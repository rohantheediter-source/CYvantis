import os
import re
from typing import Dict, Any, List, Optional
import httpx

# ============================================================================
# COMPREHENSIVE CYBERSECURITY DOMAIN EXPERT KNOWLEDGE GRAPH
# ============================================================================
CYBER_KNOWLEDGE_BASE = [
    # 1. SQL Injection (SQLi)
    {
        "keywords": ["sql injection", "sqli", "sql", "database injection", "union select", "sqlmap"],
        "category": "Web Security & OWASP A03",
        "answer": (
            "SQL Injection (SQLi) occurs when untrusted user input is directly concatenated into a dynamic database query "
            "without proper parameterization or input sanitization. This allows an attacker to manipulate backend queries, "
            "exfiltrate sensitive tables via 'UNION SELECT', bypass authentication using tautologies (e.g., \"' OR '1'='1\"), "
            "or execute administrative procedures (e.g., 'xp_cmdshell' on MSSQL).\n\n"
            "Key SQLi Variants:\n"
            "• In-Band (Classic): Error-based and UNION-based injection where query output or verbose database errors reflect directly in the HTTP response.\n"
            "• Inferential (Blind): Boolean-based and Time-based (e.g., 'pg_sleep(5)' or 'WAITFOR DELAY') where true/false conditions are inferred from HTTP status codes or execution pauses.\n"
            "• Out-of-Band (OOB): Triggered when the database server initiates external DNS or HTTP requests to an attacker-controlled listener.\n\n"
            "Remediation:\n"
            "Always utilize Prepared Statements (Parameterized Queries) via frameworks/ORMs, enforce the Principle of Least Privilege on database roles, and disable verbose error dumps in production."
        ),
        "suggested_commands": [
            {"cmd": "sqlmap -u \"http://target/api?id=1\" --batch --dbs", "label": "Automated SQLi Enumeration"},
            {"cmd": "sqlmap -u \"http://target/api?id=1\" --technique=T --time-sec=5", "label": "Time-based Blind SQLi Test"}
        ],
        "pro_tip": "To test WAF filtering behavior, practitioners inspect inline comment splits like 'UN/**/ION/**/SEL/**/ECT' or URL hex double-encoding."
    },

    # 2. Cross-Site Scripting (XSS)
    {
        "keywords": ["xss", "cross-site scripting", "cross site scripting", "stored xss", "reflected xss", "dom xss"],
        "category": "Web Security & OWASP A03",
        "answer": (
            "Cross-Site Scripting (XSS) is a client-side code injection flaw where untrusted JavaScript executes within the victim's "
            "browser in the security context of the vulnerable web application. Impact includes session hijacking via stolen authentication cookies, "
            "keystroke logging, DOM defacement, and unauthorized credential harvesting.\n\n"
            "Three Primary XSS Vectors:\n"
            "1. Reflected XSS: Non-persistent payload injected via URL parameters or form posts that immediately reflects off the server response.\n"
            "2. Stored XSS (Persistent): The payload is permanently committed to persistent storage (database, message board) and executes whenever victims view the compromised resource.\n"
            "3. DOM-based XSS: The vulnerability resides entirely within client-side code execution sinks (e.g. 'eval()', 'document.write()', 'innerHTML') processing untrusted sources.\n\n"
            "Remediation:\n"
            "Apply context-aware output encoding (HTML, JavaScript, URL), enforce a strict Content Security Policy (CSP: default-src 'self'), and flag session cookies with 'HttpOnly' and 'SameSite=Strict'."
        ),
        "suggested_commands": [
            {"cmd": "curl -s \"http://target/search?q=<script>alert(1)</script>\" | grep -i \"<script>\"", "label": "Verify Reflected Payload Output"},
            {"cmd": "echo '<img src=x onerror=alert(document.domain)>' | base64", "label": "Base64 Encode Vector"}
        ],
        "pro_tip": "When evaluating modern CSP implementations, analysts look for script gadget chains (e.g., in AngularJS or jQuery) or open JSONP endpoints that can bypass restrictions."
    },

    # 3. Server-Side Request Forgery (SSRF)
    {
        "keywords": ["ssrf", "server side request forgery", "server-side request forgery", "metadata", "169.254.169.254", "internal network"],
        "category": "Cloud & Web Security",
        "answer": (
            "Server-Side Request Forgery (SSRF) occurs when a vulnerable backend server is induced to issue unauthorized requests "
            "to arbitrary internal or external destinations. Attackers leverage SSRF to pivot behind network firewalls, port scan internal VPCs, "
            "interrogate loopback services (127.0.0.1), and extract cloud IAM tokens from instance metadata services.\n\n"
            "Cloud Metadata Targets:\n"
            "• AWS / GCP / Azure Link-Local: http://169.254.169.254/latest/meta-data/iam/security-credentials/\n"
            "• Kubernetes kubelet API: https://10.96.0.1:443/\n\n"
            "Remediation:\n"
            "Enforce strict URL schema and domain whitelisting, block RFC1918 private IP ranges at the network layer, disable unused protocols (gopher://, dict://), and migrate to AWS IMDSv2 (requiring token-backed session headers)."
        ),
        "suggested_commands": [
            {"cmd": "curl -s -H \"Metadata: true\" \"http://169.254.169.254/latest/meta-data/iam/security-credentials/\"", "label": "Probe AWS IMDS Endpoint"},
            {"cmd": "curl -v \"http://127.0.0.1:8080/admin/status\"", "label": "Inspect Loopback Admin Service"}
        ],
        "pro_tip": "If direct '127.0.0.1' representations are blacklisted, test decimal notations ('2130706433'), hex ('0x7f.0.0.1'), or IPv6 ('::1') to evaluate parser inconsistencies."
    },

    # 4. Port Scanning & Reconnaissance (Nmap)
    {
        "keywords": ["nmap", "port scan", "port scanning", "stealth scan", "syn scan", "recon", "reconnaissance", "scanning"],
        "category": "Network Reconnaissance",
        "answer": (
            "Nmap (Network Mapper) is the industry-standard network discovery and security auditing utility.\n\n"
            "Essential Scanning Methodologies:\n"
            "• SYN Stealth Scan (-sS): Half-open scanning that avoids completing the full 3-way TCP handshake (sends RST upon receiving SYN-ACK), preventing connection registration in many legacy application logs.\n"
            "• Service Version Detection (-sV): Interrogates open ports with signature probes to accurately identify listening daemon banners and build versions.\n"
            "• NSE Script Engine (-sC / --script vuln): Runs hundreds of specialized scripts to identify known CVEs, misconfigurations, and default credentials.\n"
            "• Complete Port Sweep (-p-): Scans all 65,535 TCP ports to discover non-standard high ports hosting backdoors, proxies, or management interfaces."
        ),
        "suggested_commands": [
            {"cmd": "nmap -sS -sV -sC -T4 -p- 192.168.1.10 -oN scan_results.nmap", "label": "Full Comprehensive Nmap Scan"},
            {"cmd": "nmap -sU --top-ports 100 192.168.1.10", "label": "Top UDP Services Scan"}
        ],
        "pro_tip": "For accelerated triage, run an initial fast sweep with 'nmap -F' or 'rustscan' followed by targeted version probes with '-sC -sV'."
    },

    # 5. Linux Privilege Escalation (Privesc / SUID / Sudo)
    {
        "keywords": ["privilege escalation", "privesc", "suid", "sudo -l", "linux privesc", "root access", "dirty cow", "dirty pipe"],
        "category": "Linux Hardening & Offensive Security",
        "answer": (
            "Linux Privilege Escalation is the process by which a low-privileged identity (e.g., 'www-data' or 'analyst') "
            "exploits OS flaws, misconfigurations, or elevated trust to obtain root (UID 0) access.\n\n"
            "Primary Privilege Escalation Vectors:\n"
            "1. SUID/SGID Binaries: Binaries configured with 'chmod u+s' execute with the permissions of the file owner (root). Cross-reference binaries against GTFOBins (e.g. find, bash, vim, nmap, cp).\n"
            "2. Sudo Misconfigurations: Improperly assigned privileges in '/etc/sudoers' revealed via 'sudo -l' (e.g., 'NOPASSWD: ALL').\n"
            "3. Linux Capabilities: Elevated POSIX capabilities such as 'cap_setuid+ep' attached to interpreters (python, perl) or archiving tools (tar).\n"
            "4. Writable Cron Jobs: Recurring scripts scheduled under root crontabs that permit write access to unprivileged users.\n"
            "5. Kernel Vulnerabilities: Exploits targeting kernel memory flaws like Dirty Pipe (CVE-2022-0847) or PwnKit (CVE-2021-4034)."
        ),
        "suggested_commands": [
            {"cmd": "find / -perm -u=s -type f 2>/dev/null", "label": "Find SUID Binaries"},
            {"cmd": "sudo -l", "label": "Check Sudo Privileges"},
            {"cmd": "getcap -r / 2>/dev/null", "label": "Find Linux Capabilities"}
        ],
        "pro_tip": "Always inspect '/etc/crontab' and '/etc/cron.d/' alongside 'ps -eo user,cmd | grep root' to uncover custom scheduled automation running with root rights."
    },

    # 6. Active Directory Pentesting (Kerberoasting, DCSync, Mimikatz)
    {
        "keywords": ["active directory", "ad", "kerberos", "kerberoasting", "mimikatz", "dcsync", "pass the hash", "bloodhound", "golden ticket"],
        "category": "Enterprise & Active Directory Security",
        "answer": (
            "Active Directory (AD) serves as the centralized identity and authentication foundation for enterprise networks.\n\n"
            "Core Attack Methodologies:\n"
            "• Kerberoasting: Requesting Kerberos TGS tickets for Service Principal Names (SPNs) associated with user accounts, then cracking the encrypted service ticket offline via Hashcat.\n"
            "• AS-REP Roasting: Targeting accounts with Kerberos pre-authentication disabled to obtain crackable AS-REP hashes directly.\n"
            "• Pass-the-Hash (PtH): Authenticating to remote endpoints using raw NTLM hashes without knowledge of the underlying plaintext password.\n"
            "• DCSync: Leveraging domain replication privileges ('DS-Replication-Get-Changes-All') to remotely extract all domain user hashes and the KRBTGT master key from the Domain Controller.\n"
            "• BloodHound: Using graph theory to map transitive relationships and uncover shortest paths to Domain Admin."
        ),
        "suggested_commands": [
            {"cmd": "secretsdump.py domain/user:password@target_dc", "label": "Impacket Remote DCSync Hash Dump"},
            {"cmd": "GetUserSPNs.py domain/user:password -request", "label": "Kerberoast SPN Ticket Extraction"}
        ],
        "pro_tip": "Regularly rotating the KRBTGT password twice in succession invalidates all forged Golden Tickets across the forest."
    },

    # 7. Reverse Engineering & Binary Exploitation (Pwn / Buffer Overflow)
    {
        "keywords": ["buffer overflow", "pwn", "reverse engineering", "rop", "aslr", "dep", "nx", "ghidra", "gdb", "stack overflow"],
        "category": "Binary Exploitation & Reverse Engineering",
        "answer": (
            "Binary Exploitation leverages memory management flaws to hijack CPU instruction execution flow (overwriting $EIP / $RIP).\n\n"
            "Classic Stack Buffer Overflow Mechanics:\n"
            "When an unconstrained input function (such as 'strcpy' or 'gets') writes past the boundary of a stack buffer, "
            "it corrupts adjacent memory: [Buffer] ➔ [Saved Frame Pointer EBP] ➔ [Saved Return Address EIP]. Redirecting EIP allows arbitrary shellcode execution.\n\n"
            "Defensive Mitigations & Bypasses:\n"
            "• ASLR (Address Space Layout Randomization): Randomizes memory offsets for stack, heap, and libraries on each run.\n"
            "• DEP / NX (Data Execution Prevention): Marks memory pages non-executable, preventing direct shellcode execution on the stack.\n"
            "• Stack Canaries: Inserts pseudo-random validation words before the return address to detect corruption and abort.\n"
            "• ROP (Return-Oriented Programming): Circumvents NX by chaining short existing executable code sequences ending in 'ret' (gadgets)."
        ),
        "suggested_commands": [
            {"cmd": "checksec --file=target_binary", "label": "Check Binary Protections (NX, Canary, ASLR)"},
            {"cmd": "gdb -q target_binary -ex 'pattern create 100'", "label": "GDB Cyclic Pattern Offset Finder"}
        ],
        "pro_tip": "Decompilers like Ghidra and IDA Pro reconstruct high-level C pseudocode from machine instructions, expediting the discovery of unchecked buffer allocations."
    },

    # 8. Cryptography (Hashing, Salt, Symmetric vs Asymmetric)
    {
        "keywords": ["cryptography", "crypto", "encryption", "hash", "hashing", "aes", "rsa", "salt", "rainbow table", "sha256", "md5"],
        "category": "Applied Cryptography",
        "answer": (
            "Applied Cryptography guarantees data confidentiality, integrity, authenticity, and non-repudiation across digital systems.\n\n"
            "Encryption vs Hashing:\n"
            "• Encryption (Two-Way): Reversibly transforms plaintext into ciphertext using cryptographic keys. Symmetric algorithms (AES-256-GCM) share a single secret; asymmetric algorithms (RSA-4096, ECC) use public/private key pairs.\n"
            "• Cryptographic Hashing (One-Way): Maps arbitrary-length data to fixed-size digests (SHA-256, Argon2). Hashing is mathematically non-reversible.\n\n"
            "Salting & Rainbow Table Defense:\n"
            "Appending a unique cryptographically random salt to passwords before hashing defeats precomputed lookup tables (Rainbow Tables), ensuring identical passwords yield completely distinct digests."
        ),
        "suggested_commands": [
            {"cmd": "hashcat -m 0 -a 0 hashes.txt rockyou.txt", "label": "Crack MD5 Hashes with Wordlist"},
            {"cmd": "openssl enc -aes-256-cbc -salt -in data.txt -out data.enc", "label": "AES-256 CBC File Encryption"}
        ],
        "pro_tip": "Never store authentication credentials using fast general-purpose hashes (MD5, SHA-256); always employ adaptive, memory-hard key derivation functions like Argon2id or bcrypt."
    },

    # 9. Honeypots & Threat Intelligence (Cowrie, MITRE ATT&CK)
    {
        "keywords": ["honeypot", "cowrie", "threat intelligence", "ioc", "mitre", "mitre att&ck", "soc", "siem", "telemetry"],
        "category": "SOC & Deception Technology",
        "answer": (
            "Honeypots are deliberate deception assets deployed to lure, engage, and analyze adversaries without putting production infrastructure at risk. "
            "They facilitate early warning telemetry and the capture of live attacker TTPs (Tactics, Techniques, and Procedures).\n\n"
            "Cowrie Honeypot Architecture:\n"
            "Cowrie operates as a medium-to-high interaction SSH and Telnet honeypot that emulates a full UNIX shell environment. "
            "It records attacker brute-force attempts, session interaction transcripts, and downloaded malware binaries (/var/lib/cowrie/downloads/).\n\n"
            "MITRE ATT&CK Framework Mapping:\n"
            "Captured events are mapped to standardized threat classifications: Initial Access (T1110), Execution (T1059), Persistence (T1053), and Defense Evasion (T1070)."
        ),
        "suggested_commands": [
            {"cmd": "tail -f /var/log/cowrie/cowrie.json | jq .", "label": "Live Stream Cowrie Honeypot JSON Telemetry"},
            {"cmd": "grep 'login.failed' /var/log/cowrie/cowrie.log | awk '{print $NF}' | sort | uniq -c", "label": "Top Honeypot Attacker IPs"}
        ],
        "pro_tip": "CYVANTIS autonomous deception dynamically seeds canary tokens and decoy artifacts to alert security teams the moment lateral movement commences."
    },

    # 10. Incident Response & Forensics (Memory / PCAP / Logs)
    {
        "keywords": ["incident response", "forensics", "pcap", "wireshark", "volatility", "memory dump", "dfir"],
        "category": "Digital Forensics & Incident Response (DFIR)",
        "answer": (
            "Incident Response (IR) is the structured operational workflow (NIST SP 800-61) for identifying, containing, and remediating cyber threats.\n\n"
            "Core Digital Forensic Disciplines:\n"
            "1. Network Forensics: Extracting packet payloads and session streams from PCAPs using Wireshark, Zeek, or Snort.\n"
            "2. Memory Forensics: Utilizing Volatility to inspect volatile RAM dumps, isolating injected DLLs, unlinked processes, and plaintext credentials.\n"
            "3. Host & Log Forensics: Analyzing Windows Event Logs (Event ID 4624 Logon, 4688 Process Creation, 7045 Service Install), Linux auditd, and shell histories."
        ),
        "suggested_commands": [
            {"cmd": "volatility -f mem.raw --profile=Win10x64_19041 pslist", "label": "Inspect Running Processes in Memory Dump"},
            {"cmd": "tshark -r traffic.pcap -Y 'http.request.method == \"POST\"' -T fields -e ip.src -e http.file_data", "label": "Extract POST Data from PCAP"}
        ],
        "pro_tip": "In active breach scenarios, always honor the RFC 3227 Order of Volatility: CPU Registers/Cache ➔ RAM ➔ Network Sockets ➔ Disk ➔ Offline Media."
    }
]

# ============================================================================
# OPTIONAL EXTERNAL GENERATIVE LLM ADAPTER (GEMINI / OPENAI)
# ============================================================================
async def query_external_llm(prompt: str) -> Optional[str]:
    """Queries external LLM (Gemini or OpenAI) if user configured API keys in environment."""
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    openai_key = os.getenv("OPENAI_API_KEY", "")

    # Try Google Gemini API
    if gemini_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            payload = {
                "contents": [{
                    "parts": [{
                        "text": f"You are CYVANTIS Senior Cybersecurity Architect & AI CTF Mentor. Answer the following technical cybersecurity question accurately, concisely, with terminal commands and practical tips (in clean Hinglish + English):\n\n{prompt}"
                    }]
                }]
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        return candidates[0]["content"]["parts"][0]["text"]
        except Exception:
            pass

    # Try OpenAI API
    if openai_key:
        try:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"}
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "You are CYVANTIS Senior Cybersecurity Architect & AI CTF Mentor. Provide accurate, structured, actionable cybersecurity answers with Linux/terminal commands in Hinglish and English."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.4
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    return data["choices"][0]["message"]["content"]
        except Exception:
            pass

    return None

# ============================================================================
# INTELLIGENT MATCHING & REASONING PIPELINE
# ============================================================================
def get_cybersecurity_expert_answer(query: str) -> Dict[str, Any]:
    q_lower = query.lower().strip()

    # 1. Exact match against comprehensive domain catalog
    best_match = None
    max_score = 0

    for item in CYBER_KNOWLEDGE_BASE:
        score = 0
        for kw in item["keywords"]:
            if kw in q_lower:
                score += len(kw.split()) * 2  # Multi-word match weight
        if score > max_score:
            max_score = score
            best_match = item

    if best_match and max_score > 0:
        return {
            "answer": best_match["answer"],
            "recommended_phase": best_match["category"],
            "suggested_commands": best_match["suggested_commands"],
            "pro_tip": best_match["pro_tip"]
        }

    # 2. General Query Inference (Fallback to comprehensive technical breakdown)
    return {
        "answer": (
            f"Analysis of cybersecurity query: '{query}'\n\n"
            "This concept directly touches upon defensive architecture, runtime system telemetry, and adversary deterrence.\n\n"
            "Core Security Principles to Apply:\n"
            "1. Principle of Least Privilege (PoLP): Confine identities, services, and execution contexts to the minimum necessary access rights.\n"
            "2. Defense-in-Depth: Implement layered security barriers spanning WAF, network segmentation, host-based IDS, and centralized SIEM correlation.\n"
            "3. Runtime Telemetry & Continuous Auditing: Continuously inspect live kernel events (`/var/log/audit/audit.log`) and honeypot traps.\n\n"
            "Use the terminal commands below to inspect your current host environment:"
        ),
        "recommended_phase": "General Cybersecurity Triage",
        "suggested_commands": [
            {"cmd": "ps -ef --forest", "label": "Inspect Process Tree"},
            {"cmd": "netstat -tlpn", "label": "Inspect Listening Sockets"},
            {"cmd": "journalctl -xe --no-pager | tail -n 25", "label": "View System Journal Logs"}
        ],
        "pro_tip": "You can ask about any specific concept (e.g. SQLi, XSS, Nmap, SUID, Buffer Overflow, Active Directory, Wireshark, Mimikatz) to receive an in-depth breakdown and actionable commands!"
    }
