"""Deterministic Health Risk Engine and Privacy Guardian."""

import time
import uuid
from typing import Dict, Any, Tuple
from app.schemas.models import HealthEventRequest, HealthEventResponse
from app.core.cedar_policy import policy_evaluator
from app.core.logging import logger

# Approved safe preventive guidance library (Fixed, validated statements)
SAFE_ADVICE_LIBRARY = {
    "LOW": {
        "hi": "हवा सामान्य है। आप अपनी दिनचर्या जारी रख सकते हैं।",
        "en": "Air conditions are moderate. Proceed with normal routine and stay hydrated.",
    },
    "MODERATE": {
        "hi": "हवा थोड़ी खराब है। दोपहर के समय खिड़कियाँ बंद रखें और हल्का व्यायाम करें।",
        "en": "Air quality is deteriorating. Keep windows closed during peak hours and stay indoors.",
    },
    "HIGH": {
        "hi": "माँ, आज बाहर टहलने न जाएँ। हवा बहुत खराब है। घर के अंदर हल्का टहल लें।",
        "en": "Today, skip the walk outside. The air is very poor. A light walk indoors is better.",
    },
    "CRITICAL": {
        "hi": "आपकी साँस सामान्य से तेज़ लग रही है। कृपया आराम करें और पानी पिएँ।",
        "en": "Breathing appears more labored than usual. Please rest and keep your rescue inhaler close.",
    },
}


class DeterministicRiskEngine:
    def __init__(self):
        # Event deduplication cache: user_id -> last_event_timestamp
        self.cooldown_tracker: Dict[str, float] = {}
        self.cooldown_window_sec = 180  # 3 minute cooldown for duplicate events

    def evaluate_health_event(self, event: HealthEventRequest) -> HealthEventResponse:
        # Step 1: Enforce Consent
        if not event.consent_given:
            return HealthEventResponse(
                event_id=f"evt-{uuid.uuid4().hex[:8]}",
                status="REJECTED_NO_CONSENT",
                action_taken="Blocked event processing: User has not consented to telemetry sharing.",
                coarse_risk_band="UNKNOWN",
                caregiver_notified=False,
                message_to_caregiver=None,
                audit_trace_id=f"trace-deny-{uuid.uuid4().hex[:6]}",
            )

        # Step 2: Cedar Policy Check for Caregiver Access
        is_permitted, reason = policy_evaluator.evaluate(
            principal_role="Caregiver",
            action="TransmitCoarseRisk",
            resource_type="HealthProfile",
            context={"sharing_enabled": event.sharing_enabled},
        )

        if not is_permitted:
            return HealthEventResponse(
                event_id=f"evt-{uuid.uuid4().hex[:8]}",
                status="REJECTED_NO_CONSENT",
                action_taken=f"Event kept strictly on-device: {reason}",
                coarse_risk_band=event.coarse_risk_band,
                caregiver_notified=False,
                message_to_caregiver=None,
                audit_trace_id=f"trace-cedar-deny-{uuid.uuid4().hex[:6]}",
            )

        # Step 3: Deduplication and Cooldown
        now = time.time()
        user_key = f"{event.user_id}:{event.event_trigger}"
        last_time = self.cooldown_tracker.get(user_key, 0.0)

        if (now - last_time) < self.cooldown_window_sec:
            return HealthEventResponse(
                event_id=f"evt-{uuid.uuid4().hex[:8]}",
                status="DEDUPLICATED",
                action_taken=f"Duplicate alert suppressed within {int(self.cooldown_window_sec)}s cooldown window. Caregiver trust preserved.",
                coarse_risk_band=event.coarse_risk_band,
                caregiver_notified=False,
                message_to_caregiver=None,
                audit_trace_id=f"trace-dedup-{uuid.uuid4().hex[:6]}",
            )

        self.cooldown_tracker[user_key] = now

        # Step 4: Deterministic Escalation Evaluation
        caregiver_notified = False
        message_to_caregiver = None
        status = "ACCEPTED"

        if event.coarse_risk_band in ("HIGH", "CRITICAL") or event.event_trigger in ("NO_REPLY_CHECKIN", "MOTION_FALL"):
            caregiver_notified = True
            status = "ESCALATED"

            if event.event_trigger == "NO_REPLY_CHECKIN":
                message_to_caregiver = (
                    "Maa's breathing looks harder than usual and outside air is at a very unhealthy level. "
                    "She has not replied to the app for two minutes. Please call her."
                )
                action_taken = "Dispatched calm priority notification to son Rohan (Caregiver)."
            elif event.event_trigger == "MOTION_FALL":
                message_to_caregiver = (
                    "A sudden motion impact was detected on Maa's phone. "
                    "Check-in prompt active with cancel countdown."
                )
                action_taken = "Fall detection escalation initiated with 30-second cancellation window."
            else:
                message_to_caregiver = (
                    f"Maa's health risk is currently {event.coarse_risk_band} under severe smog conditions in {event.coarse_area}."
                )
                action_taken = "Logged preventive alert to caregiver activity feed."
        else:
            action_taken = "Delivered on-device preventive guidance to user."

        return HealthEventResponse(
            event_id=f"evt-{uuid.uuid4().hex[:8]}",
            status=status,
            action_taken=action_taken,
            coarse_risk_band=event.coarse_risk_band,
            caregiver_notified=caregiver_notified,
            message_to_caregiver=message_to_caregiver,
            audit_trace_id=f"trace-pass-{uuid.uuid4().hex[:6]}",
        )


risk_engine = DeterministicRiskEngine()
