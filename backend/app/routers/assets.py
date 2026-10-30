"""Asset inventory (business context for risk scoring)."""
import datetime
import ipaddress
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from app.database import get_db
from app.intel.indicators import CVE_RE
from app.models import Asset, AuditLog, User
from app.security import get_current_user, require_admin

router = APIRouter(prefix="/assets", tags=["Assets"])


class AssetIn(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    ip_address: Optional[str] = None
    criticality: int = Field(3, ge=1, le=5)
    exposure: str = Field("internet", pattern="^(internet|internal|isolated)$")
    services: List[dict] = Field(default_factory=list, max_length=50)
    cves: List[str] = Field(default_factory=list, max_length=100)
    description: Optional[str] = Field(None, max_length=2000)

    @field_validator("ip_address")
    @classmethod
    def _ip(cls, v):
        return str(ipaddress.ip_address(v)) if v else None

    @field_validator("cves")
    @classmethod
    def _cves(cls, v):
        for c in v:
            if not CVE_RE.fullmatch(c):
                raise ValueError(f"invalid CVE id: {c[:30]}")
        return [c.upper() for c in v]


def _out(a: Asset) -> dict:
    return {"id": a.id, "name": a.name, "ip_address": a.ip_address, "criticality": a.criticality, "exposure": a.exposure,
            "services": a.services or [], "cves": a.cves or [], "description": a.description}


@router.get("")
def list_assets(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return [_out(a) for a in db.query(Asset).order_by(Asset.criticality.desc(), Asset.name).all()]


@router.post("", status_code=201)
def create_asset(body: AssetIn, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    if db.query(Asset).filter(Asset.name == body.name).first():
        raise HTTPException(400, "Asset name already exists")
    a = Asset(**body.model_dump())
    db.add(a)
    db.add(AuditLog(timestamp=datetime.datetime.utcnow(), user_id=user.id, username=user.username,
                    action="ASSET_CREATED", resource="Assets", details=body.name))
    db.commit()
    return _out(a)


@router.put("/{asset_id}")
def update_asset(asset_id: int, body: AssetIn, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    a = db.get(Asset, asset_id)
    if not a:
        raise HTTPException(404, "Asset not found")
    for k, v in body.model_dump().items():
        setattr(a, k, v)
    db.add(AuditLog(timestamp=datetime.datetime.utcnow(), user_id=user.id, username=user.username,
                    action="ASSET_UPDATED", resource="Assets", details=body.name))
    db.commit()
    return _out(a)


@router.delete("/{asset_id}")
def delete_asset(asset_id: int, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    a = db.get(Asset, asset_id)
    if not a:
        raise HTTPException(404, "Asset not found")
    db.delete(a)
    db.add(AuditLog(timestamp=datetime.datetime.utcnow(), user_id=user.id, username=user.username,
                    action="ASSET_DELETED", resource="Assets", details=a.name))
    db.commit()
    return {"deleted": asset_id}
