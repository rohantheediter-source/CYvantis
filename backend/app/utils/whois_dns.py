import socket
import urllib.parse
import urllib.request
import json
from typing import Dict, Any, List, Optional

def query_dns_records(domain: str) -> Dict[str, Any]:
    """Query DNS records for a domain (A, MX, TXT, NS, PTR)."""
    domain = domain.strip().lower()
    if domain.startswith("http://") or domain.startswith("https://"):
        domain = urllib.parse.urlparse(domain).hostname or domain

    records = {
        "domain": domain,
        "ip_addresses": [],
        "mx_records": [],
        "txt_records": [],
        "ns_records": [],
        "error": None
    }

    try:
        # A & AAAA record resolution
        addr_info = socket.getaddrinfo(domain, None)
        ips = list(set([item[4][0] for item in addr_info if item[4]]))
        records["ip_addresses"] = ips
    except Exception as e:
        records["error"] = f"DNS Resolution failed: {str(e)}"

    # Google Public DNS REST API query for MX, TXT, NS records
    for record_type in ["MX", "TXT", "NS"]:
        try:
            url = f"https://dns.google/resolve?name={domain}&type={record_type}"
            req = urllib.request.Request(url, headers={"User-Agent": "CYVANTIS-SOC/1.0"})
            with urllib.request.urlopen(req, timeout=3.0) as resp:
                data = json.loads(resp.read().decode())
                answers = data.get("Answer", [])
                ans_data = [a.get("data") for a in answers if a.get("data")]
                if record_type == "MX":
                    records["mx_records"] = ans_data
                elif record_type == "TXT":
                    records["txt_records"] = ans_data
                elif record_type == "NS":
                    records["ns_records"] = ans_data
        except Exception:
            pass

    return records

def query_whois(target: str) -> Dict[str, Any]:
    """Query WHOIS & RDAP domain/IP registration information."""
    target = target.strip().lower()
    if target.startswith("http://") or target.startswith("https://"):
        target = urllib.parse.urlparse(target).hostname or target

    rdap_data = {
        "target": target,
        "registrar": None,
        "creation_date": None,
        "expiration_date": None,
        "status": [],
        "nameservers": [],
        "org": None,
        "country": None,
        "error": None
    }

    try:
        is_ip = False
        try:
            socket.inet_aton(target)
            is_ip = True
        except Exception:
            pass

        rdap_url = f"https://rdap.org/ip/{target}" if is_ip else f"https://rdap.org/domain/{target}"
        req = urllib.request.Request(rdap_url, headers={"User-Agent": "CYVANTIS-SOC/1.0", "Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=4.0) as resp:
            data = json.loads(resp.read().decode())
            
            events = data.get("events", [])
            for ev in events:
                action = ev.get("eventAction")
                date_str = ev.get("eventDate", "")[:10]
                if action == "registration":
                    rdap_data["creation_date"] = date_str
                elif action == "expiration":
                    rdap_data["expiration_date"] = date_str

            status_list = data.get("status", [])
            rdap_data["status"] = status_list if isinstance(status_list, list) else [status_list]

            ns_list = data.get("nameservers", [])
            rdap_data["nameservers"] = [ns.get("ldhName") for ns in ns_list if ns.get("ldhName")]

            entities = data.get("entities", [])
            for ent in entities:
                roles = ent.get("roles", [])
                vcard = ent.get("vcardArray", [[]])[1] if isinstance(ent.get("vcardArray"), list) else []
                for v in vcard:
                    if len(v) >= 4 and v[0] == "fn":
                        if "registrar" in roles:
                            rdap_data["registrar"] = v[3]
                        elif "registrant" in roles:
                            rdap_data["org"] = v[3]
    except Exception as e:
        rdap_data["error"] = f"RDAP query note: {str(e)}"

    return rdap_data

def format_dns_whois_report(dns_res: Dict[str, Any], whois_res: Dict[str, Any]) -> str:
    """Format WHOIS & DNS report into clean ASCII text."""
    lines = []
    lines.append("=========================================================================")
    lines.append("  CYVANTIS WHOIS & DNS RECONNAISSANCE REPORT")
    lines.append("=========================================================================")
    lines.append(f"  Target:             {dns_res['domain']}")
    if dns_res['ip_addresses']:
        lines.append(f"  Resolved IPs:       {', '.join(dns_res['ip_addresses'])}")
    if dns_res['error']:
        lines.append(f"  [-] DNS Status:     {dns_res['error']}")
    lines.append("-------------------------------------------------------------------------")
    lines.append("  [+] DNS RECORDS")
    lines.append(f"      MX Records:     {', '.join(dns_res['mx_records']) if dns_res['mx_records'] else 'None'}")
    lines.append(f"      NS Records:     {', '.join(dns_res['ns_records']) if dns_res['ns_records'] else 'None'}")
    if dns_res['txt_records']:
        lines.append("      TXT Records:")
        for txt in dns_res['txt_records'][:3]:
            lines.append(f"        [*] {txt[:60]}")

    lines.append("-------------------------------------------------------------------------")
    lines.append("  [+] WHOIS / REGISTRATION DATA")
    if whois_res.get("registrar"):
        lines.append(f"      Registrar:      {whois_res.get('registrar')}")
    if whois_res.get("creation_date"):
        lines.append(f"      Created Date:   {whois_res.get('creation_date')}")
    if whois_res.get("expiration_date"):
        lines.append(f"      Expires Date:   {whois_res.get('expiration_date')}")
    if whois_res.get("nameservers"):
        lines.append(f"      Nameservers:    {', '.join(whois_res.get('nameservers'))}")
    if whois_res.get("status"):
        lines.append(f"      Domain Status:  {', '.join(whois_res.get('status'))}")
    if whois_res.get("error") and not whois_res.get("registrar"):
        lines.append(f"      [-] WHOIS Note:  {whois_res.get('error')}")
    lines.append("=========================================================================")
    return "\n".join(lines)
