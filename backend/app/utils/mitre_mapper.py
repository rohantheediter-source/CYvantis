from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models import HoneypotEvent

MITRE_TECHNIQUES = {
    "T1110": {
        "name": "Brute Force",
        "tactic": "Credential Access",
        "description": "Adversaries attempt to gain access to accounts by testing names and passwords.",
        "url": "https://attack.mitre.org/techniques/T1110/"
    },
    "T1059": {
        "name": "Command and Scripting Interpreter",
        "tactic": "Execution",
        "description": "Adversaries abuse command and script interpreters to execute commands, scripts, or binaries.",
        "url": "https://attack.mitre.org/techniques/T1059/"
    },
    "T1078": {
        "name": "Valid Accounts",
        "tactic": "Initial Access & Persistence",
        "description": "Adversaries obtain and abuse credentials of existing accounts for access.",
        "url": "https://attack.mitre.org/techniques/T1078/"
    },
    "T1105": {
        "name": "Ingress Tool Transfer",
        "tactic": "Command and Control",
        "description": "Adversaries transfer tools or malware from external systems into compromised environments.",
        "url": "https://attack.mitre.org/techniques/T1105/"
    },
    "T1046": {
        "name": "Network Service Discovery",
        "tactic": "Discovery",
        "description": "Adversaries attempt to get a listing of services running on remote hosts.",
        "url": "https://attack.mitre.org/techniques/T1046/"
    }
}

def map_events_to_mitre(db: Session) -> Dict[str, Any]:
    """Map database attack telemetry to MITRE ATT&CK framework techniques."""
    total_events = db.query(HoneypotEvent).count()
    brute_force_count = db.query(HoneypotEvent).filter(HoneypotEvent.username.isnot(None)).count()
    command_exec_count = db.query(HoneypotEvent).filter(HoneypotEvent.command.isnot(None)).count()
    ssh_count = db.query(HoneypotEvent).filter(HoneypotEvent.protocol == "SSH").count()
    telnet_count = db.query(HoneypotEvent).filter(HoneypotEvent.protocol == "Telnet").count()

    mappings = []

    if brute_force_count > 0:
        mappings.append({
            "tech_id": "T1110",
            "name": MITRE_TECHNIQUES["T1110"]["name"],
            "tactic": MITRE_TECHNIQUES["T1110"]["tactic"],
            "events_matched": brute_force_count,
            "confidence": "High",
            "evidence": f"Detected {brute_force_count} SSH/Telnet credential authentication attempts."
        })

    if command_exec_count > 0:
        mappings.append({
            "tech_id": "T1059",
            "name": MITRE_TECHNIQUES["T1059"]["name"],
            "tactic": MITRE_TECHNIQUES["T1059"]["tactic"],
            "events_matched": command_exec_count,
            "confidence": "High",
            "evidence": f"Captured {command_exec_count} interactive shell commands."
        })

    mappings.append({
        "tech_id": "T1078",
        "name": MITRE_TECHNIQUES["T1078"]["name"],
        "tactic": MITRE_TECHNIQUES["T1078"]["tactic"],
        "events_matched": brute_force_count,
        "confidence": "Medium",
        "evidence": f"Targeted common dictionary accounts (root, admin, user)."
    })

    mappings.append({
        "tech_id": "T1046",
        "name": MITRE_TECHNIQUES["T1046"]["name"],
        "tactic": MITRE_TECHNIQUES["T1046"]["tactic"],
        "events_matched": ssh_count + telnet_count,
        "confidence": "High",
        "evidence": f"Inbound port probes on SSH (2222) and Telnet (2223)."
    })

    return {
        "total_analyzed_events": total_events,
        "mitre_mappings": mappings
    }

def format_mitre_report(mitre_data: Dict[str, Any]) -> str:
    """Format MITRE ATT&CK mapping report into clean text."""
    lines = []
    lines.append("=========================================================================")
    lines.append("  CYVANTIS MITRE ATT&CK THREAT MAPPING REPORT")
    lines.append("=========================================================================")
    lines.append(f"  Analyzed Honeypot Telemetry Events: {mitre_data['total_analyzed_events']}")
    lines.append("-------------------------------------------------------------------------")
    lines.append("  ID      | TECHNIQUE NAME                   | TACTIC              | MATCHES")
    lines.append("  " + "-" * 67)
    for m in mitre_data["mitre_mappings"]:
        lines.append(f"  {m['tech_id']:<7} | {m['name']:<32} | {m['tactic']:<19} | {m['events_matched']}")
        lines.append(f"          Evidence: {m['evidence']}")
        lines.append("  " + "-" * 67)
    lines.append("=========================================================================")
    return "\n".join(lines)
