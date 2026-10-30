"""
Offline IP geolocation.

There is no bundled GeoIP database. A small static table of example addresses (used by the
seeded demo data) is kept for map rendering and is labelled `geo_source="static_demo_table"`.
Every other address is returned as Unknown - locations are never guessed. Private/reserved
addresses are labelled as such.

This module does NOT produce threat/reputation scores; reputation comes only from the
threat-intelligence service (app/intel) and is `None` when unknown.
"""
import ipaddress

GEO_IP_DATABASE = {
    "185.220.101.5": {"country": "Germany", "country_code": "DE", "city": "Frankfurt", "asn": "AS200651"},
    "193.142.146.210": {"country": "Russia", "country_code": "RU", "city": "Moscow", "asn": "AS49505"},
    "103.253.42.18": {"country": "China", "country_code": "CN", "city": "Beijing", "asn": "AS4134"},
    "45.154.255.88": {"country": "Netherlands", "country_code": "NL", "city": "Amsterdam", "asn": "AS60404"},
    "194.26.29.112": {"country": "Ukraine", "country_code": "UA", "city": "Kyiv", "asn": "AS200019"},
    "104.244.76.13": {"country": "United States", "country_code": "US", "city": "Chicago", "asn": "AS53667"},
    "182.61.139.88": {"country": "China", "country_code": "CN", "city": "Shenzhen", "asn": "AS23724"},
    "91.240.118.24": {"country": "Romania", "country_code": "RO", "city": "Bucharest", "asn": "AS44477"},
    "41.216.186.20": {"country": "Egypt", "country_code": "EG", "city": "Cairo", "asn": "AS8452"},
}

UNKNOWN = {"country": "Unknown", "country_code": "XX", "city": "Unknown", "asn": "Unknown"}


def enrich_ip(ip_address: str) -> dict:
    """Returns country/city/asn plus `geo_source`. `threat_score` is always None (not a reputation source)."""
    if ip_address in GEO_IP_DATABASE:
        return dict(GEO_IP_DATABASE[ip_address], geo_source="static_demo_table", threat_score=None)
    try:
        addr = ipaddress.ip_address(ip_address)
        if not addr.is_global:
            return dict(UNKNOWN, country="Private/Reserved", geo_source="reserved_range", threat_score=None)
    except ValueError:
        pass
    return dict(UNKNOWN, geo_source="unavailable", threat_score=None)
