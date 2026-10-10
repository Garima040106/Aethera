"""Master Coordinator Agent: Multi-agent orchestration and decision auditing."""

import uuid
from typing import List, Dict, Any
from app.schemas.models import DecisionRecord, DecisionsResponse
from app.data.fixtures import HISTORICAL_DECISIONS
from app.agents.air_watcher import air_watcher
from app.agents.health_guardian import health_guardian
from app.agents.care_circle import care_circle
from app.core.bedrock import bedrock_provider


class CoordinatorAgent:
    def __init__(self):
        # In-memory store of recent audit decisions
        self.decisions_db: List[Dict[str, Any]] = list(HISTORICAL_DECISIONS)

    def get_decisions(self) -> DecisionsResponse:
        records = [DecisionRecord(**d) for d in self.decisions_db]
        return DecisionsResponse(
            decisions=records,
            total_count=len(records),
            redaction_policy="Cedar Privacy Engine: Raw vitals redacted at edge. Only coarse risk bands preserved.",
        )

    def log_decision(
        self,
        agent_name: str,
        title: str,
        detail: str,
        evidence_source: str,
        risk_level: str = "MODERATE"
    ) -> DecisionRecord:
        new_dec = {
            "id": f"dec-{uuid.uuid4().hex[:6]}",
            "time": "Just now",
            "agent": agent_name,
            "title": title,
            "detail": detail,
            "evidence_source": evidence_source,
            "risk_level": risk_level,
            "redacted": True,
        }
        self.decisions_db.insert(0, new_dec)
        return DecisionRecord(**new_dec)

    def execute_full_cycle(self, area: str = "noida") -> Dict[str, Any]:
        """Runs the complete multi-agent pipeline."""
        air_summary = air_watcher.analyze_conditions(area=area)
        health_action = health_guardian.recommend_action(
            risk_band="HIGH" if air_summary["peak_aqi"] > 350 else "MODERATE",
            language="hi"
        )
        care_action = care_circle.prepare_caregiver_message(
            event_trigger="ANOMALOUS_VITALS",
            coarse_risk_band="HIGH"
        )

        return {
            "coordinator_status": "CYCLE_COMPLETED",
            "air_watcher": air_summary,
            "health_guardian": health_action,
            "care_circle": care_action,
            "mode": "bedrock" if bedrock_provider.is_available() else "local_deterministic",
        }


coordinator = CoordinatorAgent()
