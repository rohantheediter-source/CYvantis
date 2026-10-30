"""
Background ingestion worker.

Every INGEST_INTERVAL_SECONDS each registered source (see app/ingestion/sources.py) is
polled in a worker thread; new events go through the pipeline and the batch is committed
together with the source's checkpoint. Resulting event/alert/incident messages are then
broadcast to authenticated WebSocket clients.

Real Cowrie data is read from COWRIE_LOG_PATH. Synthetic events are produced only when
SIMULATION_MODE=true and are stored with data_origin="simulated".
"""
import asyncio
import datetime
import logging
from typing import Dict, List

from app.config import settings
from app.database import SessionLocal
from app.ingestion.sources import LogSource, build_sources
from app.pipeline import process_events
from app.websocket import manager

logger = logging.getLogger("cyvantis.ingestion")

# Last-cycle status per source, exposed via /api/v1/ingest/status
SOURCE_STATUS: Dict[str, dict] = {}


def run_source_once(source: LogSource) -> List[dict]:
    db = SessionLocal()
    try:
        poll = source.poll(db)
        result = process_events(db, poll.events)
        cp = poll.checkpoint
        if cp is not None:
            cp.lines_ingested = (cp.lines_ingested or 0) + result.stored
            cp.lines_rejected = (cp.lines_rejected or 0) + poll.rejected
            cp.duplicates_skipped = (cp.duplicates_skipped or 0) + result.duplicates
            if result.stored:
                cp.last_event_at = datetime.datetime.utcnow()
        db.commit()
        SOURCE_STATUS[source.name] = {
            "source": source.name,
            "data_origin": source.data_origin,
            "status": getattr(cp, "status", "active") if cp is not None else "active",
            "last_poll": datetime.datetime.utcnow().isoformat(),
            "last_batch": {"stored": result.stored, "duplicates": result.duplicates, "rejected": poll.rejected,
                           "failed": result.failed, "alerts_created": result.alerts_created,
                           "alerts_updated": result.alerts_updated},
            "recent_errors": poll.errors[:5],
        }
        if result.stored:
            logger.info("[%s] stored=%d dup=%d rejected=%d alerts+%d", source.name, result.stored,
                        result.duplicates, poll.rejected, result.alerts_created)
        return result.messages
    except Exception as exc:
        db.rollback()
        logger.exception("Ingestion cycle failed for %s", source.name)
        SOURCE_STATUS[source.name] = {"source": source.name, "data_origin": source.data_origin, "status": "error",
                                      "last_poll": datetime.datetime.utcnow().isoformat(),
                                      "recent_errors": [type(exc).__name__]}
        return []
    finally:
        db.close()


async def start_cowrie_monitoring():
    sources = build_sources()
    logger.info("Ingestion worker started: %s", ", ".join(s.name for s in sources))
    while True:
        for source in sources:
            messages = await asyncio.to_thread(run_source_once, source)
            for msg in messages:
                await manager.broadcast(msg)
        await asyncio.sleep(min(settings.INGEST_INTERVAL_SECONDS, settings.SIMULATION_INTERVAL_SECONDS)
                            if settings.SIMULATION_MODE else settings.INGEST_INTERVAL_SECONDS)
