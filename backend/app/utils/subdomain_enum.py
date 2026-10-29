import json
import socket
import urllib.request
import urllib.parse
from typing import Dict, Any, List

COMMON_SUBDOMAINS = ["www", "mail", "api", "admin", "dev", "staging", "vpn", "portal", "test", "web", "shop", "blog", "app"]

def enumerate_subdomains(domain: str) -> Dict[str, Any]:
    """Enumerate subdomains via Certificate Transparency (crt.sh) and DNS probe."""
    domain = domain.strip().lower()
    if domain.startswith("http://") or domain.startswith("https://"):
        domain = urllib.parse.urlparse(domain).hostname or domain

    found_subdomains = set()

    # Query crt.sh Certificate Transparency logs API
    try:
        url = f"https://crt.sh/?q=%.{domain}&output=json"
        req = urllib.request.Request(url, headers={"User-Agent": "CYVANTIS-SOC/1.0"})
        with urllib.request.urlopen(req, timeout=4.0) as resp:
            data = json.loads(resp.read().decode())
            for item in data[:30]:
                name = item.get("name_value", "")
                for sub in name.split("\n"):
                    sub = sub.strip().lower()
                    if sub and not sub.startswith("*.") and sub.endswith(domain):
                        found_subdomains.add(sub)
    except Exception:
        pass

    # Quick DNS brute probe fallback for common subdomains
    for sub in COMMON_SUBDOMAINS:
        target_sub = f"{sub}.{domain}"
        try:
            socket.gethostbyname(target_sub)
            found_subdomains.add(target_sub)
        except Exception:
            pass

    resolved_list = []
    for sub in sorted(list(found_subdomains)):
        try:
            ip = socket.gethostbyname(sub)
            resolved_list.append({"subdomain": sub, "ip": ip, "status": "Active"})
        except Exception:
            resolved_list.append({"subdomain": sub, "ip": "Unresolved", "status": "Inactive"})

    return {
        "domain": domain,
        "count": len(resolved_list),
        "subdomains": resolved_list
    }

def format_subdomain_report(res: Dict[str, Any]) -> str:
    """Format subdomain enumeration results into ASCII report."""
    lines = []
    lines.append("=========================================================================")
    lines.append("  CYVANTIS SUBDOMAIN ENUMERATION & SURFACE DISCOVERY")
    lines.append("=========================================================================")
    lines.append(f"  Target Domain:       {res['domain']}")
    lines.append(f"  Discovered Subdomains: {res['count']}")
    lines.append("-------------------------------------------------------------------------")
    lines.append("  SUBDOMAIN                          | RESOLVED IP     | STATUS")
    lines.append("  " + "-" * 67)
    if res['subdomains']:
        for sub in res['subdomains']:
            lines.append(f"  {sub['subdomain']:<34} | {sub['ip']:<15} | {sub['status']}")
    else:
        lines.append("  No subdomains discovered.")
    lines.append("=========================================================================")
    return "\n".join(lines)
