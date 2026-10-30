import json
import os

import pytest

from app.ingestion.cowrie import parse_cowrie_line
from app.ingestion.schema import EventParseError
from app.ingestion.sources import CowrieFileSource
from app.models import HoneypotEvent, IngestionCheckpoint
from conftest import TestingSessionLocal

FIXTURE = os.path.join(os.path.dirname(__file__), "fixtures", "cowrie_sample.json")


def test_parse_real_cowrie_login_event():
    line = json.dumps({"eventid": "cowrie.login.failed", "username": "root", "password": "supersecretpassword999",
                       "timestamp": "2026-10-20T10:00:00.123456Z", "src_ip": "192.0.2.1", "session": "abc123",
                       "sensor": "hp1", "protocol": "ssh", "dst_port": 2222})
    ev = parse_cowrie_line(line)
    assert ev.category == "authentication"
    assert ev.protocol == "SSH"
    assert ev.timestamp.tzinfo is None and ev.timestamp.hour == 10  # stored as naive UTC
    assert ev.data_origin == "real"
    assert "supersecretpassword999" not in ev.redacted_raw_json()
    assert json.loads(ev.redacted_raw_json())["password"] == "[REDACTED]"


def test_timezone_offset_normalized_to_utc():
    ev = parse_cowrie_line(json.dumps({"eventid": "cowrie.session.connect", "src_ip": "192.0.2.1",
                                       "timestamp": "2026-10-20T12:00:00+02:00"}))
    assert ev.timestamp.hour == 10


@pytest.mark.parametrize("line", [
    "{not json",
    json.dumps({"eventid": "cowrie.login.failed", "timestamp": "2026-10-20T10:00:00Z"}),  # no src_ip
    json.dumps({"eventid": "other.thing", "src_ip": "192.0.2.1", "timestamp": "2026-10-20T10:00:00Z"}),
    json.dumps({"eventid": "cowrie.login.failed", "src_ip": "not-an-ip", "timestamp": "2026-10-20T10:00:00Z"}),
    json.dumps({"eventid": "cowrie.login.failed", "src_ip": "192.0.2.1", "timestamp": "yesterday"}),
    json.dumps([1, 2, 3]),
])
def test_malformed_records_rejected(line):
    with pytest.raises(EventParseError):
        parse_cowrie_line(line)


def test_uid_is_deterministic():
    line = open(FIXTURE, encoding="utf-8").readline()
    assert parse_cowrie_line(line).compute_uid() == parse_cowrie_line(line).compute_uid()


def test_incremental_file_ingestion_dedup_and_rotation(tmp_path):
    from app.cowrie_watcher import run_source_once
    log = tmp_path / "cowrie.json"
    lines = open(FIXTURE, encoding="utf-8").read().splitlines()
    good = [l for l in lines if l.strip().startswith("{") and "cowrie." in l]
    log.write_text("\n".join(lines[:5]) + "\n", encoding="utf-8")
    src = CowrieFileSource(str(log), name="test:cowrie")

    db = TestingSessionLocal()
    before = db.query(HoneypotEvent).count()
    db.close()
    import app.cowrie_watcher as cw
    # Use the test DB session factory
    orig = cw.SessionLocal
    cw.SessionLocal = TestingSessionLocal
    try:
        run_source_once(src)
        db = TestingSessionLocal()
        after_first = db.query(HoneypotEvent).count()
        db.close()
        assert after_first > before

        # Re-polling without new data must not re-ingest
        run_source_once(src)
        db = TestingSessionLocal()
        assert db.query(HoneypotEvent).count() == after_first
        db.close()

        # Append rest including malformed + incomplete trailing line
        with open(log, "a", encoding="utf-8") as fh:
            fh.write("\n".join(lines[5:]) + "\n")
            fh.write('{"eventid": "cowrie.session.connect", "src_ip": "192.0.2.99"')  # incomplete
        run_source_once(src)
        db = TestingSessionLocal()
        after_second = db.query(HoneypotEvent).count()
        cp = db.query(IngestionCheckpoint).filter_by(source_name="test:cowrie").one()
        assert cp.lines_rejected >= 1  # malformed line counted
        db.close()
        assert after_second > after_first

        # Rotation: replace file with the same content -> identical events are deduplicated
        os.remove(log)
        log.write_text("\n".join(lines) + "\n", encoding="utf-8")
        run_source_once(src)
        db = TestingSessionLocal()
        assert db.query(HoneypotEvent).count() == after_second
        db.close()
    finally:
        cw.SessionLocal = orig


def test_missing_file_reports_waiting(tmp_path):
    db = TestingSessionLocal()
    try:
        res = CowrieFileSource(str(tmp_path / "nope.json"), name="test:missing").poll(db)
        assert res.events == [] and res.checkpoint.status == "waiting_for_file"
        db.rollback()
    finally:
        db.close()
