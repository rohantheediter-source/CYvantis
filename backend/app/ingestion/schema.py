"""
Common normalized event schema for every telemetry source.

Timezone policy: all timestamps are converted to UTC and stored as *naive* UTC
datetimes in the database (SQLite has no timezone type). Inputs without an
explicit offset are assumed to already be UTC (Cowrie writes UTC with a 'Z').
The API serialises them as ISO-8601; clients should treat them as UTC.
"""
import datetime
import hashlib
import ipaddress
import json
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field, field_validator

DATA_ORIGINS = ("real", "simulated", "replayed")
CATEGORIES = ("authentication", "command", "file", "network", "session", "application")
SEVERITIES = ("low", "medium", "high", "critical")

MAX_TEXT = 4096


class EventParseError(ValueError):
    """Raised when a raw record cannot be normalized. Message must not contain secrets."""


def parse_timestamp(value: Any) -> datetime.datetime:
    if isinstance(value, datetime.datetime):
        dt = value
    elif isinstance(value, (int, float)):
        dt = datetime.datetime.fromtimestamp(float(value), tz=datetime.timezone.utc)
    elif isinstance(value, str) and value.strip():
        try:
            dt = datetime.datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
        except ValueError as exc:
            raise EventParseError("invalid timestamp format") from exc
    else:
        raise EventParseError("missing timestamp")
    if dt.tzinfo is not None:
        dt = dt.astimezone(datetime.timezone.utc).replace(tzinfo=None)
    return dt


def _clip(value: Optional[Any], limit: int = MAX_TEXT) -> Optional[str]:
    if value is None:
        return None
    text = str(value)
    return text[:limit]


class NormalizedEvent(BaseModel):
    timestamp: datetime.datetime
    eventid: str = Field(..., max_length=100)
    category: str = "session"
    source: str = Field("api", max_length=40)
    data_origin: str = "real"
    src_ip: str
    dst_ip: Optional[str] = None
    dst_port: Optional[int] = Field(None, ge=0, le=65535)
    protocol: Optional[str] = Field(None, max_length=10)
    username: Optional[str] = Field(None, max_length=100)
    password: Optional[str] = Field(None, max_length=100)
    command: Optional[str] = Field(None, max_length=MAX_TEXT)
    file_hash: Optional[str] = Field(None, max_length=128)
    url: Optional[str] = Field(None, max_length=2048)
    session_id: Optional[str] = Field(None, max_length=100)
    duration: Optional[float] = Field(None, ge=0)
    sensor: Optional[str] = Field(None, max_length=100)
    severity: str = "low"
    source_ref: Optional[str] = Field(None, max_length=255)
    raw: Dict[str, Any] = Field(default_factory=dict)
    event_uid: Optional[str] = None

    @field_validator("timestamp", mode="before")
    @classmethod
    def _ts(cls, v):
        return parse_timestamp(v)

    @field_validator("src_ip", "dst_ip")
    @classmethod
    def _ip(cls, v):
        if v is None:
            return v
        try:
            return str(ipaddress.ip_address(str(v).strip()))
        except ValueError as exc:
            raise ValueError("invalid IP address") from exc

    @field_validator("data_origin")
    @classmethod
    def _origin(cls, v):
        if v not in DATA_ORIGINS:
            raise ValueError(f"data_origin must be one of {DATA_ORIGINS}")
        return v

    @field_validator("category")
    @classmethod
    def _category(cls, v):
        if v not in CATEGORIES:
            raise ValueError(f"category must be one of {CATEGORIES}")
        return v

    @field_validator("severity")
    @classmethod
    def _severity(cls, v):
        v = (v or "low").lower()
        if v not in SEVERITIES:
            raise ValueError(f"severity must be one of {SEVERITIES}")
        return v

    def compute_uid(self) -> str:
        """Deterministic idempotency key: identical records always map to the same uid."""
        if self.event_uid:
            return self.event_uid
        basis = json.dumps({
            "source": self.source,
            "ts": self.timestamp.isoformat(),
            "eventid": self.eventid,
            "src_ip": self.src_ip,
            "session": self.session_id,
            "user": self.username,
            "cmd": self.command,
            "hash": self.file_hash,
            "raw_uuid": self.raw.get("uuid") if isinstance(self.raw, dict) else None,
        }, sort_keys=True, default=str)
        return hashlib.sha256(basis.encode("utf-8")).hexdigest()

    def redacted_raw_json(self) -> str:
        """Raw payload for storage with captured passwords removed (stored separately, admin-only)."""
        raw = dict(self.raw or {})
        if "password" in raw:
            raw["password"] = "[REDACTED]"
        return _clip(json.dumps(raw, default=str), 16384)
