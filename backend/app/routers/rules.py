import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import DetectionRule, Alert, User, AuditLog
import json
from app.schemas import DetectionRuleCreate, DetectionRuleUpdate, DetectionRuleResponse, AlertResponse, AlertUpdate
from app.security import get_current_user, require_roles
from app.detection.engine import RULE_TYPES


def _validate_condition(condition: str) -> str:
    try:
        parsed = json.loads(condition or "{}")
    except ValueError:
        raise HTTPException(status_code=422, detail="condition must be a JSON object")
    if not isinstance(parsed, dict):
        raise HTTPException(status_code=422, detail="condition must be a JSON object")
    return json.dumps(parsed)

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
    if rule_in.rule_type not in RULE_TYPES:
        raise HTTPException(status_code=422, detail=f"rule_type must be one of {list(RULE_TYPES)}")
    condition = _validate_condition(rule_in.condition)

    rule = DetectionRule(
        name=rule_in.name,
        description=rule_in.description,
        rule_type=rule_in.rule_type,
        condition=condition,
        threshold=rule_in.threshold,
        severity=rule_in.severity,
        is_enabled=rule_in.is_enabled,
        window_seconds=rule_in.window_seconds,
        confidence=rule_in.confidence,
        trigger_count=0,
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

@router.get("/types")
def get_rule_types(current_user: User = Depends(get_current_user)):
    return {"rule_types": list(RULE_TYPES)}


@router.put("/{rule_id}", response_model=DetectionRuleResponse)
def update_rule(
    rule_id: int,
    rule_in: DetectionRuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "analyst"]))
):
    rule = db.query(DetectionRule).filter(DetectionRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    changes = rule_in.model_dump(exclude_unset=True)
    if "condition" in changes:
        changes["condition"] = _validate_condition(changes["condition"])
    before = {k: getattr(rule, k) for k in changes}
    for k, v in changes.items():
        setattr(rule, k, v)
    db.add(AuditLog(
        timestamp=datetime.datetime.utcnow(), user_id=current_user.id, username=current_user.username,
        action="RULE_TUNED", resource="DetectionRules",
        details=f"Rule {rule_id} changed: " + ", ".join(f"{k}: {before[k]!r} -> {v!r}" for k, v in changes.items())[:900]
    ))
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
    return query.order_by(Alert.timestamp.desc()).limit(500).all()

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
    db.add(AuditLog(timestamp=datetime.datetime.utcnow(), user_id=current_user.id, username=current_user.username,
                    action="ALERT_ACKNOWLEDGED", resource="Alerts", details=f"alert {alert_id}"))
    db.commit()
    db.refresh(alert)
    return alert
