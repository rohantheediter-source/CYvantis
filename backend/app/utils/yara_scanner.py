"""
YARA Malware Rules & Signature Scanner Engine for CYVANTIS
Scans attack payload strings, downloaded honeypot malware files, or command execution strings against YARA rulesets.
"""

import re
from typing import Dict, Any, List

# YARA Rule Patterns dictionary
YARA_RULES = {
    "MIRAI_BOTNET_LOADER": {
        "severity": "CRITICAL",
        "description": "Mirai botnet automated download/execution script",
        "patterns": [r"wget.*mirai", r"curl.*mirai", r"chmod \+x.*bin", r"/bin/busybox", r"tftp.*\.sh"]
    },
    "REVERSE_SHELL_PAYLOAD": {
        "severity": "HIGH",
        "description": "Interactive Bash/Python/NC Reverse Shell Execution",
        "patterns": [r"nc -e /bin/(ba)?sh", r"bash -i >& /dev/tcp/", r"python.*socket.*subprocess", r"exec\(.*socket"]
    },
    "CRYPTO_MINER_XMRIG": {
        "severity": "HIGH",
        "description": "XMRig / Monero Cryptominer Deployment",
        "patterns": [r"xmrig", r"minergate", r"stratum\+tcp://", r"coinhive", r"kdevtmpf"]
    },
    "CREDENTIAL_HARVESTER": {
        "severity": "MEDIUM",
        "description": "System file enumeration (/etc/passwd, /etc/shadow, SSH keys)",
        "patterns": [r"cat /etc/passwd", r"cat /etc/shadow", r"cat ~/.ssh/id_rsa", r"grep -i password"]
    },
    "WEBSHELL_PERSISTENCE": {
        "severity": "HIGH",
        "description": "Webshell creation or cron job backdoor persistence",
        "patterns": [r"crontab -l", r"echo.*>> /var/spool/cron", r"c99shell", r"r57shell", r"eval\(base64_decode"]
    }
}

def scan_string_with_yara(payload: str) -> Dict[str, Any]:
    if not payload:
        return {"matched": False, "matches": []}

    matches = []
    for rule_name, rule_data in YARA_RULES.items():
        matched_patterns = []
        for pattern in rule_data["patterns"]:
            if re.search(pattern, payload, re.IGNORECASE):
                matched_patterns.append(pattern)
        
        if matched_patterns:
            matches.append({
                "rule": rule_name,
                "severity": rule_data["severity"],
                "description": rule_data["description"],
                "matched_patterns": matched_patterns
            })

    return {
        "scanned_text": payload,
        "matched": len(matches) > 0,
        "match_count": len(matches),
        "matches": matches
    }

def format_yara_report(scan_res: Dict[str, Any]) -> str:
    lines = []
    lines.append("=======================================================")
    lines.append("  CYVANTIS YARA MALWARE SCANNER REPORT")
    lines.append("=======================================================")
    lines.append(f"  Scanned Payload:  {scan_res['scanned_text'][:60]}...")
    lines.append(f"  YARA Match Status: {'[!] MALICIOUS MATCH DETECTED' if scan_res['matched'] else '[+] CLEAN (No Rules Matched)'}")
    lines.append(f"  Matches Found:     {scan_res['match_count']}")
    lines.append("=======================================================")

    if scan_res["matched"]:
        lines.append("\nMatched YARA Signatures:")
        for m in scan_res["matches"]:
            lines.append(f"  • [{m['severity']}] {m['rule']}: {m['description']}")
            lines.append(f"    Matched Expressions: {', '.join(m['matched_patterns'])}\n")
    else:
        lines.append("\n  [+] Payload showed no known malware signature matches.")

    return "\n".join(lines)
