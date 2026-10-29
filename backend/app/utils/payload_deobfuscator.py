import base64
import re
import urllib.parse
from typing import Dict, Any, List

URL_PATTERN = re.compile(r'https?://[^\s\'"<>]+|ftp://[^\s\'"<>]+', re.IGNORECASE)
IP_PATTERN = re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}\b')
HEX_PATTERN = re.compile(r'(\\x[0-9a-fA-F]{2})+')

def sanitize_ascii(text: str) -> str:
    """Strip unprintable and non-ASCII characters to prevent console encoding crashes."""
    return "".join(c for c in text if 32 <= ord(c) <= 126)

def deobfuscate_command(command_str: str) -> Dict[str, Any]:
    """De-obfuscate shell commands, decodes Base64/Hex layers, extracts URLs & IPs."""
    original = sanitize_ascii(command_str.strip())
    decoded_layers = [original]
    extracted_urls = set()
    extracted_ips = set()
    detected_droppers = []

    current = original

    # Extract initial URLs & IPs
    for url in URL_PATTERN.findall(current):
        extracted_urls.add(sanitize_ascii(url))
    for ip in IP_PATTERN.findall(current):
        extracted_ips.add(sanitize_ascii(ip))

    # Base64 detection & decoding
    base64_matches = re.findall(r'[A-Za-z0-9+/]{16,}={0,2}', current)
    for b64 in base64_matches:
        try:
            decoded_bytes = base64.b64decode(b64)
            decoded_str = sanitize_ascii(decoded_bytes.decode('ascii', errors='ignore'))
            if decoded_str and len(decoded_str) > 3:
                decoded_layers.append(f"Base64 Decoded: {decoded_str}")
                current += f" {decoded_str}"
                for url in URL_PATTERN.findall(decoded_str):
                    extracted_urls.add(sanitize_ascii(url))
                for ip in IP_PATTERN.findall(decoded_str):
                    extracted_ips.add(sanitize_ascii(ip))
        except Exception:
            pass

    # Hex decoding (\x63\x75\x72\x6c)
    hex_matches = HEX_PATTERN.finditer(current)
    for match in hex_matches:
        hex_seq = match.group(0)
        try:
            raw_bytes = bytes.fromhex(hex_seq.replace('\\x', ''))
            decoded_hex = sanitize_ascii(raw_bytes.decode('ascii', errors='ignore'))
            decoded_layers.append(f"Hex Decoded: {decoded_hex}")
            current += f" {decoded_hex}"
        except Exception:
            pass

    # URL decoding (%20, %2F)
    if '%' in current:
        try:
            url_decoded = sanitize_ascii(urllib.parse.unquote(current))
            if url_decoded != current:
                decoded_layers.append(f"URL Decoded: {url_decoded}")
                current = url_decoded
        except Exception:
            pass

    # Check for malicious shell droppers / dangerous execution flags
    current_lower = current.lower()
    if "curl" in current_lower:
        detected_droppers.append("curl HTTP downloader")
    if "wget" in current_lower:
        detected_droppers.append("wget HTTP downloader")
    if "tftp" in current_lower:
        detected_droppers.append("tftp protocol downloader")
    if "| sh" in current_lower or "| bash" in current_lower or "|sh" in current_lower:
        detected_droppers.append("Piped Shell Execution (| sh)")
    if "chmod +x" in current_lower or "chmod 777" in current_lower:
        detected_droppers.append("Binary Permission Escalation (chmod +x)")
    if "/etc/cron" in current_lower or "crontab" in current_lower:
        detected_droppers.append("Cron Persistence Mechanism")
    if "rm -rf" in current_lower:
        detected_droppers.append("Destructive File Deletion (rm -rf)")

    return {
        "original_command": original,
        "decoded_layers": [sanitize_ascii(l) for l in decoded_layers],
        "extracted_urls": [sanitize_ascii(u) for u in extracted_urls],
        "extracted_ips": [sanitize_ascii(i) for i in extracted_ips],
        "detected_threats": detected_droppers,
        "is_suspicious": len(extracted_urls) > 0 or len(detected_droppers) > 0 or len(decoded_layers) > 1
    }

def format_deobfuscator_report(res: Dict[str, Any]) -> str:
    """Format de-obfuscation findings into ASCII report."""
    lines = []
    lines.append("=========================================================================")
    lines.append("  CYVANTIS PAYLOAD DE-OBFUSCATOR & SHELL ANALYZER")
    lines.append("=========================================================================")
    lines.append(f"  Input Payload:      {res['original_command'][:80]}")
    lines.append(f"  Threat Assessment: {'SUSPICIOUS / MALICIOUS' if res['is_suspicious'] else 'CLEAN / BENIGN'}")
    lines.append("-------------------------------------------------------------------------")
    lines.append("  [+] DECODING LAYERS")
    for idx, layer in enumerate(res['decoded_layers'], 1):
        lines.append(f"      Layer #{idx}: {layer}")

    lines.append("-------------------------------------------------------------------------")
    lines.append("  [+] EXTRACTED INDICATORS")
    lines.append(f"      Extracted URLs: {', '.join(res['extracted_urls']) if res['extracted_urls'] else 'None'}")
    lines.append(f"      Extracted IPs:  {', '.join(res['extracted_ips']) if res['extracted_ips'] else 'None'}")
    
    if res['detected_threats']:
        lines.append("-------------------------------------------------------------------------")
        lines.append("  [!] DETECTED MALICIOUS PATTERNS")
        for threat in res['detected_threats']:
            lines.append(f"      [*] {threat}")

    lines.append("=========================================================================")
    return "\n".join(lines)
