import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, AuditLog
from app.schemas import UserCreate, UserUpdate, UserResponse
from app.security import get_current_user, require_roles, get_password_hash

router = APIRouter(prefix="/users", tags=["User Management"])

@router.get("", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "analyst"]))
):
    return db.query(User).order_by(User.id.asc()).all()

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    existing = db.query(User).filter((User.username == user_in.username) | (User.email == user_in.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already registered")

    new_user = User(
        username=user_in.username,
        email=user_in.email,
        full_name=user_in.full_name,
        role=user_in.role,
        hashed_password=get_password_hash(user_in.password),
        is_active=True,
        created_at=datetime.datetime.utcnow()
    )
    db.add(new_user)
    
    audit = AuditLog(
        timestamp=datetime.datetime.utcnow(),
        user_id=current_user.id,
        username=current_user.username,
        action="USER_CREATED",
        resource="UserManagement",
        details=f"Created user '{user_in.username}' with role '{user_in.role}'"
    )
    db.add(audit)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_in.email:
        target_user.email = user_in.email
    if user_in.full_name is not None:
        target_user.full_name = user_in.full_name
    if user_in.role:
        target_user.role = user_in.role
    if user_in.is_active is not None:
        target_user.is_active = user_in.is_active
    if user_in.password:
        target_user.hashed_password = get_password_hash(user_in.password)

    audit = AuditLog(
        timestamp=datetime.datetime.utcnow(),
        user_id=current_user.id,
        username=current_user.username,
        action="USER_UPDATED",
        resource="UserManagement",
        details=f"Updated user ID {user_id} ({target_user.username})"
    )
    db.add(audit)
    db.commit()
    db.refresh(target_user)
    return target_user

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own active administrator account")

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    username = target_user.username

    # Clean up foreign key references to prevent integrity errors
    from app.models import Investigation, InvestigationNote, Alert
    db.query(Investigation).filter(Investigation.assigned_to_id == user_id).update({Investigation.assigned_to_id: None})
    db.query(Investigation).filter(Investigation.created_by_id == user_id).update({Investigation.created_by_id: None})
    db.query(Alert).filter(Alert.acknowledged_by_id == user_id).update({Alert.acknowledged_by_id: None})
    db.query(InvestigationNote).filter(InvestigationNote.author_id == user_id).delete()

    db.delete(target_user)
    
    audit = AuditLog(
        timestamp=datetime.datetime.utcnow(),
        user_id=current_user.id,
        username=current_user.username,
        action="USER_DELETED",
        resource="UserManagement",
        details=f"Deleted user '{username}' (ID: {user_id})"
    )
    db.add(audit)
    db.commit()
    return {"success": True, "message": f"User '{username}' successfully deleted", "deleted_user_id": user_id}

