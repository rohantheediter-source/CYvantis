import math
import hashlib
from typing import Dict, Any, List

def calculate_shannon_entropy(domain: str) -> float:
    """Calculates Shannon entropy to detect Domain Generation Algorithms (DGA)."""
    if not domain:
        return 0.0
    clean_domain = domain.split('.')[0]
    length = len(clean_domain)
    if length == 0:
        return 0.0
    prob_dist = [float(clean_domain.count(c)) / length for c in dict.fromkeys(list(clean_domain))]
    entropy = -sum([p * math.log(p) / math.log(2.0) for p in prob_dist])
    return round(entropy, 2)

def query_shodan_censys_footprint(ip: str) -> Dict[str, Any]:
    """
    Gathers active external reconnaissance & OSINT telemetry for the attacker IP.
    Simulates Shodan, Censys, BGP Toolkit, and Passive DNS telemetry.
    """
    seed_val = int(hashlib.md5(ip.encode()).hexdigest()[:6], 16)

    # Simulated exposed ports & services
    port_profiles = [
        {"ports": [22, 80, 443], "banners": ["nginx/1.18.0", "OpenSSH 8.2p1"], "os": "Ubuntu Linux", "vulns": ["CVE-2021-41773 (Apache Path Traversal)"]},
        {"ports": [22, 23, 8080], "banners": ["MikroTik RouterOS http proxy", "Dropbear SSH 2020.81"], "os": "MikroTik RouterOS", "vulns": ["CVE-2023-32154 (RouterOS Exploit)"]},
        {"ports": [22, 3389, 445], "banners": ["Microsoft Windows RPC", "Remote Desktop"], "os": "Windows Server 2019", "vulns": ["CVE-2020-0796 (SMBGhost)"]},
        {"ports": [22, 9001], "banners": ["Tor Relay Node", "OpenSSH 7.9"], "os": "Debian Linux", "vulns": []}
    ]
    profile = port_profiles[seed_val % len(port_profiles)]

    # BGP Network Provenance
    if seed_val % 4 == 0:
        infra_type = "Cloud Hosting Provider (AWS/DigitalOcean/Hetzner)"
        hosting_risk = "Medium (Ephemeral Cloud VPS)"
    elif seed_val % 4 == 1:
        infra_type = "Bulletproof Hosting Infrastructure"
        hosting_risk = "CRITICAL (High Malicious Density)"
    elif seed_val % 4 == 2:
        infra_type = "Compromised Residential ISP"
        hosting_risk = "High (Compromised IoT Node / Proxy)"
    else:
        infra_type = "Public Anonymizer / Tor Exit Relay"
        hosting_risk = "High (Anonymity Network)"

    # Passive DNS & DGA
    associated_domains = [
        f"c2-node-{seed_val % 99}.cyberthreats.biz",
        f"pool-xmr-{seed_val % 50}.minehash.pro",
        f"dga-x89q3k{seed_val % 1000}.top"
    ]
    domain = associated_domains[seed_val % len(associated_domains)]
    entropy = calculate_shannon_entropy(domain)
    is_dga = entropy >= 3.4

    return {
        "ip": ip,
        "shodan": {
            "total_open_ports": len(profile["ports"]),
            "open_ports": profile["ports"],
            "service_banners": profile["banners"],
            "detected_os": profile["os"],
            "cve_vulnerabilities": profile["vulns"],
            "host_names": [f"host-{ip.replace('.', '-')}.dynamic-pool.net"],
            "last_scanned": "2026-10-10T18:30:00Z"
        },
        "bgp_provenance": {
            "bgp_prefix": f"{'.'.join(ip.split('.')[:3])}.0/24",
            "autonomous_system": f"AS{seed_val % 50000 + 1000}",
            "infrastructure_type": infra_type,
            "hosting_risk_rating": hosting_risk,
            "bgp_hijack_indicator": "NONE (Legitimate BGP Advertised Route)",
            "peering_partners": ["Lumen AS3356", "Telia Carrier AS1299", "Cogent AS174"]
        },
        "passive_dns": {
            "associated_domain": domain,
            "shannon_entropy": entropy,
            "dga_detected": is_dga,
            "dga_classification": "Algorithmic DGA (Botnet C2)" if is_dga else "Legitimate Custom Domain",
            "dns_resolutions_count": (seed_val % 18) + 3
        }
    }
