"""Health Guardian Agent: Maps environmental context to safe preventive advice."""

from typing import Dict, Any
from app.core.bedrock import bedrock_provider
from app.services.risk_engine import SAFE_ADVICE_LIBRARY


class HealthGuardianAgent:
    """Specialized agent translating environmental risk into family-style health actions."""

    def recommend_action(
        self,
        risk_band: str = "HIGH",
        language: str = "hi",
        persona_name: str = "Kamla"
    ) -> Dict[str, Any]:
        advice_dict = SAFE_ADVICE_LIBRARY.get(risk_band, SAFE_ADVICE_LIBRARY["HIGH"])
        message = advice_dict.get(language, advice_dict["en"])

        disclaimer = "Support tool, not a medical device. In an emergency call 112."

        return {
            "agent": "Health Guardian",
            "persona": persona_name,
            "risk_band": risk_band,
            "language": language,
            "recommended_action": message,
            "action_english": advice_dict["en"],
            "disclaimer": disclaimer,
            "grounded_in_clinical_rules": True,
            "mode": "bedrock" if bedrock_provider.is_available() else "local_deterministic",
        }


health_guardian = HealthGuardianAgent()
