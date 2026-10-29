"""
Suricata & Snort IDS/IPS Rule Generator Module for CYVANTIS
Converts honeypot attack events, malicious IP addresses, and exploit payloads into standard Suricata/Snort IDS rules.
"""

from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models import HoneypotEvent, ThreatIntelIOC

def generate_ids_rules(db: Session, engine_type: str = "suricata", limit: int = 50) -> Dict[str, Any]:
    engine_type = engine_type.lower()
    events = db.query(HoneypotEvent).order_by(HoneypotEvent.timestamp.desc()).limit(limit).all()
    iocs = db.query(ThreatIntelIOC).filter(ThreatIntelIOC.threat_score >= 50).limit(limit).all()

    rules = []
    sid = 1000001

    # Header comment
    rules.append(f"# ========================================================")
    rules.append(f"# CYVANTIS AEGISNEX AUTOMATED {engine_type.upper()} IDS/IPS RULES")
    rules.append(f"# Auto-generated from Live Honeypot Telemetry & Threat IOCs")
    rules.append(f"# ========================================================\n")

    # 1. Generate rules from malicious source IPs
    for ioc in iocs:
        if ioc.ioc_type in ["IP", "ipv4"]:
            if engine_type == "snort":
                rule = (
                    f"alert ip {ioc.indicator} any -> $HOME_NET any "
                    f'(msg:"CYVANTIS IDS - Malicious Host Traffic from {ioc.indicator}"; '
                    f'threshold: type limit, track by_src, count 1, seconds 3600; '
                    f"sid:{sid}; rev:1;)"
                )
            else:
                # Suricata format
                rule = (
                    f"alert ip [{ioc.indicator}] any -> $HOME_NET any "
                    f'(msg:"CYVANTIS IDS - High Threat Host Detected [{ioc.category}]"; '
                    f'classtype:trojan-activity; sid:{sid}; rev:1;)'
                )
            rules.append(rule)
            sid += 1

    # 2. Generate rules from captured attack commands/payloads
    seen_commands = set()
    for ev in events:
        if ev.command and ev.command.strip() and ev.command not in seen_commands:
            seen_commands.add(ev.command)
            cmd_snippet = ev.command.strip()[:40].replace('"', '\\"').replace(';', '\\;')
            if engine_type == "snort":
                rule = (
                    f"alert tcp $EXTERNAL_NET any -> $HOME_NET any "
                    f'(msg:"CYVANTIS IDS - Honeypot Exploit Payload ({ev.protocol})"; '
                    f'content:"{cmd_snippet}"; sid:{sid}; rev:1;)'
                )
            else:
                rule = (
                    f"alert tcp $EXTERNAL_NET any -> $HOME_NET any "
                    f'(msg:"CYVANTIS IDS - Malicious Exploit Command Detected [{ev.protocol}]"; '
                    f'content:"{cmd_snippet}"; classtype:attempted-admin; sid:{sid}; rev:1;)'
                )
            rules.append(rule)
            sid += 1

    rules_text = "\n".join(rules)

    return {
        "engine": engine_type,
        "total_rules": len(rules) - 4, # Subtract header comments
        "rules_text": rules_text
    }
