import math
import base64
import binascii
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

class DomainIntelligenceService:
    """
    Comprehensive Domain & DNS Intelligence Suite:
    1. Passive DNS (PDNS) History & DGA Entropy Detection
    2. DNSSEC & DNS Tunneling Analyzer (TTL & Payload Decoder)
    3. Certificate Transparency (CT) Logs & Wildcard/Private CA Detection
    4. WHOIS Registration Forensics & Brand Typosquatting Detector
    """

    TOP_BRANDS = [
        "paypal", "microsoft", "google", "apple", "amazon", 
        "github", "netflix", "facebook", "twitter", "linkedin",
        "chase", "bankofamerica", "wellsfargo", "coinbase", "binance",
        "cyvantis", "cloudflare", "dropbox", "salesforce", "adobe"
    ]

    @staticmethod
    def calculate_shannon_entropy(text: str) -> float:
        """Calculates Shannon Entropy of a string to detect DGA beacons."""
        if not text:
            return 0.0
        prob_dict = {}
        for char in text:
            prob_dict[char] = prob_dict.get(char, 0) + 1
        
        entropy = 0.0
        text_len = len(text)
        for count in prob_dict.values():
            p = count / text_len
            entropy -= p * math.log2(p)
        return round(entropy, 3)

    @staticmethod
    def levenshtein_distance(s1: str, s2: str) -> int:
        """Calculates edit distance between two domain labels."""
        if len(s1) < len(s2):
            return DomainIntelligenceService.levenshtein_distance(s2, s1)
        if len(s2) == 0:
            return len(s1)

        previous_row = range(len(s2) + 1)
        for i, c1 in enumerate(s1):
            current_row = [i + 1]
            for j, c2 in enumerate(s2):
                insertions = previous_row[j + 1] + 1
                deletions = current_row[j] + 1
                substitutions = previous_row[j] + (c1 != c2)
                current_row.append(min(insertions, deletions, substitutions))
            previous_row = current_row

        return previous_row[-1]

    # -------------------------------------------------------------
    # A. PASSIVE DNS (PDNS) HISTORY & TIMELINE
    # -------------------------------------------------------------
    @classmethod
    def get_passive_dns_history(cls, domain: str) -> Dict[str, Any]:
        clean_domain = domain.strip().lower()
        now = datetime.utcnow()

        # Simulated 90-day resolution timeline
        a_record_history = [
            {
                "ip": "185.220.101.5",
                "record_type": "A",
                "first_seen": (now - timedelta(days=5)).strftime("%Y-%m-%d"),
                "last_seen": now.strftime("%Y-%m-%d"),
                "asn": "AS13335 Cloudflare",
                "country": "Netherlands",
                "status": "ACTIVE_CURRENT"
            },
            {
                "ip": "193.142.146.210",
                "record_type": "A",
                "first_seen": (now - timedelta(days=28)).strftime("%Y-%m-%d"),
                "last_seen": (now - timedelta(days=6)).strftime("%Y-%m-%d"),
                "asn": "AS8075 Microsoft Corp",
                "country": "Russia",
                "status": "HISTORICAL"
            },
            {
                "ip": "103.253.42.18",
                "record_type": "A",
                "first_seen": (now - timedelta(days=65)).strftime("%Y-%m-%d"),
                "last_seen": (now - timedelta(days=29)).strftime("%Y-%m-%d"),
                "asn": "AS4134 China Telecom",
                "country": "China",
                "status": "HISTORICAL"
            },
            {
                "ip": "2a01:4f8:c010:1234::1",
                "record_type": "AAAA",
                "first_seen": (now - timedelta(days=90)).strftime("%Y-%m-%d"),
                "last_seen": now.strftime("%Y-%m-%d"),
                "asn": "AS24940 Hetzner Online",
                "country": "Germany",
                "status": "ACTIVE_IPV6"
            }
        ]

        # CNAME Resolution Chain
        cname_chain = [
            {"node": f"mail.{clean_domain}", "type": "CNAME", "target": f"mx01.relay.{clean_domain}"},
            {"node": f"mx01.relay.{clean_domain}", "type": "CNAME", "target": "edge-cluster.mailprovider.net"},
            {"node": "edge-cluster.mailprovider.net", "type": "A", "target": "198.51.100.22"}
        ]

        # Subdomains discovered
        subdomains = [
            {"subdomain": f"api.{clean_domain}", "ip": "185.220.101.5", "status": "LIVE", "ports": [443, 8443]},
            {"subdomain": f"admin.{clean_domain}", "ip": "185.220.101.12", "status": "RESTRICTED_VPN", "ports": [22, 443]},
            {"subdomain": f"dev.{clean_domain}", "ip": "10.0.4.15", "status": "INTERNAL", "ports": [8080]},
            {"subdomain": f"staging.{clean_domain}", "ip": "10.0.4.22", "status": "INTERNAL", "ports": [3000, 8080]},
            {"subdomain": f"auth.{clean_domain}", "ip": "185.220.101.8", "status": "LIVE_SSO", "ports": [443]}
        ]

        # DGA Entropy Check on domain labels
        labels = clean_domain.split(".")
        main_label = labels[0]
        entropy_score = cls.calculate_shannon_entropy(main_label)
        is_dga = entropy_score > 3.6 or (len(main_label) > 10 and not any(v in main_label for v in "aeiou"))

        return {
            "domain": clean_domain,
            "query_timestamp": now.isoformat(),
            "records_evaluated_90d": len(a_record_history),
            "a_record_history": a_record_history,
            "cname_chain": cname_chain,
            "subdomains_discovered": subdomains,
            "dga_analysis": {
                "main_label": main_label,
                "shannon_entropy": entropy_score,
                "is_dga_candidate": is_dga,
                "risk_rating": "CRITICAL_DGA_BEACON" if is_dga else "NORMAL_LEXICAL",
                "details": "High Shannon entropy indicates algorithmic random character dispersion typical of malware C2 DGA fallback seeds." if is_dga else "Normal lexical structure consistent with human-readable branding."
            }
        }

    # -------------------------------------------------------------
    # B. DNSSEC & DNS TUNNELING ANALYZER
    # -------------------------------------------------------------
    @classmethod
    def analyze_dnssec_and_tunneling(cls, domain: str) -> Dict[str, Any]:
        clean_domain = domain.strip().lower()

        # Simulated live dig/kdig checks
        has_dnssec = "gov" in clean_domain or "mil" in clean_domain or "cyvantis" in clean_domain
        simulated_ttl = 60 if "malware" in clean_domain or "tunnel" in clean_domain else 3600
        fast_flux_indicated = simulated_ttl <= 120

        sample_tunnel_queries = [
            f"aGVsbG8gd29ybGQgZXhmaWwgdGVzdA.data.{clean_domain}",
            f"cm9vdDokNiRrcm43YmFzZTY0c2hhZG93.chunk1.{clean_domain}",
            f"NDg2NWZjMjBkYTcxOWZkYzRhOGJhZTcy.chunk2.{clean_domain}"
        ]

        avg_subdomain_length = sum(len(q.split(".")[0]) for q in sample_tunnel_queries) // len(sample_tunnel_queries)
        tunneling_detected = avg_subdomain_length > 25

        return {
            "domain": clean_domain,
            "dnssec_status": {
                "is_signed": has_dnssec,
                "rrsig_present": has_dnssec,
                "dnskey_algorithm": "RSASHA256 (Algorithm 8)" if has_dnssec else "NONE",
                "validation_status": "SECURE_VALIDATED" if has_dnssec else "INSECURE_UNSIGNED",
                "validation_notes": "Zone contains valid RRSIG and DS records matching root trust anchor." if has_dnssec else "Zone lacks cryptographic signing (vulnerable to DNS spoofing / cache poisoning)."
            },
            "ttl_analysis": {
                "record_ttl_seconds": simulated_ttl,
                "is_fast_flux": fast_flux_indicated,
                "rotation_risk": "HIGH_C2_ROTATION_RISK" if fast_flux_indicated else "STABLE_STANDARD",
                "implication": "Ultra-low TTL (<= 120s) is commonly observed in fast-flux botnet C2 nodes designed to evade IP blocklists." if fast_flux_indicated else "Standard enterprise TTL caching profile."
            },
            "tunneling_detection": {
                "tunneling_detected": tunneling_detected,
                "query_frequency_per_minute": 240 if tunneling_detected else 12,
                "average_query_length": avg_subdomain_length,
                "sample_queries": sample_tunnel_queries,
                "protocol_signature": "DNS_TUNNEL_EXFIL_BASE64" if tunneling_detected else "STANDARD_LOOKUP",
                "mitre_technique": "T1071.004 - Application Layer Protocol: DNS",
                "confidence": 0.98 if tunneling_detected else 0.15
            }
        }

    @classmethod
    def decode_tunnel_payload(cls, query: str) -> Dict[str, Any]:
        """Attempts Base64 and Hex decoding of exfiltrated data inside DNS queries."""
        subdomain = query.split(".")[0]
        decoded_text = ""
        decode_type = "UNKNOWN"

        # Try Base64
        try:
            padded = subdomain + "=" * ((4 - len(subdomain) % 4) % 4)
            b64_bytes = base64.b64decode(padded)
            decoded_candidate = b64_bytes.decode('utf-8', errors='ignore')
            if any(c.isalnum() for c in decoded_candidate):
                decoded_text = decoded_candidate
                decode_type = "BASE64"
        except Exception:
            pass

        # Try Hex if Base64 produced nothing readable
        if not decoded_text:
            try:
                hex_bytes = binascii.unhexlify(subdomain)
                decoded_candidate = hex_bytes.decode('utf-8', errors='ignore')
                if any(c.isalnum() for c in decoded_candidate):
                    decoded_text = decoded_candidate
                    decode_type = "HEXADECIMAL"
            except Exception:
                pass

        if not decoded_text:
            decoded_text = f"Decoded raw binary chunk: [{subdomain[:12]}...]"
            decode_type = "BINARY_FRAGMENT"

        return {
            "raw_query": query,
            "extracted_subdomain": subdomain,
            "encoding_type": decode_type,
            "decoded_content": decoded_text,
            "threat_classification": "ACTIVE_DATA_EXFILTRATION_PAYLOAD",
            "recommended_action": "Block recursive query resolver at perimeter firewall; isolate source endpoint."
        }

    # -------------------------------------------------------------
    # C. CERTIFICATE TRANSPARENCY (CT) LOGS & WILDCARD AUDIT
    # -------------------------------------------------------------
    @classmethod
    def get_certificate_transparency_history(cls, domain: str) -> Dict[str, Any]:
        clean_domain = domain.strip().lower()
        now = datetime.utcnow()

        certificates = [
            {
                "id": "ct-cert-901",
                "common_name": f"*.{clean_domain}",
                "san_entries": [f"*.{clean_domain}", clean_domain],
                "issuer": "Let's Encrypt Authority X3",
                "valid_from": (now - timedelta(days=40)).strftime("%Y-%m-%d"),
                "valid_to": (now + timedelta(days=50)).strftime("%Y-%m-%d"),
                "is_wildcard": True,
                "is_private_ca": False,
                "ct_log_source": "Google Argon2026 CT Log",
                "status": "VALID_ACTIVE"
            },
            {
                "id": "ct-cert-854",
                "common_name": f"api.{clean_domain}",
                "san_entries": [f"api.{clean_domain}"],
                "issuer": "DigiCert Global Root G2",
                "valid_from": (now - timedelta(days=200)).strftime("%Y-%m-%d"),
                "valid_to": (now - timedelta(days=20)).strftime("%Y-%m-%d"),
                "is_wildcard": False,
                "is_private_ca": False,
                "ct_log_source": "Cloudflare Nimbus2025 CT Log",
                "status": "EXPIRED"
            },
            {
                "id": "ct-cert-712",
                "common_name": f"c2-internal.{clean_domain}",
                "san_entries": [f"c2-internal.{clean_domain}"],
                "issuer": "Custom Internal Untrusted CA (CN=Sliver-C2-Authority)",
                "valid_from": (now - timedelta(days=12)).strftime("%Y-%m-%d"),
                "valid_to": (now + timedelta(days=350)).strftime("%Y-%m-%d"),
                "is_wildcard": False,
                "is_private_ca": True,
                "ct_log_source": "Self-Signed / Non-Logged Private Root",
                "status": "UNTRUSTED_PRIVATE_CA"
            }
        ]

        has_wildcard = any(c["is_wildcard"] for c in certificates)
        has_private_ca = any(c["is_private_ca"] for c in certificates)

        return {
            "domain": clean_domain,
            "total_certificates_found": len(certificates),
            "certificates": certificates,
            "audit_flags": {
                "wildcard_detected": has_wildcard,
                "private_ca_detected": has_private_ca,
                "certificate_mismatch_detected": False,
                "security_alert": "Wildcard certificate (*.domain) detected alongside Private CA. Potential compromised internal staging node or covert C2 deployment." if (has_wildcard and has_private_ca) else "Standard certificate issuance log."
            }
        }

    # -------------------------------------------------------------
    # D. WHOIS REGISTRATION FORENSICS & TYPOSQUATTING
    # -------------------------------------------------------------
    @classmethod
    def get_whois_and_typosquatting(cls, domain: str) -> Dict[str, Any]:
        clean_domain = domain.strip().lower()
        now = datetime.utcnow()

        # Simulated registration metadata
        created_date = now - timedelta(days=4 if "phish" in clean_domain or "test" in clean_domain else 420)
        days_old = (now - created_date).days
        is_young = days_old < 7

        # Typosquatting Analysis against Top Brands
        target_name = clean_domain.split(".")[0]
        typosquats = []

        for brand in cls.TOP_BRANDS:
            dist = cls.levenshtein_distance(target_name, brand)
            if dist == 1 or (dist == 2 and len(target_name) >= 6):
                typosquats.append({
                    "targeted_brand": brand,
                    "levenshtein_distance": dist,
                    "technique": "Omission / Substitution / Homoglyph" if dist == 1 else "Permutation",
                    "threat_level": "CRITICAL_PHISHING_IMPERSONATION"
                })

        return {
            "domain": clean_domain,
            "whois_records": {
                "registrar": "NameCheap, Inc." if is_young else "MarkMonitor Inc.",
                "created_date": created_date.strftime("%Y-%m-%d"),
                "domain_age_days": days_old,
                "is_newly_registered": is_young,
                "privacy_masking": {
                    "is_masked": True,
                    "service": "Withheld for Privacy Purposes (PrivacyGuardian.org)",
                    "registrant_country": "Iceland (1773 IS)"
                },
                "nameservers": [
                    {"ns": "ns1.cloudflare.com", "reputation": "FREE_PUBLIC_DNS_PROVIDER"},
                    {"ns": "ns2.cloudflare.com", "reputation": "FREE_PUBLIC_DNS_PROVIDER"}
                ],
                "throwaway_domain_risk": "HIGH_THROWAWAY_PROBABILITY" if is_young else "LOW_ENTERPRISE_ASSET"
            },
            "typosquatting_analysis": {
                "is_typosquat": len(typosquats) > 0,
                "matches": typosquats,
                "brand_impersonation_risk": "CRITICAL" if typosquats else "CLEAN"
            }
        }
