"""
Parser for Cowrie honeypot JSON logs (one JSON object per line, cowrie.json output plugin).

Reference fields (Cowrie 2.x): eventid, timestamp, src_ip, src_port, dst_ip, dst_port,
session, sensor, protocol, username, password, input, url, shasum, outfile, duration.
"""
import json
from typing import Optional

from app.ingestion.schema import NormalizedEvent, EventParseError

CATEGORY_BY_PREFIX = {
    "cowrie.login.": "authentication",
    "cowrie.command.": "command",
    "cowrie.session.file_": "file",
    "cowrie.direct-tcpip.": "network",
    "cowrie.session.": "session",
    "cowrie.client.": "session",
    "cowrie.log.": "session",
}

# Baseline (pre-detection) severity of a single raw event. Detection rules and
# correlation raise severity based on context; this is only the per-record default.
BASE_SEVERITY = {
    "cowrie.login.success": "medium",
    "cowrie.session.file_download": "high",
    "cowrie.session.file_upload": "high",
    "cowrie.command.input": "low",
    "cowrie.direct-tcpip.request": "medium",
}

HIGH_RISK_COMMAND_TOKENS = ("wget ", "curl ", "tftp ", "chmod +x", "/etc/shadow", "authorized_keys", "base64 -d", "| sh", "| bash")


def _category(eventid: str) -> str:
    for prefix, cat in CATEGORY_BY_PREFIX.items():
        if eventid.startswith(prefix):
            return cat
    return "session"


def _protocol(rec: dict) -> Optional[str]:
    proto = rec.get("protocol")
    if isinstance(proto, str) and proto:
        return "Telnet" if proto.lower() == "telnet" else proto.upper()[:10]
    port = rec.get("dst_port")
    if port in (23, 2323):
        return "Telnet"
    if port in (22, 2222):
        return "SSH"
    return None


def _int_or_none(value) -> Optional[int]:
    try:
        iv = int(value)
        return iv if 0 <= iv <= 65535 else None
    except (TypeError, ValueError):
        return None


def parse_cowrie_record(rec: dict, source_ref: Optional[str] = None, data_origin: str = "real") -> NormalizedEvent:
    if not isinstance(rec, dict):
        raise EventParseError("record is not a JSON object")
    eventid = rec.get("eventid")
    if not isinstance(eventid, str) or not eventid.startswith("cowrie."):
        raise EventParseError("missing or non-cowrie eventid")
    if not rec.get("src_ip"):
        raise EventParseError("missing src_ip")
    if not rec.get("timestamp"):
        raise EventParseError("missing timestamp")

    command = rec.get("input") if eventid.startswith("cowrie.command.") else None
    severity = BASE_SEVERITY.get(eventid, "low")
    if command and any(tok in command.lower() for tok in HIGH_RISK_COMMAND_TOKENS):
        severity = "high"

    try:
        duration = float(rec["duration"]) if rec.get("duration") is not None else None
    except (TypeError, ValueError):
        duration = None

    try:
        return NormalizedEvent(
            timestamp=rec.get("timestamp"),
            eventid=eventid[:100],
            category=_category(eventid),
            source="cowrie",
            data_origin=data_origin,
            src_ip=rec.get("src_ip"),
            dst_ip=rec.get("dst_ip") or None,
            dst_port=_int_or_none(rec.get("dst_port")),
            protocol=_protocol(rec),
            username=(str(rec["username"])[:100] if rec.get("username") is not None else None),
            password=(str(rec["password"])[:100] if rec.get("password") is not None else None),
            command=(str(command)[:4096] if command else None),
            file_hash=(str(rec["shasum"])[:128] if rec.get("shasum") else None),
            url=(str(rec["url"])[:2048] if rec.get("url") else None),
            session_id=(str(rec["session"])[:100] if rec.get("session") else None),
            duration=duration if duration is None or duration >= 0 else None,
            sensor=(str(rec["sensor"])[:100] if rec.get("sensor") else None),
            severity=severity,
            source_ref=source_ref,
            raw=rec,
        )
    except EventParseError:
        raise
    except Exception as exc:  # pydantic ValidationError – report field names only, never values
        fields = []
        for err in getattr(exc, "errors", lambda: [])():
            fields.append(".".join(str(p) for p in err.get("loc", ())))
        raise EventParseError(f"validation failed for fields: {', '.join(fields) or 'unknown'}") from None


def parse_cowrie_line(line: str, source_ref: Optional[str] = None, data_origin: str = "real") -> NormalizedEvent:
    line = line.strip()
    if not line:
        raise EventParseError("empty line")
    try:
        rec = json.loads(line)
    except json.JSONDecodeError:
        raise EventParseError("malformed JSON") from None
    return parse_cowrie_record(rec, source_ref=source_ref, data_origin=data_origin)
