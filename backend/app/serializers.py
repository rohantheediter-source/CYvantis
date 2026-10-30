"""Shared dict serializers for API responses and WebSocket broadcasts."""
from app.security import REDACTED


def _iso(dt):
    return dt.isoformat() if dt else None


def event_to_dict(ev, include_secrets: bool = False) -> dict:
    return {
        "id": ev.id,
        "event_uid": ev.event_uid,
        "eventid": ev.eventid,
        "timestamp": _iso(ev.timestamp),
        "src_ip": ev.src_ip,
        "dst_ip": ev.dst_ip,
        "dst_port": ev.dst_port,
        "protocol": ev.protocol,
        "username": ev.username,
        "password": ev.password if include_secrets else (REDACTED if ev.password else None),
        "command": ev.command,
        "file_hash": ev.file_hash,
        "session_id": ev.session_id,
        "duration": ev.duration,
        "country": ev.country,
        "country_code": ev.country_code,
        "city": ev.city,
        "asn": ev.asn,
        "severity": ev.severity,
        "category": ev.category,
        "source": ev.source,
        "data_origin": ev.data_origin or ("simulated" if ev.is_simulated else "real"),
        "is_simulated": bool(ev.is_simulated),
        "sensor": ev.sensor,
        "source_ref": ev.source_ref,
        "ingested_at": _iso(ev.ingested_at),
    }


def alert_to_dict(a, include_notes: bool = False) -> dict:
    d = {
        "id": a.id,
        "timestamp": _iso(a.timestamp),
        "title": a.title,
        "description": a.description,
        "severity": a.severity,
        "rule_name": a.rule_name,
        "rule_id": a.rule_id,
        "src_ip": a.src_ip,
        "status": a.status,
        "is_acknowledged": bool(a.is_acknowledged),
        "acknowledged_by": a.acknowledged_by.username if a.acknowledged_by else None,
        "acknowledged_at": _iso(a.acknowledged_at),
        "assigned_to": a.assigned_to.username if a.assigned_to else None,
        "assigned_to_id": a.assigned_to_id,
        "incident_id": a.incident_id,
        "occurrence_count": a.occurrence_count or 1,
        "first_seen": _iso(a.first_seen or a.timestamp),
        "last_seen": _iso(a.last_seen or a.timestamp),
        "confidence": a.confidence,
        "risk_score": a.risk_score,
        "priority": a.priority,
        "explanation": a.explanation,
        "evidence": a.evidence,
        "risk_breakdown": a.risk_breakdown,
        "recommendations": a.recommendations,
        "data_origin": a.data_origin or "real",
        "resolution": a.resolution,
        "resolved_at": _iso(a.resolved_at),
    }
    if include_notes:
        d["notes"] = [{"id": n.id, "author": n.author_name, "note_text": n.note_text, "created_at": _iso(n.created_at)}
                      for n in sorted(a.notes, key=lambda n: n.created_at)]
    return d


def incident_to_dict(i) -> dict:
    return {
        "id": i.id,
        "title": i.title,
        "correlation_key": i.correlation_key,
        "status": i.status,
        "priority": i.priority,
        "risk_score": i.risk_score,
        "risk_breakdown": i.risk_breakdown,
        "explanation": i.explanation,
        "recommendations": i.recommendations,
        "src_ips": i.src_ips or [],
        "session_ids": i.session_ids or [],
        "indicators": i.indicators or [],
        "tactics": i.tactics or [],
        "event_count": i.event_count or 0,
        "alert_count": i.alert_count or 0,
        "data_origin": i.data_origin or "real",
        "first_seen": _iso(i.first_seen),
        "last_seen": _iso(i.last_seen),
        "assigned_to": i.assigned_to.username if i.assigned_to else None,
        "assigned_to_id": i.assigned_to_id,
        "resolution": i.resolution,
        "created_at": _iso(i.created_at),
        "updated_at": _iso(i.updated_at),
    }
