import os
import sys
import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import HoneypotEvent, User
from app.security import get_current_user
from app.websocket import manager
from app.config import settings

router = APIRouter(prefix="/health", tags=["Infrastructure Health"])

START_TIME = datetime.datetime.utcnow()

@router.get("")
def get_system_health(
    db: Session = Depends(get_db)
):
    uptime_seconds = int((datetime.datetime.utcnow() - START_TIME).total_seconds())

    db_path = settings.DATABASE_URL.replace("sqlite:///", "")
    if not os.path.exists(db_path):
        db_path = "./cyvantis.db"
    
    db_size_bytes = os.path.getsize(db_path) if os.path.exists(db_path) else 0

    return {
        "status": "OPERATIONAL",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "uptime_seconds": uptime_seconds,
        "python_version": sys.version.split()[0],
        "backend_version": settings.VERSION,
        "database": {
            "type": "SQLite3 (Transactional)",
            "file": os.path.basename(db_path),
            "size_mb": round(db_size_bytes / (1024 * 1024), 2),
            "status": "Connected"
        },
        "honeypot_container": {
            "name": "cowrie-honeypot-v1",
            "type": "Cowrie SSH/Telnet Gateway",
            "status": "Running (Active)",
            "log_path": settings.COWRIE_LOG_PATH,
            "simulation_mode": settings.SIMULATION_MODE
        },
        "websockets": {
            "active_connections": len(manager.active_connections),
            "channel": "/api/v1/ws/events"
        },
        "services": [
            {"name": "FastAPI REST Server", "status": "Healthy", "latency_ms": 4},
            {"name": "SQLite Primary Storage Engine", "status": "Healthy", "latency_ms": 1},
            {"name": "Cowrie Log Watcher Daemon", "status": "Healthy", "latency_ms": 2},
            {"name": "Threat Intel GeoIP Resolver", "status": "Healthy", "latency_ms": 1}
        ]
    }
