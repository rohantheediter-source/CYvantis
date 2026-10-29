export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'analyst' | 'viewer';
  is_active: boolean;
  must_change_password?: boolean;
  is_totp_enabled?: boolean;
  created_at: string;
  last_login?: string;
}

export type UserRole = 'admin' | 'analyst' | 'viewer';

export interface HoneypotEvent {
  id: number;
  eventid: string;
  timestamp: string;
  src_ip: string;
  dst_port: number;
  protocol: 'SSH' | 'Telnet' | string;
  username?: string;
  password?: string;
  command?: string;
  file_hash?: string;
  session_id?: string;
  duration: number;
  country: string;
  country_code: string;
  city: string;
  asn: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_simulated: boolean;
  raw_payload?: string;
}

export interface OverviewKpis {
  total_events: number;
  unique_ips: number;
  ssh_attempts: number;
  telnet_attempts: number;
  auth_attempts: number;
  active_investigations: number;
  critical_alerts: number;
  active_sensors: number;
}

export interface InvestigationNote {
  id: number;
  investigation_id: number;
  author_id: number;
  author_username?: string;
  note_text: string;
  created_at: string;
}

export interface Investigation {
  id: number;
  title: string;
  description?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assigned_to_id?: number;
  assigned_to_username?: string;
  created_by_id?: number;
  created_by_username?: string;
  created_at: string;
  updated_at: string;
  related_events?: number[];
  notes?: InvestigationNote[];
}

export interface SecurityAlert {
  id: number;
  timestamp: string;
  title: string;
  description?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  rule_name: string;
  src_ip?: string;
  status: 'active' | 'acknowledged' | 'resolved';
  is_acknowledged: boolean;
  acknowledged_by_id?: number;
  acknowledged_at?: string;
}

export interface DetectionRule {
  id: number;
  name: string;
  description?: string;
  rule_type: string;
  condition: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_enabled: boolean;
  created_at: string;
  last_triggered?: string;
}

export interface ThreatIntelIOC {
  id: number;
  indicator: string;
  ioc_type: 'ip' | 'domain' | 'hash';
  threat_score: number;
  category: string;
  description?: string;
  first_seen: string;
  last_seen: string;
  source: string;
}

export interface AuditLog {
  id: number;
  timestamp: string;
  user_id?: number;
  username: string;
  action: string;
  resource?: string;
  details?: string;
  ip_address?: string;
}

export interface StorageStatus {
  db_filename: string;
  db_size_mb: number;
  db_size_bytes: number;
  backup_count: number;
  backup_size_mb: number;
  last_successful_backup?: string;
  last_backup_file?: string;
  retention_days: number;
  storage_health: string;
  warnings: string[];
}

export interface BackupRecord {
  id: number;
  timestamp: string;
  filename: string;
  file_size_bytes: number;
  status: string;
  is_automated: boolean;
  created_by: string;
}

export interface SystemHealth {
  status: string;
  timestamp: string;
  uptime_seconds: number;
  python_version: string;
  backend_version: string;
  database: {
    type: string;
    file: string;
    size_mb: number;
    status: string;
  };
  honeypot_container: {
    name: string;
    type: string;
    status: string;
    log_path: string;
    simulation_mode: boolean;
  };
  websockets: {
    active_connections: number;
    channel: string;
  };
  services: Array<{
    name: string;
    status: string;
    latency_ms: number;
  }>;
}

export interface PlatformSetting {
  id: number;
  key: string;
  value: string;
  description?: string;
  updated_at: string;
}
