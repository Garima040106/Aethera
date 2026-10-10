"""Automated API integration test suite."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app_name"] == "Saans Saathi API"
    assert "timestamp" in data


def test_forecast_72h_endpoint():
    response = client.get("/api/forecast?area=noida&hours=72")
    assert response.status_code == 200
    data = response.json()
    assert data["horizon_hours"] == 72
    assert len(data["points"]) == 73  # hour 0 to 72 inclusive
    assert data["summary"]["peak_aqi"] >= 300
    assert data["points"][0]["hour"] == 0
    assert data["points"][-1]["hour"] == 72
    # Verify both coupled and uncoupled curves are present
    assert "aqi_coupled" in data["points"][30]
    assert "aqi_uncoupled" in data["points"][30]


def test_inversion_endpoint():
    response = client.get("/api/inversion?area=noida")
    assert response.status_code == 200
    data = response.json()
    assert data["inversion_status_now"] in ("Weak", "Moderate", "Strong")
    assert len(data["timeline"]) > 0
    assert "ventilation_coefficient" in data["timeline"][0]


def test_plumes_endpoint():
    response = client.get("/api/plumes?area=noida")
    assert response.status_code == 200
    data = response.json()
    assert data["fire_count_upwind"] > 0
    assert len(data["hotspots"]) > 0
    assert len(data["plume_path"]) > 0
    assert data["estimated_arrival_hours"] > 0


def test_metrics_endpoint():
    response = client.get("/api/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "0-24h" in data["metrics_by_horizon"]
    assert "Persistence Baseline" in data["baseline_comparisons"]
    assert "Coupled Surrogate (Saans Saathi)" in data["baseline_comparisons"]


def test_agent_status_endpoint():
    response = client.get("/api/agents/status")
    assert response.status_code == 200
    data = response.json()
    assert data["active_mode"] in ("bedrock", "local_deterministic")
    assert "Air Watcher" in data["agents_ready"]
    assert "Coordinator" in data["agents_ready"] or "Master Coordinator" in data["agents_ready"]


def test_decisions_endpoint():
    response = client.get("/api/decisions")
    assert response.status_code == 200
    data = response.json()
    assert data["total_count"] > 0
    assert len(data["decisions"]) > 0
    assert data["decisions"][0]["redacted"] is True


def test_health_event_intake_consent_granted():
    payload = {
        "user_id": "kamla_noida",
        "consent_given": True,
        "sharing_enabled": True,
        "coarse_risk_band": "HIGH",
        "coarse_area": "Noida Sector 62",
        "event_trigger": "ANOMALOUS_VITALS",
        "client_timestamp": "10:10:00 AM",
    }
    response = client.post("/api/events/health", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("ACCEPTED", "ESCALATED", "DEDUPLICATED")
    assert "audit_trace_id" in data


def test_health_event_intake_consent_denied():
    payload = {
        "user_id": "kamla_noida",
        "consent_given": False,
        "sharing_enabled": False,
        "coarse_risk_band": "HIGH",
        "coarse_area": "Noida Sector 62",
        "event_trigger": "ANOMALOUS_VITALS",
        "client_timestamp": "10:10:00 AM",
    }
    response = client.post("/api/events/health", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "REJECTED_NO_CONSENT"
    assert data["caregiver_notified"] is False


def test_alert_simulate_endpoint():
    payload = {
        "scenario": "RESPIRATORY_DISTRESS_UNANSWERED",
        "sharing_enabled": True,
        "allow_location_on_sos": False,
        "language": "hi",
    }
    response = client.post("/api/alerts/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["steps"]) >= 4
    assert data["final_state"] == "CAREGIVER_NOTIFIED_STANDBY"


def test_scenario_compare_endpoint():
    payload = {
        "area": "noida",
        "scenario_a": "Coupled With Atmospheric Feedback",
        "scenario_b": "Uncoupled Without Feedback",
        "hours": 72,
    }
    response = client.post("/api/scenarios/compare", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["peak_diff_aqi"] > 0
    assert len(data["timeline"]) == 73
