"""
External threat-intelligence providers.

Every provider returns a `ProviderResult` with an explicit `status`:
  ok | not_found | not_configured | rate_limited | error | unsupported
A reputation score is only set when the provider actually returned one; it is never
invented. Scores are normalised to 0-100 (higher = more malicious):
  * AbuseIPDB: `abuseConfidenceScore` as-is. Confidence = min(1, totalReports / 10).
  * VirusTotal: 100 * (malicious + 0.5 * suspicious) / engines_total.
                Confidence = min(1, engines_total / 60).
  * NVD: no reputation; returns CVSS metadata (stored in `vulnerabilities`).
API keys are read from settings (environment) and never logged or returned.
"""
import base64
import logging
import time
from dataclasses import dataclass, field
from typing import Any, Dict, Optional

import httpx

from app.config import settings

logger = logging.getLogger("cyvantis.intel")

MAX_RETRIES = 2


@dataclass
class ProviderResult:
    provider: str
    status: str
    reputation_score: Optional[float] = None
    confidence: Optional[float] = None
    summary: str = ""
    data: Dict[str, Any] = field(default_factory=dict)


def _http_get_json(url: str, headers: Dict[str, str], params: Optional[dict] = None, client: Optional[httpx.Client] = None):
    """GET with timeout and bounded retries on transient failures. Returns (status_code, json|None)."""
    own = client is None
    client = client or httpx.Client(timeout=settings.INTEL_HTTP_TIMEOUT_SECONDS)
    try:
        last_exc = None
        for attempt in range(MAX_RETRIES + 1):
            try:
                resp = client.get(url, headers=headers, params=params)
            except (httpx.TimeoutException, httpx.TransportError) as exc:
                last_exc = exc
                time.sleep(0.5 * (2 ** attempt))
                continue
            if resp.status_code >= 500 and attempt < MAX_RETRIES:
                time.sleep(0.5 * (2 ** attempt))
                continue
            body = None
            if resp.headers.get("content-type", "").startswith("application/json"):
                try:
                    body = resp.json()
                except ValueError:
                    body = None
            return resp.status_code, body
        raise last_exc or RuntimeError("request failed")
    finally:
        if own:
            client.close()


class BaseProvider:
    name = "base"
    supported_types: tuple = ()

    def is_configured(self) -> bool:
        return True

    def lookup(self, indicator: str, indicator_type: str, client: Optional[httpx.Client] = None) -> ProviderResult:
        if indicator_type not in self.supported_types:
            return ProviderResult(self.name, "unsupported")
        if not self.is_configured():
            return ProviderResult(self.name, "not_configured", summary=f"{self.name} API key not configured")
        if not settings.INTEL_ENABLE_NETWORK:
            return ProviderResult(self.name, "error", summary="network lookups disabled (INTEL_ENABLE_NETWORK=false)")
        try:
            return self._lookup(indicator, indicator_type, client)
        except Exception as exc:  # never leak headers/keys
            logger.warning("%s lookup failed: %s", self.name, type(exc).__name__)
            return ProviderResult(self.name, "error", summary=f"lookup failed ({type(exc).__name__})")

    def _lookup(self, indicator, indicator_type, client) -> ProviderResult:  # pragma: no cover
        raise NotImplementedError


def _status_from_code(name: str, code: int) -> Optional[ProviderResult]:
    if code == 404:
        return ProviderResult(name, "not_found", summary="indicator not known to provider")
    if code == 429:
        return ProviderResult(name, "rate_limited", summary="provider rate limit reached")
    if code in (401, 403):
        return ProviderResult(name, "error", summary="provider rejected credentials")
    if code != 200:
        return ProviderResult(name, "error", summary=f"unexpected HTTP {code}")
    return None


class AbuseIPDBProvider(BaseProvider):
    name = "abuseipdb"
    supported_types = ("ip",)

    def is_configured(self):
        return bool(settings.ABUSEIPDB_API_KEY)

    def _lookup(self, indicator, indicator_type, client):
        code, body = _http_get_json(
            "https://api.abuseipdb.com/api/v2/check",
            headers={"Key": settings.ABUSEIPDB_API_KEY, "Accept": "application/json"},
            params={"ipAddress": indicator, "maxAgeInDays": 90},
            client=client,
        )
        bad = _status_from_code(self.name, code)
        if bad:
            return bad
        data = (body or {}).get("data") if isinstance(body, dict) else None
        if not isinstance(data, dict) or "abuseConfidenceScore" not in data:
            return ProviderResult(self.name, "error", summary="malformed provider response")
        score = float(data.get("abuseConfidenceScore") or 0)
        reports = int(data.get("totalReports") or 0)
        keep = {k: data.get(k) for k in ("abuseConfidenceScore", "totalReports", "countryCode", "isp", "usageType", "domain", "lastReportedAt", "isTor")}
        return ProviderResult(self.name, "ok", reputation_score=max(0.0, min(100.0, score)),
                              confidence=round(min(1.0, reports / 10.0), 2),
                              summary=f"AbuseIPDB confidence {score:.0f}% from {reports} report(s)", data=keep)


class VirusTotalProvider(BaseProvider):
    name = "virustotal"
    supported_types = ("ip", "domain", "url", "hash")

    def is_configured(self):
        return bool(settings.VIRUSTOTAL_API_KEY)

    def _lookup(self, indicator, indicator_type, client):
        if indicator_type == "ip":
            path = f"ip_addresses/{indicator}"
        elif indicator_type == "domain":
            path = f"domains/{indicator}"
        elif indicator_type == "hash":
            path = f"files/{indicator}"
        else:
            path = "urls/" + base64.urlsafe_b64encode(indicator.encode()).decode().rstrip("=")
        code, body = _http_get_json(f"https://www.virustotal.com/api/v3/{path}",
                                    headers={"x-apikey": settings.VIRUSTOTAL_API_KEY}, client=client)
        bad = _status_from_code(self.name, code)
        if bad:
            return bad
        try:
            attrs = body["data"]["attributes"]
            stats = attrs["last_analysis_stats"]
            malicious = int(stats.get("malicious", 0))
            suspicious = int(stats.get("suspicious", 0))
            total = sum(int(v) for v in stats.values() if isinstance(v, (int, float)))
        except (KeyError, TypeError, ValueError):
            return ProviderResult(self.name, "error", summary="malformed provider response")
        score = 100.0 * (malicious + 0.5 * suspicious) / total if total else None
        return ProviderResult(self.name, "ok",
                              reputation_score=round(score, 1) if score is not None else None,
                              confidence=round(min(1.0, total / 60.0), 2) if total else None,
                              summary=f"VirusTotal: {malicious}/{total} engines malicious, {suspicious} suspicious",
                              data={"last_analysis_stats": stats, "reputation": attrs.get("reputation"),
                                    "last_analysis_date": attrs.get("last_analysis_date")})


class NVDProvider(BaseProvider):
    name = "nvd"
    supported_types = ("cve",)

    def is_configured(self):
        return True  # NVD works without a key (lower rate limit)

    def _lookup(self, indicator, indicator_type, client):
        headers = {"apiKey": settings.NVD_API_KEY} if settings.NVD_API_KEY else {}
        code, body = _http_get_json("https://services.nvd.nist.gov/rest/json/cves/2.0",
                                    headers=headers, params={"cveId": indicator}, client=client)
        bad = _status_from_code(self.name, code)
        if bad:
            return bad
        vulns = (body or {}).get("vulnerabilities") if isinstance(body, dict) else None
        if not isinstance(vulns, list):
            return ProviderResult(self.name, "error", summary="malformed provider response")
        if not vulns:
            return ProviderResult(self.name, "not_found", summary="CVE not found in NVD")
        cve = vulns[0].get("cve", {})
        return ProviderResult(self.name, "ok", summary="NVD CVE record", data=parse_nvd_cve(cve))


def parse_nvd_cve(cve: dict) -> dict:
    desc = next((d.get("value") for d in cve.get("descriptions", []) if d.get("lang") == "en"), None)
    score = severity = vector = None
    metrics = cve.get("metrics", {}) or {}
    for key in ("cvssMetricV31", "cvssMetricV30", "cvssMetricV2"):
        if metrics.get(key):
            m = metrics[key][0]
            cd = m.get("cvssData", {})
            score = cd.get("baseScore")
            vector = cd.get("vectorString")
            severity = cd.get("baseSeverity") or m.get("baseSeverity")
            break
    return {
        "cve_id": cve.get("id"),
        "description": desc,
        "cvss_score": score,
        "cvss_vector": vector,
        "severity": severity.lower() if isinstance(severity, str) else None,
        "published": cve.get("published"),
        "last_modified": cve.get("lastModified"),
        "known_exploited": bool(cve.get("cisaExploitAdd")),
        "references": [r.get("url") for r in cve.get("references", [])[:10] if r.get("url")],
    }


PROVIDERS = [AbuseIPDBProvider(), VirusTotalProvider(), NVDProvider()]


def provider_status() -> list:
    return [{"provider": p.name, "configured": p.is_configured(), "indicator_types": list(p.supported_types),
             "network_enabled": settings.INTEL_ENABLE_NETWORK} for p in PROVIDERS]
