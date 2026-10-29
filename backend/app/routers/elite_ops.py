from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from app.utils.elite_ops_service import EliteOpsService

router = APIRouter(prefix="/elite-ops", tags=["Elite Cyber Operations & Security Lifecycle Suite"])

# Request Schemas
class RevokeIdentityRequest(BaseModel):
    username: str

class LogicFuzzRequest(BaseModel):
    test_type: Optional[str] = "all"

class AskCopilotRequest(BaseModel):
    question: str

class ArchitectureReviewRequest(BaseModel):
    architecture_description: Optional[str] = "CYVANTIS Distributed Cloud Architecture"

# -------------------------------------------------------------
# 1. IDENTITY GRAPH & INSIDER THREAT ENGINE
# -------------------------------------------------------------
@router.get("/identity-graph")
def get_identity_graph():
    """Provides unified identity mapping, privilege creep detection, and impossible travel session alerts."""
    return EliteOpsService.get_identity_graph()

@router.post("/identity-graph/revoke")
def revoke_identity_session(req: RevokeIdentityRequest):
    """Revokes all active sessions (Okta, AWS STS, database) for a compromised identity."""
    return EliteOpsService.revoke_identity_session(req.username)

# -------------------------------------------------------------
# 2. SOFTWARE SUPPLY CHAIN INTEGRITY MONITOR
# -------------------------------------------------------------
@router.get("/supply-chain")
def get_supply_chain_integrity():
    """Generates CycloneDX/SPDX SBOMs, checks dependency confusion, and verifies Sigstore build signatures."""
    return EliteOpsService.get_sbom_and_supply_chain_status()

# -------------------------------------------------------------
# 3. BUSINESS LOGIC & FRAUD ENGINE
# -------------------------------------------------------------
@router.post("/business-logic/fuzz")
def test_business_logic(req: LogicFuzzRequest):
    """Runs automated financial logic fuzzer (negative quantity, price tampering, TOCTOU inventory race, promo abuse)."""
    return EliteOpsService.test_financial_and_logic_fuzzer(req.test_type or "all")

# -------------------------------------------------------------
# 4. COGNITIVE LOAD REDUCER (AI CO-PILOT)
# -------------------------------------------------------------
@router.get("/cognitive/clusters")
def get_alert_clusters():
    """Applies DBSCAN density clustering to group noisy alerts into unified incidents and provides daily digest."""
    return EliteOpsService.get_alert_deduplication_clusters()

@router.post("/cognitive/ask")
def ask_copilot(req: AskCopilotRequest):
    """Interactive Ask CYVANTIS conversational AI Co-Pilot query interface."""
    return EliteOpsService.ask_cyvantis_copilot(req.question)

# -------------------------------------------------------------
# 5. DISASTER RECOVERY & RESILIENCE SIMULATOR
# -------------------------------------------------------------
@router.get("/disaster-recovery")
def get_disaster_recovery():
    """Provides RPO/RTO calculations, automated failover simulations, backup integrity tests, and DR runbooks."""
    return EliteOpsService.get_disaster_recovery_metrics()

# -------------------------------------------------------------
# 6. SECURITY METRICS & KPI DASHBOARD
# -------------------------------------------------------------
@router.get("/metrics-kpis")
def get_metrics_kpis():
    """Provides MTTD/MTTR historical trendlines, false positive rates, vulnerability aging, and NIST CSF radar."""
    return EliteOpsService.get_security_kpis()

# -------------------------------------------------------------
# 7. EXECUTIVE & BOARD-READY VIEW
# -------------------------------------------------------------
@router.get("/executive-board")
def get_executive_board():
    """Translates technical vulnerabilities into dollar-quantified risk using the FAIR model."""
    return EliteOpsService.get_executive_board_view()

# -------------------------------------------------------------
# 8. SECURITY AUTOMATION MARKETPLACE
# -------------------------------------------------------------
@router.get("/marketplace")
def get_marketplace():
    """Provides discoverable SOAR playbooks and enterprise connector status (Slack, Jira, AWS, Okta)."""
    return EliteOpsService.get_marketplace_and_integrations()

# -------------------------------------------------------------
# 9. SECURITY TRAINING & PHISHING SIMULATOR
# -------------------------------------------------------------
@router.get("/training-phish")
def get_training_and_phish():
    """Provides simulated phishing metrics, employee risk scores, and targeted micro-learning lessons."""
    return EliteOpsService.get_security_training_and_phishing()

# -------------------------------------------------------------
# 10. SECURITY ARCHITECTURE REVIEWER
# -------------------------------------------------------------
@router.post("/architecture-review")
def review_architecture(req: ArchitectureReviewRequest):
    """Generates automated STRIDE threat model and architectural compliance gap analysis."""
    return EliteOpsService.review_security_architecture(req.architecture_description)
