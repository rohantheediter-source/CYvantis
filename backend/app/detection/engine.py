"""
Explainable rule-based detection engine.

Rules live in the `detection_rules` table (type + JSON `condition` + threshold + window +
severity + confidence) and can be enabled/disabled/tuned via /api/v1/rules.
Each evaluator receives the *already stored* event and the DB session, and returns a
`Detection` carrying severity, confidence, a human-readable explanation, evidence (event
IDs and facts), a MITRE ATT&CK tactic hint, and a dedup key.

Detections are *signals*, not confirmed attacks: wording deliberately says "suspected"
and the ML anomaly score is attached as supporting context only (see pipeline.py).

False-positive notes (documented per rule in DEFAULT_RULES):
  - Thresholds are per source IP; NAT/CGNAT can aggregate many users behind one IP.
  - Keyword rules match substrings and can flag benign admin activity on real hosts.
  - Volume anomaly uses a simple mean/stddev baseline; it needs >= `min_baseline_windows`
    of history and is sensitive to seasonality.
"""
import datetime
import json
import logging
import math
import re
from dataclasses import dataclass, field
from typing import Callable, Dict, List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import DetectionRule, HoneypotEvent
from app.intel.indicators import CVE_RE, extract_indicators_from_text
from app.intel.service import cached_reputation

logger = logging.getLogger("cyvantis.detection")


@dataclass
class Detection:
    rule_id: int
    rule_name: str
    rule_type: str
    severity: str
    confidence: float
    title: str
    explanation: str
    entity: str  # correlation entity, e.g. src_ip
    dedup_key: str
    tactic: Optional[str] = None
    event_ids: List[int] = field(default_factory=list)
    facts: Dict = field(default_factory=dict)
    indicators: List[str] = field(default_factory=list)
    cves: List[str] = field(default_factory=list)


def _cond(rule: DetectionRule) -> dict:
    try:
        c = json.loads(rule.condition or "{}")
        return c if isinstance(c, dict) else {}
    except (TypeError, ValueError):
        logger.warning("Rule %s has invalid JSON condition; using defaults", rule.name)
        return {}


def _window_start(ev: HoneypotEvent, rule: DetectionRule) -> datetime.datetime:
    return ev.timestamp - datetime.timedelta(seconds=rule.window_seconds or 300)


def _proto_ok(ev: HoneypotEvent, cond: dict) -> bool:
    want = cond.get("protocol")
    return not want or (ev.protocol or "").lower() == str(want).lower()


def _recent(db: Session, ev: HoneypotEvent, rule: DetectionRule):
    return db.query(HoneypotEvent).filter(
        HoneypotEvent.src_ip == ev.src_ip,
        HoneypotEvent.timestamp >= _window_start(ev, rule),
        HoneypotEvent.timestamp <= ev.timestamp,
    )


def _ids(q, limit=50) -> List[int]:
    return [r.id for r in q.order_by(HoneypotEvent.timestamp.desc()).limit(limit).all()]


def _make(rule, ev, title, explanation, event_ids, facts, tactic=None, confidence=None, severity=None,
          indicators=None, cves=None, dedup_suffix="") -> Detection:
    return Detection(
        rule_id=rule.id, rule_name=rule.name, rule_type=rule.rule_type,
        severity=severity or rule.severity or "medium",
        confidence=round(float(confidence if confidence is not None else (rule.confidence or 0.7)), 3),
        title=title, explanation=explanation, entity=ev.src_ip,
        dedup_key=f"r{rule.id}:{ev.src_ip}{dedup_suffix}", tactic=tactic,
        event_ids=event_ids, facts=facts, indicators=indicators or [], cves=cves or [],
    )


# ---------------------------------------------------------------- evaluators
def eval_brute_force(db, ev, rule):
    cond = _cond(rule)
    eventid = cond.get("eventid", "cowrie.login.failed")
    if ev.eventid != eventid or not _proto_ok(ev, cond):
        return None
    q = _recent(db, ev, rule).filter(HoneypotEvent.eventid == eventid)
    if cond.get("protocol"):
        q = q.filter(func.lower(HoneypotEvent.protocol) == str(cond["protocol"]).lower())
    n = q.count()
    if n < rule.threshold:
        return None
    users = sorted({u for (u,) in q.with_entities(HoneypotEvent.username).distinct().all() if u})[:20]
    # Confidence grows with how far the count exceeds the threshold (bounded)
    conf = min(0.95, (rule.confidence or 0.7) + 0.05 * math.log2(max(1, n / max(1, rule.threshold))))
    return _make(rule, ev, f"Suspected brute force from {ev.src_ip}",
                 f"{n} failed logins from {ev.src_ip} within {rule.window_seconds}s "
                 f"(threshold {rule.threshold}); {len(users)} distinct username(s) tried.",
                 _ids(q), {"failed_attempts": n, "window_seconds": rule.window_seconds, "usernames": users,
                           "threshold": rule.threshold}, tactic="Credential Access (T1110)", confidence=conf)


def eval_suspicious_login(db, ev, rule):
    if ev.eventid != "cowrie.login.success":
        return None
    cond = _cond(rule)
    priv_users = [u.lower() for u in cond.get("privileged_users", ["root", "admin", "administrator"])]
    failures_q = _recent(db, ev, rule).filter(HoneypotEvent.eventid == "cowrie.login.failed")
    failures = failures_q.count()
    privileged = (ev.username or "").lower() in priv_users
    reasons = []
    if failures >= rule.threshold:
        reasons.append(f"preceded by {failures} failed attempts in {rule.window_seconds}s")
    if privileged:
        reasons.append(f"privileged account '{ev.username}'")
    if not reasons:
        return None
    return _make(rule, ev, f"Suspicious successful login from {ev.src_ip}",
                 f"Successful login {' and '.join(reasons)}.",
                 [ev.id] + _ids(failures_q, 20), {"prior_failures": failures, "username": ev.username,
                                                  "privileged": privileged},
                 tactic="Initial Access / Valid Accounts (T1078)",
                 severity="high" if failures >= rule.threshold and privileged else rule.severity)


def eval_command_execution(db, ev, rule):
    if not ev.command:
        return None
    cond = _cond(rule)
    keywords = cond.get("command_contains", [])
    cmd = ev.command.lower()
    hits = [k for k in keywords if k.lower() in cmd]
    if len(hits) < max(1, rule.threshold or 1):
        return None
    indicators = [v for _, v in extract_indicators_from_text(ev.command)]
    return _make(rule, ev, f"Suspicious command execution from {ev.src_ip}",
                 f"Command matched suspicious pattern(s): {', '.join(hits)}.",
                 [ev.id], {"matched": hits, "command_preview": ev.command[:200]},
                 tactic="Execution (T1059)", indicators=indicators, dedup_suffix=f":{ev.session_id or ''}")


def eval_payload_download(db, ev, rule):
    cond = _cond(rule)
    if ev.eventid not in cond.get("eventids", ["cowrie.session.file_download", "cowrie.session.file_upload"]):
        return None
    indicators = [i for i in (ev.file_hash,) if i]
    raw_url = None
    try:
        raw_url = json.loads(ev.raw_payload or "{}").get("url")
    except ValueError:
        pass
    if raw_url:
        indicators.append(raw_url)
    return _make(rule, ev, f"Payload transfer observed from {ev.src_ip}",
                 f"File transfer event ({ev.eventid}) with sha256={ev.file_hash or 'unknown'}.",
                 [ev.id], {"sha256": ev.file_hash, "url": raw_url}, tactic="Command and Control / Ingress Tool Transfer (T1105)",
                 indicators=indicators, dedup_suffix=f":{ev.file_hash or ''}")


def eval_ioc_match(db, ev, rule):
    cond = _cond(rule)
    min_score = float(cond.get("min_score", 70))
    candidates = [("src_ip", ev.src_ip)]
    if ev.file_hash:
        candidates.append(("file_hash", ev.file_hash))
    if ev.command:
        candidates += [(t, v) for t, v in extract_indicators_from_text(ev.command) if t in ("url", "domain", "ip")]
    for field_name, value in candidates:
        rep = cached_reputation(db, value)
        if rep["score"] is not None and rep["score"] >= min_score:
            src_names = ", ".join(s["provider"] for s in rep["sources"])
            demo = any(s.get("demo") for s in rep["sources"])
            conf = rep["confidence"] if rep["confidence"] is not None else 0.5
            return _make(rule, ev, f"Known malicious indicator matched ({field_name})",
                         f"{field_name}={value} has reputation {rep['score']:.0f}/100 from {src_names}"
                         f"{' [DEMO INTEL]' if demo else ''}.",
                         [ev.id], {"field": field_name, "indicator": value, "reputation": rep},
                         tactic="Threat Intelligence Match", confidence=min(0.95, 0.5 + conf / 2),
                         indicators=[value], dedup_suffix=f":{value}")
    return None


def eval_connection_frequency(db, ev, rule):
    if ev.eventid != "cowrie.session.connect":
        return None
    q = _recent(db, ev, rule).filter(HoneypotEvent.eventid == "cowrie.session.connect")
    n = q.count()
    if n < rule.threshold:
        return None
    return _make(rule, ev, f"Unusual connection frequency from {ev.src_ip}",
                 f"{n} new sessions from {ev.src_ip} within {rule.window_seconds}s (threshold {rule.threshold}).",
                 _ids(q), {"connections": n, "window_seconds": rule.window_seconds}, tactic="Reconnaissance / Discovery")


def eval_privileged_activity(db, ev, rule):
    if not ev.command:
        return None
    cond = _cond(rule)
    patterns = cond.get("patterns", [r"\bsudo\b", r"\bsu\s+-?", r"\bpasswd\b", r"\buseradd\b", r"\busermod\b",
                                     r"chmod\s+[ugo]*\+s", r"authorized_keys", r"\bcrontab\b", r"/etc/shadow"])
    hits = [p for p in patterns if re.search(p, ev.command, re.IGNORECASE)]
    if not hits:
        return None
    return _make(rule, ev, f"Privileged / persistence activity from {ev.src_ip}",
                 f"Command attempts privilege use or persistence (matched {len(hits)} pattern(s)).",
                 [ev.id], {"patterns": hits, "command_preview": ev.command[:200]},
                 tactic="Privilege Escalation / Persistence (T1098, T1053)", dedup_suffix=f":{ev.session_id or ''}")


def eval_scanning(db, ev, rule):
    if ev.eventid not in ("cowrie.session.connect", "cowrie.direct-tcpip.request"):
        return None
    q = _recent(db, ev, rule)
    ports = {p for (p,) in q.with_entities(HoneypotEvent.dst_port).distinct().all() if p is not None}
    sessions = q.filter(HoneypotEvent.eventid == "cowrie.session.connect").with_entities(HoneypotEvent.session_id).distinct().count()
    authed = q.filter(HoneypotEvent.category.in_(["authentication", "command"])).count()
    cond = _cond(rule)
    min_ports = int(cond.get("min_distinct_ports", 3))
    if len(ports) >= min_ports or (sessions >= rule.threshold and authed == 0):
        return _make(rule, ev, f"Suspected scanning from {ev.src_ip}",
                     f"{len(ports)} distinct destination port(s) and {sessions} session(s) without authentication "
                     f"attempts in {rule.window_seconds}s.",
                     _ids(q), {"distinct_ports": sorted(ports)[:50], "sessions": sessions, "auth_events": authed},
                     tactic="Reconnaissance (T1046)")
    return None


def eval_volume_anomaly(db, ev, rule):
    """Global event volume in the current window vs. mean/stddev of previous windows."""
    cond = _cond(rule)
    w = datetime.timedelta(seconds=rule.window_seconds or 300)
    n_hist = int(cond.get("baseline_windows", 12))
    min_hist = int(cond.get("min_baseline_windows", 6))
    z_thr = float(cond.get("z_threshold", 3.0))
    end = ev.timestamp
    start_hist = end - w * (n_hist + 1)
    rows = db.query(HoneypotEvent.timestamp).filter(HoneypotEvent.timestamp > start_hist,
                                                    HoneypotEvent.timestamp <= end).all()
    buckets = [0] * (n_hist + 1)
    for (ts,) in rows:
        idx = int((end - ts) / w)
        if 0 <= idx <= n_hist:
            buckets[idx] += 1
    current, hist = buckets[0], buckets[1:]
    non_empty = [h for h in hist if h > 0]
    if len(non_empty) < min_hist:
        return None
    mean = sum(hist) / len(hist)
    std = math.sqrt(sum((h - mean) ** 2 for h in hist) / len(hist)) or 1.0
    z = (current - mean) / std
    if z < z_thr or current < rule.threshold:
        return None
    bucket_id = int(end.timestamp() // w.total_seconds())
    return Detection(
        rule_id=rule.id, rule_name=rule.name, rule_type=rule.rule_type, severity=rule.severity or "medium",
        confidence=round(min(0.8, 0.4 + 0.05 * z), 3),
        title="Event volume deviates from baseline",
        explanation=f"{current} events in the last {rule.window_seconds}s vs baseline mean {mean:.1f} "
                    f"(std {std:.1f}, z={z:.1f}). Anomalous volume alone does not confirm an attack.",
        entity="global", dedup_key=f"r{rule.id}:global:{bucket_id}", tactic="Anomaly",
        event_ids=[ev.id], facts={"current": current, "baseline_mean": round(mean, 2), "baseline_std": round(std, 2), "z": round(z, 2)},
    )


def eval_vulnerability_association(db, ev, rule):
    """Only fires when the event itself references a CVE identifier (explicit evidence)."""
    text = " ".join(filter(None, [ev.command, ev.raw_payload]))
    cves = sorted({m.group(0).upper() for m in CVE_RE.finditer(text)})
    if not cves:
        return None
    return _make(rule, ev, f"Activity referencing {', '.join(cves[:3])}",
                 f"Event payload explicitly references {', '.join(cves)}; verify whether the targeted asset is affected.",
                 [ev.id], {"cves": cves}, tactic="Exploit Public-Facing Application (T1190)", cves=cves,
                 dedup_suffix=f":{cves[0]}")


EVALUATORS: Dict[str, Callable] = {
    "brute_force": eval_brute_force,
    "suspicious_login": eval_suspicious_login,
    "command_execution": eval_command_execution,
    "payload_download": eval_payload_download,
    "ioc_match": eval_ioc_match,
    "connection_frequency": eval_connection_frequency,
    "privileged_activity": eval_privileged_activity,
    "scanning": eval_scanning,
    "volume_anomaly": eval_volume_anomaly,
    "vulnerability_association": eval_vulnerability_association,
}
RULE_TYPES = tuple(EVALUATORS.keys())


def run_detections(db: Session, ev: HoneypotEvent, rules: Optional[List[DetectionRule]] = None) -> List[Detection]:
    if rules is None:
        rules = db.query(DetectionRule).filter(DetectionRule.is_enabled.is_(True)).all()
    out = []
    for rule in rules:
        fn = EVALUATORS.get(rule.rule_type)
        if fn is None:
            continue
        try:
            det = fn(db, ev, rule)
        except Exception:
            logger.exception("Rule %s failed on event %s", rule.name, ev.id)
            continue
        if det:
            out.append(det)
    return out


DEFAULT_RULES = [
    dict(name="SSH Brute Force Attack", rule_type="brute_force", threshold=5, window_seconds=300, severity="high", confidence=0.7,
         condition={"eventid": "cowrie.login.failed", "protocol": "SSH"},
         description="Failed SSH logins from one source IP reach the threshold inside the window. FP: shared NAT egress, misconfigured clients."),
    dict(name="Telnet Credential Harvesting", rule_type="brute_force", threshold=10, window_seconds=300, severity="medium", confidence=0.65,
         condition={"eventid": "cowrie.login.failed", "protocol": "Telnet"},
         description="High-volume Telnet authentication failures (typical IoT botnet behaviour)."),
    dict(name="Suspicious Successful Login", rule_type="suspicious_login", threshold=3, window_seconds=900, severity="high", confidence=0.75,
         condition={"privileged_users": ["root", "admin", "administrator"]},
         description="Successful login after repeated failures, or into a privileged account. FP: legitimate admin who mistyped."),
    dict(name="Suspicious Command Execution", rule_type="command_execution", threshold=1, window_seconds=300, severity="critical", confidence=0.8,
         condition={"command_contains": ["wget ", "curl ", "tftp ", "/etc/shadow", "base64 -d", "| sh", "| bash", "chmod +x", "nc -e", "/dev/tcp/"]},
         description="Command matches download-and-execute / credential-dumping patterns. FP: admin scripts on real hosts."),
    dict(name="Malware Payload Download", rule_type="payload_download", threshold=1, window_seconds=300, severity="critical", confidence=0.85,
         condition={"eventids": ["cowrie.session.file_download", "cowrie.session.file_upload"]},
         description="A file was downloaded/uploaded during a honeypot session."),
    dict(name="Known Malicious IOC Match", rule_type="ioc_match", threshold=1, window_seconds=300, severity="high", confidence=0.7,
         condition={"min_score": 70},
         description="Source IP, file hash or URL in the event has reputation >= min_score in local IOC DB or cached provider intel."),
    dict(name="Unusual Connection Frequency", rule_type="connection_frequency", threshold=20, window_seconds=300, severity="medium", confidence=0.6,
         condition={}, description="Many new sessions from one source in a short window."),
    dict(name="Privileged / Persistence Activity", rule_type="privileged_activity", threshold=1, window_seconds=300, severity="high", confidence=0.7,
         condition={}, description="sudo/su/passwd/useradd/SUID/authorized_keys/crontab activity. FP: routine administration on real hosts."),
    dict(name="Port / Service Scanning", rule_type="scanning", threshold=10, window_seconds=600, severity="medium", confidence=0.6,
         condition={"min_distinct_ports": 3}, description="Multiple ports or many sessions without authentication attempts."),
    dict(name="Event Volume Anomaly", rule_type="volume_anomaly", threshold=30, window_seconds=300, severity="medium", confidence=0.5,
         condition={"baseline_windows": 12, "min_baseline_windows": 6, "z_threshold": 3.0},
         description="Global event volume z-score vs. previous windows. Needs history; sensitive to seasonality."),
    dict(name="Vulnerability Reference in Payload", rule_type="vulnerability_association", threshold=1, window_seconds=300, severity="high", confidence=0.6,
         condition={}, description="Payload explicitly contains a CVE identifier (evidence-based association only)."),
]


def ensure_default_rules(db: Session):
    """Insert any missing default rules; upgrade legacy seeded rules with window/confidence."""
    existing = {r.name: r for r in db.query(DetectionRule).all()}
    for spec in DEFAULT_RULES:
        r = existing.get(spec["name"])
        if r is None:
            db.add(DetectionRule(name=spec["name"], description=spec["description"], rule_type=spec["rule_type"],
                                 condition=json.dumps(spec["condition"]), threshold=spec["threshold"],
                                 severity=spec["severity"], window_seconds=spec["window_seconds"],
                                 confidence=spec["confidence"], is_enabled=True))
        else:
            if r.window_seconds is None:
                r.window_seconds = spec["window_seconds"]
            if r.confidence is None:
                r.confidence = spec["confidence"]
            if r.trigger_count is None:
                r.trigger_count = 0
            # Legacy seed used free-form conditions; replace if not parseable for the evaluator
            if r.rule_type == spec["rule_type"] and not _cond(r):
                r.condition = json.dumps(spec["condition"])
    db.commit()
