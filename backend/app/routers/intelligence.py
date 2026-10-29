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
    geo = enrich_ip(ip_address)
    
    # Calculate attack history from honeypot database
    events_count = db.query(HoneypotEvent).filter(HoneypotEvent.src_ip == ip_address).count()
    first_seen_event = db.query(HoneypotEvent).filter(HoneypotEvent.src_ip == ip_address).order_by(HoneypotEvent.timestamp.asc()).first()
    last_seen_event = db.query(HoneypotEvent).filter(HoneypotEvent.src_ip == ip_address).order_by(HoneypotEvent.timestamp.desc()).first()

    targeted_users = db.query(HoneypotEvent.username).filter(
        HoneypotEvent.src_ip == ip_address, HoneypotEvent.username.isnot(None)
    ).distinct().all()

    ioc = db.query(ThreatIntelIOC).filter(ThreatIntelIOC.indicator == ip_address).first()

    risk_rating = "Low"
    if geo["threat_score"] > 80 or events_count > 20:
        risk_rating = "Critical"
    elif geo["threat_score"] > 60 or events_count > 5:
        risk_rating = "High"
    elif geo["threat_score"] > 40 or events_count > 0:
        risk_rating = "Medium"

    return {
        "ip": ip_address,
        "country": geo["country"],
        "country_code": geo["country_code"],
        "city": geo["city"],
        "asn": geo["asn"],
        "threat_score": geo["threat_score"],
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
    current_user: User = Depends(get_current_user)
):
    from app.utils.nmap_scanner import scan_url_and_host
    return scan_url_and_host(target)

from pydantic import BaseModel
class URLScanRequest(BaseModel):
    url: str
    virustotal_key: Optional[str] = None

@router.post("/url-scan")
def scan_url_threat_endpoint(
    req: URLScanRequest,
    current_user: User = Depends(get_current_user)
):
    from app.utils.url_scanner import analyze_url_threat
    return analyze_url_threat(req.url, virustotal_api_key=req.virustotal_key)


