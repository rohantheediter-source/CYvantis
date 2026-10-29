import datetime
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.database import get_db
from app.models import HoneypotEvent, Investigation, Alert, User, AuditLog
from app.security import get_current_user
from app.utils.pdf_generator import generate_security_report_pdf

router = APIRouter(prefix="/reports", tags=["Threat Reports"])

def _build_report_summary(db: Session) -> dict:
    total_events = db.query(HoneypotEvent).count()
    unique_ips = db.query(func.count(func.distinct(HoneypotEvent.src_ip))).scalar() or 0
    ssh_attempts = db.query(HoneypotEvent).filter(HoneypotEvent.protocol == "SSH").count()
    telnet_attempts = db.query(HoneypotEvent).filter(HoneypotEvent.protocol == "Telnet").count()
    auth_attempts = db.query(HoneypotEvent).filter(
        HoneypotEvent.eventid.in_(["cowrie.login.failed", "cowrie.login.success"])
    ).count()
    active_investigations = db.query(Investigation).filter(Investigation.status.in_(["open", "in_progress"])).count()
    critical_alerts = db.query(Alert).filter(Alert.severity.in_(["high", "critical"])).count()

    top_users = db.query(
        HoneypotEvent.username, func.count(HoneypotEvent.id).label("count")
    ).filter(HoneypotEvent.username.isnot(None)).group_by(HoneypotEvent.username).order_by(desc("count")).limit(5).all()

    top_pass = db.query(
        HoneypotEvent.password, func.count(HoneypotEvent.id).label("count")
    ).filter(HoneypotEvent.password.isnot(None)).group_by(HoneypotEvent.password).order_by(desc("count")).limit(5).all()

    return {
        "generated_at": datetime.datetime.utcnow().isoformat(),
        "total_events": total_events,
        "unique_ips": unique_ips,
        "ssh_attempts": ssh_attempts,
        "telnet_attempts": telnet_attempts,
        "auth_attempts": auth_attempts,
        "active_investigations": active_investigations,
        "critical_alerts": critical_alerts,
        "active_sensors": 1,
        "top_usernames": [{"username": u, "count": c} for u, c in top_users],
        "top_passwords": [{"password": p, "count": c} for p, c in top_pass]
    }

@router.get("/summary")
def get_report_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return _build_report_summary(db)

@router.get("/pdf")
def download_pdf_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    data = _build_report_summary(db)
    pdf_bytes = generate_security_report_pdf(data)

    audit = AuditLog(
        timestamp=datetime.datetime.utcnow(),
        user_id=current_user.id,
        username=current_user.username,
        action="REPORT_DOWNLOAD_PDF",
        resource="Reports",
        details="Generated PDF Threat Intelligence & Security Report"
    )
    db.add(audit)
    db.commit()

    filename = f"CYVANTIS_Threat_Report_{datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
