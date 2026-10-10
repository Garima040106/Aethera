# Saans Saathi: Implementation Plan

Companion to `saans-saathi-prd.md`.
Team: Team Prometheus

---

## The Three Subsystem Roles

| Role | Subsystem | Deliverables |
|---|---|---|
| **P1: Edge & Companion** | Phone app (PWA), on-device health AI, fall detection, simulator, Hindi/English UI, offline cache | Privacy-preserving health evaluation, on-device rules, consent toggles, local speech/alerts |
| **P2: Data & Forecast** | Data ingestion, inversion index, 72-hour coupled forecast surrogate, plume tracker | CPCB/OpenAQ adapter, FIRMS adapter, GFS/IMD weather adapter, 72h coupled numerical simulation, chronological validation |
| **P3: Agents & Cloud** | Multi-agent intelligence, alert ladder, Step Functions, DynamoDB, API layer | Air Watcher, Health Guardian, Care Circle, Coordinator agents, Bedrock / local fallback, alert orchestration |

---

## Implementation Roadmap

### Phase 0: Audit & Execution Blueprint
- Audit repo structure, package manager, and components.
- Confirm local runtime availability (Node.js 22+, Python 3.11).
- Identify external service availability (AWS CLI status, Bedrock access, fallback modes).

### Phase 1: Preserve Frontend & Map Contracts
- Keep light theme, layout, routing (`/`, `/dashboard`, `/companion`, `/caregiver`).
- Map each UI card to real backend endpoints.
- Add real-time interactive state, loading states, error fallbacks, and demonstration toggles.

### Phase 2: FastAPI Backend
- Implement modular FastAPI application on `http://localhost:8000`.
- Endpoints:
  - `GET /health`
  - `GET /api/forecast?area=noida&hours=72`
  - `GET /api/inversion?area=noida`
  - `GET /api/plumes?area=noida`
  - `GET /api/metrics`
  - `GET /api/agents/status`
  - `GET /api/decisions`
  - `POST /api/events/health`
  - `POST /api/alerts/simulate`
  - `POST /api/scenarios/compare`

### Phase 3: Environmental Data & Coupled 72-Hour Forecasting Surrogate
- Real adapters with live endpoints / deterministic historical replay fixtures for CPCB, OpenAQ, NASA FIRMS, GFS/IMD.
- Inversion index computed from boundary layer height and ventilation coefficient.
- Coupled 72-hour forward integration with two-way feedback:
  - Weather affects smoke dispersion and trapping.
  - Trapped smoke modifies radiation, cooling surface, lowering boundary layer height, exacerbating inversion.
- Chronological split evaluation: persistence baseline vs uncoupled baseline vs coupled surrogate vs bias-corrected surrogate.

### Phase 4: Frontend-Backend Integration
- Centralized API client with environment configuration (`VITE_API_BASE_URL`).
- Dynamic charts and metrics.
- Offline caching and stale indicators.

### Phase 5: AWS Infrastructure & Cost Review
- Parameterized CDK stack in `infra/`.
- Local-first execution without mandatory cloud credentials.
- Controlled deployment review with strict cost and resource limits.

### Phase 6: Multi-Agent Intelligence (Bedrock + Local Fallback)
- Strands Agents SDK architecture with Bedrock Converse API.
- Local deterministic provider fallback when AWS credentials or Bedrock models are unconfigured.
- Bounded tools for forecast inspection, risk lookup, caregiver notification, and decision logging.

### Phase 7: Deterministic Privacy, Risk Engine & Alert Ladder
- On-device vitals processing; only coarse risk band & coarse area transmitted with consent.
- Configurable rules engine for respiratory, cardiovascular, and heat stress.
- 5-step alert ladder: User nudge -> "Are you ok?" check-in -> Caregiver notification -> Escalation wait -> Emergency SOS with cancel countdown.

### Phase 8: Comprehensive Testing & Verification
- Unit and integration tests for FastAPI, ML surrogate, agent tools, and privacy rules.
- Verification of frontend build and browser interactivity.

### Phase 9: Demo Handover & Documentation
- Complete documentation suite, demo scripts, and run commands.
