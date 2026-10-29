import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=True)
    role = Column(String(20), default="analyst", nullable=False) # admin, analyst, viewer
    is_active = Column(Boolean, default=True, nullable=False)
    must_change_password = Column(Boolean, default=True, nullable=False)
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    locked_until = Column(DateTime, nullable=True)
    totp_secret = Column(String(64), nullable=True)
    is_totp_enabled = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    last_login = Column(DateTime, nullable=True)

class HoneypotEvent(Base):
    __tablename__ = "honeypot_events"

    id = Column(Integer, primary_key=True, index=True)
    eventid = Column(String(100), index=True, nullable=False) # cowrie.login.success, cowrie.command.input, etc.
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True, nullable=False)
    src_ip = Column(String(45), index=True, nullable=False)
    dst_port = Column(Integer, default=22)
    protocol = Column(String(10), default="SSH", index=True) # SSH, Telnet
    username = Column(String(100), index=True, nullable=True)
    password = Column(String(100), nullable=True)
    command = Column(Text, nullable=True)
    file_hash = Column(String(64), nullable=True)
    session_id = Column(String(100), index=True, nullable=True)
    duration = Column(Float, default=0.0) # session duration in seconds
    country = Column(String(100), default="Unknown", index=True)
    country_code = Column(String(5), default="XX")
    city = Column(String(100), default="Unknown")
    asn = Column(String(100), default="AS0000 Unknown")
    severity = Column(String(20), default="medium", index=True) # low, medium, high, critical
    is_simulated = Column(Boolean, default=False, nullable=False)
    raw_payload = Column(Text, nullable=True)

class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String(20), default="high", index=True) # low, medium, high, critical
    status = Column(String(20), default="open", index=True) # open, in_progress, resolved, closed
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    related_events = Column(Text, nullable=True) # JSON list of event IDs stringified

    assigned_to = relationship("User", foreign_keys=[assigned_to_id])
    created_by = relationship("User", foreign_keys=[created_by_id])
    notes = relationship("InvestigationNote", back_populates="investigation", cascade="all, delete-orphan")

class InvestigationNote(Base):
    __tablename__ = "investigation_notes"

    id = Column(Integer, primary_key=True, index=True)
    investigation_id = Column(Integer, ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    note_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    investigation = relationship("Investigation", back_populates="notes")
    author = relationship("User")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(String(20), default="high", index=True)
    rule_name = Column(String(100), nullable=False)
    src_ip = Column(String(45), index=True, nullable=True)
    status = Column(String(20), default="active", index=True) # active, acknowledged, resolved
    is_acknowledged = Column(Boolean, default=False)
    acknowledged_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)

    acknowledged_by = relationship("User")

class DetectionRule(Base):
    __tablename__ = "detection_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    rule_type = Column(String(50), nullable=False) # brute_force, command_execution, payload_download, repeated_ip
    condition = Column(Text, nullable=False) # JSON or expression
    threshold = Column(Integer, default=5)
    severity = Column(String(20), default="high")
    is_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_triggered = Column(DateTime, nullable=True)

class ThreatIntelIOC(Base):
    __tablename__ = "threat_intel_iocs"

    id = Column(Integer, primary_key=True, index=True)
    indicator = Column(String(255), unique=True, index=True, nullable=False) # IP, Domain, Hash
    ioc_type = Column(String(20), index=True, nullable=False) # ip, domain, hash
    threat_score = Column(Integer, default=50) # 0-100
    category = Column(String(50), default="Malicious Host")
    description = Column(Text, nullable=True)
    first_seen = Column(DateTime, default=datetime.datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.datetime.utcnow)
    source = Column(String(100), default="CYVANTIS Honeypot")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True, nullable=False)
    user_id = Column(Integer, nullable=True)
    username = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False) # USER_LOGIN, EVENT_EXPORT, BACKUP_CREATED, USER_CREATED, etc.
    resource = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)

class PlatformSetting(Base):
    __tablename__ = "platform_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class BackupRecord(Base):
    __tablename__ = "backup_records"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True, nullable=False)
    filename = Column(String(255), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    status = Column(String(20), default="success") # success, failed
    is_automated = Column(Boolean, default=False)
    created_by = Column(String(50), default="system")
