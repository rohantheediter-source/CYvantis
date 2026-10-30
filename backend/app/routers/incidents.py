"""Alert lifecycle, incident management and SOC summary endpoints."""
import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Alert, AlertNote, AuditLog, HoneypotEvent, Incident, User
from app.pipeline import refresh_alert_risk, refresh_incident
from app.security import can_view_captured_credentials, get_current_user, require_analyst
from app.serializers import alert_to_dict, event_to_dict, incident_to_dict
from app.websocket import manager

router = APIRouter(tags=["Alerts & Incidents"])

ALERT_TRANSITIONS = {
    "active": {"acknowledged", "investigating", "resolved", "false_positive"},
    "acknowledged": {"investigating", "resolved", "false_positive", "active"},
    "investigating": {"resolved", "false_positive", "acknowledged"},
    "resolved": {"active"},
    "false_positive": {"active"},
}
INCIDENT_TRANSITIONS = {
    "open": {"investigating", "resolved", "false_positive"},
    "investigating": {"open", "resolved", "false_positive"},
    "resolved": {"open"},
    "false_positive": {"open"},
}
SORTS = {"risk": "risk_score", "last_seen": "last_seen", "first_seen": "first_seen", "severity": "severity"}


def _audit(db, user, action, details):
    db.add(AuditLog(timestamp=datetime.datetime.utcnow(), user_id=user.id, username=user.username,
                    action=action, resource="Alerts/Incidents", details=details[:1000]))


def _paginate(query, page, page_size):
    total = query.count()
    return total, query.offset((page - 1) * page_size).limit(page_size).all()


class AlertPatch(BaseModel):
    status: Optional[str] = Field(None, pattern="^(active|acknowledged|investigating|resolved|false_positive)$")
    assigned_to_id: Optional[int] = None
    unassign: bool = False
    resolution: Optional[str] = Field(None, max_length=2000)


class NoteIn(BaseModel):
    note_text: str = Field(..., min_length=1, max_length=4000)


class IncidentPatch(BaseModel):
    status: Optional[str] = Field(None, pattern="^(open|investigating|resolved|false_positive)$")
    assigned_to_id: Optional[int] = None
    unassign: bool = False
    resolution: Optional[str] = Field(None, max_length=2000)


# ------------------------------------------------------------------ alerts
@router.get("/alerts")
def list_alerts(
    status: Optional[str] = None, severity: Optional[str] = None, priority: Optional[str] = None,
    src_ip: Optional[str] = None, incident_id: Optional[int] = None, data_origin: Optional[str] = None,
    search: Optional[str] = Query(None, max_length=200),
    sort: str = Query("last_seen", pattern="^(risk|last_seen|first_seen|severity)$"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
    page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=200),
    db: Session = Depends(get_db), user: User = Depends(get_current_user),
):
    q = db.query(Alert)
    if status == "open":
        q = q.filter(Alert.status.in_(["active", "acknowledged", "investigating"]))
    elif status and status != "all":
        q = q.filter(Alert.status == status)
    if severity:
        q = q.filter(Alert.severity == severity)
    if priority:
        q = q.filter(Alert.priority == priority)
    if src_ip:
        q = q.filter(Alert.src_ip == src_ip)
    if incident_id:
        q = q.filter(Alert.incident_id == incident_id)
    if data_origin:
        q = q.filter(Alert.data_origin == data_origin)
    if search:
        p = f"%{search}%"
        q = q.filter(or_(Alert.title.like(p), Alert.description.like(p), Alert.rule_name.like(p), Alert.src_ip.like(p)))
    col = getattr(Alert, SORTS[sort])
    q = q.order_by(col.desc().nullslast() if order == "desc" else col.asc().nullsfirst(), Alert.id.desc())
    total, items = _paginate(q, page, page_size)
    return {"total": total, "page": page, "page_size": page_size, "pages": (total + page_size - 1) // page_size,
            "items": [alert_to_dict(a) for a in items]}


@router.get("/alerts/{alert_id}")
def get_alert(alert_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    a = db.get(Alert, alert_id)
    if not a:
        raise HTTPException(404, "Alert not found")
    d = alert_to_dict(a, include_notes=True)
    ids = (a.evidence or {}).get("event_ids", [])[:100]
    events = db.query(HoneypotEvent).filter(HoneypotEvent.id.in_(ids)).order_by(HoneypotEvent.timestamp.asc()).all() if ids else []
    show = can_view_captured_credentials(user)
    d["events"] = [event_to_dict(e, include_secrets=show) for e in events]
    return d


@router.patch("/alerts/{alert_id}")
async def update_alert(alert_id: int, patch: AlertPatch, db: Session = Depends(get_db), user: User = Depends(require_analyst)):
    a = db.get(Alert, alert_id)
    if not a:
        raise HTTPException(404, "Alert not found")
    changes = []
    if patch.status and patch.status != a.status:
        if patch.status not in ALERT_TRANSITIONS.get(a.status, set()):
            raise HTTPException(409, f"Invalid transition {a.status} -> {patch.status}")
        if patch.status in ("resolved", "false_positive") and not (patch.resolution or a.resolution):
            raise HTTPException(422, "A resolution note is required to resolve an alert")
        changes.append(f"status {a.status}->{patch.status}")
        a.status = patch.status
        now = datetime.datetime.utcnow()
        if patch.status == "acknowledged" or (patch.status == "investigating" and not a.is_acknowledged):
            a.is_acknowledged, a.acknowledged_by_id, a.acknowledged_at = True, user.id, now
        a.resolved_at = now if patch.status in ("resolved", "false_positive") else None
    if patch.unassign:
        a.assigned_to_id = None
        changes.append("unassigned")
    elif patch.assigned_to_id is not None:
        if not db.get(User, patch.assigned_to_id):
            raise HTTPException(422, "Assignee not found")
        a.assigned_to_id = patch.assigned_to_id
        changes.append(f"assigned to user {patch.assigned_to_id}")
    if patch.resolution is not None:
        a.resolution = patch.resolution
        changes.append("resolution updated")
    refresh_alert_risk(db, a)
    inc = db.get(Incident, a.incident_id) if a.incident_id else None
    if inc:
        refresh_incident(db, inc)
    _audit(db, user, "ALERT_UPDATED", f"alert {a.id}: {'; '.join(changes) or 'no-op'}")
    db.commit()
    await manager.broadcast({"type": "alert", "data": alert_to_dict(a)})
    if inc:
        await manager.broadcast({"type": "incident", "data": incident_to_dict(inc)})
    return alert_to_dict(a, include_notes=True)


@router.post("/alerts/{alert_id}/notes")
def add_alert_note(alert_id: int, note: NoteIn, db: Session = Depends(get_db), user: User = Depends(require_analyst)):
    a = db.get(Alert, alert_id)
    if not a:
        raise HTTPException(404, "Alert not found")
    n = AlertNote(alert_id=a.id, author_id=user.id, author_name=user.username, note_text=note.note_text)
    db.add(n)
    _audit(db, user, "ALERT_NOTE_ADDED", f"alert {a.id}")
    db.commit()
    return {"id": n.id, "author": n.author_name, "note_text": n.note_text, "created_at": n.created_at.isoformat()}


# ------------------------------------------------------------------ incidents
@router.get("/incidents")
def list_incidents(
    status: Optional[str] = None, priority: Optional[str] = None, data_origin: Optional[str] = None,
    search: Optional[str] = Query(None, max_length=200),
    sort: str = Query("risk", pattern="^(risk|last_seen|first_seen)$"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
    page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=200),
    db: Session = Depends(get_db), user: User = Depends(get_current_user),
):
    q = db.query(Incident)
    if status == "open":
        q = q.filter(Incident.status.in_(["open", "investigating"]))
    elif status and status != "all":
        q = q.filter(Incident.status == status)
    if priority:
        q = q.filter(Incident.priority == priority)
    if data_origin:
        q = q.filter(Incident.data_origin == data_origin)
    if search:
        p = f"%{search}%"
        q = q.filter(or_(Incident.title.like(p), Incident.correlation_key.like(p), Incident.explanation.like(p)))
    col = getattr(Incident, SORTS[sort])
    q = q.order_by(col.desc() if order == "desc" else col.asc(), Incident.id.desc())
    total, items = _paginate(q, page, page_size)
    return {"total": total, "page": page, "page_size": page_size, "pages": (total + page_size - 1) // page_size,
            "items": [incident_to_dict(i) for i in items]}


@router.get("/incidents/stats")
def incident_stats(hours: int = Query(24, ge=1, le=720), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    since = datetime.datetime.utcnow() - datetime.timedelta(hours=hours)
    open_inc = db.query(Incident).filter(Incident.status.in_(["open", "investigating"]))
    by_priority = dict(open_inc.with_entities(Incident.priority, func.count(Incident.id)).group_by(Incident.priority).all())
    by_status = dict(db.query(Incident.status, func.count(Incident.id)).group_by(Incident.status).all())
    alert_by_sev = dict(db.query(Alert.severity, func.count(Alert.id)).filter(Alert.last_seen >= since)
                        .group_by(Alert.severity).all())
    top = open_inc.order_by(Incident.risk_score.desc()).limit(5).all()
    # Hourly volumes (bucketed in Python for DB portability)
    buckets = {}
    for (ts,) in db.query(HoneypotEvent.timestamp).filter(HoneypotEvent.timestamp >= since).all():
        k = ts.replace(minute=0, second=0, microsecond=0).isoformat()
        buckets.setdefault(k, {"hour": k, "events": 0, "alerts": 0})["events"] += 1
    for (ts,) in db.query(Alert.first_seen).filter(Alert.first_seen >= since).all():
        k = ts.replace(minute=0, second=0, microsecond=0).isoformat()
        buckets.setdefault(k, {"hour": k, "events": 0, "alerts": 0})["alerts"] += 1
    top_src = db.query(Alert.src_ip, func.count(Alert.id), func.max(Alert.risk_score)).filter(
        Alert.src_ip.isnot(None), Alert.last_seen >= since).group_by(Alert.src_ip).order_by(func.max(Alert.risk_score).desc()).limit(10).all()
    indicator_counts = {}
    for (inds,) in db.query(Incident.indicators).filter(Incident.last_seen >= since).all():
        for i in inds or []:
            indicator_counts[i] = indicator_counts.get(i, 0) + 1
    targets = db.query(HoneypotEvent.dst_ip, func.count(HoneypotEvent.id)).filter(
        HoneypotEvent.timestamp >= since, HoneypotEvent.dst_ip.isnot(None)).group_by(HoneypotEvent.dst_ip).order_by(
        func.count(HoneypotEvent.id).desc()).limit(10).all()
    origin_counts = dict(db.query(HoneypotEvent.data_origin, func.count(HoneypotEvent.id)).filter(
        HoneypotEvent.timestamp >= since).group_by(HoneypotEvent.data_origin).all())
    return {
        "window_hours": hours,
        "open_incidents_by_priority": by_priority,
        "incidents_by_status": by_status,
        "alerts_by_severity": alert_by_sev,
        "open_alerts": db.query(Alert).filter(Alert.status.in_(["active", "acknowledged", "investigating"])).count(),
        "events_in_window": sum(b["events"] for b in buckets.values()),
        "events_by_origin": {k or "unknown": v for k, v in origin_counts.items()},
        "top_incidents": [incident_to_dict(i) for i in top],
        "volume_by_hour": sorted(buckets.values(), key=lambda b: b["hour"]),
        "top_source_ips": [{"src_ip": s, "alerts": c, "max_risk": r} for s, c, r in top_src],
        "top_indicators": [{"indicator": k, "incidents": v} for k, v in
                           sorted(indicator_counts.items(), key=lambda kv: -kv[1])[:10]],
        "affected_assets": [{"dst_ip": d, "events": c} for d, c in targets],
    }


@router.get("/incidents/{incident_id}")
def get_incident(incident_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    inc = db.get(Incident, incident_id)
    if not inc:
        raise HTTPException(404, "Incident not found")
    alerts = db.query(Alert).filter(Alert.incident_id == inc.id).order_by(Alert.first_seen.asc()).all()
    ids = []
    for a in alerts:
        ids.extend((a.evidence or {}).get("event_ids", []))
    ids = list(dict.fromkeys(ids))[:300]
    show = can_view_captured_credentials(user)
    events = db.query(HoneypotEvent).filter(HoneypotEvent.id.in_(ids)).order_by(HoneypotEvent.timestamp.asc()).all() if ids else []
    # Timeline: evidence events plus alert milestones, chronologically
    timeline = [{"time": e.timestamp.isoformat(), "kind": "event", "event_id": e.id, "label": e.eventid,
                 "detail": e.command or e.username or e.file_hash or "", "severity": e.severity} for e in events]
    timeline += [{"time": (a.first_seen or a.timestamp).isoformat(), "kind": "alert", "alert_id": a.id,
                  "label": a.rule_name, "detail": a.description, "severity": a.severity} for a in alerts]
    timeline.sort(key=lambda t: (t["time"], 0 if t["kind"] == "event" else 1))
    d = incident_to_dict(inc)
    d["alerts"] = [alert_to_dict(a) for a in alerts]
    d["events"] = [event_to_dict(e, include_secrets=show) for e in events]
    d["timeline"] = timeline
    return d


@router.patch("/incidents/{incident_id}")
async def update_incident(incident_id: int, patch: IncidentPatch, db: Session = Depends(get_db), user: User = Depends(require_analyst)):
    inc = db.get(Incident, incident_id)
    if not inc:
        raise HTTPException(404, "Incident not found")
    changes = []
    if patch.status and patch.status != inc.status:
        if patch.status not in INCIDENT_TRANSITIONS.get(inc.status, set()):
            raise HTTPException(409, f"Invalid transition {inc.status} -> {patch.status}")
        if patch.status in ("resolved", "false_positive") and not (patch.resolution or inc.resolution):
            raise HTTPException(422, "A resolution note is required to resolve an incident")
        changes.append(f"status {inc.status}->{patch.status}")
        inc.status = patch.status
    if patch.unassign:
        inc.assigned_to_id = None
    elif patch.assigned_to_id is not None:
        if not db.get(User, patch.assigned_to_id):
            raise HTTPException(422, "Assignee not found")
        inc.assigned_to_id = patch.assigned_to_id
        changes.append(f"assigned to user {patch.assigned_to_id}")
    if patch.resolution is not None:
        inc.resolution = patch.resolution
    refresh_incident(db, inc)
    _audit(db, user, "INCIDENT_UPDATED", f"incident {inc.id}: {'; '.join(changes) or 'no-op'}")
    db.commit()
    await manager.broadcast({"type": "incident", "data": incident_to_dict(inc)})
    return incident_to_dict(inc)
