import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.database import get_db
from app.models import HoneypotEvent, Investigation, Alert, User
from app.security import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics & KPIs"])

@router.get("/overview")
def get_overview_kpis(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_events = db.query(HoneypotEvent).count()
    unique_ips = db.query(func.count(func.distinct(HoneypotEvent.src_ip))).scalar() or 0
    ssh_attempts = db.query(HoneypotEvent).filter(HoneypotEvent.protocol == "SSH").count()
    telnet_attempts = db.query(HoneypotEvent).filter(HoneypotEvent.protocol == "Telnet").count()
    auth_attempts = db.query(HoneypotEvent).filter(
        HoneypotEvent.eventid.in_(["cowrie.login.failed", "cowrie.login.success"])
    ).count()
    active_investigations = db.query(Investigation).filter(
        Investigation.status.in_(["open", "in_progress"])
    ).count()
    critical_alerts = db.query(Alert).filter(
        Alert.severity.in_(["high", "critical"]),
        Alert.status == "active"
    ).count()
    active_sensors = 1 # Primary Cowrie Docker Honeypot

    return {
        "total_events": total_events,
        "unique_ips": unique_ips,
        "ssh_attempts": ssh_attempts,
        "telnet_attempts": telnet_attempts,
        "auth_attempts": auth_attempts,
        "active_investigations": active_investigations,
        "critical_alerts": critical_alerts,
        "active_sensors": active_sensors
    }

@router.get("/timeline")
def get_attack_timeline(
    days: int = 7,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=days)
    events = db.query(HoneypotEvent).filter(HoneypotEvent.timestamp >= cutoff).all()

    # Group by date
    timeline_dict = {}
    for i in range(days + 1):
        dt_key = (datetime.datetime.utcnow() - datetime.timedelta(days=days - i)).strftime("%Y-%m-%d")
        timeline_dict[dt_key] = {"date": dt_key, "SSH": 0, "Telnet": 0, "Total": 0}

    for ev in events:
        date_str = ev.timestamp.strftime("%Y-%m-%d")
        if date_str in timeline_dict:
            proto = ev.protocol if ev.protocol in ["SSH", "Telnet"] else "SSH"
            timeline_dict[date_str][proto] += 1
            timeline_dict[date_str]["Total"] += 1

    return list(timeline_dict.values())

@router.get("/attack-types")
def get_attack_types_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    results = db.query(HoneypotEvent.eventid, func.count(HoneypotEvent.id)).group_by(HoneypotEvent.eventid).all()
    labels_map = {
        "cowrie.login.failed": "Failed Login",
        "cowrie.login.success": "Successful Auth",
        "cowrie.command.input": "Command Execution",
        "cowrie.session.file_download": "Payload Download",
        "cowrie.session.connect": "Session Connection"
    }
    data = []
    for ev_id, cnt in results:
        data.append({"type": labels_map.get(ev_id, ev_id), "count": cnt})
    return data

@router.get("/top-source-ips")
def get_top_source_ips(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    results = db.query(
        HoneypotEvent.src_ip,
        HoneypotEvent.country,
        HoneypotEvent.asn,
        func.count(HoneypotEvent.id).label("count")
    ).group_by(HoneypotEvent.src_ip).order_by(desc("count")).limit(limit).all()

    items = []
    for ip, country, asn, cnt in results:
        items.append({
            "ip": ip,
            "country": country,
            "asn": asn,
            "count": cnt
        })
    return items

@router.get("/top-credentials")
def get_top_credentials(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    users = db.query(
        HoneypotEvent.username,
        func.count(HoneypotEvent.id).label("count")
    ).filter(HoneypotEvent.username.isnot(None)).group_by(HoneypotEvent.username).order_by(desc("count")).limit(limit).all()

    passwords = db.query(
        HoneypotEvent.password,
        func.count(HoneypotEvent.id).label("count")
    ).filter(HoneypotEvent.password.isnot(None)).group_by(HoneypotEvent.password).order_by(desc("count")).limit(limit).all()

    return {
        "top_usernames": [{"username": u, "count": c} for u, c in users],
        "top_passwords": [{"password": p, "count": c} for p, c in passwords]
    }

@router.get("/geographic-distribution")
def get_geographic_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    results = db.query(
        HoneypotEvent.country,
        HoneypotEvent.country_code,
        func.count(HoneypotEvent.id).label("count")
    ).group_by(HoneypotEvent.country).order_by(desc("count")).all()

    data = []
    for country, code, cnt in results:
        data.append({"country": country, "country_code": code, "count": cnt})
    return data
