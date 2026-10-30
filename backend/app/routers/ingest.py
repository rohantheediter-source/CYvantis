"""
HTTP ingestion API and data-source health.

POST /ingest/events   - normalized events from application/auth/network log shippers
POST /ingest/cowrie   - raw Cowrie JSON lines (replay of archived honeypot logs)
GET  /ingest/status   - per-source checkpoint and last-cycle status
"""
import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.ingestion.cowrie import parse_cowrie_line
from app.ingestion.schema import EventParseError, NormalizedEvent
from app.intel.providers import provider_status
from app.models import AuditLog, HoneypotEvent, IngestionCheckpoint, User
from app.pipeline import process_events
from app.security import get_current_user, require_analyst
from app.websocket import manager

router = APIRouter(prefix="/ingest", tags=["Ingestion"])

MAX_BATCH = 500


class EventBatch(BaseModel):
    events: List[NormalizedEvent] = Field(..., max_length=MAX_BATCH)


class CowrieBatch(BaseModel):
    lines: List[str] = Field(..., max_length=MAX_BATCH)
    data_origin: str = Field("replayed", pattern="^(real|replayed|simulated)$")


async def _run(db: Session, events: List[NormalizedEvent], user: User, action: str, rejected: int = 0, errors=None):
    result = process_events(db, events)
    db.add(AuditLog(timestamp=datetime.datetime.utcnow(), user_id=user.id, username=user.username, action=action,
                    resource="Ingestion", details=f"stored={result.stored} duplicates={result.duplicates} rejected={rejected}"))
    db.commit()
    for msg in result.messages:
        await manager.broadcast(msg)
    return {"stored": result.stored, "duplicates": result.duplicates, "rejected": rejected,
            "failed": result.failed, "alerts_created": result.alerts_created, "alerts_updated": result.alerts_updated,
            "incidents_touched": result.incidents_touched, "event_ids": result.event_ids, "errors": (errors or [])[:20]}


@router.post("/events")
async def ingest_events(batch: EventBatch, db: Session = Depends(get_db), user: User = Depends(require_analyst)):
    for ev in batch.events:
        if ev.source in ("cowrie", "synthetic"):
            ev.source = "api"
    return await _run(db, batch.events, user, "INGEST_API_EVENTS")


@router.post("/cowrie")
async def ingest_cowrie_lines(batch: CowrieBatch, db: Session = Depends(get_db), user: User = Depends(require_analyst)):
    events, errors = [], []
    for i, line in enumerate(batch.lines):
        if len(line) > settings.INGEST_MAX_LINE_BYTES:
            errors.append(f"line {i}: too long")
            continue
        try:
            events.append(parse_cowrie_line(line, source_ref=f"api-upload#{i}", data_origin=batch.data_origin))
        except EventParseError as exc:
            errors.append(f"line {i}: {exc}")
    return await _run(db, events, user, "INGEST_COWRIE_LINES", rejected=len(errors), errors=errors)


@router.get("/status")
def ingestion_status(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    from app.cowrie_watcher import SOURCE_STATUS
    checkpoints = [{
        "source": cp.source_name, "path": cp.path if user.role == "admin" else None, "offset": cp.offset,
        "lines_ingested": cp.lines_ingested, "lines_rejected": cp.lines_rejected,
        "duplicates_skipped": cp.duplicates_skipped, "status": cp.status, "last_error": cp.last_error,
        "last_read_at": cp.last_read_at.isoformat() if cp.last_read_at else None,
        "last_event_at": cp.last_event_at.isoformat() if cp.last_event_at else None,
    } for cp in db.query(IngestionCheckpoint).all()]
    origins = dict(db.query(HoneypotEvent.data_origin, func.count(HoneypotEvent.id)).group_by(HoneypotEvent.data_origin).all())
    latest = {o: (db.query(func.max(HoneypotEvent.timestamp)).filter(HoneypotEvent.data_origin == o).scalar())
              for o in origins}
    return {
        "simulation_mode": settings.SIMULATION_MODE,
        "background_ingestion": not settings.DISABLE_BACKGROUND_TASKS,
        "cowrie_log_configured": bool(settings.COWRIE_LOG_PATH),
        "checkpoints": checkpoints,
        "live_sources": list(SOURCE_STATUS.values()),
        "events_by_origin": {k or "unknown": v for k, v in origins.items()},
        "latest_event_by_origin": {k or "unknown": (v.isoformat() if v else None) for k, v in latest.items()},
        "intel_providers": provider_status(),
    }
