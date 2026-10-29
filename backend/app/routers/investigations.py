import json
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Investigation, InvestigationNote, User, AuditLog
from app.schemas import (
    InvestigationCreate, InvestigationUpdate, InvestigationResponse,
    InvestigationNoteCreate, InvestigationNoteResponse
)
from app.security import get_current_user, require_roles

router = APIRouter(prefix="/investigations", tags=["Investigation Management"])

def _format_investigation(inv: Investigation, db: Session) -> dict:
    notes_list = []
    for n in inv.notes:
        author = db.query(User).filter(User.id == n.author_id).first()
        notes_list.append({
            "id": n.id,
            "investigation_id": n.investigation_id,
            "author_id": n.author_id,
            "author_username": author.username if author else "Unknown",
            "note_text": n.note_text,
            "created_at": n.created_at
        })

    assigned_user = db.query(User).filter(User.id == inv.assigned_to_id).first() if inv.assigned_to_id else None
    created_user = db.query(User).filter(User.id == inv.created_by_id).first() if inv.created_by_id else None
    
    rel_events = []
    if inv.related_events:
        try:
            rel_events = json.loads(inv.related_events)
        except Exception:
            rel_events = []

    return {
        "id": inv.id,
        "title": inv.title,
        "description": inv.description,
        "severity": inv.severity,
        "status": inv.status,
        "assigned_to_id": inv.assigned_to_id,
        "assigned_to_username": assigned_user.username if assigned_user else None,
        "created_by_id": inv.created_by_id,
        "created_by_username": created_user.username if created_user else None,
        "created_at": inv.created_at,
        "updated_at": inv.updated_at,
        "related_events": rel_events,
        "notes": notes_list
    }

@router.get("", response_model=List[InvestigationResponse])
def get_all_investigations(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Investigation)
    if status_filter:
        query = query.filter(Investigation.status == status_filter)
    investigations = query.order_by(Investigation.updated_at.desc()).all()
    return [_format_investigation(inv, db) for inv in investigations]

@router.post("", response_model=InvestigationResponse, status_code=status.HTTP_201_CREATED)
def create_investigation(
    inv_in: InvestigationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "analyst"]))
):
    rel_events_json = json.dumps(inv_in.related_events) if inv_in.related_events else None

    inv = Investigation(
        title=inv_in.title,
        description=inv_in.description,
        severity=inv_in.severity,
        status=inv_in.status,
        assigned_to_id=inv_in.assigned_to_id or current_user.id,
        created_by_id=current_user.id,
        created_at=datetime.datetime.utcnow(),
        updated_at=datetime.datetime.utcnow(),
        related_events=rel_events_json
    )
    db.add(inv)
    
    audit = AuditLog(
        timestamp=datetime.datetime.utcnow(),
        user_id=current_user.id,
        username=current_user.username,
        action="INVESTIGATION_CREATED",
        resource="Investigations",
        details=f"Created investigation: {inv_in.title}"
    )
    db.add(audit)
    db.commit()
    db.refresh(inv)
    return _format_investigation(inv, db)

@router.get("/{inv_id}", response_model=InvestigationResponse)
def get_investigation_detail(
    inv_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inv = db.query(Investigation).filter(Investigation.id == inv_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")
    return _format_investigation(inv, db)

@router.put("/{inv_id}", response_model=InvestigationResponse)
def update_investigation(
    inv_id: int,
    inv_in: InvestigationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "analyst"]))
):
    inv = db.query(Investigation).filter(Investigation.id == inv_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    if inv_in.title:
        inv.title = inv_in.title
    if inv_in.description is not None:
        inv.description = inv_in.description
    if inv_in.severity:
        inv.severity = inv_in.severity
    if inv_in.status:
        inv.status = inv_in.status
    if inv_in.assigned_to_id is not None:
        inv.assigned_to_id = inv_in.assigned_to_id
    if inv_in.related_events is not None:
        inv.related_events = json.dumps(inv_in.related_events)

    inv.updated_at = datetime.datetime.utcnow()

    audit = AuditLog(
        timestamp=datetime.datetime.utcnow(),
        user_id=current_user.id,
        username=current_user.username,
        action="INVESTIGATION_UPDATED",
        resource="Investigations",
        details=f"Updated investigation ID {inv_id}"
    )
    db.add(audit)
    db.commit()
    db.refresh(inv)
    return _format_investigation(inv, db)

@router.post("/{inv_id}/notes", response_model=InvestigationNoteResponse)
def add_investigation_note(
    inv_id: int,
    note_in: InvestigationNoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "analyst"]))
):
    inv = db.query(Investigation).filter(Investigation.id == inv_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    note = InvestigationNote(
        investigation_id=inv_id,
        author_id=current_user.id,
        note_text=note_in.note_text,
        created_at=datetime.datetime.utcnow()
    )
    db.add(note)
    inv.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(note)

    return {
        "id": note.id,
        "investigation_id": note.investigation_id,
        "author_id": note.author_id,
        "author_username": current_user.username,
        "note_text": note.note_text,
        "created_at": note.created_at
    }
