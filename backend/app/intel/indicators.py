"""Indicator classification and normalization."""
import ipaddress
import re
from typing import Optional, Tuple
from urllib.parse import urlparse

CVE_RE = re.compile(r"\bCVE-\d{4}-\d{4,7}\b", re.IGNORECASE)
HASH_RE = re.compile(r"^(?:[a-fA-F0-9]{32}|[a-fA-F0-9]{40}|[a-fA-F0-9]{64})$")
DOMAIN_RE = re.compile(r"^(?=.{1,253}$)(?!-)(?:[a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,63}$")
URL_IN_TEXT_RE = re.compile(r"\b(?:https?|ftp|tftp)://[^\s'\"<>|;]+", re.IGNORECASE)

INDICATOR_TYPES = ("ip", "domain", "url", "hash", "cve")


def classify_indicator(value: str) -> Tuple[Optional[str], Optional[str]]:
    """Returns (type, normalized_value) or (None, None) if unrecognised."""
    if not value:
        return None, None
    v = value.strip()
    if len(v) > 2048:
        return None, None
    try:
        return "ip", str(ipaddress.ip_address(v))
    except ValueError:
        pass
    if CVE_RE.fullmatch(v):
        return "cve", v.upper()
    if HASH_RE.match(v):
        return "hash", v.lower()
    if "://" in v:
        parsed = urlparse(v)
        if parsed.scheme in ("http", "https", "ftp", "tftp") and parsed.netloc:
            return "url", v
        return None, None
    if DOMAIN_RE.match(v):
        return "domain", v.lower().rstrip(".")
    return None, None


def is_public_ip(ip: str) -> bool:
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return False
    return addr.is_global


def extract_indicators_from_text(text: str):
    """Yields (type, value) for URLs, domains (from URLs), IPs (from URLs) and CVE IDs found in free text."""
    if not text:
        return
    for m in URL_IN_TEXT_RE.finditer(text):
        url = m.group(0)
        yield "url", url
        host = urlparse(url).hostname
        if host:
            t, norm = classify_indicator(host)
            if t in ("ip", "domain"):
                yield t, norm
    for m in CVE_RE.finditer(text):
        yield "cve", m.group(0).upper()
