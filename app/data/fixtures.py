"""High-fidelity demonstration fixtures and replay data for Delhi NCR."""

from typing import Dict, Any, List

AREAS_GEO: Dict[str, Dict[str, float]] = {
    "noida": {"lat": 28.6280, "lon": 77.3649, "name": "Noida Sector 62"},
    "anand_vihar": {"lat": 28.6469, "lon": 77.3160, "name": "Anand Vihar, Delhi"},
    "punjabi_bagh": {"lat": 28.6740, "lon": 77.1310, "name": "Punjabi Bagh, Delhi"},
    "gurugram": {"lat": 28.4595, "lon": 77.0266, "name": "Gurugram Sector 51"},
    "central_delhi": {"lat": 28.6139, "lon": 77.2090, "name": "Central Delhi"},
}

# Realistically documented stubble-burning fire hotspots in Punjab/Haryana upwind corridor
FIRE_HOTSPOTS_SAMPLE: List[Dict[str, Any]] = [
    {"id": "FIRMS-PB-01", "latitude": 30.9010, "longitude": 75.8573, "brightness": 342.5, "confidence": "high", "region": "Ludhiana, Punjab"},
    {"id": "FIRMS-PB-02", "latitude": 30.3400, "longitude": 76.3800, "brightness": 358.1, "confidence": "nominal", "region": "Patiala, Punjab"},
    {"id": "FIRMS-PB-03", "latitude": 31.1471, "longitude": 75.3412, "brightness": 331.0, "confidence": "high", "region": "Moga, Punjab"},
    {"id": "FIRMS-HR-01", "latitude": 29.9695, "longitude": 76.8783, "brightness": 329.8, "confidence": "high", "region": "Kurukshetra, Haryana"},
    {"id": "FIRMS-HR-02", "latitude": 29.6857, "longitude": 76.9905, "brightness": 344.2, "confidence": "nominal", "region": "Karnal, Haryana"},
    {"id": "FIRMS-PB-04", "latitude": 30.2110, "longitude": 74.9455, "brightness": 365.4, "confidence": "high", "region": "Bathinda, Punjab"},
    {"id": "FIRMS-HR-03", "latitude": 29.5349, "longitude": 76.0310, "brightness": 338.0, "confidence": "nominal", "region": "Jind, Haryana"},
]

# Baseline meteorological diurnal profile for North India winter
BASE_MET_PROFILE: Dict[str, Any] = {
    "wind_speed_base_ms": 2.2,  # Low winter wind speed
    "wind_direction_base_deg": 315.0,  # North-Westerly upwind plume corridor
    "pblh_day_max_m": 1200.0,  # Afternoon boundary layer maximum
    "pblh_night_min_m": 220.0,  # Nocturnal collapse under inversion
    "temp_day_max_c": 26.5,
    "temp_night_min_c": 13.0,
    "humidity_night_pct": 78.0,
    "humidity_day_pct": 42.0,
}

# Decision log pre-populated audit records
HISTORICAL_DECISIONS: List[Dict[str, Any]] = [
    {
        "id": "dec-001",
        "time": "22:00",
        "agent": "Air Watcher",
        "title": "Raised Delhi NCR risk to High.",
        "detail": "A strong inversion is forecast from +18 h and 7 active fire clusters are upwind in Punjab/Haryana.",
        "evidence_source": "Coupled Surrogate Model + NASA FIRMS MODIS",
        "risk_level": "HIGH",
        "redacted": True,
    },
    {
        "id": "dec-002",
        "time": "05:30",
        "agent": "Health Guardian",
        "title": "Chose 'stay in, light walk indoors' for Kamla.",
        "detail": "Her breathing risk is medium and outside air is very poor (AQI 380). Grounded in verified safe advice library.",
        "evidence_source": "Approved Advice Rulebook v1.2",
        "risk_level": "MODERATE",
        "redacted": True,
    },
    {
        "id": "dec-003",
        "time": "06:00",
        "agent": "Care Circle",
        "title": "Sent Hindi morning guidance to Kamla.",
        "detail": "Hindi preferred language. Verified consent for on-device prompt delivery.",
        "evidence_source": "Cedar Policy Engine Consent Grant",
        "risk_level": "LOW",
        "redacted": True,
    },
    {
        "id": "dec-004",
        "time": "10:12",
        "agent": "Health Guardian",
        "title": "Triggered 'Are you ok?' check-in.",
        "detail": "On-device breathing frequency elevated (>24 bpm) and SpO2 dipped below baseline (93%). Zero raw vitals transmitted.",
        "evidence_source": "On-Device Anomaly Detector",
        "risk_level": "HIGH",
        "redacted": True,
    },
    {
        "id": "dec-005",
        "time": "10:14",
        "agent": "Care Circle",
        "title": "Messaged caregiver Rohan.",
        "detail": "Check-in remained unanswered for 2 minutes. Transmitted coarse risk band 'HIGH' and area 'Noida' under Cedar Policy 1.",
        "evidence_source": "Step Functions Alert Ladder Stage 3",
        "risk_level": "HIGH",
        "redacted": True,
    },
]
