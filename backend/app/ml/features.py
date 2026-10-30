"""
Feature engineering shared by training and inference (single source of truth).

All features are computed from a single event's own fields - no label, no future data and
no cross-event aggregates - so there is no target leakage from the feature side.
Missing / malformed fields fall back to neutral values (0 / empty string).
"""
import re
from typing import Any, Dict

FEATURE_COLUMNS = [
    "duration", "dst_port", "protocol_ssh", "protocol_telnet",
    "cmd_len", "cmd_tokens", "user_len", "pass_len", "is_root_user",
    "has_wget_curl", "has_execution", "has_recon", "has_obfuscation", "has_persistence",
    "has_url", "event_login_success", "event_login_failed", "event_cmd_input",
    "event_file_transfer", "event_session",
]

FEATURE_DOCS = {
    "duration": "session duration in seconds (0 if absent)",
    "dst_port": "destination port (22 if absent)",
    "protocol_ssh / protocol_telnet": "one-hot protocol",
    "cmd_len / cmd_tokens": "length and whitespace token count of the command",
    "user_len / pass_len": "length of attempted username / password (values themselves are not used)",
    "is_root_user": "username in {root, admin, administrator, system}",
    "has_wget_curl": "command uses a download tool (wget/curl/tftp/ftp)",
    "has_execution": "command executes code (chmod +x, sh/bash/python/perl, nc)",
    "has_recon": "command is host reconnaissance (uname, whoami, id, /proc/cpuinfo, ...)",
    "has_obfuscation": "base64/eval/exec/hex-escape usage",
    "has_persistence": "authorized_keys/crontab/useradd/passwd/systemctl",
    "has_url": "command contains a URL",
    "event_*": "one-hot event family from eventid",
}

PRIV_USERS = {"root", "admin", "administrator", "system"}
RE_DOWNLOAD = re.compile(r"\b(wget|curl|tftp|ftpget|ftp)\b", re.I)
RE_EXEC = re.compile(r"(chmod\s+\+?[0-7]*x|\b(sh|bash|python3?|perl|nc|ncat)\b\s|\./\S+)", re.I)
RE_RECON = re.compile(r"\b(uname|whoami|id|hostname|lscpu|uptime|w|nproc|ifconfig|netstat)\b|/proc/cpuinfo|cat\s+/etc/(passwd|issue|os-release)|ps\s+aux", re.I)
RE_OBF = re.compile(r"\b(base64|eval|exec)\b|\\x[0-9a-f]{2}", re.I)
RE_PERSIST = re.compile(r"authorized_keys|\bcrontab\b|\buseradd\b|\bpasswd\b|\bsystemctl\b|/etc/rc\.local", re.I)
RE_URL = re.compile(r"\b(?:https?|ftp|tftp)://", re.I)


def featurize(ev: Dict[str, Any]) -> Dict[str, float]:
    cmd = str(ev.get("command") or "")
    user = str(ev.get("username") or "")
    pwd = ev.get("password")
    pwd = "" if pwd in (None, "[REDACTED]") else str(pwd)
    eid = str(ev.get("eventid") or "").lower()
    proto = str(ev.get("protocol") or "").upper()
    try:
        duration = max(0.0, float(ev.get("duration") or 0.0))
    except (TypeError, ValueError):
        duration = 0.0
    try:
        port = int(ev.get("dst_port") or 22)
    except (TypeError, ValueError):
        port = 22
    return {
        "duration": min(duration, 86400.0),
        "dst_port": port,
        "protocol_ssh": 1 if proto == "SSH" else 0,
        "protocol_telnet": 1 if proto == "TELNET" else 0,
        "cmd_len": min(len(cmd), 4096),
        "cmd_tokens": len(cmd.split()),
        "user_len": len(user),
        "pass_len": len(pwd),
        "is_root_user": 1 if user.lower() in PRIV_USERS else 0,
        "has_wget_curl": 1 if RE_DOWNLOAD.search(cmd) else 0,
        "has_execution": 1 if RE_EXEC.search(cmd + " ") else 0,
        "has_recon": 1 if RE_RECON.search(cmd) else 0,
        "has_obfuscation": 1 if RE_OBF.search(cmd) else 0,
        "has_persistence": 1 if RE_PERSIST.search(cmd) else 0,
        "has_url": 1 if RE_URL.search(cmd) else 0,
        "event_login_success": 1 if "login.success" in eid else 0,
        "event_login_failed": 1 if "login.failed" in eid else 0,
        "event_cmd_input": 1 if "command." in eid else 0,
        "event_file_transfer": 1 if "file_" in eid else 0,
        "event_session": 1 if ("session.connect" in eid or "session.closed" in eid or "client." in eid) else 0,
    }
