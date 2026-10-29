import ipaddress
import fnmatch
import re
from typing import Dict, Any, List, Optional

class ScopeValidator:
    """
    Validates targets against Allowlist and Denylist scope boundaries (CIDRs and Wildcard Domains).
    """
    def __init__(self, allowlist: List[str] = None, denylist: List[str] = None):
        self.allowlist = allowlist or ["10.0.0.0/8", "192.168.0.0/16", "172.16.0.0/12", "*.example.com", "*.corp.local", "185.220.101.0/24"]
        self.denylist = denylist or ["169.254.169.254/32", "127.0.0.1/32", "*.gov", "*.mil", "8.8.8.8/32"]

    def is_ip_in_cidr_list(self, ip_str: str, cidr_list: List[str]) -> bool:
        try:
            target_ip = ipaddress.ip_address(ip_str)
        except ValueError:
            return False

        for entry in cidr_list:
            try:
                # If entry is an IP or CIDR
                net = ipaddress.ip_network(entry, strict=False)
                if target_ip in net:
                    return True
            except ValueError:
                continue
        return False

    def is_domain_matching(self, domain_str: str, pattern_list: List[str]) -> bool:
        domain_clean = domain_str.lower().strip()
        for pat in pattern_list:
            if fnmatch.fnmatch(domain_clean, pat.lower().strip()):
                return True
        return False

    def validate_target(self, target: str) -> Dict[str, Any]:
        """
        Evaluates target (IP or domain) against scope definitions.
        Returns: { in_scope: bool, reason: str, category: str, violation_type: Optional[str] }
        """
        clean_target = target.strip()
        is_ip = True
        try:
            ipaddress.ip_address(clean_target)
        except ValueError:
            is_ip = False

        # 1. Check Denylist First (Precedence)
        if is_ip:
            if self.is_ip_in_cidr_list(clean_target, self.denylist):
                return {
                    "in_scope": False,
                    "target": clean_target,
                    "reason": f"Target {clean_target} explicitly forbidden by Denylist boundary rule.",
                    "status": "EXCLUDED_DENYLIST",
                    "action": "BLOCK_SCAN"
                }
        else:
            if self.is_domain_matching(clean_target, self.denylist):
                return {
                    "in_scope": False,
                    "target": clean_target,
                    "reason": f"Domain {clean_target} matches forbidden Denylist pattern.",
                    "status": "EXCLUDED_DENYLIST",
                    "action": "BLOCK_SCAN"
                }

        # 2. Check Allowlist
        if is_ip:
            in_allowlist = self.is_ip_in_cidr_list(clean_target, self.allowlist)
        else:
            in_allowlist = self.is_domain_matching(clean_target, self.allowlist)

        if in_allowlist:
            return {
                "in_scope": True,
                "target": clean_target,
                "reason": f"Target {clean_target} verified within authorized engagement scope.",
                "status": "AUTHORIZED_IN_SCOPE",
                "action": "PERMIT_SCAN"
            }
        else:
            return {
                "in_scope": False,
                "target": clean_target,
                "reason": f"Target {clean_target} falls outside authorized CIDR / domain scope.",
                "status": "OUT_OF_SCOPE",
                "action": "FLAG_EXTERNAL_PIVOT_ONLY"
            }


class PolicyGuardrailsEngine:
    """
    Enforces non-destructive payload restrictions and operational safety modes.
    """
    # Strict regex pattern for destructive commands that must never be run on live or unapproved assets
    DESTRUCTIVE_PATTERNS = [
        r"rm\s+(-[a-zA-Z]*r[a-zA-Z]*f*|-rf|-fr)\s+.*",
        r"mkfs(\.[a-z0-9]+)?\s+.*",
        r"dd\s+if=.*of=/dev/(sd|hd|nvme|zero).*",
        r">\s*/dev/(sd|hd|nvme|null|kmem|mem).*",
        r"chmod\s+(-R\s+)?000\s+.*",
        r"chown\s+(-R\s+)?nobody\s+/(etc|boot|bin|usr)",
        r":\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:", # Fork bomb
        r"(shutdown|reboot|poweroff|init\s+0|halt)(\s+.*)?",
        r"drop\s+(database|table|schema)\s+.*",
        r"truncate\s+table\s+.*",
        r"iptables\s+-F",
        r"cat\s+/dev/urandom\s+>\s+.*"
    ]

    SAFE_VERIFICATION_PAYLOADS = [
        "id", "whoami", "uname -a", "hostname", "uptime",
        "echo 'CYVANTIS_SECURITY_VERIFY'",
        "cat /etc/issue", "pwd"
    ]

    @classmethod
    def evaluate_payload(cls, payload: str, mode: str = "Active Verification") -> Dict[str, Any]:
        """
        Evaluates payload safety according to operational mode:
        - 'Passive Observation': No active packets or commands allowed.
        - 'Active Verification': Harmless proof-of-concept verification only. Destructive commands strictly rejected.
        """
        mode_clean = mode.strip()

        if mode_clean == "Passive Observation":
            return {
                "allowed": False,
                "mode": "Passive Observation",
                "reason": "System is locked in Passive Observation mode. No active execution or packets permitted.",
                "violation": "PASSIVE_MODE_ENFORCED",
                "safe_alternative": "Review passive network logs and passive DNS telemetry instead."
            }

        # Check against destructive patterns
        payload_lower = payload.lower().strip()
        for pattern in cls.DESTRUCTIVE_PATTERNS:
            if re.search(pattern, payload_lower, re.IGNORECASE):
                return {
                    "allowed": False,
                    "mode": mode_clean,
                    "reason": f"Payload violates Guardrails Policy: Matched destructive pattern '{pattern}'. Execution blocked to protect environment stability.",
                    "violation": "DESTRUCTIVE_COMMAND_DETECTED",
                    "safe_alternative": "echo 'CYVANTIS_NON_DESTRUCTIVE_TEST'"
                }

        # Active verification permitted
        return {
            "allowed": True,
            "mode": mode_clean,
            "reason": "Payload verified as non-destructive. Authorized for sandbox or scoped active verification.",
            "violation": None,
            "safe_alternative": None
        }


class RateLimitThrottler:
    """
    Computes packet transmission rates, throttling profiles, and DoS risk factor.
    """
    PROFILES = {
        "polite": {
            "name": "Polite Scan (Guardrailed)",
            "pps": 500,
            "concurrency": 4,
            "delay_ms": 20,
            "dos_risk": "VERY LOW (Production Safe)",
            "recommended_for": "Sensitive production environments & enterprise business hours"
        },
        "standard": {
            "name": "Standard Professional",
            "pps": 1500,
            "concurrency": 16,
            "delay_ms": 5,
            "dos_risk": "LOW",
            "recommended_for": "Staging clusters & off-peak scheduled penetration tests"
        },
        "aggressive": {
            "name": "High Throughput (Aggressive)",
            "pps": 10000,
            "concurrency": 64,
            "delay_ms": 0,
            "dos_risk": "HIGH (Potential Network Saturation)",
            "recommended_for": "Isolated offline sandbox & dedicated range only"
        }
    }

    @classmethod
    def get_profile(cls, profile_key: str = "polite", total_targets: int = 1) -> Dict[str, Any]:
        key = profile_key.lower().strip()
        cfg = cls.PROFILES.get(key, cls.PROFILES["polite"])
        
        # Estimate scan duration for 1000 standard ports
        ports = 1000 * total_targets
        est_seconds = max(1, round(ports / cfg["pps"]))
        
        return {
            "profile_key": key,
            "name": cfg["name"],
            "packets_per_second": cfg["pps"],
            "max_concurrency": cfg["concurrency"],
            "inter_packet_delay_ms": cfg["delay_ms"],
            "dos_risk": cfg["dos_risk"],
            "estimated_duration_seconds": est_seconds,
            "recommended_for": cfg["recommended_for"]
        }
