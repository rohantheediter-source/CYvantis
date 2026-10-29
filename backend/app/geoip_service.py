import random

GEO_IP_DATABASE = {
    "185.220.101.5": {"country": "Germany", "country_code": "DE", "city": "Frankfurt", "asn": "AS200651 Tor Exit Node", "score": 95},
    "193.142.146.210": {"country": "Russia", "country_code": "RU", "city": "Moscow", "asn": "AS49505 OOO Network", "score": 90},
    "103.253.42.18": {"country": "China", "country_code": "CN", "city": "Beijing", "asn": "AS4134 CHINANET", "score": 88},
    "45.154.255.88": {"country": "Netherlands", "country_code": "NL", "city": "Amsterdam", "asn": "AS60404 Hostinger", "score": 78},
    "194.26.29.112": {"country": "Ukraine", "country_code": "UA", "city": "Kyiv", "asn": "AS200019 VPS Corp", "score": 85},
    "104.244.76.13": {"country": "United States", "country_code": "US", "city": "Chicago", "asn": "AS53667 Frantech", "score": 72},
    "182.61.139.88": {"country": "China", "country_code": "CN", "city": "Shenzhen", "asn": "AS23724 Tencent Cloud", "score": 82},
    "91.240.118.24": {"country": "Romania", "country_code": "RO", "city": "Bucharest", "asn": "AS44477 HostSailor", "score": 80},
    "198.51.100.44": {"country": "Brazil", "country_code": "BR", "city": "São Paulo", "asn": "AS28573 Telecom", "score": 65},
    "41.216.186.20": {"country": "Egypt", "country_code": "EG", "city": "Cairo", "asn": "AS8452 TE Data", "score": 70},
}

COUNTRY_FALLBACKS = [
    ("United States", "US", "New York", "AS15169 Google Cloud"),
    ("Germany", "DE", "Berlin", "AS24940 Hetzner"),
    ("Russia", "RU", "Saint Petersburg", "AS12389 Rostelecom"),
    ("China", "CN", "Shanghai", "AS4808 China Unicom"),
    ("Netherlands", "NL", "Rotterdam", "AS16276 OVH"),
    ("United Kingdom", "GB", "London", "AS5607 British Telecom"),
    ("France", "FR", "Paris", "AS12876 Online SAS"),
    ("Japan", "JP", "Tokyo", "AS2514 NTT Communications"),
    ("Brazil", "BR", "Rio de Janeiro", "AS28573 Claro"),
    ("India", "IN", "Mumbai", "AS55836 Reliance Jio"),
]

def enrich_ip(ip_address: str) -> dict:
    """Enrich IP with Geolocation, ASN, and Threat Score"""
    if ip_address in GEO_IP_DATABASE:
        data = GEO_IP_DATABASE[ip_address]
        return {
            "country": data["country"],
            "country_code": data["country_code"],
            "city": data["city"],
            "asn": data["asn"],
            "threat_score": data["score"]
        }
    
    # Deterministic hash lookup for unmapped IPs so same IP yields consistent geo
    hash_val = sum(ord(c) for c in ip_address)
    country, code, city, asn = COUNTRY_FALLBACKS[hash_val % len(COUNTRY_FALLBACKS)]
    score = 40 + (hash_val % 55)

    return {
        "country": country,
        "country_code": code,
        "city": city,
        "asn": asn,
        "threat_score": score
    }
