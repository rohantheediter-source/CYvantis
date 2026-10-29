-- Cyvantis Database Quick Query File
-- Open this file in DB Browser for SQLite under the "Execute SQL" tab

-- 1. View all Users
SELECT id, username, email, role, is_active, last_login 
FROM users;

-- 2. View Recent Honeypot Events (Latest 50)
SELECT id, timestamp, src_ip, dst_port, protocol, username, password, command, severity, country 
FROM honeypot_events 
ORDER BY timestamp DESC 
LIMIT 50;

-- 3. View Security Alerts
SELECT id, timestamp, title, severity, rule_name, src_ip, status, is_acknowledged 
FROM alerts 
ORDER BY timestamp DESC;

-- 4. View Active Investigations
SELECT id, title, severity, status, created_at, updated_at 
FROM investigations;

-- 5. View Detection Rules
SELECT id, name, rule_type, threshold, severity, is_enabled, last_triggered 
FROM detection_rules;

-- 6. View Threat Intel IOCs
SELECT id, indicator, ioc_type, threat_score, category, source 
FROM threat_intel_iocs;

-- 7. View Audit Logs
SELECT id, timestamp, username, action, resource, ip_address 
FROM audit_logs 
ORDER BY timestamp DESC 
LIMIT 50;

-- 8. View Backup Records
SELECT id, timestamp, filename, file_size_bytes, status, is_automated 
FROM backup_records;
