# Saans Saathi: Requirements Traceability Matrix

This matrix maps every requirement from the official PRD, Implementation Plan, and SIH26082 Problem Statement to its implementation component, API endpoint, and validation method.

| Req ID | Requirement Description | Source Document | Implementation Component | API / UI Touchpoint | Verification Method |
|---|---|---|---|---|---|
| **REQ-ENV-01** | Ingest Air Quality from CPCB & OpenAQ | PRD M1 | `app/data/cpcb_adapter.py`, `app/data/openaq_adapter.py` | `GET /api/forecast` | Unit tests on mock and live responses, timestamp validation |
| **REQ-ENV-02** | Ingest Active Fire Hotspots from NASA FIRMS | PRD M1 | `app/data/firms_adapter.py` | `GET /api/plumes` | GeoJSON boundary check for Punjab & Haryana clusters |
| **REQ-ENV-03** | Ingest Meteorological Data (GFS / IMD) | PRD M1 | `app/data/weather_adapter.py` | `GET /api/forecast` | Wind, Temp, PBLH validation |
| **REQ-ENV-04** | Inversion Index from Ventilation & Stability | PRD M2 | `app/services/inversion.py` | `GET /api/inversion` | Boundary layer height & wind speed correlation tests |
| **REQ-ENV-05** | 72-Hour Coupled Air-Weather Surrogate Forecast | PRD M3 | `app/ml/coupled_surrogate.py` | `GET /api/forecast?hours=72` | Numerical stability test, feedback vs uncoupled delta check |
| **REQ-ENV-06** | Forward Smoke Plume Lagrangian Advection | PRD M4 | `app/services/plume_tracker.py` | `GET /api/plumes` | Forward parcel integration, arrival time estimation at NCR |
| **REQ-ENV-07** | Model Chronological Evaluation & Baselines | PRD M3, Phase 3.5 | `app/ml/evaluation.py` | `GET /api/metrics` | Rolling-origin time split, MAE/RMSE/Bias calculation |
| **REQ-UI-01** | Interactive 72h Forecast & Inversion Dashboard | PRD M5 | `frontend/src/pages/DashboardPage.tsx` | UI `/dashboard` | Visual verification of dual-curve chart & inversion strip |
| **REQ-UI-02** | Plume Transport Map & Source Freshness | PRD M5 | `frontend/src/pages/DashboardPage.tsx` | UI `/dashboard` | Station and satellite timestamp rendering |
| **REQ-UI-03** | On-Device Health Companion & Hindi Interface | PRD M6, M7 | `frontend/src/pages/CompanionPage.tsx` | UI `/companion` | Hindi text display, audio speech synthesis, check-in buttons |
| **REQ-UI-04** | Caregiver View with Calm One-Tap Action | PRD M11 | `frontend/src/pages/CaregiverPage.tsx` | UI `/caregiver` | Caregiver message rendering, Call CTA, escalation state |
| **REQ-PRV-01** | Raw Health Data Remains on Device | PRD M12 | `frontend/src/pages/CompanionPage.tsx` | Local state / `localStorage` | Verify network payloads contain only coarse risk bands |
| **REQ-PRV-02** | Consent-Validated Health Event Intake | PRD M12, Phase 7 | `app/services/risk_engine.py` | `POST /api/events/health` | Rejection of unconsented or raw biomedical payloads |
| **REQ-PRV-03** | Cedar Policy Model for Caregiver Sharing | PRD 7A | `app/core/cedar_policy.py` | `GET /api/decisions`, `/caregiver` | Policy evaluation tests (allowed: risk band; denied: raw vitals) |
| **REQ-AGT-01** | Air Watcher Agent | PRD M10 | `app/agents/air_watcher.py` | `GET /api/agents/status` | Environmental condition summarization & tool call audit |
| **REQ-AGT-02** | Health Guardian Agent | PRD M10 | `app/agents/health_guardian.py` | `GET /api/agents/status` | Safe fixed advice selection without clinical claims |
| **REQ-AGT-03** | Care Circle Agent | PRD M10 | `app/agents/care_circle.py` | `GET /api/agents/status` | Empathetic caregiver message generation |
| **REQ-AGT-04** | Master Coordinator Agent | PRD M10 | `app/agents/coordinator.py` | `GET /api/decisions` | Multi-agent task orchestration, decision logging |
| **REQ-ALT-01** | 5-Step Escalation Ladder & Idempotency | PRD M11 | `app/workflows/alert_ladder.py` | `POST /api/alerts/simulate` | Idempotent execution, cooldown, cancellation window |
| **REQ-AWS-01** | Minimal AWS CDK Infrastructure as Code | PRD 7A, Phase 5 | `infra/` (AWS CDK) | Synthesis & validation | Parameterized stack synthesis without hardcoded secrets |
| **REQ-AWS-02** | Bedrock Integration with Local Fallback | PRD 6, Phase 6 | `app/core/bedrock.py` | `GET /api/agents/status` | Seamless fallback when AWS credentials absent |
| **REQ-OFF-01** | Offline-First Caching & Resilience | PRD M6, Phase 7.4 | `frontend/src/services/api.ts` | UI Offline badge | Airplane mode / disconnected network test |
