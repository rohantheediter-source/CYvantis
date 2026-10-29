from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models import HoneypotEvent, ThreatIntelIOC

def generate_firewall_blocklist(
    db: Session,
    format_type: str = "ufw",
    min_score: int = 50,
    limit: int = 100
) -> Dict[str, Any]:
    """Generate firewall block rules and CIDR blocklists from malicious honeypot IPs."""
    format_type = format_type.lower()
    
    # Query distinct malicious IPs from HoneypotEvent & ThreatIntelIOC
    honeypot_ips = db.query(HoneypotEvent.src_ip).distinct().all()
    ioc_ips = db.query(ThreatIntelIOC.indicator).filter(
        ThreatIntelIOC.ioc_type == "IP", ThreatIntelIOC.threat_score >= min_score
    ).all()

    all_ips = set([ip[0] for ip in honeypot_ips if ip[0]])
    all_ips.update([ip[0] for ip in ioc_ips if ip[0]])
    
    ip_list = sorted(list(all_ips))[:limit]

    output_rules = []

    if format_type == "ufw":
        output_rules.append("# UFW Firewall Block Rules - CYVANTIS SOC Threat Feed")
        for ip in ip_list:
            output_rules.append(f"sudo ufw deny from {ip} to any comment 'CYVANTIS Honeypot Threat Block'")

    elif format_type == "iptables":
        output_rules.append("# iptables Firewall Rules - CYVANTIS SOC Threat Feed")
        for ip in ip_list:
            output_rules.append(f"iptables -A INPUT -s {ip} -j DROP")

    elif format_type == "powershell" or format_type == "windows":
        output_rules.append("# Windows PowerShell Firewall Rules - CYVANTIS SOC Threat Feed")
        for idx, ip in enumerate(ip_list, 1):
            rule_name = f"CYVANTIS_Block_IP_{idx}"
            output_rules.append(f"New-NetFirewallRule -DisplayName '{rule_name}' -Direction Inbound -Action Block -RemoteAddress '{ip}'")

    elif format_type == "pfsense" or format_type == "alias":
        output_rules.append("# pfSense / Fortinet Alias List")
        output_rules.append(",".join(ip_list))

    else: # plain IP / CIDR list
        for ip in ip_list:
            output_rules.append(f"{ip}/32")

    return {
        "format": format_type,
        "count": len(ip_list),
        "ip_list": ip_list,
        "rules_text": "\n".join(output_rules)
    }
