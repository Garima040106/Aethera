"""Pydantic schemas and data models for Saans Saathi API."""

from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field, ConfigDict


# Health Check
class HealthResponse(BaseModel):
    status: str = "healthy"
    app_name: str
    version: str
    environment: str
    bedrock_mode: str
    timestamp: str


# Forecast Models
class ForecastPoint(BaseModel):
    hour: int = Field(..., ge=0, le=72, description="Forecast step horizon in hours")
    timestamp: str
    temperature_c: float
    relative_humidity_pct: float
    wind_speed_ms: float
    wind_direction_deg: float
    boundary_layer_height_m: float
    pm25_ugm3: float
    pm10_ugm3: float
    ozone_ugm3: float
    nox_ugm3: float
    aqi_coupled: int
    aqi_category: str
    aqi_uncoupled: int
    inversion_level: Literal["Weak", "Moderate", "Strong"]
    ventilation_coefficient_m2s: float
    feedback_enhancement_aqi: int
    data_quality: str = "valid"


class ForecastResponse(BaseModel):
    area: str
    latitude: float
    longitude: float
    generated_at: str
    model_version: str = "SaansSaathi-CoupledSurrogate-v1.2"
    source_provenance: Dict[str, str]
    horizon_hours: int
    points: List[ForecastPoint]
    summary: Dict[str, Any]


# Inversion Models
class InversionPoint(BaseModel):
    hour: int
    timestamp: str
    strength: Literal["Weak", "Moderate", "Strong"]
    ventilation_coefficient: float = Field(..., description="PBLH * Wind Speed in m2/s")
    surface_temp_c: float
    air_temp_gradient_c: float
    pblh_meters: float
    trapping_risk: str


class InversionResponse(BaseModel):
    area: str
    updated_at: str
    inversion_status_now: Literal["Weak", "Moderate", "Strong"]
    peak_inversion_window: str
    proxy_notes: str
    timeline: List[InversionPoint]


# Plume Models
class FireHotspot(BaseModel):
    id: str
    latitude: float
    longitude: float
    brightness: float
    confidence: str
    region: str


class PlumeTrajectoryPoint(BaseModel):
    hour_offset: int
    latitude: float
    longitude: float
    dispersion_radius_km: float
    concentration_factor: float


class PlumeResponse(BaseModel):
    area_target: str
    updated_at: str
    estimated_arrival_hours: float
    wind_direction_cardinal: str
    fire_count_upwind: int
    hotspots: List[FireHotspot]
    plume_path: List[PlumeTrajectoryPoint]
    trapping_factor: str
    data_source: str


# Metrics Models
class HorizonMetrics(BaseModel):
    mae: float
    rmse: float
    bias: float
    r_squared: float


class MetricsResponse(BaseModel):
    model_name: str
    evaluation_period: str
    validation_method: str = "chronological_rolling_origin"
    metrics_by_horizon: Dict[str, HorizonMetrics]
    baseline_comparisons: Dict[str, Dict[str, float]]
    data_points_evaluated: int
    limitations: str


# Agent Models
class AgentStatusResponse(BaseModel):
    active_mode: Literal["bedrock", "local_deterministic"]
    bedrock_available: bool
    region: str
    configured_model: str
    agents_ready: List[str]
    guardrails_enforced: bool = True
    offline_capable: bool = True


class DecisionRecord(BaseModel):
    id: str
    time: str
    agent: str
    title: str
    detail: str
    evidence_source: str
    risk_level: str
    redacted: bool = True


class DecisionsResponse(BaseModel):
    decisions: List[DecisionRecord]
    total_count: int
    redaction_policy: str = "Cedar Privacy Policy v1.0 enforced - zero raw health telemetry stored"


# Health Event Request / Response
class HealthEventRequest(BaseModel):
    user_id: str = "kamla_noida"
    consent_given: bool = True
    sharing_enabled: bool = True
    coarse_risk_band: Literal["LOW", "MODERATE", "HIGH", "CRITICAL"]
    coarse_area: str = "Noida Sector 62"
    event_trigger: Literal["ANOMALOUS_VITALS", "NO_REPLY_CHECKIN", "MANUAL_CHECKIN", "MOTION_FALL"]
    client_timestamp: str
    notes: Optional[str] = None


class HealthEventResponse(BaseModel):
    event_id: str
    status: Literal["ACCEPTED", "REJECTED_NO_CONSENT", "DEDUPLICATED", "ESCALATED"]
    action_taken: str
    coarse_risk_band: str
    caregiver_notified: bool
    message_to_caregiver: Optional[str]
    audit_trace_id: str


# Alert Simulation Request / Response
class AlertSimulateRequest(BaseModel):
    scenario: Literal[
        "RESPIRATORY_DISTRESS_UNANSWERED",
        "INVERSION_SPIKE_MORNING_NUDGE",
        "USER_OK_CONFIRMED",
        "FALL_DETECTED_SOS_CANCELLED",
        "SOS_EMERGENCY_DISPATCH"
    ]
    sharing_enabled: bool = True
    allow_location_on_sos: bool = False
    language: Literal["hi", "en"] = "hi"


class AlertSimulateStep(BaseModel):
    step_number: int
    step_name: str
    status: str
    actor: str
    detail: str
    timestamp: str


class AlertSimulateResponse(BaseModel):
    simulation_id: str
    scenario: str
    final_state: str
    steps: List[AlertSimulateStep]
    disclaimer: str = "SIMULATION ONLY: No actual SMS, call, or 112 emergency dispatch was executed."


# Scenario Comparison Models
class ScenarioCompareRequest(BaseModel):
    area: str = "noida"
    scenario_a: str = "Coupled With Atmospheric Feedback"
    scenario_b: str = "Uncoupled Without Feedback"
    hours: int = 72


class ScenarioComparePoint(BaseModel):
    hour: int
    aqi_a: int
    aqi_b: int
    difference: int
    pblh_a: float
    pblh_b: float


class ScenarioCompareResponse(BaseModel):
    area: str
    scenario_a_name: str
    scenario_b_name: str
    peak_diff_hour: int
    peak_diff_aqi: int
    analysis: str
    timeline: List[ScenarioComparePoint]
