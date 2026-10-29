# CYVANTIS — Enterprise Gateway Intelligence & Security Nexus

**Tagline:** Deceive. Detect. Investigate. Defend.

CYVANTIS is a professional, modern, enterprise-grade honeypot threat intelligence and attack monitoring platform designed to capture, analyze, visualize, and investigate cyberattacks in real time using Cowrie honeypot technology.

---

## 🌟 Core Features

- **SOC Admin Dashboard**: Premium dark navy aesthetic (`#080E1E`) inspired by enterprise Security Operations Center (SOC) control rooms.
- **Centralized Admin Data Panel**: Direct interface to inspect, query, search, edit, and delete records across all database tables (`events`, `users`, `investigations`, `alerts`, `rules`, `iocs`) with audit logging.
- **Command Line Interface (CLI)**: Full administrative CLI tool (`cyvantis.py` / `cyvantis.bat`) to query events, manage users, trigger online SQLite backups, restore snapshots, and generate PDF reports.
- **Real-Time Live Monitoring**: WebSocket connection streaming honeypot event telemetry live with pause/play controls and cyber terminal log simulator.
- **16 Navigation Modules**:
  1. **Overview**: KPI Cards, 7-day attack activity timeline, attack type distribution, top malicious source IPs, active alerts.
  2. **Live Monitoring**: WebSocket event stream, protocol filters, live terminal output.
  3. **Event Explorer**: Searchable event records table, pagination, date/protocol/severity filters, CSV & JSON export buttons, raw event detail drawer.
  4. **Attack Analysis**: Targeted usernames & passwords dictionary statistics, common exploit commands list.
  5. **Source Intelligence**: IP reputation lookup tool, GeoIP country mapping, ASN provider info, threat risk rating scores.
  6. **Geographic Threat Map**: World radar map overlay, regional heat counters, country attack leaderboard.
  7. **Investigations**: Incident case management hub, analyst notes thread, event linking, status updates (open, in_progress, resolved).
  8. **Detection Rules**: Brute-force & exploit detection rules engine, enable/disable toggle, threshold configuration, security alert queue with one-click Acknowledge.
  9. **Threat Intelligence**: Indicators of Compromise (IOC) database (IPs, hashes, domains), VirusTotal & AbuseIPDB key integration.
  10. **Reports**: Executive threat intelligence report generator with one-click PDF export file download.
  11. **Admin Data Management**: Centralized CRUD table browser & JSON viewer across all database models with audit tracking.
  12. **Storage & Backups**: SQLite database health monitor, atomic online SQLite backup creation (`sqlite3.connect.backup`), backup restore workflow, data retention purge.
  13. **Infrastructure Health**: System operational health cards, Cowrie container status, API latency matrix, WebSocket connection counter.
  14. **Audit Logs**: Immutable log trail of administrative and analyst actions (login, user creation, record deletion, backup, settings changes).
  15. **User Management**: User directory, Role-Based Access Control (Admin, Analyst, Viewer), account activation toggle, password reset.
  16. **Settings**: Platform title branding, Cowrie log directory path configuration, retention rules.

---

## 💻 CYVANTIS Command Line Interface (CLI)

The project includes a built-in administrative CLI (`cyvantis.py` / `cyvantis.bat`) to execute core platform operations directly from the terminal.

### Available CLI Commands

#### 1. System Health & Diagnostics
```bash
python cyvantis.py health
# Or on Windows:
.\cyvantis.bat health
```

#### 2. User & Role Management
```bash
# List all registered users
python cyvantis.py users list

# Create a new analyst or admin user
python cyvantis.py users create --username analyst2 --email analyst2@cyvantis.soc --password "SecurePass123!" --role analyst --full-name "Junior Analyst"

# Delete a user account by ID
python cyvantis.py users delete --user-id 4
```

#### 3. Event Captures & Export
```bash
# Display latest honeypot events
python cyvantis.py events list --limit 15

# Export honeypot events to CSV or JSON
python cyvantis.py events export --format csv --output attack_captures.csv
python cyvantis.py events export --format json --output attack_captures.json
```

#### 4. Storage & Online SQLite Backups
```bash
# Create an atomic online SQLite snapshot backup
python cyvantis.py storage backup

# List all backup snapshots
python cyvantis.py storage list

# Restore SQLite database from a backup file
python cyvantis.py storage restore --file cyvantis_backup_20261002_024443.db

# Purge backups older than specified retention days
python cyvantis.py storage purge --days 90
```

#### 5. Threat Report Generation
```bash
# Generate executive PDF threat intelligence report
python cyvantis.py report --output Executive_Threat_Report.pdf
```

#### 6. Domain & DNS Intelligence Suite
```bash
# 90-day Passive DNS (PDNS) resolution history & CNAME delegation chain
python cyvantis.py pdns cyvantis-target.io

# Subdomain DGA Shannon entropy detection (algorithmic C2 beacons)
python cyvantis.py dga v8x29m31.cyvantis-target.io

# Live DNSSEC cryptographic validation & Fast-Flux TTL rotation analysis
python cyvantis.py dnssec cyvantis-target.io

# Exfiltration Payload Decoder (Base64/Hex DNS tunneling payload recovery)
python cyvantis.py decode-tunnel c2VjcmV0X3Bhc3N3b3JkXzEyMw==.data.tunnel.io

# Certificate Transparency (CT) log audit, wildcard & Private CA detection
python cyvantis.py ct-logs cyvantis-target.io

# WHOIS registration forensics & brand typosquatting detector (Levenshtein distance)
python cyvantis.py typosquat paypa1.com
```

#### 7. Offensive & Defensive Cyber War Room
```bash
# Lateral Movement Simulator (BloodHound-style attack path from DMZ to Domain Controller)
python cyvantis.py lateral

# Cloud Misconfiguration Hunter (S3 bucket permissions, IAM AssumeRole escalation, Lambda)
python cyvantis.py cloud-audit --env AWS-Production

# API Security Fuzzer (GraphQL schema introspection, IDOR/BOLA bypass, Rate-limit stress)
python cyvantis.py api-fuzz --endpoint /api/v1/users

# Software Supply Chain Auditor (Manifest inspection, typosquats, AST malicious code patterns)
python cyvantis.py supply-chain

# Zero-Day Hunter (Real-time AFL++ / Jazzer fuzzing metrics, branch coverage & crash dumps)
python cyvantis.py fuzzing

# Attack Playbook Builder & Sandbox Simulator (Custom chained multi-stage kill chains)
python cyvantis.py playbook

# Threat Actor Profiler & MITRE ATT&CK Matrix (APT29, FIN7, Lazarus Group)
python cyvantis.py threat-actor APT29

# Red Team Assessment Report Generator (Exports Markdown report with CVSS risk scores)
python cyvantis.py redteam --output redteam_assessment.md
```

#### 8. Interactive Pro-Hacker Console
```bash
# Launch interactive 32-option SOC command center terminal
python cyvantis.py menu
# Or simply:
.\cyvantis.bat
```

#### 9. Autonomous Cyber Defense Operations Suite
CYVANTIS integrates 10 autonomous defensive engineering modules:
1. **Auto-Patch & Configuration Drift Engine**: Continuous IaC (Terraform/K8s) desired vs live drift comparison with One-Click Revert, OS package manager patch debt index (CVE-2024-3094), and dependency pinning auditor.
2. **Immutable Infrastructure Guardian**: Real-time eBPF system call telemetry (sys_enter_openat/write), rootkit detection on `/etc/passwd` & `/bin/ls`, automated host quarantine & reboot, and CIS Level 2 Golden Image builder (Chainguard Distroless/Alpine).
3. **Zero Trust Network Micro-Segmentation Planner**: NetFlow East-West lateral movement heatmap, unexpected cross-tier connection tripwires, least-privilege Kubernetes NetworkPolicy & AWS Security Groups generator, and Istio STRICT mTLS enforcer.
4. **Data Exfiltration Sentinel**: Real-time DLP pattern inspector with Luhn credit card validation, US SSNs, and AWS/OpenAI secret keys, DNS tunneling query surge alarms, and SQL bulk-scraping auditor with automated PostgreSQL Row-Level Security (RLS) generator.
5. **Threat Hunting Query Builder**: AI-powered natural language prompt translator generating production Splunk (SPL), Microsoft Sentinel (KQL), and Elasticsearch (ES|QL) queries, interactive Hypothesis Cards with evidence scores, and MITRE ATT&CK tactics coverage matrix with Sigma rules.
6. **Incident Response Orchestrator**: SOAR playbook automation (threat intel enrichment, firewall blackholing, session revocation, and Jira ticket creation), chronological multi-stage Attack Timeline reconstruction, and automated Post-Mortem Root Cause Analysis (RCA).
7. **Resilience Chaos Engineering Engine**: LitmusChaos & Chaos Mesh fault injection (Network partition, CPU DDoS surge, CoreDNS outage), live Service Level Objective (SLO) error budget burn rate tracking, and Cyber Game Day simulator.
8. **Compliance & Governance Dashboard**: Live continuous control scorecards for SOC 2 Type II, ISO 27001:2022, HIPAA, and PCI-DSS v4.0, tamper-proof SHA-256 hash-chained Merkle audit ledger with mathematical verification, and Open Policy Agent (OPA) Conftest Rego validator.
9. **Threat Intel Fusion Center**: Real-time multi-source enrichment fusing VirusTotal, AbuseIPDB, Shodan open sockets, AlienVault OTX, and MISP, coupled with cross-indicator correlation campaigns and diamond-model Threat Actor attribution (APT29, FIN7, Lazarus).
10. **Security Posture Scorecard**: Weighted 0-100 composite posture index across 5 core pillars, SaaS & financial industry peer percentiles, and prioritized improvement roadmap with interactive simulated posture projection.

#### 10. Elite Cyber Operations & Security Lifecycle Suite
CYVANTIS adds 10 next-generation enterprise lifecycle capabilities:
1. **Identity Graph & Insider Threat Engine**: Unified correlation across Active Directory, Okta, and AWS IAM; interactive Identity Graph with impossible travel alarms (SF Office to Bucharest, Romania via curl) and One-Click Session Revocation.
2. **Software Supply Chain Integrity Monitor**: CycloneDX/SPDX SBOM generator, dependency confusion vulnerability scanner, Sigstore/Cosign build provenance verifier, and AST-based AI malicious commit detector.
3. **Business Logic & Fraud Engine**: Financial logic fuzzer testing negative item quantities (-5 units), client-side price tampering, TOCTOU inventory race conditions, promotional coupon replay farms, and response PII data leakage audits.
4. **Cognitive Co-Pilot (AI)**: DBSCAN alert deduplication achieving 99.8% noise compression (4,890 raw events -> 2 actionable incidents), executive daily security digests, and interactive "Ask CYVANTIS" conversational query assistant.
5. **Disaster Recovery & Resilience Simulator**: RPO/RTO gap analysis, chaos automated database failover simulation (28.4s failover, 0 records lost), cryptographic backup sandbox verifier, and step-by-step P1 DR runbooks.
6. **Security Metrics & KPI Dashboard**: MTTD (4.2m vs 48m average) and MTTR (12.8m vs 120m average) historical trendlines, false positive rate (FPR) tuning, vulnerability aging SLAs, and NIST CSF maturity radar.
7. **Executive & Board-Ready View**: Factor Analysis of Information Risk (FAIR model) calculating Annualized Loss Expectancy ($506,500/yr financial risk mitigated, 86.4% ROI) with CISO Board briefing exports.
8. **Security Automation Marketplace**: Discoverable community SOAR playbook library, connector status hub (Slack, Jira, AWS CloudTrail, Okta, Splunk, CrowdStrike), and Git-based security policy version control.
9. **Security Training & Phishing Simulator**: PhishSim simulated campaigns, employee resilience tracking, high-risk user leaderboards, and targeted 3-minute interactive micro-learning drills (Homograph spoofing, MFA fatigue).
10. **Security Architecture Reviewer**: Pre-deployment architecture component auditor, automated STRIDE threat modeling (Spoofing, Tampering, Repudiation, Info Disclosure, DoS, Elevation of Privilege), and compliance gap analysis.

---

## 🚀 Local Development Setup

### 1. Backend Setup

```bash
cd backend
python -m venv venv
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
pip install email-validator

# Run FastAPI backend server (port 8000)
# On Windows PowerShell (Direct venv execution):
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --reload-dir app

# Or after activating venv (Linux / macOS / PowerShell):
uvicorn app.main:app --reload --reload-dir app --host 0.0.0.0 --port 8000
```

The database will be automatically created (`cyvantis.db`) and populated with initial seed users, detection rules, threat IOCs, and 200+ realistic honeypot events.

### Default Login Accounts:
- **Admin**: `admin` / `Admin@Cyvantis2026!` (Role: Admin)
- **Analyst**: `analyst` / `Analyst@Cyvantis2026!` (Role: Analyst)
- **Viewer**: `viewer` / `Viewer@Cyvantis2026!` (Role: Viewer)

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Automated Testing

Execute the backend pytest suite to verify authentication, database persistence, event filtering, rules engine, and SQLite backup/restore:

```bash
.\backend\venv\Scripts\pytest.exe backend/tests
```

---

## 🐳 Docker Deployment

To deploy CYVANTIS with Cowrie honeypot, FastAPI backend, and React frontend using Docker Compose:

```bash
docker-compose up -d --build
```

- **Frontend SOC Dashboard**: `http://localhost`
- **Backend API Docs**: `http://localhost:8000/api/v1/docs`
- **Cowrie Honeypot Gateway**: SSH port `2222`, Telnet port `2223`

---

## 💾 Storage & SQLite Backup Procedures

CYVANTIS uses SQLite primary storage managed by the backend.

1. **Manual Backup**: Go to **12. Storage & Backups** in the dashboard and click **Create SQLite Snapshot** or run `python cyvantis.py storage backup`.
2. **Restore**: Select a backup snapshot from the history table and click **Restore** or run `python cyvantis.py storage restore --file <snapshot.db>`.
3. **Retention Purge**: Purges old backup files beyond 90 days.

---

## 🔒 Security Architecture

- **Least-Privilege RBAC**: Role checks enforced on all administrative routes (`Admin`, `Analyst`, `Viewer`).
- **Input Sanitization**: Pydantic schemas validate all incoming REST inputs.
- **Sensitive Data Handling**: Plaintext passwords in honeypot events are stored with access restriction labels.
- **Audit Logging**: All user actions (login, deletion, backup, settings edits) are recorded in the `audit_logs` table.

---

## 🛡️ Advanced SOC Technology Stack & Analyst Skill Matrix

Security Operations Center (SOC) teams use an advanced technology stack across 14 specialized domain areas to monitor, detect, analyze, hunt, and respond to cyber threats:

| Domain Area | Advanced Tools | What You Learn |
| :--- | :--- | :--- |
| **SIEM** | Splunk, Microsoft Sentinel, Elastic Security | Detection engineering, correlation, log aggregation, and security investigations. |
| **EDR / XDR** | CrowdStrike Falcon, Defender XDR, SentinelOne | Endpoint investigation, process behavior analysis, and threat hunting. |
| **SOAR** | Cortex XSOAR, Splunk SOAR, Tines | Automated incident response, playbook execution, and workflow orchestration. |
| **NDR** | Darktrace, Vectra AI, ExtraHop | Network behavior anomaly detection, packet analysis, and lateral movement tracking. |
| **IDS / NSM** | Suricata, Zeek, Security Onion, Wireshark | Network security monitoring, signature detection, and deep packet inspection. |
| **Threat Intelligence** | MISP, OpenCTI, ThreatConnect | IOC & TTP intelligence management, threat actor profiling, and feed ingestion. |
| **Case Management** | TheHive, ServiceNow SecOps | Incident lifecycle management, analyst collaborative case notes, and SLAs. |
| **Malware Analysis** | Ghidra, IDA, CAPE Sandbox | Malware analysis, dynamic/static reverse engineering, and disassembly. |
| **Digital Forensics** | Autopsy, Volatility, Velociraptor | Disk artifacts, memory dump analysis, and endpoint forensic artifact retrieval. |
| **Threat Hunting** | osquery, Velociraptor, Sigma, YARA | Proactive hypothesis-driven threat hunting and fleet query analysis. |
| **Detection Engineering** | Sigma, YARA, KQL, SPL, EQL | Writing high-quality detection rules, reducing false positives, and MITRE mapping. |
| **Cloud Security** | AWS GuardDuty, Microsoft Defender for Cloud, Google SecOps | Cloud environment monitoring, IAM anomaly detection, and cloud threat detection. |
| **Identity Security** | Microsoft Entra ID, Okta, BloodHound CE | Identity attack-path analysis, Active Directory privilege escalation, and SSO. |
| **Container Security** | Falco, Trivy, Wiz | Kubernetes runtime monitoring, container vulnerability scanning, and posture management. |

---

### ⚡ Essential Core SOC Tools & Framework Mapping

| Essential Tool / Technology | Primary SOC Function / Domain |
| :--- | :--- |
| **Wazuh / Elastic Security** | SIEM (Security Information & Event Management) |
| **Suricata** | Intrusion Detection System (IDS) |
| **Zeek** | Network Security Monitoring (NSM) |
| **Sigma** | Detection rules standard |
| **YARA** | Malware detection & artifact matching |
| **Velociraptor** | Endpoint investigation & DFIR |
| **TheHive** | Incident & case management |
| **MISP or OpenCTI** | Threat intelligence platform (TIP) |
| **MITRE ATT&CK** | Adversary behavior framework & tactic mapping |
| **Python** | SOC automation & API scripting |
| **KQL / SPL / EQL** | Security query languages |
| **Ghidra + Volatility** | Advanced malware reverse engineering & memory forensics |
