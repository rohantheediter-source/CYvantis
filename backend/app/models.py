import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text, ForeignKey, JSON, Index, UniqueConstraint
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
    # Provenance / normalization (see app/ingestion/schema.py)
    event_uid = Column(String(64), unique=True, index=True, nullable=True)  # idempotency key
    source = Column(String(40), default="cowrie", index=True)  # cowrie, synthetic, api, replay
    data_origin = Column(String(20), default="real", index=True)  # real, simulated, replayed
    category = Column(String(40), default="session", index=True)  # authentication, command, network, file, session
    dst_ip = Column(String(45), nullable=True)
    sensor = Column(String(100), nullable=True)
    ingested_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=True)
    source_ref = Column(String(255), nullable=True)  # e.g. file path + byte offset of the original record

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
    # Detection / correlation / risk
    rule_id = Column(Integer, ForeignKey("detection_rules.id"), nullable=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"), nullable=True, index=True)
    dedup_key = Column(String(200), index=True, nullable=True)
    occurrence_count = Column(Integer, default=1)
    first_seen = Column(DateTime, nullable=True)
    last_seen = Column(DateTime, nullable=True, index=True)
    confidence = Column(Float, default=0.5)
    risk_score = Column(Float, nullable=True, index=True)
    priority = Column(String(20), nullable=True, index=True)  # critical, high, medium, low
    explanation = Column(Text, nullable=True)
    evidence = Column(JSON, nullable=True)  # {"event_ids": [...], "facts": {...}}
    risk_breakdown = Column(JSON, nullable=True)
    recommendations = Column(JSON, nullable=True)
    data_origin = Column(String(20), default="real")
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolution = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    acknowledged_by = relationship("User", foreign_keys=[acknowledged_by_id])
    assigned_to = relationship("User", foreign_keys=[assigned_to_id])
    notes = relationship("AlertNote", back_populates="alert", cascade="all, delete-orphan")

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
    window_seconds = Column(Integer, default=300)
    confidence = Column(Float, default=0.7)
    trigger_count = Column(Integer, default=0)

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
    confidence = Column(Float, default=0.5)
    expires_at = Column(DateTime, nullable=True)
    is_demo = Column(Boolean, default=False)  # demo/seed indicator, not real intelligence

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


class AlertNote(Base):
    __tablename__ = "alert_notes"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("alerts.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    author_name = Column(String(50), nullable=False)
    note_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    alert = relationship("Alert", back_populates="notes")


class Incident(Base):
    """A group of related alerts sharing an entity (source IP) inside a correlation window."""
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    correlation_key = Column(String(200), index=True, nullable=False)  # e.g. "src_ip:1.2.3.4"
    status = Column(String(20), default="open", index=True)  # open, investigating, resolved, false_positive
    priority = Column(String(20), default="low", index=True)
    risk_score = Column(Float, default=0.0, index=True)
    risk_breakdown = Column(JSON, nullable=True)
    explanation = Column(Text, nullable=True)
    recommendations = Column(JSON, nullable=True)
    src_ips = Column(JSON, nullable=True)
    session_ids = Column(JSON, nullable=True)
    indicators = Column(JSON, nullable=True)
    tactics = Column(JSON, nullable=True)
    event_count = Column(Integer, default=0)
    alert_count = Column(Integer, default=0)
    data_origin = Column(String(20), default="real")
    first_seen = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    last_seen = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolution = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    alerts = relationship("Alert", backref="incident", foreign_keys="Alert.incident_id")
    assigned_to = relationship("User")


class IngestionCheckpoint(Base):
    """Persists file read position so restarts never re-ingest the same lines."""
    __tablename__ = "ingestion_checkpoints"

    id = Column(Integer, primary_key=True, index=True)
    source_name = Column(String(100), unique=True, nullable=False)
    path = Column(String(500), nullable=True)
    file_id = Column(String(100), nullable=True)  # inode/device fingerprint for rotation detection
    offset = Column(Integer, default=0)
    lines_ingested = Column(Integer, default=0)
    lines_rejected = Column(Integer, default=0)
    duplicates_skipped = Column(Integer, default=0)
    last_read_at = Column(DateTime, nullable=True)
    last_event_at = Column(DateTime, nullable=True)
    last_error = Column(Text, nullable=True)
    status = Column(String(30), default="unknown")  # active, waiting_for_file, error, disabled


class IntelEnrichment(Base):
    """Cached result of a lookup against an external or local intelligence provider."""
    __tablename__ = "intel_enrichments"
    __table_args__ = (UniqueConstraint("indicator", "provider", name="uq_intel_indicator_provider"),)

    id = Column(Integer, primary_key=True, index=True)
    indicator = Column(String(255), index=True, nullable=False)
    indicator_type = Column(String(20), index=True, nullable=False)
    provider = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False)  # ok, not_found, error, not_configured, rate_limited
    reputation_score = Column(Float, nullable=True)  # 0-100 maliciousness; None when unknown
    confidence = Column(Float, nullable=True)
    summary = Column(Text, nullable=True)
    data = Column(JSON, nullable=True)
    fetched_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, nullable=True, index=True)


class Vulnerability(Base):
    __tablename__ = "vulnerabilities"

    id = Column(Integer, primary_key=True, index=True)
    cve_id = Column(String(30), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    cvss_score = Column(Float, nullable=True)
    cvss_vector = Column(String(200), nullable=True)
    severity = Column(String(20), nullable=True, index=True)
    published = Column(DateTime, nullable=True)
    last_modified = Column(DateTime, nullable=True)
    known_exploited = Column(Boolean, default=False)
    references = Column(JSON, nullable=True)
    source = Column(String(50), default="NVD")
    fetched_at = Column(DateTime, default=datetime.datetime.utcnow)


class Asset(Base):
    """Monitored asset with business context used for risk scoring."""
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    ip_address = Column(String(45), index=True, nullable=True)
    criticality = Column(Integer, default=3)  # 1 (low) - 5 (mission critical)
    exposure = Column(String(20), default="internet")  # internet, internal, isolated
    services = Column(JSON, nullable=True)  # e.g. [{"port": 22, "service": "ssh"}]
    cves = Column(JSON, nullable=True)  # CVE IDs known to affect this asset
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


Index("ix_events_src_ts", HoneypotEvent.src_ip, HoneypotEvent.timestamp)
Index("ix_alerts_dedup_last", Alert.dedup_key, Alert.last_seen)
Index("ix_incident_key_status", Incident.correlation_key, Incident.status)
