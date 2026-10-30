"""
Explainable risk scoring.

Each factor is normalised to [0, 1]. Missing factors are *excluded* (weights renormalised)
and reported in `missing_factors`; `uncertainty` is the share of total weight that was
missing. Nothing is silently defaulted.

  severity       S = max alert severity  (low .25, medium .5, high .75, critical 1.0)
  confidence     C = noisy-OR of per-rule confidences, one value per *distinct rule*
                     1 - prod(1 - c_r)   (repeated alerts from the same rule do not add up,
                     which avoids double-counting correlated evidence)
  threat_intel   T = best reputation / 100 across involved indicators (local IOC or cached
                     provider result). Missing if no intel exists.
  asset          A = criticality / 5 of the targeted asset (matched by dst_ip). Missing if
                     the target is not in the asset inventory.
  exploitability V = max CVSS / 10 of CVEs referenced by alerts or affecting the asset.
                     Missing if no CVE context.
  exposure       E = internet 1.0, internal 0.6, isolated 0.3 (from asset inventory).
  scope          B = min(1, log2(1 + distinct_rules + distinct_sessions - 1) / 3)
  recurrence     R = 1.0 if last activity < 15 min ago, 0.6 if < 1 h, 0.3 if < 24 h, else 0.1;
                     plus 0.1 bonus (capped at 1) when occurrences >= 10.

  inherent = 100 * sum(w_i * f_i) / sum(w_i)  over available factors
  residual = 0 if the incident/alert is resolved or marked false positive, else inherent
             (no automated containment exists, so no other mitigation is assumed).

Priority: >= critical_threshold -> critical, >= high -> high, >= medium -> medium, else low.
"""
import datetime
import math
from dataclasses import dataclass, field
from typing import Dict, Iterable, List, Optional

SEVERITY_VALUE = {"low": 0.25, "medium": 0.5, "high": 0.75, "critical": 1.0}
EXPOSURE_VALUE = {"internet": 1.0, "internal": 0.6, "isolated": 0.3}

DEFAULT_WEIGHTS = {
    "severity": 0.25,
    "confidence": 0.20,
    "threat_intel": 0.15,
    "asset": 0.10,
    "exploitability": 0.10,
    "exposure": 0.05,
    "scope": 0.10,
    "recurrence": 0.05,
}
DEFAULT_THRESHOLDS = {"critical": 80.0, "high": 60.0, "medium": 35.0}

FACTOR_LABELS = {
    "severity": "Detection severity",
    "confidence": "Combined detection confidence",
    "threat_intel": "Threat-intel reputation",
    "asset": "Asset criticality",
    "exploitability": "Vulnerability exploitability (CVSS)",
    "exposure": "Asset exposure",
    "scope": "Incident scope (rules/sessions)",
    "recurrence": "Ongoing / repeated activity",
}


@dataclass
class RiskInput:
    severities: List[str] = field(default_factory=list)
    rule_confidences: Dict[str, float] = field(default_factory=dict)  # rule -> confidence
    intel_score: Optional[float] = None  # 0-100
    asset_criticality: Optional[int] = None  # 1-5
    cvss_max: Optional[float] = None  # 0-10
    exposure: Optional[str] = None
    distinct_sessions: int = 0
    occurrences: int = 1
    last_seen: Optional[datetime.datetime] = None
    status: str = "open"
    now: Optional[datetime.datetime] = None


def priority_for(score: float, thresholds: Dict[str, float] = None) -> str:
    t = thresholds or DEFAULT_THRESHOLDS
    if score >= t["critical"]:
        return "critical"
    if score >= t["high"]:
        return "high"
    if score >= t["medium"]:
        return "medium"
    return "low"


def noisy_or(values: Iterable[float]) -> float:
    p = 1.0
    for v in values:
        p *= 1.0 - max(0.0, min(1.0, float(v)))
    return 1.0 - p


def compute_risk(inp: RiskInput, weights: Dict[str, float] = None, thresholds: Dict[str, float] = None) -> Dict:
    w = dict(DEFAULT_WEIGHTS, **(weights or {}))
    now = inp.now or datetime.datetime.utcnow()
    f: Dict[str, Optional[float]] = {}

    sev_vals = [SEVERITY_VALUE[s] for s in inp.severities if s in SEVERITY_VALUE]
    f["severity"] = max(sev_vals) if sev_vals else None
    f["confidence"] = round(noisy_or(inp.rule_confidences.values()), 4) if inp.rule_confidences else None
    f["threat_intel"] = max(0.0, min(1.0, inp.intel_score / 100.0)) if inp.intel_score is not None else None
    f["asset"] = max(0.2, min(1.0, inp.asset_criticality / 5.0)) if inp.asset_criticality else None
    f["exploitability"] = max(0.0, min(1.0, inp.cvss_max / 10.0)) if inp.cvss_max is not None else None
    f["exposure"] = EXPOSURE_VALUE.get(inp.exposure) if inp.exposure else None
    breadth = max(1, len(inp.rule_confidences)) + max(0, inp.distinct_sessions - 1)
    f["scope"] = round(min(1.0, math.log2(1 + breadth) / 3.0), 4)
    if inp.last_seen:
        age = (now - inp.last_seen).total_seconds()
        rec = 1.0 if age < 900 else 0.6 if age < 3600 else 0.3 if age < 86400 else 0.1
        if inp.occurrences >= 10:
            rec = min(1.0, rec + 0.1)
        f["recurrence"] = rec
    else:
        f["recurrence"] = None

    available = {k: v for k, v in f.items() if v is not None and w.get(k, 0) > 0}
    missing = [k for k, v in f.items() if v is None and w.get(k, 0) > 0]
    total_w = sum(w[k] for k in available)
    inherent = 100.0 * sum(w[k] * v for k, v in available.items()) / total_w if total_w else 0.0
    inherent = round(max(0.0, min(100.0, inherent)), 1)
    residual = 0.0 if inp.status in ("resolved", "false_positive") else inherent
    all_w = sum(v for v in w.values() if v > 0)
    uncertainty = round(sum(w[k] for k in missing) / all_w, 3) if all_w else 1.0

    contributions = sorted(
        ({"factor": k, "label": FACTOR_LABELS[k], "value": round(v, 3), "weight": w[k],
          "points": round(100.0 * w[k] * v / total_w, 1)} for k, v in available.items()),
        key=lambda c: -c["points"])
    priority = priority_for(residual, thresholds)
    top = ", ".join(f"{c['label']} ({c['points']} pts)" for c in contributions[:3])
    explanation = f"Risk {residual:.0f}/100 ({priority.upper()}). Main drivers: {top or 'none'}."
    if missing:
        explanation += f" Not available: {', '.join(FACTOR_LABELS[m] for m in missing)} (uncertainty {uncertainty:.0%})."
    if inp.status in ("resolved", "false_positive"):
        explanation += f" Residual risk is 0 because status is '{inp.status}' (inherent {inherent:.0f})."

    return {
        "inherent_score": inherent,
        "residual_score": round(residual, 1),
        "priority": priority,
        "factors": f,
        "contributions": contributions,
        "missing_factors": missing,
        "uncertainty": uncertainty,
        "weights": w,
        "explanation": explanation,
    }
