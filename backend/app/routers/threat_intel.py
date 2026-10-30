"""Threat-intelligence lookups and vulnerability intelligence (sync handlers run in a threadpool)."""
import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.intel.indicators import classify_indicator
from app.intel.providers import provider_status
from app.intel.service import enrich
from app.models import AuditLog, IntelEnrichment, User, Vulnerability
from app.security import get_current_user

router = APIRouter(tags=["Threat Intelligence Engine"])


def _vuln(v: Vulnerability) -> dict:
    return {"cve_id": v.cve_id, "description": v.description, "cvss_score": v.cvss_score, "cvss_vector": v.cvss_vector,
            "severity": v.severity, "known_exploited": v.known_exploited,
            "published": v.published.isoformat() if v.published else None,
            "last_modified": v.last_modified.isoformat() if v.last_modified else None,
            "references": v.references, "source": v.source,
            "fetched_at": v.fetched_at.isoformat() if v.fetched_at else None}


@router.get("/threat-intel/providers")
def providers(user: User = Depends(get_current_user)):
    return provider_status()


@router.get("/threat-intel/lookup")
def lookup(indicator: str = Query(..., min_length=1, max_length=2048), refresh: bool = False,
           db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    itype, _ = classify_indicator(indicator)
    if not itype:
        raise HTTPException(422, "Unrecognised indicator. Supported: IPv4/IPv6, domain, URL, MD5/SHA1/SHA256, CVE ID.")
    if refresh and user.role == "viewer":
        raise HTTPException(403, "Viewers cannot force a provider refresh")
    result = enrich(db, indicator, force=refresh)
    db.add(AuditLog(timestamp=datetime.datetime.utcnow(), user_id=user.id, username=user.username,
                    action="INTEL_LOOKUP", resource="ThreatIntel", details=f"{itype} lookup (refresh={refresh})"))
    db.commit()
    return result


@router.get("/threat-intel/indicators")
def cached_indicators(indicator_type: Optional[str] = None, provider: Optional[str] = None,
                      min_score: Optional[float] = Query(None, ge=0, le=100),
                      page: int = Query(1, ge=1), page_size: int = Query(50, ge=1, le=200),
                      db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(IntelEnrichment)
    if indicator_type:
        q = q.filter(IntelEnrichment.indicator_type == indicator_type)
    if provider:
        q = q.filter(IntelEnrichment.provider == provider)
    if min_score is not None:
        q = q.filter(IntelEnrichment.reputation_score >= min_score)
    total = q.count()
    rows = q.order_by(IntelEnrichment.fetched_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"total": total, "items": [{
        "indicator": r.indicator, "type": r.indicator_type, "provider": r.provider, "status": r.status,
        "reputation_score": r.reputation_score, "confidence": r.confidence, "summary": r.summary,
        "fetched_at": r.fetched_at.isoformat() if r.fetched_at else None,
        "expires_at": r.expires_at.isoformat() if r.expires_at else None} for r in rows]}


@router.get("/vulnerabilities")
def list_vulnerabilities(search: Optional[str] = Query(None, max_length=100), severity: Optional[str] = None,
                         known_exploited: Optional[bool] = None,
                         page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=200),
                         db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(Vulnerability)
    if search:
        p = f"%{search}%"
        q = q.filter(or_(Vulnerability.cve_id.like(p), Vulnerability.description.like(p)))
    if severity:
        q = q.filter(Vulnerability.severity == severity.lower())
    if known_exploited is not None:
        q = q.filter(Vulnerability.known_exploited.is_(known_exploited))
    total = q.count()
    rows = q.order_by(Vulnerability.cvss_score.desc().nullslast()).offset((page - 1) * page_size).limit(page_size).all()
    return {"total": total, "items": [_vuln(v) for v in rows]}


@router.get("/vulnerabilities/{cve_id}")
def get_vulnerability(cve_id: str, refresh: bool = False, db: Session = Depends(get_db),
                      user: User = Depends(get_current_user)):
    itype, norm = classify_indicator(cve_id)
    if itype != "cve":
        raise HTTPException(422, "Invalid CVE identifier")
    v = db.query(Vulnerability).filter(Vulnerability.cve_id == norm).first()
    if v is None or refresh:
        res = enrich(db, norm, force=refresh)
        v = db.query(Vulnerability).filter(Vulnerability.cve_id == norm).first()
        if v is None:
            nvd = next((p for p in res.get("providers", []) if p["provider"] == "nvd"), {})
            raise HTTPException(404 if nvd.get("status") == "not_found" else 503,
                                f"CVE not available from NVD (status: {nvd.get('status', 'unknown')}). {nvd.get('summary') or ''}".strip())
    return _vuln(v)
