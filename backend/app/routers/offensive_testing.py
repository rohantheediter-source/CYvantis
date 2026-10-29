from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.utils.offensive_defensive_service import OffensiveDefensiveSuiteService

router = APIRouter(prefix="/offensive", tags=["Offensive & Defensive Security Testing"])

class CloudAuditRequest(BaseModel):
    environment: Optional[str] = "AWS-Production"

class ApiFuzzerRequest(BaseModel):
    endpoint: Optional[str] = "/api/v1/users"

class PlaybookSimulateRequest(BaseModel):
    steps: List[str]

class RedTeamReportRequest(BaseModel):
    title: Optional[str] = "Enterprise Cyber War Room Assessment"

@router.get("/lateral-movement/attack-path")
def get_attack_path():
    """Generates the shortest attack path graph from initial foothold to Domain Controller."""
    return OffensiveDefensiveSuiteService.get_lateral_movement_simulation()

@router.post("/cloud/audit")
def audit_cloud(req: CloudAuditRequest):
    """Probes S3 public bucket access, IAM AssumeRole privilege escalation, and Lambda injections."""
    return OffensiveDefensiveSuiteService.audit_cloud_environment(req.environment or "AWS-Production")

@router.post("/api-fuzzer/test")
def test_api_security(req: ApiFuzzerRequest):
    """Tests GraphQL introspection, IDOR authorization bypass, and rate-limit enforcement."""
    return OffensiveDefensiveSuiteService.test_api_security(req.endpoint or "/api/v1/users")

@router.post("/supply-chain/audit")
def audit_supply_chain():
    """Audits dependencies for typosquats and scans code for dangerous static execution calls."""
    return OffensiveDefensiveSuiteService.audit_software_supply_chain()

@router.get("/fuzzing/campaigns")
def get_fuzzing_status():
    """Provides real-time AFL++/Jazzer fuzzing campaign status, branch coverage, and crash dumps."""
    return OffensiveDefensiveSuiteService.get_fuzzing_campaign_status()

@router.get("/threat-actors")
def list_threat_actors():
    """Returns top nation-state threat actors with mapped MITRE TTPs."""
    return {
        "actors": ["APT29", "FIN7", "Lazarus"],
        "profiles": [
            OffensiveDefensiveSuiteService.get_threat_actor_profile("APT29"),
            OffensiveDefensiveSuiteService.get_threat_actor_profile("FIN7"),
            OffensiveDefensiveSuiteService.get_threat_actor_profile("Lazarus")
        ]
    }

@router.get("/threat-actors/{actor_id}")
def get_actor_profile(actor_id: str):
    """Fetches full threat actor profile and MITRE matrix."""
    return OffensiveDefensiveSuiteService.get_threat_actor_profile(actor_id)

@router.post("/playbook/simulate")
def simulate_attack_playbook(req: PlaybookSimulateRequest):
    """Simulates custom chained adversary steps and calculates cumulative business impact."""
    return OffensiveDefensiveSuiteService.simulate_attack_playbook(req.steps)

@router.post("/redteam/report")
def generate_red_team_report(req: RedTeamReportRequest):
    """Generates a professional Red Team assessment report in structured Markdown format."""
    return OffensiveDefensiveSuiteService.generate_red_team_report(req.title or "Enterprise Assessment")
