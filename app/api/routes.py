"""API route handlers for Saans Saathi."""

from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Query, HTTPException

from app.core.config import settings
from app.core.bedrock import bedrock_provider
from app.schemas.models import (
    HealthResponse,
    ForecastResponse,
    InversionResponse,
    PlumeResponse,
    MetricsResponse,
    AgentStatusResponse,
    DecisionsResponse,
    HealthEventRequest,
    HealthEventResponse,
    AlertSimulateRequest,
    AlertSimulateResponse,
    ScenarioCompareRequest,
    ScenarioCompareResponse,
    ScenarioComparePoint,
)
from app.services.forecast import forecast_service
from app.services.inversion import inversion_service
from app.services.plume_tracker import plume_tracker
from app.services.risk_engine import risk_engine
from app.ml.evaluation import evaluation_engine
from app.ml.coupled_surrogate import coupled_surrogate
from app.agents.coordinator import coordinator
from app.workflows.alert_ladder import alert_ladder

router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["Health"])
def get_health():
    """Service health and operational mode status."""
    return HealthResponse(
        status="healthy",
        app_name=settings.APP_NAME,
        version=settings.APP_VERSION,
        environment=settings.APP_ENV,
        bedrock_mode="bedrock_live" if bedrock_provider.is_available() else "local_deterministic_fallback",
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/api/forecast", response_model=ForecastResponse, tags=["Environmental Forecast"])
def get_forecast(
    area: str = Query(default="noida", description="Delhi NCR district/station (e.g. noida, anand_vihar, gurugram)"),
    hours: int = Query(default=72, ge=1, le=72, description="Forecast horizon steps in hours"),
):
    """
    72-hour coupled environmental forecast connecting meteorology and air pollutants.
    """
    return forecast_service.get_forecast(area=area, hours=hours)


@router.get("/api/inversion", response_model=InversionResponse, tags=["Inversion & Stability"])
def get_inversion(
    area: str = Query(default="noida", description="Target Delhi NCR area"),
):
    """
    Atmospheric thermal inversion strength and ventilation coefficient indicators.
    """
    return inversion_service.get_inversion_status(area=area)


@router.get("/api/plumes", response_model=PlumeResponse, tags=["Smoke Plumes"])
def get_plumes(
    area: str = Query(default="noida", description="Target Delhi NCR area"),
):
    """
    Active stubble burning fire clusters and forward smoke plume trajectory to NCR.
    """
    return plume_tracker.get_plume_trajectory(area=area)


@router.get("/api/metrics", response_model=MetricsResponse, tags=["Model Validation"])
def get_metrics():
    """
    Model evaluation metrics and baseline comparisons across forecast horizons.
    """
    return evaluation_engine.compute_metrics()


@router.get("/api/agents/status", response_model=AgentStatusResponse, tags=["Multi-Agent Intelligence"])
def get_agent_status():
    """
    Availability of Strands AI Agents and Bedrock foundation models.
    """
    status = bedrock_provider.get_status()
    return AgentStatusResponse(
        active_mode=status["active_mode"],
        bedrock_available=status["bedrock_available"],
        region=status["region"],
        configured_model=status["configured_model"],
        agents_ready=["Air Watcher", "Health Guardian", "Care Circle", "Master Coordinator"],
        guardrails_enforced=True,
        offline_capable=True,
    )


@router.get("/api/decisions", response_model=DecisionsResponse, tags=["Audit & Transparency"])
def get_decisions():
    """
    Recent agent decision records with Cedar-redacted privacy controls.
    """
    return coordinator.get_decisions()


@router.post("/api/events/health", response_model=HealthEventResponse, tags=["Privacy & Health Intake"])
def post_health_event(event: HealthEventRequest):
    """
    Intake for consent-validated coarse health events. Raw vitals are rejected.
    """
    return risk_engine.evaluate_health_event(event)


@router.post("/api/alerts/simulate", response_model=AlertSimulateResponse, tags=["Alert Ladder"])
def post_alert_simulate(request: AlertSimulateRequest):
    """
    Executes an idempotent simulation of the Step Functions alert escalation ladder.
    """
    return alert_ladder.simulate(request)


@router.post("/api/scenarios/compare", response_model=ScenarioCompareResponse, tags=["Scenario Modeling"])
def compare_scenarios(req: ScenarioCompareRequest):
    """
    Compare coupled atmospheric feedback vs uncoupled independent baseline.
    """
    points_coupled = coupled_surrogate.run_72h_forecast(area=req.area, hours=req.hours, enable_feedback=True)
    points_uncoupled = coupled_surrogate.run_72h_forecast(area=req.area, hours=req.hours, enable_feedback=False)

    timeline = []
    max_diff = 0
    max_diff_hour = 0

    for pc, pu in zip(points_coupled, points_uncoupled):
        diff = pc.aqi_coupled - pu.aqi_coupled
        if diff > max_diff:
            max_diff = diff
            max_diff_hour = pc.hour

        timeline.append(
            ScenarioComparePoint(
                hour=pc.hour,
                aqi_a=pc.aqi_coupled,
                aqi_b=pu.aqi_coupled,
                difference=diff,
                pblh_a=pc.boundary_layer_height_m,
                pblh_b=pu.boundary_layer_height_m,
            )
        )

    analysis = (
        f"Coupled feedback predicts a severe peak AQI of {points_coupled[max_diff_hour].aqi_coupled} at +{max_diff_hour}h. "
        f"The uncoupled baseline predicts only {points_uncoupled[max_diff_hour].aqi_coupled}, "
        f"missing a massive spike of +{max_diff} AQI points because it ignores smoke-induced boundary layer suppression."
    )

    return ScenarioCompareResponse(
        area=req.area,
        scenario_a_name="Coupled With Atmospheric Feedback (Aethera / Saans Saathi)",
        scenario_b_name="Uncoupled Without Weather-Smoke Feedback",
        peak_diff_hour=max_diff_hour,
        peak_diff_aqi=max_diff,
        analysis=analysis,
        timeline=timeline,
    )
