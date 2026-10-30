"""
Evidence-based, advisory response recommendations.

All recommendations have `requires_approval=True` and `automated=False`: CYVANTIS never
blocks IPs, changes firewall rules, disables accounts or runs commands on external systems.
"""
from typing import Dict, List

PRIORITY_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3}


def _rec(action, reason, evidence, priority, confidence):
    return {"action": action, "reason": reason, "evidence": evidence, "priority": priority,
            "confidence": round(confidence, 2), "requires_approval": True, "automated": False}


def build_recommendations(rule_types: Dict[str, dict], src_ips: List[str], indicators: List[str],
                          cves: List[str], intel_score, priority: str, data_origin: str = "real") -> List[dict]:
    """
    rule_types: {rule_type: {"confidence": float, "event_ids": [...], "facts": {...}}}
    """
    recs = []
    ips = ", ".join(src_ips[:5]) or "the source"

    def ev(rt):
        d = rule_types.get(rt, {})
        return {"rule_type": rt, "event_ids": d.get("event_ids", [])[:10], "facts": d.get("facts", {})}

    if "brute_force" in rule_types:
        recs.append(_rec("Review authentication logs for the targeted accounts and enforce MFA / key-only SSH",
                         f"Repeated failed logins from {ips}", ev("brute_force"), "medium", rule_types["brute_force"]["confidence"]))
    if "suspicious_login" in rule_types:
        recs.append(_rec("Investigate the affected account/host session and rotate credentials if the target is a real system",
                         "A login succeeded after failures or into a privileged account", ev("suspicious_login"), "high",
                         rule_types["suspicious_login"]["confidence"]))
    if "command_execution" in rule_types or "privileged_activity" in rule_types:
        rt = "command_execution" if "command_execution" in rule_types else "privileged_activity"
        recs.append(_rec("Review the full session transcript and check real hosts for the same commands / persistence artefacts",
                         "Post-authentication commands matched execution or persistence patterns", ev(rt), "high",
                         rule_types[rt]["confidence"]))
    if "payload_download" in rule_types or indicators:
        recs.append(_rec("Verify the downloaded file hash / URL against trusted intelligence (VirusTotal) before any blocking decision",
                         "A payload or external indicator was observed", ev("payload_download") if "payload_download" in rule_types
                         else {"indicators": indicators[:10]}, "high" if "payload_download" in rule_types else "medium",
                         rule_types.get("payload_download", {}).get("confidence", 0.6)))
    if cves:
        recs.append(_rec(f"Check whether monitored assets are affected by {', '.join(cves[:3])} and patch or mitigate",
                         "Activity referenced known vulnerabilities", {"cves": cves[:10]}, "high", 0.6))
    if "scanning" in rule_types or "connection_frequency" in rule_types:
        rt = "scanning" if "scanning" in rule_types else "connection_frequency"
        recs.append(_rec("Apply additional monitoring to exposed services and confirm only intended ports are reachable",
                         "Scanning / high connection rate observed", ev(rt), "low", rule_types[rt]["confidence"]))
    if "volume_anomaly" in rule_types:
        recs.append(_rec("Correlate the volume spike with other sources before escalating (anomaly alone is not confirmation)",
                         "Event volume deviated from baseline", ev("volume_anomaly"), "low", rule_types["volume_anomaly"]["confidence"]))
    confirmed_bad = intel_score is not None and intel_score >= 80
    if confirmed_bad and priority in ("critical", "high"):
        recs.append(_rec(f"Consider blocking {ips} through an approved firewall change process",
                         f"High-risk incident and threat-intel reputation {intel_score:.0f}/100",
                         {"intel_score": intel_score, "src_ips": src_ips[:5]}, priority, 0.7))
    if data_origin != "real":
        for r in recs:
            r["reason"] = f"[{data_origin.upper()} DATA] " + r["reason"]
    recs.sort(key=lambda r: PRIORITY_ORDER.get(r["priority"], 9))
    return recs
