"""Privacy, Safety, and Cedar Policy Engine Tests."""

from app.core.cedar_policy import policy_evaluator
from app.services.risk_engine import risk_engine
from app.schemas.models import HealthEventRequest


def test_cedar_policy_strictly_forbids_raw_vitals():
    permitted, reason = policy_evaluator.evaluate(
        principal_role="Caregiver",
        action="ViewRawVitals",
        resource_type="HealthProfile",
        context={"sharing_enabled": True},
    )
    assert permitted is False
    assert "FORBID" in reason


def test_cedar_policy_coarse_risk_band_permission():
    # Permitted when sharing is enabled
    permitted, reason = policy_evaluator.evaluate(
        principal_role="Caregiver",
        action="ViewCoarseRiskBand",
        resource_type="HealthProfile",
        context={"sharing_enabled": True},
    )
    assert permitted is True
    assert "PERMIT" in reason

    # Denied when sharing is disabled
    permitted, reason = policy_evaluator.evaluate(
        principal_role="Caregiver",
        action="ViewCoarseRiskBand",
        resource_type="HealthProfile",
        context={"sharing_enabled": False},
    )
    assert permitted is False
    assert "DENY" in reason


def test_cedar_location_only_on_sos():
    # Denied during normal routine
    permitted, _ = policy_evaluator.evaluate(
        principal_role="Caregiver",
        action="ViewExactLocation",
        resource_type="Location",
        context={"is_sos_active": False, "allow_location_on_sos": False},
    )
    assert permitted is False

    # Permitted during active SOS with explicit user consent
    permitted, _ = policy_evaluator.evaluate(
        principal_role="Caregiver",
        action="ViewExactLocation",
        resource_type="Location",
        context={"is_sos_active": True, "allow_location_on_sos": True},
    )
    assert permitted is True


def test_event_deduplication():
    event = HealthEventRequest(
        user_id="dedup_test_user",
        consent_given=True,
        sharing_enabled=True,
        coarse_risk_band="HIGH",
        coarse_area="Noida",
        event_trigger="ANOMALOUS_VITALS",
        client_timestamp="11:00:00 AM",
    )
    res1 = risk_engine.evaluate_health_event(event)
    assert res1.status in ("ACCEPTED", "ESCALATED")

    # Immediate second event should be deduplicated to avoid alert flooding
    res2 = risk_engine.evaluate_health_event(event)
    assert res2.status == "DEDUPLICATED"
    assert res2.caregiver_notified is False
