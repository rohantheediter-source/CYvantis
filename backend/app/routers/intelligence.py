import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import ThreatIntelIOC, HoneypotEvent, User, AuditLog
from app.schemas import ThreatIntelIOCCreate, ThreatIntelIOCResponse
from app.security import get_current_user, require_roles
from app.geoip_service import enrich_ip

router = APIRouter(prefix="/intelligence", tags=["Threat Intelligence"])

@router.get("/iocs", response_model=List[ThreatIntelIOCResponse])
def get_all_iocs(
    ioc_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ThreatIntelIOC)
    if ioc_type:
        query = query.filter(ThreatIntelIOC.ioc_type == ioc_type)
    return query.order_by(ThreatIntelIOC.last_seen.desc()).all()

@router.post("/iocs", response_model=ThreatIntelIOCResponse, status_code=status.HTTP_201_CREATED)
def create_ioc(
    ioc_in: ThreatIntelIOCCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "analyst"]))
):
    existing = db.query(ThreatIntelIOC).filter(ThreatIntelIOC.indicator == ioc_in.indicator).first()
    if existing:
        raise HTTPException(status_code=400, detail="Indicator already exists in IOC database")

    ioc = ThreatIntelIOC(
        indicator=ioc_in.indicator,
        ioc_type=ioc_in.ioc_type,
        threat_score=ioc_in.threat_score,
        category=ioc_in.category,
        description=ioc_in.description,
        source=ioc_in.source,
        confidence=ioc_in.confidence,
        first_seen=datetime.datetime.utcnow(),
        last_seen=datetime.datetime.utcnow()
    )
    db.add(ioc)
    
    audit = AuditLog(
        timestamp=datetime.datetime.utcnow(),
        user_id=current_user.id,
        username=current_user.username,
        action="IOC_CREATED",
        resource="ThreatIntelligence",
        details=f"Added IOC: {ioc_in.indicator} ({ioc_in.ioc_type})"
    )
    db.add(audit)
    db.commit()
    db.refresh(ioc)
    return ioc

@router.get("/ip/{ip_address}")
def lookup_ip_intelligence(
    ip_address: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.intel.indicators import classify_indicator
    from app.intel.service import cached_reputation
    itype, ip_address = classify_indicator(ip_address)
    if itype != "ip":
        raise HTTPException(status_code=422, detail="Invalid IP address")
    geo = enrich_ip(ip_address)
    q = db.query(HoneypotEvent).filter(HoneypotEvent.src_ip == ip_address)
    events_count = q.count()
    first_seen_event = q.order_by(HoneypotEvent.timestamp.asc()).first()
    last_seen_event = q.order_by(HoneypotEvent.timestamp.desc()).first()
    targeted_users = q.filter(HoneypotEvent.username.isnot(None)).with_entities(HoneypotEvent.username).distinct().limit(50).all()
    ioc = db.query(ThreatIntelIOC).filter(ThreatIntelIOC.indicator == ip_address).first()
    rep = cached_reputation(db, ip_address)

    # Rating is derived only from known reputation and observed honeypot activity
    score = rep["score"]
    if (score is not None and score >= 80) or events_count > 20:
        risk_rating = "Critical"
    elif (score is not None and score >= 60) or events_count > 5:
        risk_rating = "High"
    elif (score is not None and score >= 40) or events_count > 0:
        risk_rating = "Medium"
    else:
        risk_rating = "Low" if score is not None else "Unknown"

    return {
        "ip": ip_address,
        "country": geo["country"],
        "country_code": geo["country_code"],
        "city": geo["city"],
        "asn": geo["asn"],
        "geo_source": geo["geo_source"],
        "threat_score": score,
        "threat_score_sources": rep["sources"],
        "risk_rating": risk_rating,
        "total_honeypot_attacks": events_count,
        "first_seen": first_seen_event.timestamp.isoformat() if first_seen_event else None,
        "last_seen": last_seen_event.timestamp.isoformat() if last_seen_event else None,
        "targeted_usernames": [u[0] for u in targeted_users],
        "is_known_ioc": ioc is not None,
        "ioc_category": ioc.category if ioc else None
    }

@router.get("/scan")
def scan_target_intelligence(
    target: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    """Active scan (TCP connect / nmap -F). Admin-only; only scan systems you are authorised to test."""
    import re
    target = target.strip()
    if not target or target.startswith("-") or len(target) > 253 or not re.fullmatch(r"[A-Za-z0-9.:\-\[\]/]+", target):
        raise HTTPException(status_code=422, detail="Invalid scan target")
    db.add(AuditLog(timestamp=datetime.datetime.utcnow(), user_id=current_user.id, username=current_user.username,
                    action="ACTIVE_SCAN", resource="ThreatIntelligence", details=f"scan target {target}"))
    db.commit()
    from app.utils.nmap_scanner import scan_url_and_host
    return scan_url_and_host(target)

from pydantic import BaseModel
class URLScanRequest(BaseModel):
    url: str
    virustotal_key: Optional[str] = None  # ignored: API keys are server-side only (VIRUSTOTAL_API_KEY)

@router.post("/url-scan")
def scan_url_threat_endpoint(
    req: URLScanRequest,
    current_user: User = Depends(get_current_user)
):
    from app.utils.url_scanner import analyze_url_threat
    from app.config import settings
    if len(req.url) > 2048:
        raise HTTPException(status_code=422, detail="URL too long")
    return analyze_url_threat(req.url, virustotal_api_key=settings.VIRUSTOTAL_API_KEY or None)


