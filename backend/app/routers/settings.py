import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import PlatformSetting, User, AuditLog
from app.schemas import PlatformSettingResponse, PlatformSettingUpdate
from app.security import get_current_user, require_roles

router = APIRouter(prefix="/settings", tags=["Platform Settings"])

@router.get("", response_model=List[PlatformSettingResponse])
def get_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(PlatformSetting).order_by(PlatformSetting.id.asc()).all()

@router.put("/{key}", response_model=PlatformSettingResponse)
def update_setting(
    key: str,
    setting_in: PlatformSettingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin"]))
):
    setting = db.query(PlatformSetting).filter(PlatformSetting.key == key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting key not found")

    setting.value = setting_in.value
    setting.updated_at = datetime.datetime.utcnow()

    audit = AuditLog(
        timestamp=datetime.datetime.utcnow(),
        user_id=current_user.id,
        username=current_user.username,
        action="SETTING_UPDATED",
        resource="Settings",
        details=f"Updated setting '{key}' to '{setting_in.value}'"
    )
    db.add(audit)
    db.commit()
    db.refresh(setting)
    return setting
