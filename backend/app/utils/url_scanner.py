import re
import socket
import ssl
import time
import urllib.parse
import urllib.request
import json
from typing import Dict, Any, List

def analyze_url_threat(url: str, virustotal_api_key: str = None) -> Dict[str, Any]:
    """
    Analyzes a URL for validity, live HTTP health, SSL certificate details, 
    redirect destinations, heuristics (phishing/suspicious patterns), 
    and VirusTotal 70+ AV engine scan reputation.
    """
    start_time = time.time()
    
    # 1. Ensure scheme present
    url_to_test = url.strip()
    if not url_to_test.startswith(('http://', 'https://')):
        url_to_test = 'http://' + url_to_test

    parsed = urllib.parse.urlparse(url_to_test)
    hostname = parsed.hostname or ""
    port = parsed.port
    scheme = parsed.scheme.lower()
    path = parsed.path

    # Initial Validation
    if not hostname or "." not in hostname and hostname != "localhost":
        # Check if valid IP
        is_ip = False
        try:
            socket.inet_aton(hostname)
            is_ip = True
        except socket.error:
            pass

        if not is_ip and hostname != "localhost":
            return {
                "url": url,
                "is_valid": False,
                "error": "Invalid URL or domain format",
                "verdict": "INVALID",
                "risk_score": 100,
                "latency_ms": 0,
            }

    results: Dict[str, Any] = {
        "url": url_to_test,
        "is_valid": True,
        "scheme": scheme,
        "hostname": hostname,
        "port": port or (443 if scheme == "https" else 80),
        "ip_addresses": [],
        "http_status": None,
        "final_url": url_to_test,
        "is_redirected": False,
        "server_header": None,
        "latency_ms": 0,
        "ssl_info": None,
        "heuristics": [],
        "virustotal": None,
        "risk_score": 0,
        "verdict": "CLEAN",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
    }

    # 2. DNS Resolution & IP Lookup
    try:
        addr_info = socket.getaddrinfo(hostname, None)
        ips = list(set([info[4][0] for info in addr_info if info[4]]))
        results["ip_addresses"] = ips
    except Exception as e:
        results["heuristics"].append(f"DNS resolution failed: {str(e)}")

    # 3. Heuristic Phishing & Suspicious Keyword Check
    heuristics = []
    # Check IP in hostname (often used by malicious actors)
    if re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", hostname):
        heuristics.append("Raw IP address used in URL (Common in phishing/malware distribution)")
        results["risk_score"] += 25

    # High risk TLD check
    suspicious_tlds = ['.xyz', '.top', '.tk', '.ml', '.ga', '.cf', '.gq', '.work', '.click', '.fit', '.rf.gd']
    if any(hostname.endswith(tld) for tld in suspicious_tlds):
        heuristics.append(f"Suspicious high-risk TLD detected: .{hostname.split('.')[-1]}")
        results["risk_score"] += 20

    # Credential harvesting parameter check
    if re.search(r"(login|signin|account|bank|update|verify|secure|paypal|password|token)", url_to_test.lower()):
        heuristics.append("Contains sensitive authentication keywords in URL structure")
        results["risk_score"] += 15

    # Excessive subdomains check
    if hostname.count('.') > 3:
        heuristics.append("Excessive subdomain depth (potential domain spoofing)")
        results["risk_score"] += 15

    # 4. HTTP Live Check & Redirect Tracking
    req_start = time.time()
    try:
        req = urllib.request.Request(
            url_to_test,
            headers={"User-Agent": "CYVANTIS-ThreatIntel-Scanner/1.0 (Security; Research)"}
        )
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        with urllib.request.urlopen(req, timeout=5, context=ctx) as response:
            results["http_status"] = response.status
            results["final_url"] = response.geturl()
            results["is_redirected"] = (results["final_url"] != url_to_test)
            results["server_header"] = response.headers.get("Server", "Unknown")

            if results["is_redirected"]:
                heuristics.append(f"URL redirects to external destination: {results['final_url']}")

    except urllib.error.HTTPError as e:
        results["http_status"] = e.code
        results["server_header"] = e.headers.get("Server", "Unknown")
    except Exception as e:
        heuristics.append(f"HTTP connection failed / timeout: {str(e)}")
        results["risk_score"] += 10

    results["latency_ms"] = int((time.time() - req_start) * 1000)

    # 5. SSL/TLS Certificate Inspection for HTTPS
    if scheme == "https":
        try:
            ctx = ssl.create_default_context()
            with socket.create_connection((hostname, port or 443), timeout=4) as sock:
                with ctx.wrap_socket(sock, server_hostname=hostname) as ssock:
                    cert = ssock.getpeercert()
                    if cert:
                        issuer = dict(x[0] for x in cert.get('issuer', []))
                        subject = dict(x[0] for x in cert.get('subject', []))
                        results["ssl_info"] = {
                            "valid": True,
                            "issuer": issuer.get('organizationName') or issuer.get('commonName') or 'Unknown',
                            "subject": subject.get('commonName') or hostname,
                            "notBefore": cert.get('notBefore'),
                            "notAfter": cert.get('notAfter'),
                            "cipher": ssock.cipher()
                        }
        except Exception as e:
            results["ssl_info"] = {
                "valid": False,
                "error": f"SSL verification error: {str(e)}"
            }
            heuristics.append("Invalid or untrusted SSL/TLS certificate")
            results["risk_score"] += 20

    # 6. VirusTotal API Integration (if API key provided or simulated public lookup)
    if virustotal_api_key:
        try:
            # VT URL scan lookup
            url_id = urllib.parse.quote_plus(url_to_test)
            vt_req = urllib.request.Request(
                f"https://www.virustotal.com/api/v3/urls/{url_id}",
                headers={"x-apikey": virustotal_api_key}
            )
            with urllib.request.urlopen(vt_req, timeout=5) as vt_res:
                vt_data = json.loads(vt_res.read().decode('utf-8'))
                stats = vt_data.get('data', {}).get('attributes', {}).get('last_analysis_stats', {})
                malicious = stats.get('malicious', 0)
                suspicious = stats.get('suspicious', 0)
                harmless = stats.get('harmless', 0)
                undetected = stats.get('undetected', 0)

                results["virustotal"] = {
                    "malicious": malicious,
                    "suspicious": suspicious,
                    "harmless": harmless,
                    "undetected": undetected,
                    "total_engines": malicious + suspicious + harmless + undetected
                }

                if malicious > 0:
                    results["risk_score"] += (malicious * 15)
                    heuristics.append(f"Flagged MALICIOUS by {malicious} VirusTotal security vendor(s)!")
                elif suspicious > 0:
                    results["risk_score"] += (suspicious * 5)
                    heuristics.append(f"Flagged SUSPICIOUS by {suspicious} VirusTotal vendor(s)")

        except Exception as e:
            results["virustotal"] = {"error": f"VirusTotal API query failed: {str(e)}"}

    results["heuristics"] = heuristics

    # Calculate final Verdict
    score = min(results["risk_score"], 100)
    results["risk_score"] = score

    if score >= 60:
        results["verdict"] = "MALICIOUS (DANGER)"
    elif score >= 25:
        results["verdict"] = "SUSPICIOUS"
    else:
        results["verdict"] = "CLEAN (SAFE)"

    return results
