import socket
import ssl
import subprocess
import shutil
import urllib.parse
import datetime
import concurrent.futures
from typing import Dict, Any, List, Optional
import httpx

COMMON_PORTS = {
    21: "FTP",
    22: "SSH",
    23: "Telnet",
    25: "SMTP",
    53: "DNS",
    80: "HTTP",
    110: "POP3",
    143: "IMAP",
    443: "HTTPS",
    1433: "MSSQL",
    1521: "Oracle",
    3306: "MySQL",
    3389: "RDP",
    5432: "PostgreSQL",
    6379: "Redis",
    8000: "HTTP-Alt",
    8080: "HTTP-Proxy",
    8443: "HTTPS-Alt",
    9200: "Elasticsearch",
    27017: "MongoDB"
}

def parse_target(target_str: str) -> Dict[str, Any]:
    """Extract host, port, scheme, and clean URL from target string."""
    target_str = target_str.strip()
    if not target_str.startswith("http://") and not target_str.startswith("https://"):
        url_to_parse = "http://" + target_str
    else:
        url_to_parse = target_str

    parsed = urllib.parse.urlparse(url_to_parse)
    hostname = parsed.hostname or target_str
    port = parsed.port

    return {
        "raw_target": target_str,
        "hostname": hostname,
        "port": port,
        "scheme": parsed.scheme,
        "parsed_url": url_to_parse
    }

def scan_target_port_socket(host: str, port: int, timeout: float = 1.0) -> Optional[Dict[str, Any]]:
    """Scan a single port using raw socket connection and grab banner if available."""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        if result == 0:
            service_name = COMMON_PORTS.get(port, "Unknown")
            banner = ""
            try:
                sock.send(b"\r\n")
                raw_data = sock.recv(1024)
                banner = raw_data.decode("utf-8", errors="ignore").strip().splitlines()[0][:60]
            except Exception:
                pass
            sock.close()
            return {"port": port, "state": "open", "service": service_name, "banner": banner}
        sock.close()
    except Exception:
        pass
    return None

def run_nmap_binary(hostname_or_ip: str) -> Optional[str]:
    """Execute nmap binary if available on system PATH."""
    nmap_path = shutil.which("nmap")
    if not nmap_path:
        return None

    cmd = [nmap_path, "-Pn", "-F", hostname_or_ip]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=25)
        if res.returncode == 0 or res.stdout:
            return res.stdout.strip()
    except Exception as e:
        return f"Error executing Nmap binary: {str(e)}"
    return None

def scan_url_and_host(target_input: str, force_socket: bool = False) -> Dict[str, Any]:
    """Full reconnaissance & port scan on target URL / IP / hostname."""
    parsed_info = parse_target(target_input)
    hostname = parsed_info["hostname"]
    
    # Resolve IP
    ip_address = None
    resolve_error = None
    try:
        ip_address = socket.gethostbyname(hostname)
    except Exception as e:
        resolve_error = str(e)

    # HTTP / HTTPS Recon
    http_recon = {
        "target_url": None,
        "status_code": None,
        "server": None,
        "powered_by": None,
        "security_headers": {},
        "missing_security_headers": [],
        "latency_ms": None,
        "error": None
    }

    if ip_address:
        urls_to_test = []
        if parsed_info["raw_target"].startswith("http"):
            urls_to_test.append(parsed_info["raw_target"])
        else:
            urls_to_test.append(f"https://{hostname}")
            urls_to_test.append(f"http://{hostname}")

        for test_url in urls_to_test:
            try:
                start_time = datetime.datetime.now()
                with httpx.Client(timeout=4.0, verify=False, follow_redirects=True) as client:
                    resp = client.get(test_url)
                    latency = round((datetime.datetime.now() - start_time).total_seconds() * 1000, 1)
                    
                    headers_lower = {k.lower(): v for k, v in resp.headers.items()}
                    sec_headers = {
                        "strict-transport-security": headers_lower.get("strict-transport-security"),
                        "content-security-policy": headers_lower.get("content-security-policy"),
                        "x-frame-options": headers_lower.get("x-frame-options"),
                        "x-content-type-options": headers_lower.get("x-content-type-options"),
                        "x-xss-protection": headers_lower.get("x-xss-protection"),
                        "referrer-policy": headers_lower.get("referrer-policy"),
                    }
                    missing = [k for k, v in sec_headers.items() if not v]

                    http_recon = {
                        "target_url": str(resp.url),
                        "status_code": resp.status_code,
                        "server": headers_lower.get("server", "Unknown / Hidden"),
                        "powered_by": headers_lower.get("x-powered-by", "Not specified"),
                        "security_headers": {k: v for k, v in sec_headers.items() if v},
                        "missing_security_headers": missing,
                        "latency_ms": latency,
                        "error": None
                    }
                    break
            except Exception as ex:
                http_recon["error"] = str(ex)

    # Port Scanning (Nmap or Socket)
    nmap_raw_output = None
    open_ports = []
    scan_method = "socket"

    if ip_address:
        if not force_socket:
            nmap_raw_output = run_nmap_binary(hostname)

        if nmap_raw_output:
            scan_method = "Nmap CLI Binary"
        else:
            scan_method = "Python Socket Engine"
            with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
                futures = [executor.submit(scan_target_port_socket, ip_address, p) for p in COMMON_PORTS.keys()]
                for fut in concurrent.futures.as_completed(futures):
                    res = fut.result()
                    if res:
                        open_ports.append(res)
            open_ports.sort(key=lambda x: x["port"])

    return {
        "target_input": target_input,
        "hostname": hostname,
        "ip_address": ip_address,
        "resolve_error": resolve_error,
        "http_recon": http_recon,
        "scan_method": scan_method,
        "nmap_raw_output": nmap_raw_output,
        "open_ports": open_ports,
        "scanned_at": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    }

def format_scan_report(res: Dict[str, Any]) -> str:
    """Generate formatted ASCII intelligence report."""
    lines = []
    lines.append("=========================================================================")
    lines.append("  CYVANTIS TARGET RECONNAISSANCE & NMAP PORT SCANNER")
    lines.append("=========================================================================")
    lines.append(f"  Target Input:        {res['target_input']}")
    lines.append(f"  Resolved Hostname:   {res['hostname']}")
    if res['resolve_error']:
        lines.append(f"  [-] IP Resolution:   FAILED ({res['resolve_error']})")
        lines.append("=========================================================================")
        return "\n".join(lines)
    
    lines.append(f"  Resolved IP Address: {res['ip_address']}")
    lines.append(f"  Scan Engine:         {res['scan_method']}")
    lines.append(f"  Timestamp:           {res['scanned_at']}")
    lines.append("-------------------------------------------------------------------------")

    # Web Recon
    http = res["http_recon"]
    lines.append("  [+] WEB SERVICE RECONNAISSANCE")
    if http.get("status_code"):
        lines.append(f"      Target URL:       {http.get('target_url')}")
        lines.append(f"      HTTP Status:      {http.get('status_code')}")
        lines.append(f"      Latency:          {http.get('latency_ms')} ms")
        lines.append(f"      Server Header:    {http.get('server')}")
        lines.append(f"      Powered-By:       {http.get('powered_by')}")
        
        sec_h = http.get("security_headers", {})
        if sec_h:
            lines.append("      Present Security Headers:")
            for k, v in sec_h.items():
                lines.append(f"        [+] {k}: {v[:50]}")
        
        missing_h = http.get("missing_security_headers", [])
        if missing_h:
            lines.append("      Missing Security Headers:")
            for m in missing_h:
                lines.append(f"        [!] {m}")
    else:
        err_msg = http.get("error") or "No HTTP response detected"
        lines.append(f"      [-] Web Server Status: {err_msg}")

    lines.append("-------------------------------------------------------------------------")
    lines.append("  [+] PORT SCAN RESULTS")

    if res["nmap_raw_output"]:
        lines.append("  [Nmap Output]")
        for line in res["nmap_raw_output"].splitlines():
            lines.append(f"  {line}")
    elif res["open_ports"]:
        lines.append("  PORT     STATE   SERVICE      BANNER / INFO")
        lines.append("  " + "-" * 60)
        for p in res["open_ports"]:
            banner_str = f" ({p['banner']})" if p['banner'] else ""
            lines.append(f"  {p['port']:<8}/tcp {p['state']:<7} {p['service']:<12}{banner_str}")
    else:
        lines.append("  No open ports detected in common port scan list.")

    lines.append("=========================================================================")
    return "\n".join(lines)
