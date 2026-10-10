"""Cedar Policy Engine model for privacy consent and authorization."""

from typing import Dict, Any, Tuple
from app.core.logging import logger

# Formal Cedar Policy representation for Saans Saathi
CEDAR_POLICIES = """
// Policy 1: Permit caregiver to see coarse risk band if sharing enabled
permit (
    principal in Role::"Caregiver",
    action in [Action::"ViewCoarseRiskBand", Action::"ViewCoarseArea"],
    resource in UserData::"HealthProfile"
)
when {
    context.sharing_enabled == true
};

// Policy 2: FORBID access to raw vitals under all circumstances
forbid (
    principal,
    action in [Action::"ViewRawVitals", Action::"ExportRawBiometrics"],
    resource
);

// Policy 3: Permit exact location ONLY during active SOS with explicit consent
permit (
    principal in Role::"EmergencyContact",
    action == Action::"ViewExactLocation",
    resource in UserData::"Location"
)
when {
    context.is_sos_active == true &&
    context.allow_location_on_sos == true
};
"""


class CedarPolicyEvaluator:
    """Evaluates Cedar consent policies deterministically."""

    @staticmethod
    def evaluate(
        principal_role: str,
        action: str,
        resource_type: str,
        context: Dict[str, Any],
    ) -> Tuple[bool, str]:
        """
        Evaluate if an action is permitted under Cedar policies.
        Returns: (is_permitted, decision_reason)
        """
        # Universal Forbid: Raw vitals never leave device
        if action in ("ViewRawVitals", "ExportRawBiometrics", "TransmitRawVitals"):
            return False, "FORBID: Cedar Policy 2 strictly forbids external sharing or transmission of raw vital signs."

        # Location Policy
        if action == "ViewExactLocation":
            if (
                principal_role in ("EmergencyContact", "Caregiver")
                and context.get("is_sos_active", False)
                and context.get("allow_location_on_sos", False)
            ):
                return True, "PERMIT: Cedar Policy 3 allows exact location viewing during confirmed SOS with user consent."
            return False, "DENY: Exact location is private. Cedar Policy 3 requires active SOS and explicit user consent."

        # Coarse Risk & Area Policy
        if action in ("ViewCoarseRiskBand", "ViewCoarseArea", "TransmitCoarseRisk"):
            if not context.get("sharing_enabled", False):
                return False, "DENY: Cedar Policy 1 requires sharing_enabled == true for caregiver access."
            return True, "PERMIT: Cedar Policy 1 allows coarse risk and area access when sharing is enabled."

        return False, f"DENY: Default-deny for action '{action}' under Cedar authorization."


policy_evaluator = CedarPolicyEvaluator()
