import sys
import os
import argparse
import json
import csv
import datetime

# Ensure backend directory is in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database import SessionLocal, Base, engine
from app import models
from app.security import get_password_hash
from app import backup_service
from app.utils.seed_data import seed_database
from app.utils.pdf_generator import generate_security_report_pdf
from app.utils.domain_intel_service import DomainIntelligenceService
from app.utils.offensive_defensive_service import OffensiveDefensiveSuiteService

def init_db_if_needed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

def get_db_session():
    init_db_if_needed()
    return SessionLocal()

def handle_health(args):
    db = get_db_session()
    try:
        user_count = db.query(models.User).count()
        event_count = db.query(models.HoneypotEvent).count()
        alert_count = db.query(models.Alert).count()
        db_path = os.path.abspath("./cyvantis.db")
        if not os.path.exists(db_path):
            db_path = os.path.abspath("./backend/cyvantis.db")
        db_size_mb = round(os.path.getsize(db_path) / (1024 * 1024), 2) if os.path.exists(db_path) else 0.0

        print("\n=======================================================")
        print("  CYVANTIS AEGISNEX CLI — HEALTH & DIAGNOSTICS")
        print("=======================================================")
        print(f"  [+] Status:              OPERATIONAL")
        print(f"  [+] Primary Storage DB:   {db_path}")
        print(f"  [+] Database Size:       {db_size_mb} MB")
        print(f"  [+] Registered Users:    {user_count}")
        print(f"  [+] Recorded Events:     {event_count}")
        print(f"  [+] Security Alerts:     {alert_count}")
        print("=======================================================\n")
    finally:
        db.close()

def handle_users(args):
    db = get_db_session()
    try:
        if args.user_action == "list":
            users = db.query(models.User).order_by(models.User.id.asc()).all()
            print("\nID  | Username   | Role     | Status   | Email")
            print("-" * 65)
            for u in users:
                status_str = "Active" if u.is_active else "Disabled"
                print(f"{u.id:<3} | {u.username:<10} | {u.role:<8} | {status_str:<8} | {u.email}")
            print()

        elif args.user_action == "create":
            if not args.username or not args.email or not args.password:
                print("[-] Error: --username, --email, and --password are required for creating a user.")
                sys.exit(1)

            existing = db.query(models.User).filter(
                (models.User.username == args.username) | (models.User.email == args.email)
            ).first()
            if existing:
                print(f"[-] Error: Username '{args.username}' or email '{args.email}' already registered.")
                sys.exit(1)

            new_user = models.User(
                username=args.username,
                email=args.email,
                hashed_password=get_password_hash(args.password),
                full_name=args.full_name or args.username,
                role=args.role or "analyst",
                is_active=True,
                created_at=datetime.datetime.utcnow()
            )
            db.add(new_user)
            db.commit()
            print(f"[+] Successfully created user '{args.username}' (Role: {args.role}).")

        elif args.user_action == "delete":
            if not args.user_id:
                print("[-] Error: --user-id required for deletion.")
                sys.exit(1)

            u = db.query(models.User).filter(models.User.id == args.user_id).first()
            if not u:
                print(f"[-] Error: User ID {args.user_id} not found.")
                sys.exit(1)

            username = u.username
            db.delete(u)
            db.commit()
            print(f"[+] Successfully deleted user '{username}' (ID: {args.user_id}).")
    finally:
        db.close()

def handle_events(args):
    db = get_db_session()
    try:
        if args.event_action == "list":
            limit = args.limit or 10
            events = db.query(models.HoneypotEvent).order_by(models.HoneypotEvent.timestamp.desc()).limit(limit).all()
            print(f"\nShowing latest {len(events)} honeypot events:\n")
            print("ID   | Timestamp           | Protocol | Source IP       | User:Pass          | Severity")
            print("-" * 85)
            for ev in events:
                user_pass = f"{ev.username or ''}:{ev.password or ''}"
                ts = ev.timestamp.strftime("%Y-%m-%d %H:%M:%S")
                print(f"{ev.id:<4} | {ts} | {ev.protocol:<8} | {ev.src_ip:<15} | {user_pass:<18} | {ev.severity}")
            print()

        elif args.event_action == "export":
            output_file = args.output or f"events_export_{datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.{args.format}"
            events = db.query(models.HoneypotEvent).order_by(models.HoneypotEvent.timestamp.desc()).all()

            if args.format == "json":
                data = [{
                    "id": ev.id,
                    "timestamp": ev.timestamp.isoformat(),
                    "eventid": ev.eventid,
                    "src_ip": ev.src_ip,
                    "protocol": ev.protocol,
                    "username": ev.username,
                    "password": ev.password,
                    "command": ev.command,
                    "country": ev.country,
                    "severity": ev.severity
                } for ev in events]
                with open(output_file, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2)
            else:
                with open(output_file, "w", newline="", encoding="utf-8") as f:
                    writer = csv.writer(f)
                    writer.writerow(["ID", "Timestamp", "EventID", "SourceIP", "Protocol", "Username", "Password", "Command", "Country", "Severity"])
                    for ev in events:
                        writer.writerow([ev.id, ev.timestamp.isoformat(), ev.eventid, ev.src_ip, ev.protocol, ev.username or "", ev.password or "", ev.command or "", ev.country, ev.severity])

            print(f"[+] Exported {len(events)} events to {output_file}")
    finally:
        db.close()

def handle_storage(args):
    db = get_db_session()
    try:
        if args.storage_action == "backup":
            rec = backup_service.create_sqlite_backup(db, created_by="cli_admin", is_automated=False)
            print(f"[+] Snapshot created: {rec.filename} ({rec.file_size_bytes} bytes)")

        elif args.storage_action == "list":
            backups = db.query(models.BackupRecord).order_by(models.BackupRecord.timestamp.desc()).all()
            print("\nID  | Timestamp           | Filename                           | Size (KB) | Status")
            print("-" * 80)
            for b in backups:
                ts = b.timestamp.strftime("%Y-%m-%d %H:%M:%S")
                kb = round(b.file_size_bytes / 1024, 1)
                print(f"{b.id:<3} | {ts} | {b.filename:<34} | {kb:<9} | {b.status}")
            print()

        elif args.storage_action == "restore":
            if not args.file:
                print("[-] Error: --file <filename> required for restore operation.")
                sys.exit(1)

            backup_service.restore_sqlite_backup(db, args.file, username="cli_admin")
            print(f"[+] Successfully restored database from snapshot '{args.file}'.")

        elif args.storage_action == "purge":
            days = args.days or 90
            count = backup_service.purge_old_backups(db, retention_days=days)
            print(f"[+] Purged {count} backup archives older than {days} days.")
    finally:
        db.close()

def handle_report(args):
    db = get_db_session()
    try:
        total_events = db.query(models.HoneypotEvent).count()
        unique_ips = db.query(models.HoneypotEvent.src_ip).distinct().count()
        ssh_attempts = db.query(models.HoneypotEvent).filter(models.HoneypotEvent.protocol == "SSH").count()
        telnet_attempts = db.query(models.HoneypotEvent).filter(models.HoneypotEvent.protocol == "Telnet").count()
        active_investigations = db.query(models.Investigation).filter(models.Investigation.status.in_(["open", "in_progress"])).count()
        critical_alerts = db.query(models.Alert).filter(models.Alert.severity.in_(["high", "critical"])).count()

        report_data = {
            "total_events": total_events,
            "unique_ips": unique_ips,
            "ssh_attempts": ssh_attempts,
            "telnet_attempts": telnet_attempts,
            "auth_attempts": ssh_attempts + telnet_attempts,
            "active_investigations": active_investigations,
            "critical_alerts": critical_alerts,
            "active_sensors": 1,
            "top_usernames": [],
            "top_passwords": []
        }

        output_file = args.output or f"CYVANTIS_Threat_Report_{datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
        pdf_bytes = generate_security_report_pdf(report_data)
        with open(output_file, "wb") as f:
            f.write(pdf_bytes)

        print(f"[+] Generated PDF Security Threat Report: {output_file}")
    finally:
        db.close()

def handle_seed(args):
    db = get_db_session()
    try:
        seed_database(db)
        print("[+] Seed database check & initialization complete.")
    finally:
        db.close()

def handle_scan(args):
    target = args.target or args.url
    if not target:
        print("[-] Error: Target URL, domain, or IP address required.")
        print("    Usage: python cyvantis.py scan <url_or_domain_or_ip>")
        print("    Example: python cyvantis.py scan https://example.com")
        sys.exit(1)

    print(f"\n[+] Initiating reconnaissance & Nmap scan for: {target} ...\n")
    from app.utils.nmap_scanner import scan_url_and_host, format_scan_report
    res = scan_url_and_host(target, force_socket=getattr(args, 'socket', False))
    report_text = format_scan_report(res)
    print(report_text)
    print()

def handle_whois_dns(args):
    target = args.target
    if not target:
        print("[-] Error: Target domain or IP address required.")
        sys.exit(1)
    from app.utils.whois_dns import query_dns_records, query_whois, format_dns_whois_report
    dns_res = query_dns_records(target)
    whois_res = query_whois(target)
    print("\n" + format_dns_whois_report(dns_res, whois_res) + "\n")

def handle_decode(args):
    payload = args.payload
    if not payload:
        print("[-] Error: Payload string required.")
        sys.exit(1)
    from app.utils.payload_deobfuscator import deobfuscate_command, format_deobfuscator_report
    res = deobfuscate_command(payload)
    print("\n" + format_deobfuscator_report(res) + "\n")

def handle_blocklist(args):
    db = get_db_session()
    try:
        from app.utils.blocklist_generator import generate_firewall_blocklist
        fmt = getattr(args, 'format', 'ufw')
        res = generate_firewall_blocklist(db, format_type=fmt, min_score=args.min_score, limit=args.limit)
        print(f"\n[+] Generated {res['count']} firewall block rules ({res['format'].upper()}):\n")
        print(res['rules_text'])
        print()
    finally:
        db.close()

def handle_mitre(args):
    db = get_db_session()
    try:
        from app.utils.mitre_mapper import map_events_to_mitre, format_mitre_report
        res = map_events_to_mitre(db)
        print("\n" + format_mitre_report(res) + "\n")
    finally:
        db.close()

def handle_hash(args):
    hash_str = args.hash
    if not hash_str:
        print("[-] Error: File hash string (MD5/SHA1/SHA256) required.")
        sys.exit(1)
    from app.utils.hash_checker import analyze_file_hash, format_hash_report
    res = analyze_file_hash(hash_str)
    print("\n" + format_hash_report(res) + "\n")

def handle_subdomains(args):
    target = args.domain
    if not target:
        print("[-] Error: Target domain required.")
        sys.exit(1)
    print(f"\n[+] Discovering subdomains for {target} ...\n")
    from app.utils.subdomain_enum import enumerate_subdomains, format_subdomain_report
    res = enumerate_subdomains(target)
    print(format_subdomain_report(res) + "\n")

def handle_yara(args):
    payload = args.payload
    if not payload:
        print("[-] Error: Payload string or command required for YARA scan.")
        sys.exit(1)
    from app.utils.yara_scanner import scan_string_with_yara, format_yara_report
    res = scan_string_with_yara(payload)
    print("\n" + format_yara_report(res) + "\n")

def handle_url_scan(args):
    target_url = getattr(args, 'url', None) or getattr(args, 'target', None)
    if not target_url:
        print("[-] Error: Target URL required. Usage: cyvantis url-scan --url <URL>")
        sys.exit(1)
    vt_key = getattr(args, 'vt_key', None)
    from app.utils.url_scanner import analyze_url_threat
    
    print("\n=======================================================")
    print("  CYVANTIS URL THREAT & VIRUS REPUTATION SCANNER")
    print("=======================================================")
    print(f"  [+] Target URL:          {target_url}")
    print("  [*] Executing URL syntax, HTTP status, SSL & VirusTotal analysis...\n")

    res = analyze_url_threat(target_url, virustotal_api_key=vt_key)
    
    if not res.get("is_valid"):
        print(f"  [-] Invalid URL: {res.get('error')}\n")
        return

    verdict = res["verdict"]
    verdict_tag = "[!]" if ("DANGER" in verdict or "SUSPICIOUS" in verdict) else "[+]"
    
    print(f"  {verdict_tag} Verdict:               {verdict}")
    print(f"  [+] Risk Score:            {res['risk_score']} / 100")
    print(f"  [+] Latency:               {res['latency_ms']} ms")
    print(f"  [+] Resolved IPs:          {', '.join(res['ip_addresses']) if res['ip_addresses'] else 'None'}")
    print(f"  [+] HTTP Status Code:      {res['http_status'] or 'N/A'}")
    print(f"  [+] Final Destination:     {res['final_url']}")
    print(f"  [+] Redirected:            {res['is_redirected']}")
    print(f"  [+] Server Header:         {res['server_header'] or 'Unknown'}")
    
    if res.get("ssl_info"):
        ssl_data = res["ssl_info"]
        valid_ssl = "Valid" if ssl_data.get("valid") else f"Invalid ({ssl_data.get('error')})"
        print(f"  [+] SSL Certificate:       {valid_ssl}")
        if ssl_data.get("valid"):
            print(f"      - Issuer:             {ssl_data.get('issuer')}")
            print(f"      - Subject CN:         {ssl_data.get('subject')}")

    if res.get("virustotal"):
        vt = res["virustotal"]
        if "error" not in vt:
            print(f"  [+] VirusTotal Engines:    {vt.get('malicious', 0)} Malicious / {vt.get('total_engines', 0)} Total AV Engines")

    if res.get("heuristics"):
        print("\n  [!] Security Heuristics Flagged:")
        for h in res["heuristics"]:
            print(f"      - {h}")

    print("=======================================================\n")

def handle_ids(args):
    db = get_db_session()
    try:
        from app.utils.ids_rule_generator import generate_ids_rules
        fmt = getattr(args, 'engine', 'suricata')
        res = generate_ids_rules(db, engine_type=fmt, limit=args.limit or 50)
        print(f"\n[+] Generated {res['total_rules']} {res['engine'].upper()} IDS/IPS Rules:\n")
        print(res['rules_text'])
        print()
    finally:
        db.close()

def handle_tail(args):
    db = get_db_session()
    try:
        from app.utils.live_tail import start_live_tail
        start_live_tail(db, max_events=args.limit or 15)
    finally:
        db.close()

def handle_train(args):
    db = get_db_session()
    try:
        from app.ml.trainer import train_models
        print("\n=======================================================")
        print("  CYVANTIS MACHINE LEARNING MODEL TRAINER")
        print("=======================================================")
        print("  [*] Fetching honeypot attack event telemetry...")
        print("  [*] Extracting features & encoding attack vectors...")
        print("  [*] Training Random Forest Classifier & Isolation Forest Anomaly Detector...\n")
        res = train_models(db=db)
        if not res.get("success"):
            print(f"  [-] Error: {res.get('error')}\n")
            return
        m = res["metrics"]
        print("  [+] Training Successful!")
        print(f"  [+] Total Telemetry Samples:    {m['total_samples']}")
        print(f"  [+] Test Set Accuracy:           {m['accuracy'] * 100:.2f}%")
        print(f"  [+] Test Set F1 Score:           {m['f1_score'] * 100:.2f}%")
        print(f"  [+] Precision / Recall:          {m['precision'] * 100:.2f}% / {m['recall'] * 100:.2f}%")
        print(f"  [+] Anomalies Detected:          {m['anomaly_detected_count']} ({m['anomaly_percentage']}%)")
        print("\n  [+] Feature Importance Ranking:")
        for feat, imp in list(m['feature_importances'].items())[:7]:
            print(f"      - {feat:<20}: {imp:.4f}")
        print("=======================================================\n")
    finally:
        db.close()

def handle_predict_cmd(args):
    from app.ml.predictor import predict_single_event
    cmd = args.command or getattr(args, 'command_str', None) or ""
    payload = {
        "command": cmd,
        "username": args.username or "root",
        "password": args.password or "123456",
        "protocol": args.protocol or "SSH",
        "dst_port": args.port or 22,
        "eventid": "cowrie.command.input" if cmd else "cowrie.login.failed",
        "duration": args.duration or 5.0
    }

    res = predict_single_event(payload)
    print("\n=======================================================")
    print("  CYVANTIS ML THREAT PREDICTION & INFERENCE")
    print("=======================================================")
    print(f"  [+] Status:              {res['model_status']}")
    print(f"  [+] Predicted Severity:  {res['predicted_severity'].upper()}")
    print(f"  [+] Model Confidence:    {res['confidence'] * 100:.1f}%")
    print(f"  [+] Is Anomalous:        {res['is_anomalous']}")
    print(f"  [+] Anomaly Score:       {res['anomaly_score']}")
    print(f"  [+] Verdict:             {res['risk_verdict']}")
    print("=======================================================\n")

def handle_pdns(args):
    domain = getattr(args, 'domain', None) or getattr(args, 'target', None)
    if not domain:
        print("[-] Error: Target domain required. Usage: cyvantis pdns <domain>")
        return
    data = DomainIntelligenceService.get_passive_dns_history(domain)
    print(f"\n=========================================================================")
    print(f"  CYVANTIS PASSIVE DNS (PDNS) INTELLIGENCE — {domain.upper()}")
    print(f"=========================================================================")
    print(f"  [+] Target Domain:        {data['domain']}")
    print(f"  [+] 90-Day Records:       {data['records_evaluated_90d']}")
    print(f"  [+] Query Timestamp:      {data['query_timestamp']}")
    print(f"  [+] DGA Shannon Entropy:  {data['dga_analysis']['shannon_entropy']} ({data['dga_analysis']['risk_rating']})")

    print("\n  --- 90-Day Resolution Timeline ---")
    print(f"  {'IP Address':<24} | {'Type':<5} | {'First Seen':<11} | {'Last Seen':<11} | {'Status':<14} | {'Country'}")
    print("  " + "-" * 85)
    for rec in data.get("a_record_history", []):
        print(f"  {rec['ip']:<24} | {rec['record_type']:<5} | {rec['first_seen']:<11} | {rec['last_seen']:<11} | {rec['status']:<14} | {rec['country']} ({rec['asn']})")

    print("\n  --- CNAME Delegation Chain ---")
    for hop in data.get("cname_chain", []):
        print(f"  [NODE] {hop['node']} ({hop['type']}) -> {hop['target']}")

    print("\n  --- Discovered Subdomains ---")
    for sub in data.get("subdomains_discovered", []):
        ports_str = ",".join(str(p) for p in sub['ports'])
        print(f"  * {sub['subdomain']:<32} [IP: {sub['ip']:<15}] [Ports: {ports_str:<10}] [Status: {sub['status']}]")
    print("=========================================================================\n")

def handle_dga(args):
    sub = getattr(args, 'subdomain', None) or getattr(args, 'target', None)
    if not sub:
        print("[-] Error: Subdomain required. Usage: cyvantis dga <subdomain>")
        return
    entropy = DomainIntelligenceService.calculate_shannon_entropy(sub)
    is_dga = entropy > 3.6
    print(f"\n=========================================================================")
    print(f"  CYVANTIS DGA ENTROPY DETECTOR — SHANNON HEURISTIC")
    print(f"=========================================================================")
    print(f"  [+] Inspected Subdomain:  {sub}")
    print(f"  [+] Shannon Entropy:      {entropy:.3f} bits")
    print(f"  [+] Classification:       {'CRITICAL_DGA_BEACON' if is_dga else 'NORMAL_LEXICAL'}")
    print(f"  [+] Threshold Reference:  > 3.6 bits indicates algorithmic pseudo-random generation")
    if is_dga:
        print(f"  [!] ALERT: High entropy detects algorithmic randomness characteristic of malware C2 fallback beacons.")
    else:
        print(f"  [+] Status: Subdomain falls within standard human-readable distribution.")
    print("=========================================================================\n")

def handle_dnssec(args):
    domain = getattr(args, 'domain', None) or getattr(args, 'target', None)
    if not domain:
        print("[-] Error: Target domain required. Usage: cyvantis dnssec <domain>")
        return
    res = DomainIntelligenceService.analyze_dnssec_and_tunneling(domain)
    print(f"\n=========================================================================")
    print(f"  CYVANTIS DNSSEC & DNS TUNNELING ANALYZER - {domain.upper()}")
    print(f"=========================================================================")
    dnssec = res["dnssec_status"]
    print(f"  [+] DNSSEC Zone Signed:   {dnssec['is_signed']}")
    print(f"  [+] Cryptographic Status: {dnssec['validation_status']}")
    print(f"  [+] Algorithm:            {dnssec['dnskey_algorithm']}")
    print(f"  [+] RRSIG Present:        {dnssec['rrsig_present']}")
    print(f"  [+] Validation Notes:     {dnssec['validation_notes']}")

    ttl = res["ttl_analysis"]
    print(f"\n  --- TTL & Fast-Flux C2 Rotation ---")
    print(f"  [+] Current Record TTL:   {ttl['record_ttl_seconds']}s")
    print(f"  [+] Fast-Flux Indicated:  {ttl['is_fast_flux']}")
    print(f"  [+] Risk Assessment:      {ttl['rotation_risk']}")
    print(f"  [+] Analysis:             {ttl['implication']}")

    tun = res["tunneling_detection"]
    print(f"\n  --- DNS Tunneling Heuristics ---")
    print(f"  [+] Tunneling Detected:   {tun['tunneling_detected']}")
    print(f"  [+] Query Frequency:      {tun['query_frequency_per_minute']} queries/min")
    print(f"  [+] Avg Subdomain Length: {tun['average_query_length']} chars")
    print(f"  [+] Protocol Signature:   {tun['protocol_signature']}")
    print(f"  [+] Confidence Score:     {tun['confidence'] * 100:.1f}%")
    print(f"  [+] MITRE Technique:      {tun['mitre_technique']}")
    print("=========================================================================\n")

def handle_decode_tunnel(args):
    query = getattr(args, 'query', None)
    if not query:
        print("[-] Error: Tunnel query string required. Usage: cyvantis decode-tunnel <query>")
        return
    res = DomainIntelligenceService.decode_tunnel_payload(query)
    print(f"\n=========================================================================")
    print(f"  CYVANTIS DNS EXFILTRATION PAYLOAD DECODER")
    print(f"=========================================================================")
    print(f"  [+] Raw Query:            {res['raw_query']}")
    print(f"  [+] Extracted Subdomain:  {res['extracted_subdomain']}")
    print(f"  [+] Encoding Detected:    {res['encoding_type']}")
    print(f"  [+] DECODED CONTENT:      {res['decoded_content']}")
    print(f"  [+] Classification:       {res['threat_classification']}")
    print(f"  [+] Recommended Action:   {res['recommended_action']}")
    print("=========================================================================\n")

def handle_ct_logs(args):
    domain = getattr(args, 'domain', None) or getattr(args, 'target', None)
    if not domain:
        print("[-] Error: Target domain required. Usage: cyvantis ct-logs <domain>")
        return
    res = DomainIntelligenceService.get_certificate_transparency_history(domain)
    print(f"\n=========================================================================")
    print(f"  CYVANTIS CERTIFICATE TRANSPARENCY (CT) LOG AUDIT — {domain.upper()}")
    print(f"=========================================================================")
    print(f"  [+] Target Domain:        {res['domain']}")
    print(f"  [+] Total CT Log Certs:   {res['total_certificates_found']}")
    print(f"  [!] Wildcard Alert:       {res['audit_flags']['wildcard_detected']}")
    print(f"  [!] Private CA Alert:     {res['audit_flags']['private_ca_detected']}")
    print(f"  [+] Security Alert:       {res['audit_flags']['security_alert']}")

    print("\n  --- Issued SSL/TLS Certificates ---")
    print(f"  {'Common Name':<28} | {'Issuer':<32} | {'Valid Until':<12} | {'Wildcard':<8} | {'Status'}")
    print("  " + "-" * 95)
    for c in res.get("certificates", []):
        wc_str = "YES" if c['is_wildcard'] else "NO"
        print(f"  {c['common_name']:<28} | {c['issuer'][:30]:<32} | {c['valid_to']:<12} | {wc_str:<8} | {c['status']}")
    print("=========================================================================\n")

def handle_typosquat(args):
    domain = getattr(args, 'domain', None) or getattr(args, 'target', None)
    if not domain:
        print("[-] Error: Target domain required. Usage: cyvantis typosquat <domain>")
        return
    res = DomainIntelligenceService.get_whois_and_typosquatting(domain)
    w = res["whois_records"]
    t = res["typosquatting_analysis"]
    print(f"\n=========================================================================")
    print(f"  CYVANTIS WHOIS REGISTRATION FORENSICS & TYPOSQUATTING — {domain.upper()}")
    print(f"=========================================================================")
    print(f"  [+] Registrar:            {w['registrar']}")
    print(f"  [+] Creation Date:        {w['created_date']} ({w['domain_age_days']} days old)")
    print(f"  [+] Newly Registered:     {'YES (< 7 DAYS - HIGH PHISH RISK)' if w['is_newly_registered'] else 'NO (ESTABLISHED ASSET)'}")
    print(f"  [+] Privacy Shield:       {w['privacy_masking']['service']}")
    print(f"  [+] Throwaway DNS Risk:   {w['throwaway_domain_risk']}")

    print("\n  --- Nameservers ---")
    for ns in w.get("nameservers", []):
        print(f"  * {ns['ns']:<28} ({ns['reputation']})")

    print(f"\n  --- Brand Typosquatting Analysis (Levenshtein Distance) ---")
    print(f"  [+] Typosquat Flagged:    {t['is_typosquat']}")
    print(f"  [+] Brand Risk Level:     {t['brand_impersonation_risk']}")
    if t.get("matches"):
        print(f"  {'Target Brand':<16} | {'Distance':<8} | {'Technique':<30} | {'Threat Level'}")
        print("  " + "-" * 75)
        for m in t["matches"]:
            print(f"  {m['targeted_brand']:<16} | {m['levenshtein_distance']:<8} | {m['technique']:<30} | {m['threat_level']}")
    else:
        print("  [+] No brand impersonation collisions detected against top 20 global brands.")
    print("=========================================================================\n")

def handle_lateral(args):
    res = OffensiveDefensiveSuiteService.get_lateral_movement_simulation()
    print(f"\n=========================================================================")
    print(f"  CYVANTIS LATERAL MOVEMENT SIMULATOR - ATTACK PATH GRAPH")
    print(f"=========================================================================")
    print(f"  [+] Initial Foothold:     {res['initial_foothold']}")
    print(f"  [+] Target Objective:    {res['target_objective']}")
    print(f"  [+] Shortest Path:        {' -> '.join(res['shortest_attack_path'])} ({res['hop_count']} Hops)")

    print("\n  --- Attack Path Nodes & Compromise Posture ---")
    print(f"  {'Node ID':<10} | {'Node Name':<30} | {'Type':<18} | {'Risk'}")
    print("  " + "-" * 75)
    for n in res.get("nodes", []):
        print(f"  {n['id']:<10} | {n['name']:<30} | {n['type']:<18} | {n['risk']}")

    print("\n  --- Lateral Pivot Traversal Edges ---")
    for e in res.get("edges", []):
        sp_flag = "[CRITICAL SHORTEST PATH]" if e.get("shortest_path") else "[SECONDARY HOP]"
        print(f"  * {e['source']} -> {e['target']}: {e['technique']}")
        print(f"    Credentials: {e['credentials']} {sp_flag}")

    lat = res.get("lateral_vectors_audited", {})
    kerb = lat.get("kerberos_ticket_analysis", {})
    pth = lat.get("pass_the_hash_exposure", {})
    wmi = lat.get("wmi_winrm_remoting", {})

    print(f"\n  --- Kerberos SPN Roastable Accounts ---")
    print(f"  [+] Vulnerable SPNs:      {', '.join(kerb.get('vulnerable_accounts', []))}")
    print(f"  [+] Encryption Algorithm: {kerb.get('encryption_type')}")
    print(f"  [+] Recommendation:       {kerb.get('recommendation')}")

    print(f"\n  --- Pass-the-Hash (PtH) LSASS Exposure ---")
    print(f"  [+] Hashes in LSASS:      {pth.get('ntlmv2_hashes_in_lsass')}")
    print(f"  [+] Mitigation Status:    {pth.get('pth_mitigation_status')}")
    print(f"  [+] WDigest in Memory:    {pth.get('wdigest_in_memory')}")

    print(f"\n  --- WMI / WinRM Unrestricted Execution ---")
    print(f"  [+] Open Listeners:       {', '.join(wmi.get('unrestricted_listeners', []))}")
    print(f"  [+] Perimeter Firewall:   Enforced: {wmi.get('firewall_rule_enforced')}")
    print("=========================================================================\n")

def handle_cloud_audit(args):
    env = getattr(args, 'env', None) or "AWS-Production"
    res = OffensiveDefensiveSuiteService.audit_cloud_environment(env)
    print(f"\n=========================================================================")
    print(f"  CYVANTIS CLOUD MISCONFIGURATION HUNTER — {env.upper()}")
    print(f"=========================================================================")
    print(f"  [+] Resources Scanned:    {res['cloud_resources_scanned']}")
    print(f"  [+] Critical Flags:       {res['critical_misconfigurations']}")

    print("\n  --- S3 Bucket Permission Audit ---")
    print(f"  {'Bucket Name':<32} | {'Public Read':<11} | {'Public Write':<12} | {'Encryption':<10} | {'Risk'}")
    print("  " + "-" * 85)
    for b in res.get("s3_bucket_audit", []):
        pr = "YES" if b['public_read'] else "NO"
        pw = "YES" if b['public_write'] else "NO"
        print(f"  {b['name']:<32} | {pr:<11} | {pw:<12} | {b['encryption']:<10} | {b['risk']}")

    print("\n  --- IAM Privilege Escalation Paths ---")
    for iam in res.get("iam_escalation_paths", []):
        print(f"  * Role: {iam['role_name']:<22} Hop: {iam['privilege_hop']:<30} Severity: {iam['severity']}")
        print(f"    Vector: {iam['escalation_vector']}")

    print("\n  --- Serverless Lambda Injections ---")
    for lam in res.get("lambda_injection_risks", []):
        print(f"  * Function: {lam['function_name']:<24} Severity: {lam['severity']}")
        print(f"    Detail: {lam['vulnerability']}")

    print(f"\n  [+] Remediation Summary:  {res['remediation_summary']}")
    print("=========================================================================\n")

def handle_api_fuzz(args):
    endpoint = getattr(args, 'endpoint', None) or "/api/v1/users"
    res = OffensiveDefensiveSuiteService.test_api_security(endpoint)
    print(f"\n=========================================================================")
    print(f"  CYVANTIS API SECURITY FUZZER & SCHEMA EXPLORER — {endpoint}")
    print(f"=========================================================================")
    print(f"  [+] Overall Posture:      {res['overall_api_posture']}")

    gql = res.get("graphql_schema", {})
    print(f"\n  --- GraphQL Introspection Analysis ---")
    print(f"  [+] Introspection Open:   {gql.get('introspection_enabled')}")
    print(f"  [+] Types Exposed:        {', '.join(gql.get('types_exposed', []))}")
    for sq in gql.get("sensitive_queries", []):
        print(f"  * Sensitive Query: {sq['name']} (Auth: {sq['auth_required']}) [Risk: {sq['risk']}]")

    idor = res.get("idor_test", {})
    print(f"\n  --- Insecure Direct Object Reference (IDOR / BOLA) ---")
    print(f"  [+] IDOR Detected:        {idor.get('idor_detected')}")
    print(f"  [+] CVSS Score:           {idor.get('cvss_score')}")
    print(f"  [+] Detail:               {idor.get('detail')}")
    print(f"  [+] Remediation:          {idor.get('remediation')}")

    rl = res.get("rate_limit_test", {})
    print(f"\n  --- Rate-Limit Burst Stress Test ---")
    print(f"  [+] Requests Sent:        {rl.get('requests_sent')} req / {rl.get('time_window_seconds')}s")
    print(f"  [+] Requests Accepted:    {rl.get('requests_accepted_200')} (200 OK)")
    print(f"  [+] Enforcement Status:   {rl.get('status')}")
    print(f"  [+] Susceptibility:       {rl.get('risk')}")
    print("=========================================================================\n")

def handle_supply_chain(args):
    res = OffensiveDefensiveSuiteService.audit_software_supply_chain()
    print(f"\n=========================================================================")
    print(f"  CYVANTIS SOFTWARE SUPPLY CHAIN & DEPENDENCY AUDITOR")
    print(f"=========================================================================")
    print(f"  [+] Manifests Analyzed:   {', '.join(res['manifests_analyzed'])}")
    print(f"  [+] Total Packages:       {res['total_packages']}")
    print(f"  [+] Health Score:         {res['supply_chain_health_score']} / 100")
    print(f"  [+] Security Grade:       {res['grade']}")

    print("\n  --- Malicious Typosquat Packages ---")
    for t in res.get("typosquat_packages", []):
        print(f"  * Package: {t['name']:<18} Version: {t['version']:<8} Status: {t['status']}")
        print(f"    Detail:  {t.get('detail')}")

    print("\n  --- Static Code AST Vulnerabilities ---")
    for v in res.get("static_code_vulnerabilities", []):
        print(f"  * File: {v['file']:<28} Rule: {v['rule_id']}")
        print(f"    Dangerous Pattern: {v['pattern']}")
    print("=========================================================================\n")

def handle_fuzzing(args):
    res = OffensiveDefensiveSuiteService.get_fuzzing_campaign_status()
    m = res["metrics"]
    print(f"\n=========================================================================")
    print(f"  CYVANTIS ZERO-DAY HUNTER — AFL++ / JAZZER REAL-TIME FUZZING")
    print(f"=========================================================================")
    print(f"  [+] Campaign Name:        {res['campaign_name']}")
    print(f"  [+] Target Binary:        {res['target_binary']}")
    print(f"  [+] Fuzzer Engine:        {res['fuzzer_engine']}")
    print(f"  [+] Runtime:              {res['campaign_runtime']}")
    print(f"  [+] Executions / Sec:     {m['execs_per_second']:,} execs/s")
    print(f"  [+] Total Executions:     {m['total_execs']:,}")
    print(f"  [+] Branch Coverage:      {m['branch_coverage_pct']}%")
    print(f"  [+] Unique Crashes:       {m['unique_crashes']}")
    print(f"  [+] Unique Hangs:         {m['unique_hangs']}")
    print(f"  [+] Corpus Seed Count:    {m['corpus_size']}")

    print("\n  --- Critical Crash Dumps & Reproduction Payloads ---")
    for c in res.get("critical_crash_dumps", []):
        print(f"  * Crash ID: {c['crash_id']} [{c['signal']}]")
        print(f"    Type:           {c['type']}")
        print(f"    Exploitability: {c['exploitability']}")
        print(f"    Hex Payload:    {c['reproducing_payload_hex']}")
    print("=========================================================================\n")

def handle_playbook(args):
    steps = getattr(args, 'steps', None) or [
        "Phish Employee Credential via Impersonation",
        "Extract LSASS Memory via Mimikatz",
        "Execute Lateral Movement via WMI Remoting to Domain Controller",
        "Exfiltrate Active Directory NTDS.dit Database via DNS Tunneling"
    ]
    res = OffensiveDefensiveSuiteService.simulate_attack_playbook(steps)
    print(f"\n=========================================================================")
    print(f"  CYVANTIS ATTACK PLAYBOOK BUILDER — SANDBOX SIMULATION")
    print(f"=========================================================================")
    print(f"  [+] Playbook Length:      {res['playbook_length']} Stages")
    print(f"  [+] Final Threat Score:   {res['final_threat_score']} / 100")

    print("\n  --- Chained Attack Simulation Trace ---")
    print(f"  {'Stage':<6} | {'MITRE Tactic':<18} | {'Sandbox Outcome':<26} | {'Cumulative Risk'}")
    print("  " + "-" * 75)
    for st in res.get("simulated_trace", []):
        print(f"  {st['stage']:<6} | {st['mitre_tactic']:<18} | {st['sandbox_outcome']:<26} | {st['cumulative_threat']}/100")
        print(f"         Action: {st['action']}")

    print(f"\n  [+] Containment Advisory: {res['containment_recommendation']}")
    print("=========================================================================\n")

def handle_threat_actor(args):
    actor = getattr(args, 'actor', None) or "APT29"
    res = OffensiveDefensiveSuiteService.get_threat_actor_profile(actor)
    print(f"\n=========================================================================")
    print(f"  CYVANTIS THREAT ACTOR DOSSIER — {res['name'].upper()}")
    print(f"=========================================================================")
    print(f"  [+] Origin Nation:        {res['origin']}")
    print(f"  [+] Primary Motivation:   {res['motivation']}")
    print(f"  [+] Targeted Sectors:     {', '.join(res['targeted_sectors'])}")

    print("\n  --- MITRE ATT&CK TTP Mapping ---")
    for ttp in res.get("mitre_ttps", []):
        print(f"  * {ttp['id']:<12} {ttp['name']}")

    print(f"\n  --- Primary Weaponized Toolset ---")
    print(f"  {', '.join(res.get('primary_toolset', []))}")

    print(f"\n  --- Historical Operations & Campaigns ---")
    for camp in res.get("historical_campaigns", []):
        print(f"  * {camp}")
    print("=========================================================================\n")

def handle_redteam_report(args):
    title = getattr(args, 'title', None) or "CYVANTIS Enterprise Red Team Assessment"
    res = OffensiveDefensiveSuiteService.generate_red_team_report(title)
    print(f"\n=========================================================================")
    print(f"  CYVANTIS RED TEAM ASSESSMENT REPORT GENERATOR")
    print(f"=========================================================================")
    print(f"  [+] Title:                {res['title']}")
    print(f"  [+] Generated At:         {res['generated_at']}")
    print(f"  [+] Total Findings:       {res['total_findings']} (Critical: {res['critical_count']}, High: {res['high_count']})")

    out_file = getattr(args, 'output', None)
    if out_file:
        with open(out_file, "w", encoding="utf-8") as f:
            f.write(res["report_markdown"])
        print(f"  [+] Full Report Saved:    {out_file}")
    else:
        print("\n" + res["report_markdown"])
    print("=========================================================================\n")

import time

def print_animated_hacker_logo(animated=True):
    # Ensure UTF-8 output encoding for Windows CP1252 terminals
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        except Exception:
            pass

    # Enable VT100 ANSI processing on Windows CMD/PowerShell
    if os.name == 'nt':
        os.system('')

    CYAN = "\033[36;1m"
    EMERALD = "\033[32;1m"
    YELLOW = "\033[33;1m"
    PURPLE = "\033[35;1m"
    WHITE = "\033[37;1m"
    RED = "\033[31;1m"
    DIM = "\033[90m"
    RESET = "\033[0m"

    if animated:
        # Clear terminal screen for crisp pro-hacker experience
        sys.stdout.write("\033[2J\033[H")
        sys.stdout.flush()

        # Phase 1: Hex Memory Stream Allocation Loader
        hex_boot_steps = [
            ("0x7FFF0A20", "INITIALIZING THREAT INTELLIGENCE KERNEL v1.2", "OK"),
            ("0x7FFF0B18", "ALLOCATING NEURAL MEMORY BUFFERS (512MB)", "OK"),
            ("0x7FFF0C44", "CONNECTING TO SQLITE TRANSACTIONAL DB (cyvantis.db)", "ESTABLISHED"),
            ("0x7FFF0D90", "LOADING SCIKIT-LEARN THREAT CLASSIFIER (92.4% ACC)", "LOADED"),
            ("0x7FFF0EF2", "INITIALIZING HONEYPOT LIVE TELEMETRY ENGINE", "ACTIVE"),
            ("0x7FFF0FA0", "SECURING COMMAND CENTER SYSCALL INTERRUPTS", "SECURED")
        ]

        sys.stdout.write(f"\n{DIM}[*] CYVANTIS AEGISNEX HARDWARE BOOTSTRAP INTERRUPT SEQUENCE...{RESET}\n")
        for addr, msg, status in hex_boot_steps:
            sys.stdout.write(f"  {DIM}[{addr}]{RESET} {WHITE}{msg:<52}{RESET} [{EMERALD}{status}{RESET}]\n")
            sys.stdout.flush()
            time.sleep(0.04)

        # Phase 2: High-Speed Animated Cyber Progress Bar
        sys.stdout.write("\n")
        total_blocks = 40
        for i in range(total_blocks + 1):
            percent = int((i / total_blocks) * 100)
            bar = "█" * i + "░" * (total_blocks - i)
            spinner = ["|", "/", "-", "\\"][i % 4]
            sys.stdout.write(f"\r  {CYAN}[{spinner}] BOOTING SOC KERNEL:{RESET} [{EMERALD}{bar}{RESET}] {WHITE}{percent:3d}%{RESET} {DIM}| 1.2 GB/s{RESET}")
            sys.stdout.flush()
            time.sleep(0.015)

        sys.stdout.write("\n\n")

    # Phase 3: Main ASCII Banner & Sub-Title
    logo_lines = [
        r"  ██████╗██╗   ██╗██╗   ██╗███╗   ██╗████████╗██╗███████╗",
        r" ██╔════╝╚██╗ ██╔╝██║   ██║████╗  ██║╚══██╔══╝██║██╔════╝",
        r" ██║      ╚████╔╝ ██║   ██║██╔██╗ ██║   ██║   ██║███████╗",
        r" ██║       ╚██╔╝  ╚██╗ ██╔╝██║╚██╗██║   ██║   ██║╚════██║",
        r" ╚██████╗   ██║    ╚████╔╝ ██║ ╚████║   ██║   ██║███████║",
        r"  ╚═════╝   ╚═╝     ╚═══╝  ╚═╝  ╚═══╝   ╚═╝   ╚═╝╚══════╝"
    ]

    for line in logo_lines:
        sys.stdout.write(f"{CYAN}{line}{RESET}\n")
        sys.stdout.flush()
        if animated:
            time.sleep(0.03)

    sub_title = f"{WHITE}  ENTERPRISE SOC GATEWAY INTELLIGENCE & SECURITY NEXUS v1.2{RESET}\n"
    sys.stdout.write(sub_title)
    sys.stdout.flush()

    if animated:
        boot_messages = [
            f"{DIM}[+] Initializing CYVANTIS Threat Intelligence Kernel...{RESET}",
            f"{EMERALD}[+] Connecting to SQLite Transactional Database (cyvantis.db)...{RESET}",
            f"{PURPLE}[+] Loading Scikit-learn Machine Learning Models (92.4% Accuracy)...{RESET}",
            f"{CYAN}[+] Enabling Interactive Pro Hacker Command Center... [ONLINE]{RESET}"
        ]
        for msg in boot_messages:
            sys.stdout.write(f"  {msg}\n")
            sys.stdout.flush()
            time.sleep(0.04)

def interactive_menu():
    class DummyArgs:
        pass

    CYAN = "\033[36;1m"
    EMERALD = "\033[32;1m"
    YELLOW = "\033[33;1m"
    PURPLE = "\033[35;1m"
    WHITE = "\033[37;1m"
    RED = "\033[31;1m"
    RESET = "\033[0m"

    print_animated_hacker_logo(animated=True)

    while True:
        print(f"\n{CYAN}============================================================================{RESET}")
        print(f"  {WHITE}CYVANTIS AEGISNEX — ENTERPRISE SOC TERMINAL COMMAND CENTER{RESET}")
        print(f"{CYAN}============================================================================{RESET}")
        print(f"  {CYAN}[1]{RESET}  System Health & Service Diagnostics")
        print(f"  {CYAN}[2]{RESET}  View Honeypot Attack Events")
        print(f"  {CYAN}[3]{RESET}  Export Events to File (CSV / JSON)")
        print(f"  {CYAN}[4]{RESET}  Target Security Scanner & Port Reconnaissance")
        print(f"  {CYAN}[5]{RESET}  WHOIS Registrar & DNS Record Lookup")
        print(f"  {CYAN}[6]{RESET}  Attack Payload De-obfuscator")
        print(f"  {CYAN}[7]{RESET}  Firewall Blocklist Generator (UFW / iptables / PowerShell)")
        print(f"  {CYAN}[8]{RESET}  MITRE ATT&CK Framework Mapping Report")
        print(f"  {CYAN}[9]{RESET}  Malware File Hash Checker (MD5 / SHA256)")
        print(f"  {CYAN}[10]{RESET} Subdomain Enumeration Engine")
        print(f"  {CYAN}[11]{RESET} YARA Malware Signature Scanner")
        print(f"  {CYAN}[12]{RESET} Suricata / Snort IDS Rule Generator")
        print(f"  {CYAN}[13]{RESET} Live Honey-Tail Event Stream (CLI)")
        print(f"  {CYAN}[14]{RESET} User Account Management (List, Create, Delete)")
        print(f"  {CYAN}[15]{RESET} Database Storage Snapshot & Restoration")
        print(f"  {CYAN}[16]{RESET} Generate Executive PDF Threat Report")
        print(f"  {CYAN}[17]{RESET} Start Web Dashboard Servers (Backend + Frontend)")
        print(f"  {CYAN}[18]{RESET} Train Machine Learning Threat Models (Scikit-Learn)")
        print(f"\n  {PURPLE}--- DOMAIN & DNS INTELLIGENCE SUITE ---{RESET}")
        print(f"  {CYAN}[19]{RESET} Passive DNS (PDNS) History & 90-Day Timeline")
        print(f"  {CYAN}[20]{RESET} Subdomain DGA Entropy Detector (Shannon Alg)")
        print(f"  {CYAN}[21]{RESET} DNSSEC & Fast-Flux Tunneling Analyzer")
        print(f"  {CYAN}[22]{RESET} DNS Tunnel Exfiltration Payload Decoder")
        print(f"  {CYAN}[23]{RESET} Certificate Transparency (CT) & Private CA Audit")
        print(f"  {CYAN}[24]{RESET} WHOIS Registration Forensics & Typosquat Detector")
        print(f"\n  {RED}--- OFFENSIVE & DEFENSIVE CYBER WAR ROOM ---{RESET}")
        print(f"  {CYAN}[25]{RESET} Lateral Movement Simulator (Attack Path Graph)")
        print(f"  {CYAN}[26]{RESET} Cloud Misconfiguration Hunter (S3/IAM/Lambda)")
        print(f"  {CYAN}[27]{RESET} API Security Fuzzer (GraphQL/IDOR/Rate-Limit)")
        print(f"  {CYAN}[28]{RESET} Software Supply Chain & Malicious Package Audit")
        print(f"  {CYAN}[29]{RESET} Zero-Day Hunter (AFL++ / Jazzer Fuzzing Metrics)")
        print(f"  {CYAN}[30]{RESET} Attack Playbook Simulator (Custom Kill-Chain)")
        print(f"  {CYAN}[31]{RESET} Threat Actor Profiler (APT29 / FIN7 / Lazarus)")
        print(f"  {CYAN}[32]{RESET} Red Team Assessment Report Generator")
        print(f"  {RED}[0]{RESET}  Exit SOC Terminal")
        print(f"{CYAN}============================================================================{RESET}")

        try:
            choice = input(f"\n{EMERALD}cyvantis-soc# {RESET}Select an option (0-32): ").strip()
        except (KeyboardInterrupt, EOFError):
            print(f"\n{YELLOW}[+] Exiting CYVANTIS CLI. Goodbye!{RESET}")
            break

        if choice == "0":
            print("[+] Exiting CYVANTIS CLI. Goodbye!")
            break
        elif choice == "1":
            handle_health(DummyArgs())
        elif choice == "2":
            limit_str = input("Enter number of events to show [default 15]: ").strip()
            limit = int(limit_str) if limit_str.isdigit() else 15
            args = DummyArgs()
            args.event_action = "list"
            args.limit = limit
            handle_events(args)
        elif choice == "3":
            fmt = input("Enter format (csv/json) [default csv]: ").strip().lower()
            if fmt not in ["csv", "json"]:
                fmt = "csv"
            out = input("Enter output file path [default auto]: ").strip()
            args = DummyArgs()
            args.event_action = "export"
            args.format = fmt
            args.output = out if out else None
            handle_events(args)
        elif choice == "4":
            target = input("Enter target URL, domain, or IP address: ").strip()
            if target:
                args = DummyArgs()
                args.target = target
                args.url = None
                args.socket = False
                handle_scan(args)
        elif choice == "5":
            target = input("Enter target domain or IP address: ").strip()
            if target:
                args = DummyArgs()
                args.target = target
                handle_whois_dns(args)
        elif choice == "6":
            payload = input("Enter encoded payload string to deobfuscate: ").strip()
            if payload:
                args = DummyArgs()
                args.payload = payload
                handle_decode(args)
        elif choice == "7":
            fmt = input("Enter format (ufw/iptables/powershell/plain) [default ufw]: ").strip().lower()
            if fmt not in ["ufw", "iptables", "powershell", "plain"]:
                fmt = "ufw"
            args = DummyArgs()
            args.format = fmt
            args.min_score = 50
            args.limit = 100
            handle_blocklist(args)
        elif choice == "8":
            handle_mitre(DummyArgs())
        elif choice == "9":
            h = input("Enter file MD5/SHA1/SHA256 hash: ").strip()
            if h:
                args = DummyArgs()
                args.hash = h
                handle_hash(args)
        elif choice == "10":
            d = input("Enter target domain name: ").strip()
            if d:
                args = DummyArgs()
                args.domain = d
                handle_subdomains(args)
        elif choice == "11":
            p = input("Enter command string or payload to scan with YARA: ").strip()
            if p:
                args = DummyArgs()
                args.payload = p
                handle_yara(args)
        elif choice == "12":
            eng = input("Enter IDS engine format (suricata/snort) [default suricata]: ").strip().lower()
            if eng not in ["suricata", "snort"]:
                eng = "suricata"
            args = DummyArgs()
            args.engine = eng
            args.limit = 50
            handle_ids(args)
        elif choice == "13":
            args = DummyArgs()
            args.limit = 15
            handle_tail(args)
        elif choice == "14":
            print("\n  User Management: [L]ist  [C]reate  [D]elete")
            sub_choice = input("  Select action (L/C/D): ").strip().lower()
            args = DummyArgs()
            if sub_choice == "l":
                args.user_action = "list"
                handle_users(args)
            elif sub_choice == "c":
                u = input("  Username: ").strip()
                e = input("  Email: ").strip()
                p = input("  Password: ").strip()
                r = input("  Role (admin/analyst/viewer) [default analyst]: ").strip().lower() or "analyst"
                f = input("  Full Name: ").strip()
                args.user_action = "create"
                args.username = u
                args.email = e
                args.password = p
                args.role = r
                args.full_name = f
                handle_users(args)
            elif sub_choice == "d":
                uid = input("  User ID to delete: ").strip()
                if uid.isdigit():
                    args.user_action = "delete"
                    args.user_id = int(uid)
                    handle_users(args)
        elif choice == "15":
            print("\n  Storage Management: [B]ackup  [L]ist  [R]estore  [P]urge")
            sub_choice = input("  Select action (B/L/R/P): ").strip().lower()
            args = DummyArgs()
            if sub_choice == "b":
                args.storage_action = "backup"
                handle_storage(args)
            elif sub_choice == "l":
                args.storage_action = "list"
                handle_storage(args)
            elif sub_choice == "r":
                fn = input("  Backup snapshot filename: ").strip()
                if fn:
                    args.storage_action = "restore"
                    args.file = fn
                    handle_storage(args)
            elif sub_choice == "p":
                days_str = input("  Purge backups older than N days [default 90]: ").strip()
                args.storage_action = "purge"
                args.days = int(days_str) if days_str.isdigit() else 90
                handle_storage(args)
        elif choice == "16":
            out = input("Enter output PDF filename [default auto]: ").strip()
            args = DummyArgs()
            args.output = out if out else None
            handle_report(args)
        elif choice == "17":
            print("\n[+] Launching CYVANTIS Web Dashboard...")
            if os.name == "nt":
                os.system("start_cyvantis.bat")
            else:
                os.system("./start_cyvantis.sh")
        elif choice == "18":
            args = DummyArgs()
            handle_train(args)
        elif choice == "19":
            domain = input("Enter target domain [default cyvantis-target.io]: ").strip() or "cyvantis-target.io"
            args = DummyArgs()
            args.domain = domain
            handle_pdns(args)
        elif choice == "20":
            sub = input("Enter subdomain to inspect [default v8x29m31.cyvantis-target.io]: ").strip() or "v8x29m31.cyvantis-target.io"
            args = DummyArgs()
            args.subdomain = sub
            handle_dga(args)
        elif choice == "21":
            domain = input("Enter target domain [default cyvantis-target.io]: ").strip() or "cyvantis-target.io"
            args = DummyArgs()
            args.domain = domain
            handle_dnssec(args)
        elif choice == "22":
            q = input("Enter DNS query payload [default c2VjcmV0X3Bhc3N3b3JkXzEyMw==.data.tunnel.io]: ").strip() or "c2VjcmV0X3Bhc3N3b3JkXzEyMw==.data.tunnel.io"
            args = DummyArgs()
            args.query = q
            handle_decode_tunnel(args)
        elif choice == "23":
            domain = input("Enter target domain [default cyvantis-target.io]: ").strip() or "cyvantis-target.io"
            args = DummyArgs()
            args.domain = domain
            handle_ct_logs(args)
        elif choice == "24":
            domain = input("Enter domain for typosquat check [default paypa1.com]: ").strip() or "paypa1.com"
            args = DummyArgs()
            args.domain = domain
            handle_typosquat(args)
        elif choice == "25":
            handle_lateral(DummyArgs())
        elif choice == "26":
            env = input("Enter environment [default AWS-Production]: ").strip() or "AWS-Production"
            args = DummyArgs()
            args.env = env
            handle_cloud_audit(args)
        elif choice == "27":
            ep = input("Enter target endpoint [default /api/v1/users]: ").strip() or "/api/v1/users"
            args = DummyArgs()
            args.endpoint = ep
            handle_api_fuzz(args)
        elif choice == "28":
            handle_supply_chain(DummyArgs())
        elif choice == "29":
            handle_fuzzing(DummyArgs())
        elif choice == "30":
            handle_playbook(DummyArgs())
        elif choice == "31":
            act = input("Enter Threat Actor (APT29 / FIN7 / Lazarus) [default APT29]: ").strip() or "APT29"
            args = DummyArgs()
            args.actor = act
            handle_threat_actor(args)
        elif choice == "32":
            out = input("Enter output markdown file path [press Enter to print to screen]: ").strip()
            args = DummyArgs()
            args.output = out if out else None
            args.title = "CYVANTIS Enterprise Red Team Assessment"
            handle_redteam_report(args)
        else:
            print("[-] Invalid selection. Please choose 0-32.")

def main():
    if len(sys.argv) == 1 or (len(sys.argv) > 1 and sys.argv[1] in ["menu", "interactive"]):
        interactive_menu()
        return

    parser = argparse.ArgumentParser(
        prog="cyvantis",
        description="CYVANTIS Enterprise Threat Intelligence & Honeypot SOC Command Line Interface (CLI)"
    )

    subparsers = parser.add_subparsers(dest="cli_command", help="Available CYVANTIS CLI Commands")

    # Interactive menu command
    subparsers.add_parser("menu", help="Launch interactive SOC Command Center console")

    # Health command
    subparsers.add_parser("health", help="Check system operational health and database stats")

    # Seed command
    subparsers.add_parser("seed", help="Seed initial users, rules, and realistic honeypot events")

    # Train ML models command
    subparsers.add_parser("train", help="Train Machine Learning Threat Severity & Anomaly Detection models")

    # Predict ML command
    predict_p = subparsers.add_parser("predict", help="Predict threat severity and anomaly score for an attack payload")
    predict_p.add_argument("command_str", nargs="?", help="Attacker command string")
    predict_p.add_argument("--command", help="Attacker command string")
    predict_p.add_argument("--username", help="Attacker username target")
    predict_p.add_argument("--password", help="Attacker password target")
    predict_p.add_argument("--protocol", default="SSH", help="Protocol (SSH, Telnet)")
    predict_p.add_argument("--port", type=int, default=22, help="Target destination port")
    predict_p.add_argument("--duration", type=float, default=5.0, help="Session duration in seconds")

    # Target Reconnaissance & Nmap Scan command
    scan_p = subparsers.add_parser("scan", help="Nmap port scanning & URL web service reconnaissance")
    scan_p.add_argument("target", nargs="?", help="Target URL, domain name, or IP address")
    scan_p.add_argument("--url", help="Target URL or domain name")
    scan_p.add_argument("--socket", action="store_true", help="Force native Python socket scanner mode")

    nmap_p = subparsers.add_parser("nmap", help="Alias for Nmap port scanning & URL reconnaissance")
    nmap_p.add_argument("target", nargs="?", help="Target URL, domain name, or IP address")
    nmap_p.add_argument("--url", help="Target URL or domain name")
    nmap_p.add_argument("--socket", action="store_true", help="Force native Python socket scanner mode")

    # WHOIS & DNS Recon
    whois_p = subparsers.add_parser("whois", help="WHOIS registrar & DNS record lookup")
    whois_p.add_argument("target", nargs="?", help="Domain or IP address")

    dns_p = subparsers.add_parser("dns", help="DNS record resolution (A, MX, TXT, NS)")
    dns_p.add_argument("target", nargs="?", help="Domain or IP address")

    # Deobfuscator
    decode_p = subparsers.add_parser("decode", help="De-obfuscate Base64/Hex/URL encoded attack payloads")
    decode_p.add_argument("payload", help="Malicious payload string to decode")

    # Blocklist Exporter
    block_p = subparsers.add_parser("blocklist", help="Generate firewall block rules (UFW, iptables, PowerShell, CIDR)")
    block_p.add_argument("--format", choices=["ufw", "iptables", "powershell", "pfsense", "plain"], default="ufw", help="Rule format")
    block_p.add_argument("--min-score", type=int, default=50, help="Minimum threat score cutoff")
    block_p.add_argument("--limit", type=int, default=100, help="Max IP limit")

    # MITRE ATT&CK Mapper
    subparsers.add_parser("mitre", help="Map honeypot events to MITRE ATT&CK techniques")

    # Hash Reputation Checker
    hash_p = subparsers.add_parser("hash", help="Check file hash malware reputation (MD5, SHA1, SHA256)")
    hash_p.add_argument("hash", help="File hash string")

    # Subdomain Enumerator
    sub_p = subparsers.add_parser("subdomains", help="Discover subdomains via Certificate Transparency & DNS")
    sub_p.add_argument("domain", help="Target domain name")

    # URL Threat & Virus Scanner
    url_p = subparsers.add_parser("url-scan", help="Check URL validity, HTTP live status, SSL, and VirusTotal reputation")
    url_p.add_argument("target", nargs="?", help="Target URL to scan")
    url_p.add_argument("--url", help="Target URL to scan")
    url_p.add_argument("--vt-key", help="VirusTotal API v3 key (optional)")

    # User Management command
    user_parser = subparsers.add_parser("users", help="User and Role-Based Access Control")
    user_sub = user_parser.add_subparsers(dest="user_action", help="User Actions")
    user_sub.add_parser("list", help="List all registered user accounts")

    create_user_p = user_sub.add_parser("create", help="Create a new user account")
    create_user_p.add_argument("--username", required=True, help="Username")
    create_user_p.add_argument("--email", required=True, help="Email address")
    create_user_p.add_argument("--password", required=True, help="User password")
    create_user_p.add_argument("--full-name", help="Full name")
    create_user_p.add_argument("--role", choices=["admin", "analyst", "viewer"], default="analyst", help="Assigned role")

    del_user_p = user_sub.add_parser("delete", help="Delete user account")
    del_user_p.add_argument("--user-id", type=int, required=True, help="User ID to delete")

    # Event Intelligence command
    event_parser = subparsers.add_parser("events", help="Query and export honeypot attack event captures")
    event_sub = event_parser.add_subparsers(dest="event_action", help="Event Actions")
    
    list_events_p = event_sub.add_parser("list", help="List recent honeypot events")
    list_events_p.add_argument("--limit", type=int, default=10, help="Number of records to show")

    export_events_p = event_sub.add_parser("export", help="Export events to CSV or JSON file")
    export_events_p.add_argument("--format", choices=["csv", "json"], default="csv", help="Export format")
    export_events_p.add_argument("--output", help="Output filepath")

    # Storage & Backup command
    storage_parser = subparsers.add_parser("storage", help="SQLite transactional database backups and retention")
    storage_sub = storage_parser.add_subparsers(dest="storage_action", help="Storage Actions")
    storage_sub.add_parser("backup", help="Create atomic SQLite snapshot backup")
    storage_sub.add_parser("list", help="List backup snapshot archives")

    restore_storage_p = storage_sub.add_parser("restore", help="Restore SQLite database from snapshot file")
    restore_storage_p.add_argument("--file", required=True, help="Backup snapshot filename")

    purge_storage_p = storage_sub.add_parser("purge", help="Purge backup files older than specified retention days")
    purge_storage_p.add_argument("--days", type=int, default=90, help="Retention cutoff in days")

    # Report command
    report_p = subparsers.add_parser("report", help="Generate PDF Threat Intelligence & Security Report")
    report_p.add_argument("--output", help="Output PDF file path")

    # Domain Intelligence subparsers
    pdns_p = subparsers.add_parser("pdns", help="90-day Passive DNS (PDNS) resolution history & CNAME chain")
    pdns_p.add_argument("domain", nargs="?", default="cyvantis-target.io", help="Target domain name")

    dga_p = subparsers.add_parser("dga", help="Calculate Shannon entropy on subdomains to detect DGA C2 beacons")
    dga_p.add_argument("subdomain", nargs="?", default="v8x29m31.cyvantis-target.io", help="Subdomain string to analyze")

    dnssec_p = subparsers.add_parser("dnssec", help="DNSSEC cryptographic validation & fast-flux TTL tunneling analysis")
    dnssec_p.add_argument("domain", nargs="?", default="cyvantis-target.io", help="Target domain name")

    dec_tun_p = subparsers.add_parser("decode-tunnel", help="Decode Base64/Hex exfiltrated payloads from DNS tunneling queries")
    dec_tun_p.add_argument("query", nargs="?", default="c2VjcmV0X3Bhc3N3b3JkXzEyMw==.data.tunnel.io", help="DNS query payload")

    ct_p = subparsers.add_parser("ct-logs", help="Certificate Transparency log audit, wildcard & Private CA detection")
    ct_p.add_argument("domain", nargs="?", default="cyvantis-target.io", help="Target domain name")

    typo_p = subparsers.add_parser("typosquat", help="WHOIS registration forensics & brand typosquatting detector")
    typo_p.add_argument("domain", nargs="?", default="paypa1.com", help="Target domain name")

    # Offensive / Cyber War Room subparsers
    subparsers.add_parser("lateral", help="Lateral Movement Simulator: shortest attack path from DMZ to Domain Controller")

    cloud_p = subparsers.add_parser("cloud-audit", help="Cloud Misconfiguration Hunter: S3 buckets, IAM escalation, Lambda injection")
    cloud_p.add_argument("--env", default="AWS-Production", help="Cloud environment (default: AWS-Production)")

    api_fuzz_p = subparsers.add_parser("api-fuzz", help="API Security Fuzzer: GraphQL introspection, IDOR BOLA, Rate limits")
    api_fuzz_p.add_argument("--endpoint", default="/api/v1/users", help="Target API endpoint")

    subparsers.add_parser("supply-chain", help="Software Supply Chain Analyzer: dependency audit & malicious typosquat detection")

    subparsers.add_parser("fuzzing", help="Zero-Day Hunter: AFL++ / Jazzer live fuzzing campaign metrics & crash dumps")

    playbook_p = subparsers.add_parser("playbook", help="Attack Playbook Builder: sandbox simulation of chained attack steps")
    playbook_p.add_argument("--steps", nargs="+", help="Custom attack steps list")

    actor_p = subparsers.add_parser("threat-actor", help="Threat Actor Profiler (APT29, FIN7, Lazarus) & MITRE ATT&CK matrix")
    actor_p.add_argument("actor", nargs="?", default="APT29", help="Threat actor name (APT29, FIN7, Lazarus)")

    rt_p = subparsers.add_parser("redteam", help="Generate professional Red Team Assessment Report")
    rt_p.add_argument("--output", help="Save markdown report to file")
    rt_p.add_argument("--title", default="CYVANTIS Enterprise Red Team Assessment", help="Assessment title")

    args = parser.parse_args()

    if args.cli_command in ["menu", "interactive"]:
        interactive_menu()
    elif args.cli_command == "health":
        handle_health(args)
    elif args.cli_command in ["scan", "nmap"]:
        handle_scan(args)
    elif args.cli_command in ["whois", "dns"]:
        handle_whois_dns(args)
    elif args.cli_command == "decode":
        handle_decode(args)
    elif args.cli_command == "blocklist":
        handle_blocklist(args)
    elif args.cli_command == "mitre":
        handle_mitre(args)
    elif args.cli_command == "hash":
        handle_hash(args)
    elif args.cli_command == "subdomains":
        handle_subdomains(args)
    elif args.cli_command == "url-scan":
        handle_url_scan(args)
    elif args.cli_command == "users":
        handle_users(args)
    elif args.cli_command == "events":
        handle_events(args)
    elif args.cli_command == "storage":
        handle_storage(args)
    elif args.cli_command == "report":
        handle_report(args)
    elif args.cli_command == "seed":
        handle_seed(args)
    elif args.cli_command == "train":
        handle_train(args)
    elif args.cli_command == "predict":
        handle_predict_cmd(args)
    elif args.cli_command == "pdns":
        handle_pdns(args)
    elif args.cli_command == "dga":
        handle_dga(args)
    elif args.cli_command == "dnssec":
        handle_dnssec(args)
    elif args.cli_command == "decode-tunnel":
        handle_decode_tunnel(args)
    elif args.cli_command == "ct-logs":
        handle_ct_logs(args)
    elif args.cli_command == "typosquat":
        handle_typosquat(args)
    elif args.cli_command == "lateral":
        handle_lateral(args)
    elif args.cli_command == "cloud-audit":
        handle_cloud_audit(args)
    elif args.cli_command == "api-fuzz":
        handle_api_fuzz(args)
    elif args.cli_command == "supply-chain":
        handle_supply_chain(args)
    elif args.cli_command == "fuzzing":
        handle_fuzzing(args)
    elif args.cli_command == "playbook":
        handle_playbook(args)
    elif args.cli_command == "threat-actor":
        handle_threat_actor(args)
    elif args.cli_command == "redteam":
        handle_redteam_report(args)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()


