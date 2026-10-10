"""Alert Ladder workflow simulator and Step Functions emulator."""

import time
import uuid
from typing import List
from app.schemas.models import AlertSimulateRequest, AlertSimulateResponse, AlertSimulateStep
from app.agents.coordinator import coordinator


class AlertLadderWorkflow:
    """
    Executes the 5-stage deterministic alert ladder:
    1. Local Nudge -> 2. "Are you ok?" Check-in -> 3. Caregiver Message ->
    4. Escalation Wait -> 5. SOS with Cancel Countdown.
    """

    def simulate(self, req: AlertSimulateRequest) -> AlertSimulateResponse:
        sim_id = f"sim-{uuid.uuid4().hex[:8]}"
        steps: List[AlertSimulateStep] = []

        if req.scenario == "RESPIRATORY_DISTRESS_UNANSWERED":
            steps = [
                AlertSimulateStep(
                    step_number=1,
                    step_name="ON_DEVICE_ANOMALY_DETECTION",
                    status="COMPLETED",
                    actor="Phone TensorFlow.js",
                    detail="Breathing rate elevated (>24/min) with SpO2 dip to 93%. Raw vitals retained on device.",
                    timestamp="10:10:00 AM",
                ),
                AlertSimulateStep(
                    step_number=2,
                    step_name="ARE_YOU_OK_CHECKIN_PROMPT",
                    status="COMPLETED",
                    actor="Health Guardian Agent",
                    detail="Prompted user in Hindi: 'क्या आप ठीक हैं?'. 2-minute timer initiated.",
                    timestamp="10:10:05 AM",
                ),
                AlertSimulateStep(
                    step_number=3,
                    step_name="CHECKIN_TIMEOUT_EXPIRED",
                    status="COMPLETED",
                    actor="AWS Step Functions Timer",
                    detail="120 seconds elapsed with no user response. Cedar policy verified for caregiver sharing.",
                    timestamp="10:12:05 AM",
                ),
                AlertSimulateStep(
                    step_number=4,
                    step_name="CAREGIVER_NOTIFICATION_DISPATCH",
                    status="COMPLETED",
                    actor="Care Circle Agent (via Amazon SNS)",
                    detail="Calm SMS sent to son Rohan: 'Maa's breathing looks harder than usual. Outside air is severe. Please call her.'",
                    timestamp="10:12:15 AM",
                ),
                AlertSimulateStep(
                    step_number=5,
                    step_name="STANDBY_FOR_CALL_RESOLUTION",
                    status="AWAITING_CAREGIVER_ACTION",
                    actor="Care Circle Dashboard",
                    detail="One-tap Call Maa CTA presented. Emergency SOS escalation held in standby.",
                    timestamp="10:12:30 AM",
                ),
            ]
            final_state = "CAREGIVER_NOTIFIED_STANDBY"

        elif req.scenario == "USER_OK_CONFIRMED":
            steps = [
                AlertSimulateStep(
                    step_number=1,
                    step_name="ARE_YOU_OK_CHECKIN_PROMPT",
                    status="COMPLETED",
                    actor="Health Guardian Agent",
                    detail="Check-in prompted on phone screen.",
                    timestamp="10:10:00 AM",
                ),
                AlertSimulateStep(
                    step_number=2,
                    step_name="USER_RESPONSE_RECEIVED",
                    status="COMPLETED",
                    actor="User Kamla",
                    detail="User tapped 'मैं ठीक हूँ' (I am okay).",
                    timestamp="10:10:25 AM",
                ),
                AlertSimulateStep(
                    step_number=3,
                    step_name="ESCALATION_CANCELLED",
                    status="RESOLVED",
                    actor="Step Functions Engine",
                    detail="Workflow terminated gracefully. No notification sent to caregiver. False alarm averted.",
                    timestamp="10:10:26 AM",
                ),
            ]
            final_state = "RESOLVED_SAFE"

        elif req.scenario == "FALL_DETECTED_SOS_CANCELLED":
            steps = [
                AlertSimulateStep(
                    step_number=1,
                    step_name="MOTION_IMPACT_DETECTED",
                    status="COMPLETED",
                    actor="Phone Accelerometer",
                    detail="Motion threshold exceeded indicating potential fall. High acoustic chime sounded.",
                    timestamp="02:15:00 PM",
                ),
                AlertSimulateStep(
                    step_number=2,
                    step_name="CANCEL_COUNTDOWN_ACTIVE",
                    status="COMPLETED",
                    actor="Phone PWA",
                    detail="30-second cancellation countdown displayed with large touch button.",
                    timestamp="02:15:02 PM",
                ),
                AlertSimulateStep(
                    step_number=3,
                    step_name="CANCEL_TAP_BY_USER",
                    status="RESOLVED",
                    actor="User Kamla",
                    detail="User cancelled before expiration (e.g. phone dropped on soft bed). Zero alert sent.",
                    timestamp="02:15:14 PM",
                ),
            ]
            final_state = "FALL_ALERT_CANCELLED_BY_USER"

        else:  # SOS_EMERGENCY_DISPATCH
            steps = [
                AlertSimulateStep(
                    step_number=1,
                    step_name="SOS_COUNTDOWN_EXPIRED",
                    status="COMPLETED",
                    actor="Step Functions Alert Ladder",
                    detail="Neither user nor caregiver replied after multi-tier escalation.",
                    timestamp="10:15:00 AM",
                ),
                AlertSimulateStep(
                    step_number=2,
                    step_name="EMERGENCY_CONTACT_NOTIFIED",
                    status="COMPLETED",
                    actor="Amazon SNS Priority SMS",
                    detail=f"Dispatched SOS alert to backup emergency contact. Location shared: {req.allow_location_on_sos}.",
                    timestamp="10:15:10 AM",
                ),
            ]
            final_state = "EMERGENCY_SOS_DISPATCHED"

        # Log decision into audit trail
        coordinator.log_decision(
            agent_name="Care Circle",
            title=f"Executed Alert Workflow: {req.scenario}",
            detail=f"Final state: {final_state}. Steps executed: {len(steps)}.",
            evidence_source="Step Functions Alert Ladder Engine",
            risk_level="HIGH" if "EMERGENCY" in final_state or "NOTIFIED" in final_state else "LOW",
        )

        return AlertSimulateResponse(
            simulation_id=sim_id,
            scenario=req.scenario,
            final_state=final_state,
            steps=steps,
        )


alert_ladder = AlertLadderWorkflow()
