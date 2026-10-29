import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import DetectionRule, Alert, User, AuditLog
from app.schemas import DetectionRuleCreate, DetectionRuleResponse, AlertResponse, AlertUpdate
from app.security import get_current_user, require_roles

router = APIRouter(prefix="/rules", tags=["Detection Rules & Alerts"])

@router.get("", response_model=List[DetectionRuleResponse])
def get_all_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(DetectionRule).order_by(DetectionRule.id.asc()).all()

@router.post("", response_model=DetectionRuleResponse, status_code=status.HTTP_201_CREATED)
def create_rule(
    rule_in: DetectionRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "analyst"]))
):
    existing = db.query(DetectionRule).filter(DetectionRule.name == rule_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Rule name already exists")

    rule = DetectionRule(
        name=rule_in.name,
        description=rule_in.description,
        rule_type=rule_in.rule_type,
        condition=rule_in.condition,
        threshold=rule_in.threshold,
        severity=rule_in.severity,
        is_enabled=rule_in.is_enabled,
        created_at=datetime.datetime.utcnow()
    )
    db.add(rule)

    audit = AuditLog(
        timestamp=datetime.datetime.utcnow(),
        user_id=current_user.id,
        username=current_user.username,
        action="RULE_CREATED",
        resource="DetectionRules",
        details=f"Created detection rule: {rule_in.name}"
    )
    db.add(audit)
    db.commit()
    db.refresh(rule)
    return rule

@router.put("/{rule_id}/toggle", response_model=DetectionRuleResponse)
def toggle_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "analyst"]))
):
    rule = db.query(DetectionRule).filter(DetectionRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    rule.is_enabled = not rule.is_enabled

    audit = AuditLog(
        timestamp=datetime.datetime.utcnow(),
        user_id=current_user.id,
        username=current_user.username,
        action="RULE_TOGGLED",
        resource="DetectionRules",
        details=f"Toggled rule ID {rule_id} status to {rule.is_enabled}"
    )
    db.add(audit)
    db.commit()
    db.refresh(rule)
    return rule

@router.get("/alerts", response_model=List[AlertResponse])
def get_all_alerts(
    status_filter: str = "all",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Alert)
    if status_filter != "all":
        query = query.filter(Alert.status == status_filter)
    return query.order_by(Alert.timestamp.desc()).all()

@router.put("/alerts/{alert_id}/acknowledge", response_model=AlertResponse)
def acknowledge_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "analyst"]))
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_acknowledged = True
    alert.status = "acknowledged"
    alert.acknowledged_by_id = current_user.id
    alert.acknowledged_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(alert)
    return alert
