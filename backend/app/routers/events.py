import csv
import io
import json
import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models import HoneypotEvent, User, AuditLog
from app.schemas import EventPaginatedResponse, EventResponse
from app.security import get_current_user, can_view_captured_credentials, REDACTED
from app.serializers import event_to_dict

router = APIRouter(prefix="/events", tags=["Honeypot Events"])

@router.get("", response_model=EventPaginatedResponse)
def get_events(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: Optional[str] = Query(None, max_length=200),
    protocol: Optional[str] = None,
    severity: Optional[str] = None,
    country: Optional[str] = None,
    data_origin: Optional[str] = None,
    eventid: Optional[str] = None,
    src_ip: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(HoneypotEvent)

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                HoneypotEvent.src_ip.like(pattern),
                HoneypotEvent.username.like(pattern),
                HoneypotEvent.command.like(pattern),
                HoneypotEvent.country.like(pattern),
                HoneypotEvent.session_id.like(pattern)
            )
        )

    if protocol:
        query = query.filter(HoneypotEvent.protocol == protocol)
    if severity:
        query = query.filter(HoneypotEvent.severity == severity)
    if country:
        query = query.filter(HoneypotEvent.country == country)
    if eventid:
        query = query.filter(HoneypotEvent.eventid == eventid)
    if src_ip:
        query = query.filter(HoneypotEvent.src_ip == src_ip)
    if data_origin:
        query = query.filter(HoneypotEvent.data_origin == data_origin)

    if start_date:
        try:
            dt_start = datetime.datetime.fromisoformat(start_date.replace("Z", "+00:00"))
            query = query.filter(HoneypotEvent.timestamp >= dt_start)
        except Exception:
            pass

    if end_date:
        try:
            dt_end = datetime.datetime.fromisoformat(end_date.replace("Z", "+00:00"))
            query = query.filter(HoneypotEvent.timestamp <= dt_end)
        except Exception:
            pass

    total = query.count()
    pages = (total + page_size - 1) // page_size

    items = query.order_by(HoneypotEvent.timestamp.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
        "items": [event_to_dict(e, include_secrets=can_view_captured_credentials(current_user)) for e in items]
    }

@router.get("/{event_id:int}", response_model=EventResponse)
def get_event_detail(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(HoneypotEvent).filter(HoneypotEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    d = event_to_dict(event, include_secrets=can_view_captured_credentials(current_user))
    d["raw_payload"] = event.raw_payload
    return d

@router.get("/export/csv")
def export_events_csv(
    search: Optional[str] = None,
    protocol: Optional[str] = None,
    severity: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(HoneypotEvent)
    if protocol:
        query = query.filter(HoneypotEvent.protocol == protocol)
    if severity:
        query = query.filter(HoneypotEvent.severity == severity)
    if search:
        pattern = f"%{search}%"
        query = query.filter(or_(HoneypotEvent.src_ip.like(pattern), HoneypotEvent.username.like(pattern)))

    events = query.order_by(HoneypotEvent.timestamp.desc()).limit(2000).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Timestamp", "EventID", "Source IP", "Port", "Protocol",
        "Username", "Password", "Command", "Country", "ASN", "Severity", "Simulated"
    ])
    show_secrets = can_view_captured_credentials(current_user)

    for ev in events:
        writer.writerow([
            ev.id, ev.timestamp.isoformat(), ev.eventid, ev.src_ip, ev.dst_port,
            ev.protocol, ev.username or "", (ev.password or "") if show_secrets else (REDACTED if ev.password else ""), ev.command or "",
            ev.country, ev.asn, ev.severity, ev.is_simulated
        ])

    audit = AuditLog(
        timestamp=datetime.datetime.utcnow(),
        user_id=current_user.id,
        username=current_user.username,
        action="EVENT_EXPORT_CSV",
        resource="EventExplorer",
        details=f"Exported {len(events)} events to CSV"
    )
    db.add(audit)
    db.commit()

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=cyvantis_events_{datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"}
    )

@router.get("/export/json")
def export_events_json(
    search: Optional[str] = None,
    protocol: Optional[str] = None,
    severity: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(HoneypotEvent)
    if protocol:
        query = query.filter(HoneypotEvent.protocol == protocol)
    if severity:
        query = query.filter(HoneypotEvent.severity == severity)

    events = query.order_by(HoneypotEvent.timestamp.desc()).limit(2000).all()
    data = []
    for ev in events:
        data.append({
            "id": ev.id,
            "timestamp": ev.timestamp.isoformat(),
            "eventid": ev.eventid,
            "src_ip": ev.src_ip,
            "dst_port": ev.dst_port,
            "protocol": ev.protocol,
            "username": ev.username,
            "password": ev.password if can_view_captured_credentials(current_user) else (REDACTED if ev.password else None),
            "data_origin": ev.data_origin,
            "command": ev.command,
            "country": ev.country,
            "asn": ev.asn,
            "severity": ev.severity,
            "is_simulated": ev.is_simulated
        })

    audit = AuditLog(
        timestamp=datetime.datetime.utcnow(),
        user_id=current_user.id,
        username=current_user.username,
        action="EVENT_EXPORT_JSON",
        resource="EventExplorer",
        details=f"Exported {len(events)} events to JSON"
    )
    db.add(audit)
    db.commit()

    json_str = json.dumps(data, indent=2)
    return Response(
        content=json_str,
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=cyvantis_events_{datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"}
    )
