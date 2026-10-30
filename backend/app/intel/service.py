"""
Threat-intelligence enrichment service with caching and source attribution.

* `cached_reputation()` is cheap and used inline by the event pipeline: it only reads the
  local IOC table and cached provider results (no network I/O in the hot path).
* `enrich()` performs provider lookups (network) for one indicator, caches each provider
  result with an expiry, and stores NVD CVE metadata in `vulnerabilities`.
"""
import datetime
import logging
from typing import Dict, List, Optional

from sqlalchemy.orm import Session

from app.config import settings
from app.intel.indicators import classify_indicator, is_public_ip
from app.intel.providers import PROVIDERS, ProviderResult
from app.models import IntelEnrichment, ThreatIntelIOC, HoneypotEvent, Vulnerability

logger = logging.getLogger("cyvantis.intel")

ERROR_CACHE_MINUTES = 15


def _now():
    return datetime.datetime.utcnow()


def _parse_dt(v):
    if not v:
        return None
    try:
        dt = datetime.datetime.fromisoformat(str(v).replace("Z", "+00:00"))
        return dt.astimezone(datetime.timezone.utc).replace(tzinfo=None) if dt.tzinfo else dt
    except ValueError:
        return None


def local_ioc(db: Session, value: str) -> Optional[ThreatIntelIOC]:
    ioc = db.query(ThreatIntelIOC).filter(ThreatIntelIOC.indicator == value).first()
    if ioc and ioc.expires_at and ioc.expires_at < _now():
        return None
    return ioc


def cached_reputation(db: Session, value: str) -> Dict:
    """
    Best known reputation for an indicator from local data only.
    Returns {"score": float|None, "confidence": float|None, "sources": [...]}.
    """
    sources = []
    best_score, best_conf = None, None
    ioc = local_ioc(db, value)
    if ioc:
        conf = ioc.confidence if ioc.confidence is not None else 0.5
        sources.append({"provider": f"local_ioc:{ioc.source}", "score": ioc.threat_score, "confidence": conf,
                        "category": ioc.category, "demo": bool(ioc.is_demo)})
        best_score, best_conf = float(ioc.threat_score), conf
    rows = db.query(IntelEnrichment).filter(IntelEnrichment.indicator == value, IntelEnrichment.status == "ok").all()
    for r in rows:
        if r.reputation_score is None:
            continue
        sources.append({"provider": r.provider, "score": r.reputation_score, "confidence": r.confidence,
                        "fetched_at": r.fetched_at.isoformat() if r.fetched_at else None})
        if best_score is None or r.reputation_score > best_score:
            best_score, best_conf = r.reputation_score, r.confidence
    return {"score": best_score, "confidence": best_conf, "sources": sources}


def _store(db: Session, value: str, itype: str, res: ProviderResult):
    row = db.query(IntelEnrichment).filter(IntelEnrichment.indicator == value, IntelEnrichment.provider == res.provider).first()
    if row is None:
        row = IntelEnrichment(indicator=value, indicator_type=itype, provider=res.provider)
        db.add(row)
    ttl = datetime.timedelta(hours=settings.INTEL_CACHE_TTL_HOURS) if res.status in ("ok", "not_found") \
        else datetime.timedelta(minutes=ERROR_CACHE_MINUTES)
    row.status = res.status
    row.reputation_score = res.reputation_score
    row.confidence = res.confidence
    row.summary = res.summary[:1000] if res.summary else None
    row.data = res.data or None
    row.fetched_at = _now()
    row.expires_at = _now() + ttl
    return row


def _store_cve(db: Session, data: dict):
    cve_id = data.get("cve_id")
    if not cve_id:
        return
    v = db.query(Vulnerability).filter(Vulnerability.cve_id == cve_id).first()
    if v is None:
        v = Vulnerability(cve_id=cve_id)
        db.add(v)
    v.description = data.get("description")
    v.cvss_score = data.get("cvss_score")
    v.cvss_vector = data.get("cvss_vector")
    v.severity = data.get("severity")
    v.published = _parse_dt(data.get("published"))
    v.last_modified = _parse_dt(data.get("last_modified"))
    v.known_exploited = bool(data.get("known_exploited"))
    v.references = data.get("references")
    v.source = "NVD"
    v.fetched_at = _now()


def _serialize(row: IntelEnrichment) -> dict:
    return {
        "provider": row.provider,
        "status": row.status,
        "reputation_score": row.reputation_score,
        "confidence": row.confidence,
        "summary": row.summary,
        "data": row.data,
        "fetched_at": row.fetched_at.isoformat() if row.fetched_at else None,
        "expires_at": row.expires_at.isoformat() if row.expires_at else None,
    }


def enrich(db: Session, raw_value: str, force: bool = False, client=None) -> Dict:
    itype, value = classify_indicator(raw_value)
    if not itype:
        return {"indicator": raw_value, "type": None, "error": "unrecognised indicator format"}

    results: List[dict] = []
    for provider in PROVIDERS:
        if itype not in provider.supported_types:
            continue
        if itype == "ip" and not is_public_ip(value):
            results.append({"provider": provider.name, "status": "unsupported",
                            "summary": "private/reserved address - not sent to external providers"})
            continue
        cached = db.query(IntelEnrichment).filter(IntelEnrichment.indicator == value,
                                                  IntelEnrichment.provider == provider.name).first()
        if cached and not force and cached.expires_at and cached.expires_at > _now():
            results.append(dict(_serialize(cached), cached=True))
            continue
        res = provider.lookup(value, itype, client=client)
        if res.status == "not_configured":
            # Not cached: configuring a key later should take effect immediately
            results.append({"provider": provider.name, "status": res.status, "summary": res.summary})
            continue
        row = _store(db, value, itype, res)
        if provider.name == "nvd" and res.status == "ok":
            _store_cve(db, res.data)
        db.flush()
        results.append(dict(_serialize(row), cached=False))
    db.commit()

    local = cached_reputation(db, value)
    sightings_q = None
    if itype == "ip":
        sightings_q = db.query(HoneypotEvent).filter(HoneypotEvent.src_ip == value)
    elif itype == "hash":
        sightings_q = db.query(HoneypotEvent).filter(HoneypotEvent.file_hash == value)
    elif itype in ("url", "domain"):
        sightings_q = db.query(HoneypotEvent).filter(HoneypotEvent.command.like(f"%{value}%"))
    sightings = None
    if sightings_q is not None:
        first = sightings_q.order_by(HoneypotEvent.timestamp.asc()).first()
        last = sightings_q.order_by(HoneypotEvent.timestamp.desc()).first()
        sightings = {
            "count": sightings_q.count(),
            "first_seen": first.timestamp.isoformat() if first else None,
            "last_seen": last.timestamp.isoformat() if last else None,
            "recent_event_ids": [e.id for e in sightings_q.order_by(HoneypotEvent.timestamp.desc()).limit(20).all()],
        }
    ioc = local_ioc(db, value)
    vuln = None
    if itype == "cve":
        v = db.query(Vulnerability).filter(Vulnerability.cve_id == value).first()
        if v:
            vuln = {"cve_id": v.cve_id, "description": v.description, "cvss_score": v.cvss_score,
                    "cvss_vector": v.cvss_vector, "severity": v.severity, "known_exploited": v.known_exploited,
                    "published": v.published.isoformat() if v.published else None, "references": v.references,
                    "source": v.source, "fetched_at": v.fetched_at.isoformat() if v.fetched_at else None}
    return {
        "indicator": value,
        "type": itype,
        "providers": results,
        "local_ioc": ({"category": ioc.category, "threat_score": ioc.threat_score, "source": ioc.source,
                       "confidence": ioc.confidence, "is_demo": bool(ioc.is_demo), "description": ioc.description,
                       "last_seen": ioc.last_seen.isoformat() if ioc.last_seen else None} if ioc else None),
        "aggregate": local,
        "honeypot_sightings": sightings,
        "vulnerability": vuln,
    }
