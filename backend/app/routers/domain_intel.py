from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.utils.domain_intel_service import DomainIntelligenceService

router = APIRouter(prefix="/domain-intel", tags=["Domain & DNS Intelligence"])

class DgaDetectRequest(BaseModel):
    subdomain: str

class DecodeTunnelPayloadRequest(BaseModel):
    query: str

class TyposquatCheckRequest(BaseModel):
    domain: str

@router.get("/pdns/{domain}")
def get_passive_dns(domain: str):
    """Retrieves 90-day A/AAAA history, CNAME chains, subdomains, and DGA entropy."""
    return DomainIntelligenceService.get_passive_dns_history(domain)

@router.post("/dga-detect")
def detect_dga_entropy(req: DgaDetectRequest):
    """Calculates Shannon entropy on a subdomain to flag potential DGA beacons."""
    entropy = DomainIntelligenceService.calculate_shannon_entropy(req.subdomain)
    is_dga = entropy > 3.6
    return {
        "subdomain": req.subdomain,
        "shannon_entropy": entropy,
        "is_dga": is_dga,
        "risk": "CRITICAL_DGA" if is_dga else "CLEAN"
    }

@router.get("/dnssec-tunneling/{domain}")
def get_dnssec_and_tunneling(domain: str):
    """Analyzes DNSSEC status, fast-flux TTL rotations, and DNS tunneling query signatures."""
    return DomainIntelligenceService.analyze_dnssec_and_tunneling(domain)

@router.post("/decode-tunnel-payload")
def decode_tunnel_payload(req: DecodeTunnelPayloadRequest):
    """Decodes Base64/Hex exfiltrated data within high-volume DNS tunneling queries."""
    return DomainIntelligenceService.decode_tunnel_payload(req.query)

@router.get("/ct-logs/{domain}")
def get_ct_logs(domain: str):
    """Queries Certificate Transparency history, detects wildcards, and flags Private CAs."""
    return DomainIntelligenceService.get_certificate_transparency_history(domain)

@router.get("/whois/{domain}")
def get_whois_registration(domain: str):
    """Provides registration forensics, privacy masking check, and throwaway nameserver analysis."""
    return DomainIntelligenceService.get_whois_and_typosquatting(domain)

@router.post("/typosquat-check")
def check_typosquatting(req: TyposquatCheckRequest):
    """Runs Levenshtein distance against top global brands to detect phishing impersonations."""
    result = DomainIntelligenceService.get_whois_and_typosquatting(req.domain)
    return result.get("typosquatting_analysis", {})
