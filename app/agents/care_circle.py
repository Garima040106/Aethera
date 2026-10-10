"""Care Circle Agent: Formulates calm caregiver notifications."""

from typing import Dict, Any
from app.core.bedrock import bedrock_provider
from app.core.cedar_policy import policy_evaluator


class CareCircleAgent:
    """Specialized agent managing family notifications and escalation ladder."""

    def prepare_caregiver_message(
        self,
        event_trigger: str,
        coarse_risk_band: str,
        caregiver_name: str = "Rohan",
        recipient_name: str = "Maa",
        sharing_enabled: bool = True,
    ) -> Dict[str, Any]:
        # Enforce Cedar privacy rules
        is_permitted, policy_reason = policy_evaluator.evaluate(
            principal_role="Caregiver",
            action="TransmitCoarseRisk",
            resource_type="HealthProfile",
            context={"sharing_enabled": sharing_enabled},
        )

        if not is_permitted:
            return {
                "agent": "Care Circle",
                "permitted": False,
                "reason": policy_reason,
                "message": None,
            }

        if event_trigger == "NO_REPLY_CHECKIN":
            subject = f"Please call {recipient_name}"
            body = (
                f"{recipient_name}'s breathing looks harder than usual and outside air is at a very unhealthy level. "
                f"She has not replied to the app for two minutes. Please call her."
            )
            suggested_cta = "Call Maa"
        elif event_trigger == "MOTION_FALL":
            subject = f"Urgent: Check on {recipient_name}"
            body = (
                f"A fall was detected on {recipient_name}'s phone. "
                f"She has a 30-second cancellation window before emergency contacts are notified."
            )
            suggested_cta = "Call Immediately"
        else:
            subject = f"Air update for {recipient_name}"
            body = f"Outside air is currently in the {coarse_risk_band} risk category. Please remind her to remain indoors."
            suggested_cta = "Send Reminder"

        return {
            "agent": "Care Circle",
            "permitted": True,
            "caregiver": caregiver_name,
            "subject": subject,
            "body": body,
            "cta": suggested_cta,
            "mode": "bedrock" if bedrock_provider.is_available() else "local_deterministic",
        }


care_circle = CareCircleAgent()
