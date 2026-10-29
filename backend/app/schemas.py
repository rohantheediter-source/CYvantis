import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr

# Auth & User Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: "UserResponse"

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    role: str = "analyst" # admin, analyst, viewer

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class PasswordChangeFirstLogin(BaseModel):
    current_password: str
    new_password: str

class TotpSetupResponse(BaseModel):
    secret: str
    qr_code_url: str
    otpauth_url: str

class TotpVerifyRequest(BaseModel):
    totp_code: str

class Login2faVerifyRequest(BaseModel):
    temp_token: str
    totp_code: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    role: str
    is_active: bool
    must_change_password: bool = True
    is_totp_enabled: bool = False
    created_at: datetime.datetime
    last_login: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

# Honeypot Event Schemas
class EventCreate(BaseModel):
    eventid: str
    src_ip: str
    dst_port: int = 22
    protocol: str = "SSH"
    username: Optional[str] = None
    password: Optional[str] = None
    command: Optional[str] = None
    file_hash: Optional[str] = None
    session_id: Optional[str] = None
    duration: float = 0.0
    country: Optional[str] = "Unknown"
    country_code: Optional[str] = "XX"
    city: Optional[str] = "Unknown"
    asn: Optional[str] = "AS0000 Unknown"
    severity: str = "medium"
    is_simulated: bool = False
    raw_payload: Optional[str] = None

class EventResponse(BaseModel):
    id: int
    eventid: str
    timestamp: datetime.datetime
    src_ip: str
    dst_port: int
    protocol: str
    username: Optional[str] = None
    password: Optional[str] = None
    command: Optional[str] = None
    file_hash: Optional[str] = None
    session_id: Optional[str] = None
    duration: float
    country: str
    country_code: str
    city: str
    asn: str
    severity: str
    is_simulated: bool
    raw_payload: Optional[str] = None

    class Config:
        from_attributes = True

class EventPaginatedResponse(BaseModel):
    total: int
    page: int
    page_size: int
    pages: int
    items: List[EventResponse]

# Investigation Schemas
class InvestigationNoteCreate(BaseModel):
    note_text: str

class InvestigationNoteResponse(BaseModel):
    id: int
    investigation_id: int
    author_id: int
    author_username: Optional[str] = None
    note_text: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class InvestigationCreate(BaseModel):
    title: str
    description: Optional[str] = None
    severity: str = "high"
    status: str = "open"
    assigned_to_id: Optional[int] = None
    related_events: Optional[List[int]] = None

class InvestigationUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    assigned_to_id: Optional[int] = None
    related_events: Optional[List[int]] = None

class InvestigationResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    severity: str
    status: str
    assigned_to_id: Optional[int] = None
    assigned_to_username: Optional[str] = None
    created_by_id: Optional[int] = None
    created_by_username: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
    related_events: Optional[List[int]] = None
    notes: List[InvestigationNoteResponse] = []

    class Config:
        from_attributes = True

# Alert Schemas
class AlertUpdate(BaseModel):
    status: Optional[str] = None # active, acknowledged, resolved
    is_acknowledged: Optional[bool] = None

class AlertResponse(BaseModel):
    id: int
    timestamp: datetime.datetime
    title: str
    description: Optional[str] = None
    severity: str
    rule_name: str
    src_ip: Optional[str] = None
    status: str
    is_acknowledged: bool
    acknowledged_by_id: Optional[int] = None
    acknowledged_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

# Detection Rule Schemas
class DetectionRuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    rule_type: str
    condition: str
    threshold: int = 5
    severity: str = "high"
    is_enabled: bool = True

class DetectionRuleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    rule_type: str
    condition: str
    threshold: int
    severity: str
    is_enabled: bool
    created_at: datetime.datetime
    last_triggered: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

# Threat Intel IOC Schemas
class ThreatIntelIOCCreate(BaseModel):
    indicator: str
    ioc_type: str # ip, domain, hash
    threat_score: int = 50
    category: str = "Malicious Host"
    description: Optional[str] = None
    source: str = "Manual Entry"

class ThreatIntelIOCResponse(BaseModel):
    id: int
    indicator: str
    ioc_type: str
    threat_score: int
    category: str
    description: Optional[str] = None
    first_seen: datetime.datetime
    last_seen: datetime.datetime
    source: str

    class Config:
        from_attributes = True

# Audit Log Schemas
class AuditLogResponse(BaseModel):
    id: int
    timestamp: datetime.datetime
    user_id: Optional[int] = None
    username: str
    action: str
    resource: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None

    class Config:
        from_attributes = True

# Setting & Backup Schemas
class PlatformSettingUpdate(BaseModel):
    value: str

class PlatformSettingResponse(BaseModel):
    id: int
    key: str
    value: str
    description: Optional[str] = None
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

class BackupRecordResponse(BaseModel):
    id: int
    timestamp: datetime.datetime
    filename: str
    file_size_bytes: int
    status: str
    is_automated: bool
    created_by: str

    class Config:
        from_attributes = True
