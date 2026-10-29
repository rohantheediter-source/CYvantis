import datetime
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db
from app.models import (
    User, HoneypotEvent, Investigation, Alert, DetectionRule, ThreatIntelIOC, AuditLog
)
from app.security import get_current_user, require_roles

router = APIRouter(prefix="/admin-data", tags=["Admin Data Management"])

MODEL_MAP = {
    "events": HoneypotEvent,
    "users": User,
    "investigations": Investigation,
    "alerts": Alert,
    "rules": DetectionRule,
    "iocs": ThreatIntelIOC
}

@router.get("/tables")
def get_available_tables(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    table_stats = []
    for key, model in MODEL_MAP.items():
        count = db.query(model).count()
        table_stats.append({
            "table_key": key,
            "table_name": model.__tablename__,
            "record_count": count
        })
    return table_stats

@router.get("/tables/{table_key}")
def get_table_records(
    table_key: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    if table_key not in MODEL_MAP:
        raise HTTPException(status_code=400, detail=f"Invalid table key. Allowed: {list(MODEL_MAP.keys())}")

    model = MODEL_MAP[table_key]
    query = db.query(model)

    total = query.count()
    records = query.order_by(model.id.desc()).offset((page - 1) * page_size).limit(page_size).all()

    # Convert model objects to dictionaries for JSON response
    items = []
    for rec in records:
        rec_dict = {}
        for column in model.__table__.columns:
            val = getattr(rec, column.name)
            if isinstance(val, (datetime.datetime, datetime.date)):
                val = val.isoformat()
            rec_dict[column.name] = val
        items.append(rec_dict)

    return {
        "table_key": table_key,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size,
        "columns": [c.name for c in model.__table__.columns],
        "items": items
    }

@router.delete("/tables/{table_key}/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_table_record(
    table_key: str,
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    if table_key not in MODEL_MAP:
        raise HTTPException(status_code=400, detail="Invalid table key")

    model = MODEL_MAP[table_key]
    target = db.query(model).filter(model.id == record_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Record not found")

    db.delete(target)

    audit = AuditLog(
        timestamp=datetime.datetime.utcnow(),
        user_id=current_user.id,
        username=current_user.username,
        action="ADMIN_RECORD_DELETED",
        resource=f"Table:{table_key}",
        details=f"Deleted record ID {record_id} from table '{model.__tablename__}'"
    )
    db.add(audit)
    db.commit()
    return None
