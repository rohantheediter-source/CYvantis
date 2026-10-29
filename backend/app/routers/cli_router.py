import io
import contextlib
import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, HoneypotEvent, Alert, DetectionRule, ThreatIntelIOC, BackupRecord, AuditLog
from app.security import get_current_user
from app import backup_service
from app.utils.pdf_generator import generate_security_report_pdf
from app.utils.domain_intel_service import DomainIntelligenceService
from app.utils.offensive_defensive_service import OffensiveDefensiveSuiteService

router = APIRouter(prefix="/cli", tags=["Interactive Web CLI"])

class CLICommandRequest(BaseModel):
    command: str

class CLICommandResponse(BaseModel):
    command: str
    output: str
    status: str
    timestamp: str

@router.post("/execute", response_model=CLICommandResponse)
def execute_web_cli_command(
    req: CLICommandRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cmd_str = req.command.strip()
    if not cmd_str:
        return {
            "command": "",
            "output": "",
            "status": "empty",
            "timestamp": datetime.datetime.utcnow().isoformat()
        }

    raw_parts = cmd_str.split()
    parts = []
    for p in raw_parts:
        clean_p = p.strip('"\'').lower()
        if clean_p in ["python", "python3", "python.exe", "cyvantis", "cyvantis.py", "cyvantis.bat", ".\\cyvantis.bat", "./cyvantis.bat", ".\\cyvantis.py"]:
            continue
        parts.append(p)

    if not parts:
        parts = raw_parts

    base_cmd = parts[0].lower()
    sub_cmd = parts[1].lower() if len(parts) > 1 else ""

    output_lines = []
    status_str = "success"

    try:
        if base_cmd in ["help", "?"]:
            output_lines.append("=========================================================================")
            output_lines.append("  CYVANTIS AEGISNEX WEB CLI CONSOLE — AVAILABLE COMMANDS")
            output_lines.append("=========================================================================")
            output_lines.append("  health                         - View system health & database operational status")
            output_lines.append("  whoami                         - Display current active user session metadata")
            output_lines.append("  scan <url|domain|ip>           - Nmap port scan & URL web service reconnaissance")
            output_lines.append("  nmap <url|domain|ip>           - Perform Nmap target scan & banner grabbing")
            output_lines.append("  whois <domain|ip>              - WHOIS registrar & RDAP lookup")
            output_lines.append("  dns <domain>                   - DNS records resolution (A, MX, TXT, NS)")
            output_lines.append("  decode <payload>               - De-obfuscate Base64/Hex/URL encoded attack payloads")
            output_lines.append("  blocklist [ufw|iptables|ps]    - Generate firewall block rules")
            output_lines.append("  mitre                          - Map honeypot events to MITRE ATT&CK techniques")
            output_lines.append("  hash <file_hash>               - Check file hash malware reputation (MD5, SHA256)")
            output_lines.append("  subdomains <domain>            - Discover subdomains via CT logs & DNS")
            output_lines.append("  users list                     - List all registered SOC analyst accounts")
            output_lines.append("  events list [limit]            - Show recent honeypot attack event captures")
            output_lines.append("  storage status                 - Display SQLite database size and backup count")
            output_lines.append("  storage backup                 - Trigger an online atomic SQLite snapshot backup")
            output_lines.append("  storage list                   - List all stored backup snapshot archives")
            output_lines.append("  rules list                     - List detection rules and threshold status")
            output_lines.append("  iocs list                      - Show registered Indicators of Compromise (IOCs)")
            output_lines.append("  report                         - Generate executive threat intelligence summary")
            output_lines.append("  banner                         - Print CYVANTIS SOC banner")
            output_lines.append("  clear                          - Clear terminal output screen")
            output_lines.append("\n  --- DOMAIN & DNS INTELLIGENCE SUITE ---")
            output_lines.append("  pdns <domain>                  - 90-day Passive DNS history & CNAME chain")
            output_lines.append("  dga <subdomain>                - Shannon entropy algorithmic DGA detection")
            output_lines.append("  dnssec <domain>                - DNSSEC cryptographic check & fast-flux TTL analysis")
            output_lines.append("  decode-tunnel <query>          - Decode Base64/Hex DNS tunneling exfiltration payloads")
            output_lines.append("  ct-logs <domain>               - Certificate Transparency audit & Private CA detection")
            output_lines.append("  typosquat <domain>             - WHOIS forensics & brand typosquatting scanner")
            output_lines.append("\n  --- OFFENSIVE & DEFENSIVE CYBER WAR ROOM ---")
            output_lines.append("  lateral                        - Lateral Movement Simulator (Attack Path Graph)")
            output_lines.append("  cloud-audit [env]              - Cloud Misconfiguration Hunter (S3, IAM, Lambda)")
            output_lines.append("  api-fuzz [endpoint]            - API Security Fuzzer (GraphQL, IDOR BOLA, Rate limits)")
            output_lines.append("  supply-chain                   - Software Supply Chain manifest & dependency audit")
            output_lines.append("  fuzzing                        - Zero-Day Hunter: AFL++ / Jazzer live fuzzing telemetry")
            output_lines.append("  playbook                       - Attack Playbook Builder: simulated kill chain trace")
            output_lines.append("  threat-actor [actor]           - Threat Actor Profiler (APT29, FIN7, Lazarus) TTP matrix")
            output_lines.append("  redteam                        - Generate professional Red Team Assessment Report")
            output_lines.append("=========================================================================")

        elif base_cmd == "banner":
            output_lines.append("  ██████╗██╗   ██╗██╗   ██╗███╗   ██╗████████╗██╗███████╗")
            output_lines.append(" ██╔════╝╚██╗ ██╔╝██║   ██║████╗  ██║╚══██╔══╝██║██╔════╝")
            output_lines.append(" ██║      ╚████╔╝ ██║   ██║██╔██╗ ██║   ██║   ██║███████╗")
            output_lines.append(" ██║       ╚██╔╝  ╚██╗ ██╔╝██║╚██╗██║   ██║   ██║╚════██║")
            output_lines.append(" ╚██████╗   ██║    ╚████╔╝ ██║ ╚████║   ██║   ██║███████║")
            output_lines.append("  ╚═════╝   ╚═╝     ╚═══╝  ╚═╝  ╚═══╝   ╚═╝   ╚═╝╚══════╝")
            output_lines.append("  [+] CYVANTIS AEGISNEX — ENTERPRISE SOC TERMINAL COMMAND CENTER v1.2")
            output_lines.append("  [+] Status: KERNEL ONLINE | 200,000 ML Threat Model Pipeline Active")

        elif base_cmd == "whoami":
            output_lines.append(f"User: {current_user.username} | Role: {current_user.role} | Email: {current_user.email} | ID: #{current_user.id}")

        elif base_cmd == "health":
            user_count = db.query(User).count()
            event_count = db.query(HoneypotEvent).count()
            alert_count = db.query(Alert).count()
            output_lines.append("=========================================================")
            output_lines.append("  CYVANTIS SOC HEALTH & DIAGNOSTICS")
            output_lines.append("=========================================================")
            output_lines.append("  [+] Platform Status:      OPERATIONAL")
            output_lines.append("  [+] Database Engine:      SQLite 3 Transactional DB")
            output_lines.append(f"  [+] Registered Users:     {user_count}")
            output_lines.append(f"  [+] Honeypot Captures:    {event_count}")
            output_lines.append(f"  [+] Active Alerts:        {alert_count}")
            output_lines.append("=========================================================")

        elif base_cmd in ["whois", "dns"]:
            target = parts[1] if len(parts) > 1 else ""
            if not target:
                output_lines.append("[-] Error: Target domain or IP address required. Example: whois example.com")
            else:
                from app.utils.whois_dns import query_dns_records, query_whois, format_dns_whois_report
                dns_res = query_dns_records(target)
                whois_res = query_whois(target)
                output_lines.extend(format_dns_whois_report(dns_res, whois_res).splitlines())

        elif base_cmd == "decode":
            payload = " ".join(parts[1:]) if len(parts) > 1 else ""
            if not payload:
                output_lines.append("[-] Error: Payload string required. Example: decode Y3VybCBldmlsLmNvbQ==")
            else:
                from app.utils.payload_deobfuscator import deobfuscate_command, format_deobfuscator_report
                res = deobfuscate_command(payload)
                output_lines.extend(format_deobfuscator_report(res).splitlines())

        elif base_cmd == "blocklist":
            fmt = parts[1].lower() if len(parts) > 1 else "ufw"
            from app.utils.blocklist_generator import generate_firewall_blocklist
            res = generate_firewall_blocklist(db, format_type=fmt)
            output_lines.append(f"[+] Generated {res['count']} firewall block rules ({res['format'].upper()}):")
            output_lines.extend(res['rules_text'].splitlines())

        elif base_cmd == "mitre":
            from app.utils.mitre_mapper import map_events_to_mitre, format_mitre_report
            res = map_events_to_mitre(db)
            output_lines.extend(format_mitre_report(res).splitlines())

        elif base_cmd == "hash":
            hash_str = parts[1] if len(parts) > 1 else ""
            if not hash_str:
                output_lines.append("[-] Error: File hash string required. Example: hash 44d88612fea8a8f36de82e1278abb02f")
            else:
                from app.utils.hash_checker import analyze_file_hash, format_hash_report
                res = analyze_file_hash(hash_str)
                output_lines.extend(format_hash_report(res).splitlines())

        elif base_cmd == "subdomains":
            target = parts[1] if len(parts) > 1 else ""
            if not target:
                output_lines.append("[-] Error: Target domain required. Example: subdomains example.com")
            else:
                from app.utils.subdomain_enum import enumerate_subdomains, format_subdomain_report
                res = enumerate_subdomains(target)
                output_lines.extend(format_subdomain_report(res).splitlines())

        elif base_cmd in ["url", "url-scan"]:
            target_url = parts[1] if len(parts) > 1 else ""
            if not target_url:
                output_lines.append("[-] Error: Target URL required. Example: url-scan http://example.com")
            else:
                from app.utils.url_scanner import analyze_url_threat
                res = analyze_url_threat(target_url)
                if not res.get("is_valid"):
                    output_lines.append(f"[-] Invalid URL: {res.get('error')}")
                else:
                    output_lines.append(f"[+] URL Target:           {res['url']}")
                    output_lines.append(f"[+] Verdict:              {res['verdict']}")
                    output_lines.append(f"[+] Risk Score:           {res['risk_score']} / 100")
                    output_lines.append(f"[+] Response Latency:     {res['latency_ms']} ms")
                    output_lines.append(f"[+] Resolved IPs:         {', '.join(res['ip_addresses']) if res['ip_addresses'] else 'None'}")
                    output_lines.append(f"[+] HTTP Status Code:     {res['http_status'] or 'N/A'}")
                    output_lines.append(f"[+] Final Destination:    {res['final_url']}")
                    output_lines.append(f"[+] Redirected:           {res['is_redirected']}")
                    if res.get("ssl_info"):
                        output_lines.append(f"[+] SSL Valid:            {res['ssl_info'].get('valid')}")
                    if res.get("heuristics"):
                        output_lines.append("[!] Heuristic Flags:")
                        for h in res["heuristics"]:
                            output_lines.append(f"    - {h}")

        elif base_cmd == "users" and sub_cmd == "list":
            users = db.query(User).order_by(User.id.asc()).all()
            output_lines.append("ID  | Username   | Role     | Status   | Email")
            output_lines.append("-" * 65)
            for u in users:
                st = "Active" if u.is_active else "Disabled"
                output_lines.append(f"{u.id:<3} | {u.username:<10} | {u.role:<8} | {st:<8} | {u.email}")

        elif base_cmd == "events" and sub_cmd == "list":
            limit = int(parts[2]) if len(parts) > 2 and parts[2].isdigit() else 10
            events = db.query(HoneypotEvent).order_by(HoneypotEvent.timestamp.desc()).limit(limit).all()
            output_lines.append(f"ID   | Timestamp           | Protocol | Source IP       | User:Pass          | Severity")
            output_lines.append("-" * 85)
            for ev in events:
                user_pass = f"{ev.username or ''}:{ev.password or ''}"
                ts = ev.timestamp.strftime("%Y-%m-%d %H:%M:%S")
                output_lines.append(f"{ev.id:<4} | {ts} | {ev.protocol:<8} | {ev.src_ip:<15} | {user_pass:<18} | {ev.severity}")

        elif base_cmd == "storage":
            if sub_cmd == "backup":
                rec = backup_service.create_sqlite_backup(db, created_by=current_user.username, is_automated=False)
                output_lines.append(f"[+] Snapshot backup created successfully: {rec.filename} ({rec.file_size_bytes} bytes)")
            elif sub_cmd == "list":
                backups = db.query(BackupRecord).order_by(BackupRecord.timestamp.desc()).all()
                output_lines.append("ID  | Timestamp           | Filename                           | Size (KB) | Status")
                output_lines.append("-" * 80)
                for b in backups:
                    ts = b.timestamp.strftime("%Y-%m-%d %H:%M:%S")
                    kb = round(b.file_size_bytes / 1024, 1)
                    output_lines.append(f"{b.id:<3} | {ts} | {b.filename:<34} | {kb:<9} | {b.status}")
            else:
                output_lines.append("Storage usage: Run 'storage backup' or 'storage list'")

        elif base_cmd == "rules" and sub_cmd == "list":
            rules = db.query(DetectionRule).order_by(DetectionRule.id.asc()).all()
            output_lines.append("ID  | Rule Name                     | Status   | Threshold | Severity")
            output_lines.append("-" * 75)
            for r in rules:
                st = "ENABLED" if r.is_enabled else "DISABLED"
                output_lines.append(f"{r.id:<3} | {r.name:<29} | {st:<8} | {r.threshold:<9} | {r.severity}")

        elif base_cmd == "iocs" and sub_cmd == "list":
            iocs = db.query(ThreatIntelIOC).order_by(ThreatIntelIOC.last_seen.desc()).all()
            output_lines.append("ID  | Indicator                     | Type   | Score | Category")
            output_lines.append("-" * 75)
            for i in iocs:
                output_lines.append(f"{i.id:<3} | {i.indicator:<29} | {i.ioc_type:<6} | {i.threat_score:<5} | {i.category}")

        elif base_cmd in ["scan", "nmap"]:
            target = ""
            for p in parts[1:]:
                if not p.startswith("-") and not target:
                    target = p
                elif p.startswith("--url=") or p.startswith("-u="):
                    target = p.split("=", 1)[1]
            if not target and len(parts) > 2 and parts[1] in ["--url", "-u"]:
                target = parts[2]

            if not target:
                output_lines.append("[-] Error: Target URL, domain, or IP address required.")
                output_lines.append("    Usage: scan <url_or_domain_or_ip>")
                output_lines.append("    Example: scan https://example.com")
                output_lines.append("    Example: scan 192.168.1.1")
            else:
                from app.utils.nmap_scanner import scan_url_and_host, format_scan_report
                res = scan_url_and_host(target)
                report_text = format_scan_report(res)
                output_lines.extend(report_text.splitlines())

        elif base_cmd == "report":
            total_events = db.query(HoneypotEvent).count()
            unique_ips = db.query(HoneypotEvent.src_ip).distinct().count()
            output_lines.append("=========================================================")
            output_lines.append("  CYVANTIS THREAT INTELLIGENCE SUMMARY REPORT")
            output_lines.append("=========================================================")
            output_lines.append(f"  Total Recorded Attacks:   {total_events}")
            output_lines.append(f"  Unique Malicious IPs:     {unique_ips}")
            output_lines.append("  Status: PDF report ready for download at /api/v1/reports/pdf")
            output_lines.append("=========================================================")

        elif base_cmd == "pdns":
            target = parts[1] if len(parts) > 1 else "cyvantis-target.io"
            data = DomainIntelligenceService.get_passive_dns_history(target)
            output_lines.append("=========================================================================")
            output_lines.append(f"  CYVANTIS PASSIVE DNS (PDNS) INTELLIGENCE - {target.upper()}")
            output_lines.append("=========================================================================")
            output_lines.append(f"  Target Domain:        {data['domain']}")
            output_lines.append(f"  90-Day Records:       {data['records_evaluated_90d']}")
            output_lines.append(f"  DGA Shannon Entropy:  {data['dga_analysis']['shannon_entropy']} ({data['dga_analysis']['risk_rating']})")
            output_lines.append("\n  --- 90-Day Resolution Timeline ---")
            output_lines.append(f"  {'IP Address':<24} | {'Type':<5} | {'First Seen':<11} | {'Last Seen':<11} | {'Status'}")
            output_lines.append("  " + "-" * 75)
            for rec in data.get("a_record_history", []):
                output_lines.append(f"  {rec['ip']:<24} | {rec['record_type']:<5} | {rec['first_seen']:<11} | {rec['last_seen']:<11} | {rec['status']}")
            output_lines.append("\n  --- CNAME Delegation Chain ---")
            for hop in data.get("cname_chain", []):
                output_lines.append(f"  [NODE] {hop['node']} ({hop['type']}) -> {hop['target']}")
            output_lines.append("\n  --- Discovered Subdomains ---")
            for sub in data.get("subdomains_discovered", []):
                output_lines.append(f"  * {sub['subdomain']:<32} [IP: {sub['ip']:<15}] [Status: {sub['status']}]")
            output_lines.append("=========================================================================")

        elif base_cmd == "dga":
            sub = parts[1] if len(parts) > 1 else "v8x29m31.cyvantis-target.io"
            entropy = DomainIntelligenceService.calculate_shannon_entropy(sub)
            is_dga = entropy > 3.6
            output_lines.append("=========================================================================")
            output_lines.append("  CYVANTIS DGA ENTROPY DETECTOR - SHANNON HEURISTIC")
            output_lines.append("=========================================================================")
            output_lines.append(f"  Inspected Subdomain:  {sub}")
            output_lines.append(f"  Shannon Entropy:      {entropy:.3f} bits")
            output_lines.append(f"  Classification:       {'CRITICAL_DGA_BEACON' if is_dga else 'NORMAL_LEXICAL'}")
            output_lines.append(f"  Threshold Reference:  > 3.6 bits indicates algorithmic randomness")
            output_lines.append(f"  Verdict:              {'MALICIOUS DGA C2 BEACON' if is_dga else 'HUMAN READABLE / BENIGN'}")
            output_lines.append("=========================================================================")

        elif base_cmd == "dnssec":
            target = parts[1] if len(parts) > 1 else "cyvantis-target.io"
            res = DomainIntelligenceService.analyze_dnssec_and_tunneling(target)
            dnssec = res["dnssec_status"]
            ttl = res["ttl_analysis"]
            tun = res["tunneling_detection"]
            output_lines.append("=========================================================================")
            output_lines.append(f"  CYVANTIS DNSSEC & DNS TUNNELING ANALYZER - {target.upper()}")
            output_lines.append("=========================================================================")
            output_lines.append(f"  DNSSEC Zone Signed:   {dnssec['is_signed']}")
            output_lines.append(f"  Cryptographic Status: {dnssec['validation_status']}")
            output_lines.append(f"  Algorithm:            {dnssec['dnskey_algorithm']}")
            output_lines.append(f"  Record TTL:           {ttl['record_ttl_seconds']}s (Fast-Flux: {ttl['is_fast_flux']})")
            output_lines.append(f"  Tunneling Detected:   {tun['tunneling_detected']} ({tun['query_frequency_per_minute']} queries/min)")
            output_lines.append(f"  Protocol Signature:   {tun['protocol_signature']}")
            output_lines.append(f"  MITRE Technique:      {tun['mitre_technique']}")
            output_lines.append("=========================================================================")

        elif base_cmd in ["decode-tunnel", "tunnel-decode"]:
            q = parts[1] if len(parts) > 1 else "c2VjcmV0X3Bhc3N3b3JkXzEyMw==.data.tunnel.io"
            res = DomainIntelligenceService.decode_tunnel_payload(q)
            output_lines.append("=========================================================================")
            output_lines.append("  CYVANTIS DNS EXFILTRATION PAYLOAD DECODER")
            output_lines.append("=========================================================================")
            output_lines.append(f"  Raw Query:            {res['raw_query']}")
            output_lines.append(f"  Encoding Detected:    {res['encoding_type']}")
            output_lines.append(f"  DECODED CONTENT:      {res['decoded_content']}")
            output_lines.append(f"  Classification:       {res['threat_classification']}")
            output_lines.append(f"  Recommended Action:   {res['recommended_action']}")
            output_lines.append("=========================================================================")

        elif base_cmd == "ct-logs":
            target = parts[1] if len(parts) > 1 else "cyvantis-target.io"
            res = DomainIntelligenceService.get_certificate_transparency_history(target)
            output_lines.append("=========================================================================")
            output_lines.append(f"  CYVANTIS CERTIFICATE TRANSPARENCY (CT) LOG AUDIT - {target.upper()}")
            output_lines.append("=========================================================================")
            output_lines.append(f"  Total Certificates:   {res['total_certificates_found']}")
            output_lines.append(f"  Wildcard Alert:       {res['audit_flags']['wildcard_detected']}")
            output_lines.append(f"  Private CA Alert:     {res['audit_flags']['private_ca_detected']}")
            output_lines.append(f"  Security Summary:     {res['audit_flags']['security_alert']}")
            output_lines.append("\n  --- Certificates ---")
            for c in res.get("certificates", []):
                output_lines.append(f"  * {c['common_name']:<28} | {c['issuer'][:30]:<30} | {c['status']}")
            output_lines.append("=========================================================================")

        elif base_cmd == "typosquat":
            target = parts[1] if len(parts) > 1 else "paypa1.com"
            res = DomainIntelligenceService.get_whois_and_typosquatting(target)
            w = res["whois_records"]
            t = res["typosquatting_analysis"]
            output_lines.append("=========================================================================")
            output_lines.append(f"  CYVANTIS WHOIS REGISTRATION FORENSICS - {target.upper()}")
            output_lines.append("=========================================================================")
            output_lines.append(f"  Registrar:            {w['registrar']}")
            output_lines.append(f"  Domain Age:           {w['domain_age_days']} days (Created: {w['created_date']})")
            output_lines.append(f"  Newly Registered:     {w['is_newly_registered']}")
            output_lines.append(f"  Privacy Guard:        {w['privacy_masking']['service']}")
            output_lines.append(f"  Throwaway DNS Risk:   {w['throwaway_domain_risk']}")
            output_lines.append(f"  Typosquat Impostor:   {t['is_typosquat']} ({t['brand_impersonation_risk']})")
            for m in t.get("matches", []):
                output_lines.append(f"  * Target Brand: {m['targeted_brand']} (Dist: {m['levenshtein_distance']}) [{m['technique']}]")
            output_lines.append("=========================================================================")

        elif base_cmd == "lateral":
            res = OffensiveDefensiveSuiteService.get_lateral_movement_simulation()
            output_lines.append("=========================================================================")
            output_lines.append("  CYVANTIS LATERAL MOVEMENT SIMULATOR - ATTACK PATH GRAPH")
            output_lines.append("=========================================================================")
            output_lines.append(f"  Initial Foothold:     {res['initial_foothold']}")
            output_lines.append(f"  Target Objective:    {res['target_objective']}")
            output_lines.append(f"  Shortest Path:        {' -> '.join(res['shortest_attack_path'])} ({res['hop_count']} Hops)")
            output_lines.append("\n  --- Attack Nodes ---")
            for n in res.get("nodes", []):
                output_lines.append(f"  * {n['id']:<10} | {n['name']:<30} | {n['risk']}")
            lat = res.get("lateral_vectors_audited", {})
            kerb = lat.get("kerberos_ticket_analysis", {})
            pth = lat.get("pass_the_hash_exposure", {})
            output_lines.append(f"\n  Kerberos SPN Vulnerable: {', '.join(kerb.get('vulnerable_accounts', []))}")
            output_lines.append(f"  LSASS Hashes Exposed:    {pth.get('ntlmv2_hashes_in_lsass')} (Status: {pth.get('pth_mitigation_status')})")
            output_lines.append("=========================================================================")

        elif base_cmd == "cloud-audit":
            env = parts[1] if len(parts) > 1 else "AWS-Production"
            res = OffensiveDefensiveSuiteService.audit_cloud_environment(env)
            output_lines.append("=========================================================================")
            output_lines.append(f"  CYVANTIS CLOUD MISCONFIGURATION HUNTER - {env.upper()}")
            output_lines.append("=========================================================================")
            output_lines.append(f"  Resources Scanned:    {res['cloud_resources_scanned']}")
            output_lines.append(f"  Critical Flags:       {res['critical_misconfigurations']}")
            output_lines.append("\n  --- S3 Buckets ---")
            for b in res.get("s3_bucket_audit", []):
                output_lines.append(f"  * {b['name']:<32} [Read: {b['public_read']} | Write: {b['public_write']}] Risk: {b['risk']}")
            output_lines.append("\n  --- IAM Escalations ---")
            for iam in res.get("iam_escalation_paths", []):
                output_lines.append(f"  * {iam['role_name']}: {iam['privilege_hop']} [{iam['severity']}]")
            output_lines.append(f"\n  Remediation:          {res['remediation_summary']}")
            output_lines.append("=========================================================================")

        elif base_cmd == "api-fuzz":
            ep = parts[1] if len(parts) > 1 else "/api/v1/users"
            res = OffensiveDefensiveSuiteService.test_api_security(ep)
            output_lines.append("=========================================================================")
            output_lines.append(f"  CYVANTIS API SECURITY FUZZER - {ep}")
            output_lines.append("=========================================================================")
            output_lines.append(f"  Overall Posture:      {res['overall_api_posture']}")
            gql = res.get("graphql_schema", {})
            idor = res.get("idor_test", {})
            rl = res.get("rate_limit_test", {})
            output_lines.append(f"  GraphQL Introspection: {gql.get('introspection_enabled')} (Types: {', '.join(gql.get('types_exposed', []))})")
            output_lines.append(f"  IDOR / BOLA Detected:  {idor.get('idor_detected')} (CVSS {idor.get('cvss_score')})")
            output_lines.append(f"  Rate Limit Enforced:   {rl.get('rate_limit_enforced')} ({rl.get('status')})")
            output_lines.append("=========================================================================")

        elif base_cmd == "supply-chain":
            res = OffensiveDefensiveSuiteService.audit_software_supply_chain()
            output_lines.append("=========================================================================")
            output_lines.append("  CYVANTIS SOFTWARE SUPPLY CHAIN AUDITOR")
            output_lines.append("=========================================================================")
            output_lines.append(f"  Manifests:            {', '.join(res['manifests_analyzed'])}")
            output_lines.append(f"  Health Score:         {res['supply_chain_health_score']} / 100 ({res['grade']})")
            output_lines.append("\n  --- Typosquat Packages ---")
            for t in res.get("typosquat_packages", []):
                output_lines.append(f"  * {t['name']} v{t['version']}: {t['status']}")
            output_lines.append("\n  --- AST Vulnerabilities ---")
            for v in res.get("static_code_vulnerabilities", []):
                output_lines.append(f"  * {v['file']}: {v['rule_id']}")
            output_lines.append("=========================================================================")

        elif base_cmd == "fuzzing":
            res = OffensiveDefensiveSuiteService.get_fuzzing_campaign_status()
            m = res["metrics"]
            output_lines.append("=========================================================================")
            output_lines.append("  CYVANTIS ZERO-DAY HUNTER - AFL++ / JAZZER TELEMETRY")
            output_lines.append("=========================================================================")
            output_lines.append(f"  Campaign:             {res['campaign_name']}")
            output_lines.append(f"  Binary:               {res['target_binary']}")
            output_lines.append(f"  Engine:               {res['fuzzer_engine']}")
            output_lines.append(f"  Execs / Sec:          {m['execs_per_second']:,} execs/s")
            output_lines.append(f"  Branch Coverage:      {m['branch_coverage_pct']}%")
            output_lines.append(f"  Unique Crashes:       {m['unique_crashes']} | Hangs: {m['unique_hangs']}")
            for c in res.get("critical_crash_dumps", []):
                output_lines.append(f"  * {c['crash_id']} [{c['signal']}]: {c['type']}")
            output_lines.append("=========================================================================")

        elif base_cmd == "playbook":
            steps = parts[1:] if len(parts) > 1 else [
                "Phish Employee Credential via Impersonation",
                "Extract LSASS Memory via Mimikatz",
                "Execute Lateral Movement via WMI Remoting",
                "Exfiltrate Active Directory NTDS.dit"
            ]
            res = OffensiveDefensiveSuiteService.simulate_attack_playbook(steps)
            output_lines.append("=========================================================================")
            output_lines.append("  CYVANTIS ATTACK PLAYBOOK SIMULATOR")
            output_lines.append("=========================================================================")
            output_lines.append(f"  Stages Simulated:     {res['playbook_length']}")
            output_lines.append(f"  Final Threat Score:   {res['final_threat_score']} / 100")
            for st in res.get("simulated_trace", []):
                output_lines.append(f"  Stage {st['stage']}: {st['action']} [{st['mitre_tactic']}] -> {st['cumulative_threat']}/100")
            output_lines.append(f"\n  Containment Advisory: {res['containment_recommendation']}")
            output_lines.append("=========================================================================")

        elif base_cmd == "threat-actor":
            act = parts[1].upper() if len(parts) > 1 else "APT29"
            res = OffensiveDefensiveSuiteService.get_threat_actor_profile(act)
            output_lines.append("=========================================================================")
            output_lines.append(f"  CYVANTIS THREAT ACTOR DOSSIER - {res['name'].upper()}")
            output_lines.append("=========================================================================")
            output_lines.append(f"  Origin:               {res['origin']}")
            output_lines.append(f"  Motivation:           {res['motivation']}")
            output_lines.append(f"  Targeted Sectors:     {', '.join(res['targeted_sectors'])}")
            output_lines.append(f"  Primary Toolset:      {', '.join(res.get('primary_toolset', []))}")
            output_lines.append("\n  MITRE ATT&CK TTPs:")
            for ttp in res.get("mitre_ttps", []):
                output_lines.append(f"  * {ttp['id']:<10} {ttp['name']}")
            output_lines.append("=========================================================================")

        elif base_cmd == "redteam":
            res = OffensiveDefensiveSuiteService.generate_red_team_report("CYVANTIS Enterprise Red Team Assessment")
            output_lines.append("=========================================================================")
            output_lines.append(f"  CYVANTIS RED TEAM ASSESSMENT REPORT")
            output_lines.append("=========================================================================")
            output_lines.append(f"  Title:                {res['title']}")
            output_lines.append(f"  Total Findings:       {res['total_findings']} (Critical: {res['critical_count']}, High: {res['high_count']})")
            output_lines.append("  Status:               Full Markdown report generated & preview ready")
            output_lines.append("=========================================================================")
            output_lines.extend(res["report_markdown"].splitlines()[:25])
            output_lines.append("  [... Report continues - Use 'cyvantis redteam --output report.md' for full export ...]")

        else:
            output_lines.append(f"[-] Command not recognized: '{cmd_str}'. Type 'help' for available commands.")
            status_str = "error"

    except Exception as e:
        output_lines.append(f"[-] Error executing CLI command: {str(e)}")
        status_str = "error"

    # Audit log entry for WEB CLI execution
    audit = AuditLog(
        timestamp=datetime.datetime.utcnow(),
        user_id=current_user.id,
        username=current_user.username,
        action="WEB_CLI_EXECUTE",
        resource="WebConsole",
        details=f"Executed Web CLI command: {cmd_str}"
    )
    db.add(audit)
    db.commit()

    return {
        "command": cmd_str,
        "output": "\n".join(output_lines),
        "status": status_str,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
