"""
Database bootstrap.

* Accounts: created only when the users table is empty. Passwords come from
  BOOTSTRAP_ADMIN_PASSWORD / BOOTSTRAP_ANALYST_PASSWORD / BOOTSTRAP_VIEWER_PASSWORD; any that
  are missing are generated randomly and printed ONCE to the console. All bootstrap accounts
  must change their password on first login.
* Demo data (SEED_DEMO_DATA=true, empty events table): synthetic attack sessions are pushed
  through the real pipeline with past timestamps, so alerts/incidents are genuinely derived.
  Everything is labelled data_origin="simulated" and uses RFC 5737 documentation IPs.
  Demo IOCs are flagged is_demo=True and are not real intelligence.
"""
import datetime
import json
import logging
import random
import secrets
import string

from sqlalchemy.orm import Session

from app.config import settings
from app.models import User, HoneypotEvent, ThreatIntelIOC, PlatformSetting, Asset
from app.security import get_password_hash

logger = logging.getLogger("cyvantis.seed")


def _random_password() -> str:
    alphabet = string.ascii_letters + string.digits + "!@#%^*-_"
    while True:
        pw = "".join(secrets.choice(alphabet) for _ in range(20))
        if any(c.islower() for c in pw) and any(c.isupper() for c in pw) and any(c.isdigit() for c in pw):
            return pw


def _seed_users(db: Session):
    if db.query(User).count() > 0:
        return
    specs = [
        ("admin", "admin@cyvantis.local", "SOC Administrator", "admin", settings.BOOTSTRAP_ADMIN_PASSWORD),
        ("analyst", "analyst@cyvantis.local", "SOC Analyst", "analyst", settings.BOOTSTRAP_ANALYST_PASSWORD),
        ("viewer", "viewer@cyvantis.local", "Read-only Observer", "viewer", settings.BOOTSTRAP_VIEWER_PASSWORD),
    ]
    generated = []
    for username, email, name, role, pw in specs:
        if not pw:
            pw = _random_password()
            generated.append((username, pw))
        db.add(User(username=username, email=email, full_name=name, role=role, hashed_password=get_password_hash(pw),
                    is_active=True, must_change_password=True))
    db.commit()
    if generated:
        lines = "\n".join(f"      {u}: {p}" for u, p in generated)
        # Printed once on first boot so the operator can log in; not stored anywhere else.
        print("[!] ================================================================\n"
              "[!] Bootstrap accounts created with RANDOM passwords (shown only once):\n"
              f"{lines}\n"
              "[!] Set BOOTSTRAP_*_PASSWORD env vars to choose them. Change on first login.\n"
              "[!] ================================================================", flush=True)


def _seed_settings(db: Session):
    if db.query(PlatformSetting).count() > 0:
        return
    db.add_all([
        PlatformSetting(key="PLATFORM_NAME", value="CYVANTIS AEGISNEX", description="Platform Branding Title"),
        PlatformSetting(key="COWRIE_SYNC_ENABLED", value="true", description="Cowrie Live Monitoring Status"),
        PlatformSetting(key="ALERT_THRESHOLD_ATTEMPTS", value="5", description="Failed login alert threshold"),
        PlatformSetting(key="DATA_RETENTION_DAYS", value="90", description="Days to retain event logs"),
        PlatformSetting(key="GEOIP_AUTO_ENRICHMENT", value="true", description="Offline GeoIP labelling"),
        PlatformSetting(key="SIMULATION_INTERVAL", value=str(settings.SIMULATION_INTERVAL_SECONDS), description="Seconds between simulated events"),
    ])
    db.commit()


def _seed_demo(db: Session):
    from app.ingestion.sources import SyntheticSource, SYNTH_HASH, SYNTH_DST, SYNTH_SENSOR
    from app.pipeline import process_events

    if db.query(ThreatIntelIOC).count() == 0:
        db.add_all([
            ThreatIntelIOC(indicator="203.0.113.200", ioc_type="ip", threat_score=90, category="Payload host (demo)",
                           description="DEMO indicator - RFC 5737 documentation address used by synthetic telemetry",
                           source="Demo seed", confidence=0.6, is_demo=True),
            ThreatIntelIOC(indicator=SYNTH_HASH, ioc_type="hash", threat_score=95, category="Dropper (demo)",
                           description="DEMO indicator - synthetic payload hash", source="Demo seed", confidence=0.6, is_demo=True),
            ThreatIntelIOC(indicator="198.51.100.77", ioc_type="ip", threat_score=75, category="Brute-force source (demo)",
                           description="DEMO indicator - RFC 5737 documentation address", source="Demo seed",
                           confidence=0.5, is_demo=True),
        ])
        db.commit()
    if db.query(Asset).count() == 0:
        db.add(Asset(name=SYNTH_SENSOR, ip_address=SYNTH_DST, criticality=3, exposure="internet",
                     services=[{"port": 22, "service": "ssh"}, {"port": 23, "service": "telnet"}], cves=[],
                     description="Demo honeypot sensor (synthetic telemetry target)"))
        db.commit()
    if db.query(HoneypotEvent).count() > 0:
        return
    rng = random.Random(1337)  # deterministic demo history
    src = SyntheticSource(rng=rng)
    now = datetime.datetime.utcnow()
    events = []
    for i in range(40):
        src._new_session()
        start = now - datetime.timedelta(hours=rng.uniform(0.2, 48))
        for j, rec in enumerate(src._queue):
            rec["timestamp"] = (start + datetime.timedelta(seconds=7 * j)).isoformat() + "Z"
            rec["uuid"] = f"seed-{i}-{j}"
        from app.ingestion.cowrie import parse_cowrie_line
        for rec in src._queue:
            ev = parse_cowrie_line(json.dumps(rec), data_origin="simulated")
            ev.source = "synthetic"
            events.append(ev)
        src._queue.clear()
    events.sort(key=lambda e: e.timestamp)
    res = process_events(db, events)
    db.commit()
    logger.info("Seeded %d synthetic demo events (%d alerts) - labelled data_origin=simulated", res.stored, res.alerts_created)


def seed_database(db: Session):
    from app.detection.engine import ensure_default_rules
    _seed_users(db)
    _seed_settings(db)
    ensure_default_rules(db)
    if settings.SEED_DEMO_DATA:
        _seed_demo(db)
