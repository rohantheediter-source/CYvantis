from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from app.utils.defensive_suite_service import DefensiveSuiteService

router = APIRouter(prefix="/defense", tags=["Autonomous Cyber Defense Operations Suite"])

# Request Schemas
class DriftRevertRequest(BaseModel):
    drift_id: str

class PatchDispatchRequest(BaseModel):
    asset_id: str
    cve_id: Optional[str] = None

class GoldenImageRequest(BaseModel):
    base_os: Optional[str] = "alpine"

class PolicyGenRequest(BaseModel):
    policy_type: Optional[str] = "kubernetes"

class DlpScanRequest(BaseModel):
    payload: str

class SqlAuditRequest(BaseModel):
    sql_query: str

class NlQueryRequest(BaseModel):
    prompt: str

class PlaybookExecuteRequest(BaseModel):
    playbook_id: str
    target_ip: Optional[str] = "185.220.101.5"
    host_id: Optional[str] = "web-gateway-01"

class ChaosInjectRequest(BaseModel):
    scenario_id: str

class PacValidateRequest(BaseModel):
    terraform_snippet: str

class IocEnrichRequest(BaseModel):
    ioc: str

# -------------------------------------------------------------
# 1. AUTO-PATCH & CONFIGURATION DRIFT ENGINE
# -------------------------------------------------------------
@router.get("/iac-drift")
def get_iac_drift():
    """Returns detected IaC configuration drifts across cloud, security groups, and K8s."""
    return DefensiveSuiteService.get_iac_drift_status()

@router.post("/iac-drift/revert")
def revert_iac_drift(req: DriftRevertRequest):
    """Executes automated One-Click Revert to restore desired IaC state."""
    return DefensiveSuiteService.revert_iac_drift(req.drift_id)

@router.get("/patch-debt")
def get_patch_debt():
    """Computes fleet patch debt score, outdated OS packages, and critical CVE exposure."""
    return DefensiveSuiteService.get_patch_debt_audit()

@router.post("/patch-debt/dispatch")
def dispatch_patch(req: PatchDispatchRequest):
    """Dispatches automated patch remediation for a vulnerable host."""
    return DefensiveSuiteService.dispatch_patch_remediation(req.asset_id, req.cve_id)

@router.get("/dependency-auditor")
def audit_dependencies():
    """Scans package.json and requirements.txt for unpinned dependencies and generates lockfile diffs."""
    return DefensiveSuiteService.audit_dependency_pinning()

# -------------------------------------------------------------
# 2. IMMUTABLE INFRASTRUCTURE GUARDIAN
# -------------------------------------------------------------
@router.get("/host-integrity")
def get_host_integrity():
    """Provides real-time eBPF system call telemetry, kernel hooks, and file tampering alerts."""
    return DefensiveSuiteService.get_host_integrity_monitoring()

@router.post("/host-integrity/quarantine")
def quarantine_host(host_id: str = Query(...)):
    """Executes automated host isolation, RAM snapshotting, and Golden Image reprovisioning."""
    return DefensiveSuiteService.quarantine_and_reboot_host(host_id)

@router.post("/golden-image/generate")
def generate_golden_image(req: GoldenImageRequest):
    """Generates CIS Level 2 benchmark hardened Dockerfile and Packer AMI specs."""
    return DefensiveSuiteService.generate_golden_image_spec(req.base_os or "alpine")

# -------------------------------------------------------------
# 3. ZERO TRUST NETWORK MICRO-SEGMENTATION PLANNER
# -------------------------------------------------------------
@router.get("/zero-trust/heatmap")
def get_zero_trust_heatmap():
    """Provides NetFlow East-West lateral movement traffic map and flags unauthorized cross-tier flows."""
    return DefensiveSuiteService.get_lateral_movement_flow_heatmap()

@router.post("/zero-trust/policies")
def generate_zero_trust_policies(req: PolicyGenRequest):
    """Generates least-privilege Kubernetes NetworkPolicies, AWS Security Groups, and runs What-If impact simulation."""
    return DefensiveSuiteService.generate_microsegmentation_policies(req.policy_type or "kubernetes")

@router.get("/zero-trust/service-mesh")
def get_service_mesh_status():
    """Audits Istio/Linkerd mTLS status across services and detects plaintext communication."""
    return DefensiveSuiteService.get_service_mesh_mtls_status()

# -------------------------------------------------------------
# 4. DATA EXFILTRATION SENTINEL
# -------------------------------------------------------------
@router.post("/dlp/scan")
def scan_dlp_payload(req: DlpScanRequest):
    """Scans outbound payload with Luhn credit card validation, SSN, and Cloud Secret patterns."""
    return DefensiveSuiteService.scan_dlp_payload(req.payload)

@router.get("/dlp/anomalies")
def get_dlp_anomalies():
    """Monitors DNS query surges and abnormal outbound bandwidth indicative of data tunneling."""
    return DefensiveSuiteService.get_exfiltration_anomalies()

@router.post("/dlp/sql-audit")
def audit_sql_query(req: SqlAuditRequest):
    """Audits SQL queries for bulk customer scraping and generates PostgreSQL Row-Level Security policies."""
    return DefensiveSuiteService.audit_sql_query_and_generate_rls(req.sql_query)

# -------------------------------------------------------------
# 5. THREAT HUNTING QUERY BUILDER
# -------------------------------------------------------------
@router.post("/threat-hunting/nl-query")
def translate_nl_query(req: NlQueryRequest):
    """Translates natural language questions into SPL (Splunk), KQL (Kusto), and Elasticsearch queries."""
    return DefensiveSuiteService.translate_natural_language_to_query(req.prompt)

@router.get("/threat-hunting/hypotheses")
def get_threat_hypotheses():
    """Returns interactive hypothesis cards with evidence scores and confirmed verdicts."""
    return DefensiveSuiteService.get_hunting_hypotheses()

@router.get("/threat-hunting/mitre-coverage")
def get_mitre_coverage():
    """Maps detection rules against MITRE ATT&CK tactics and recommends Sigma rules."""
    return DefensiveSuiteService.get_mitre_coverage_mapping()

# -------------------------------------------------------------
# 6. INCIDENT RESPONSE ORCHESTRATOR
# -------------------------------------------------------------
@router.get("/incident-response/playbooks")
def get_playbooks():
    """Lists available automated SOAR incident response playbooks."""
    return DefensiveSuiteService.get_incident_response_playbooks()

@router.post("/incident-response/playbooks/execute")
def execute_playbook(req: PlaybookExecuteRequest):
    """Simulates immediate automated execution of a critical incident response playbook."""
    return DefensiveSuiteService.execute_incident_playbook(req.playbook_id, req.target_ip or "185.220.101.5", req.host_id or "web-gateway-01")

@router.get("/incident-response/timeline")
def get_attack_timeline():
    """Reconstructs chronological multi-stage attack timeline from initial probe to exfiltration."""
    return DefensiveSuiteService.get_attack_timeline_reconstruction()

@router.get("/incident-response/post-mortem")
def get_post_mortem(incident_ref: str = Query("INC-2026-0492")):
    """Generates an executive-ready Root Cause Analysis (RCA) document."""
    return DefensiveSuiteService.generate_post_mortem_rca(incident_ref)

# -------------------------------------------------------------
# 7. RESILIENCE CHAOS ENGINEERING ENGINE
# -------------------------------------------------------------
@router.get("/chaos/scenarios")
def get_chaos_scenarios():
    """Lists LitmusChaos / Chaos Mesh fault injection scenarios."""
    return DefensiveSuiteService.get_chaos_scenarios()

@router.post("/chaos/inject")
def inject_chaos(req: ChaosInjectRequest):
    """Executes controlled fault injection and evaluates circuit breakers and autoscalers."""
    return DefensiveSuiteService.inject_chaos_scenario(req.scenario_id)

@router.get("/chaos/slo-burn-rate")
def get_slo_burn_rate():
    """Returns live SLO error budget burn rate metrics and alarm thresholds."""
    return DefensiveSuiteService.get_slo_burn_rate_metrics()

@router.post("/chaos/game-day")
def run_game_day():
    """Executes multi-vector Game Day drill and generates resilience scorecard."""
    return DefensiveSuiteService.run_game_day_drill()

# -------------------------------------------------------------
# 8. COMPLIANCE & GOVERNANCE DASHBOARD
# -------------------------------------------------------------
@router.get("/compliance/scorecards")
def get_compliance_scorecards():
    """Returns SOC 2, ISO 27001, HIPAA, and PCI-DSS compliance ratings and control statuses."""
    return DefensiveSuiteService.get_compliance_scorecards()

@router.get("/compliance/audit-trail")
def get_audit_trail():
    """Returns cryptographic SHA-256 hash-chained audit log."""
    return DefensiveSuiteService.get_tamper_proof_audit_trail()

@router.post("/compliance/audit-trail/verify")
def verify_audit_trail():
    """Verifies mathematical integrity of hash-chained audit log blocks."""
    return DefensiveSuiteService.verify_audit_trail_integrity()

@router.post("/compliance/pac-validate")
def validate_pac_rego(req: PacValidateRequest):
    """Validates Terraform snippet against Open Policy Agent (OPA) Rego security policies."""
    return DefensiveSuiteService.validate_policy_as_code_rego(req.terraform_snippet)

# -------------------------------------------------------------
# 9. THREAT INTEL FUSION CENTER
# -------------------------------------------------------------
@router.post("/fusion/enrich")
def enrich_ioc(req: IocEnrichRequest):
    """Aggregates VirusTotal, AbuseIPDB, Shodan, AlienVault OTX, and MISP threat intelligence."""
    return DefensiveSuiteService.enrich_ioc_multi_source(req.ioc)

@router.get("/fusion/correlations")
def get_ioc_correlations():
    """Correlates multiple IOCs and maps them to known threat actor campaigns."""
    return DefensiveSuiteService.get_ioc_correlation_matrix()

# -------------------------------------------------------------
# 10. SECURITY POSTURE SCORECARD
# -------------------------------------------------------------
@router.get("/posture/scorecard")
def get_security_posture():
    """Calculates composite 0-100 security score, industry benchmarks, and improvement roadmap."""
    return DefensiveSuiteService.get_composite_security_scorecard()
