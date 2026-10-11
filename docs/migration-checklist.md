# FastAPI to Express Migration Checklist

This checklist records the Python source-to-TypeScript mapping and the current API contract. The Python backend and Python tests remain in place as behavioral references; this migration does not delete or replace them.

## Python module mapping

| Existing Python module | TypeScript implementation | Coverage / notes |
|---|---|---|
| `app/main.py` | `backend/src/app.ts`, `server.ts`, `lambda.ts` | Express factory, local HTTP server, and API Gateway-compatible Lambda adapter are separate. |
| `app/api/routes.py` | `backend/src/routes/api.ts` | Original endpoint contracts are preserved. |
| `app/schemas/models.py` | `backend/src/schemas/api.ts` | Zod request schemas and TypeScript response types; invalid requests return FastAPI-shaped `detail` errors. |
| `app/core/config.py` | `backend/src/config/env.ts` | dotenv configuration; optional AWS integrations disabled by default. |
| `app/core/logging.py` | `backend/src/server.ts`, `backend/src/middleware/errors.ts` | No request-body logging; health data is not logged. |
| `app/core/cedar_policy.py` | `backend/src/services/privacy-service.ts` | Default-deny policy decisions, consent checks, and raw telemetry rejection. |
| `app/core/bedrock.py` | `backend/src/agents/bedrock-provider.ts` | AWS SDK v3 Converse; deterministic fallback, disabled by default. |
| `app/data/fixtures.py` | `backend/src/data/fixtures.ts` | Geographic areas, fire sample points, and redacted historical decisions. |
| `app/data/cpcb_adapter.py` | `backend/src/services/environmental-service.ts` | Existing API used deterministic replay data; no live CPCB/OpenAQ connection is represented as active. |
| `app/data/firms_adapter.py` | `backend/src/data/fixtures.ts`, `environmental-service.ts` | Sample fire points; not a live FIRMS feed. |
| `app/ml/coupled_surrogate.py` | `backend/src/ml/coupled-surrogate.ts` | Iterative coupled/uncoupled PM2.5, AQI, meteorological, inversion, and ventilation calculations. |
| `app/ml/evaluation.py` | `backend/src/services/environmental-service.ts` (`metricsResponse`) | Preserves the existing static metrics shape; documented as carried-over demonstration metrics, not independently validated by this migration. |
| `app/services/forecast.py` | `backend/src/services/environmental-service.ts` | Forecast response and summary. |
| `app/services/inversion.py` | `backend/src/services/environmental-service.ts` | Full forecast-derived inversion timeline and ventilation proxy. |
| `app/services/plume_tracker.py` | `backend/src/services/environmental-service.ts` | Deterministic sample hotspot trajectory. |
| `app/services/risk_engine.py` | `backend/src/services/risk-engine.ts` | Consent/share enforcement, 180-second deduplication, deterministic escalation, minimal alert persistence. |
| `app/agents/air_watcher.py` | `backend/src/agents/agents.ts` | Forecast/inversion/plume synthesis. |
| `app/agents/health_guardian.py` | `backend/src/agents/agents.ts` | Fixed safe-advice library; no model text may change safety policy. |
| `app/agents/care_circle.py` | `backend/src/agents/agents.ts` | Consent-gated caregiver message preparation. |
| `app/agents/coordinator.py` | `backend/src/services/decision-service.ts`, `backend/src/agents/agents.ts` | Historical and minimized redacted decisions; no raw measurements. |
| `app/workflows/alert_ladder.py` | `backend/src/workflows/alert-ladder.ts` | Deterministic simulations only; no SNS, call, or emergency dispatch. |
| `tests/test_api.py` | `backend/src/tests/api.test.ts` | HTTP endpoint contract and behavior tests. |
| `tests/test_ml.py` | `backend/src/tests/surrogate.test.ts` | Forecast length, bounds, category calculation, and feedback behavior. |
| `tests/test_privacy.py` | `backend/src/tests/api.test.ts`, `repositories.test.ts` | Consent, raw-health-data rejection/redaction, and persistence coverage. |

## API compatibility matrix

The frontend's API base URL remains `VITE_API_BASE_URL || http://localhost:8000`. JSON property names and nested structures match the existing Pydantic and frontend TypeScript shapes. The React UI's localStorage cache continues to work unchanged. The Home, Login, and protected-route demo-auth flows remain frontend-only and do not imply backend authentication.

| Method and path | Query / body | Success response and status | Error behavior | Frontend consumer |
|---|---|---|---|---|
| `GET /health` | None | `200`; `status`, `app_name`, `version`, `environment`, `bedrock_mode`, `timestamp` | Unknown route: `404 {"detail":"Not Found"}` | `api.getHealth()`; not currently used by a page |
| `GET /api/forecast` | `area` (default `noida`), `hours` integer `1..72` (default `72`) | `200`; area/coordinates, model metadata, provenance, `horizon_hours`, hourly `points` (including hour 0), and `summary`; stores a snapshot when DynamoDB is enabled | Invalid query: `422 {"detail":[...]}`; enabled DynamoDB write failure: `503` | `DashboardPage` through `api.getForecast()` |
| `GET /api/environmental-data` | `area` (default `noida`), `limit` integer `1..100` (default `10`) | `200`; area and newest persisted forecast snapshots for that area | Invalid query: `422`; enabled DynamoDB read failure: `503` | Direct endpoint |
| `GET /api/inversion` | `area` (default `noida`) | `200`; area, update/proxy notes, `inversion_status_now`, `peak_inversion_window`, `timeline` | Invalid query: `422` | `DashboardPage` through `api.getInversion()` |
| `GET /api/plumes` | `area` (default `noida`) | `200`; area, arrival/wind/trapping metadata, hotspots and trajectory path | Invalid query: `422` | `DashboardPage` through `api.getPlumes()` |
| `GET /api/metrics` | None | `200`; model/evaluation metadata, horizon metrics, baseline comparisons, limitations | No optional service required | Available for direct clients; no current page call |
| `GET /api/agents/status` | None | `200`; `active_mode`, `bedrock_available`, `region`, `configured_model`, agent names and guardrail/offline flags | No optional service required; mode is local deterministic when Bedrock is disabled | `api.getAgentStatus()`; no current page call |
| `GET /api/decisions` | None | `200`; `decisions`, `total_count`, `redaction_policy` | Enabled DynamoDB read failures return `503`, never fake success | `DashboardPage` through `api.getDecisions()` |
| `POST /api/events/health` | JSON: optional `user_id`, consent/sharing flags, `coarse_risk_band`, `coarse_area`, `event_trigger`, required `client_timestamp`, optional `notes` | `200`; event ID, status, action, coarse risk, caregiver flag/message, audit trace ID. Consent denial remains a `200` response with `REJECTED_NO_CONSENT`. | Invalid schema or raw measurement keys: `422`; DynamoDB write failures: `503` | `CompanionPage` through `api.submitHealthEvent()` |
| `POST /api/alerts/simulate` | JSON: scenario enum, optional sharing/location flags and `language` | `200`; simulation ID, scenario, final state, ordered steps, simulation disclaimer | Invalid scenario/body: `422`; persistence failures: `503` | `CaregiverPage` through `api.simulateAlert()` |
| `POST /api/scenarios/compare` | JSON: optional area and scenario labels, integer `hours` `1..72` | `200`; scenario labels, peak difference, analysis, coupled/uncoupled timeline | Invalid schema: `422` | Direct endpoint; not currently called by frontend |

For JSON validation, Express uses HTTP `422` and a FastAPI-compatible `detail` array with `loc`, `msg`, and `type`. Malformed JSON receives `400`; an unknown route receives `404`; failed enabled persistence receives `503`. CORS allows configured origins, including both Vite defaults `http://localhost:5173` and `http://127.0.0.1:5173`.

## AWS CDK audit

`infra/lib/aethera-stack.ts` defines, but does not deploy or connect the application to:

* An S3 bucket with S3-managed encryption, public access blocked, SSL enforced, and a 14-day object lifecycle.
* The alerts DynamoDB table with partition key `eventId`, sort key `timestamp`, and TTL attribute `ttl`.
* The decisions DynamoDB table with partition key `decisionId`.
* An SNS topic and Step Functions alert-ladder state machine. Its CloudWatch Logs group has a 14-day retention policy.
* A Bedrock IAM `PolicyStatement` object. In the currently inspected CDK source it is not attached to a role or grant, and there is no Lambda/API Gateway backend resource or DynamoDB grant.

The Express backend can use the existing `AtheraEnvironmentalData` single table with string `pk` and `sk` keys by setting `ENABLE_DYNAMODB=true`, `DYNAMODB_TABLE=AtheraEnvironmentalData`, and `AWS_REGION=us-east-1`. It stores forecasts under `ENVIRONMENT#<area>`, alerts under `ALERT#<eventId>`, and redacted decisions under `DECISION`; recent items are read with `Query`, not a full table scan. The connection uses standard AWS credentials and does not create or modify AWS resources. The CDK definition remains a separate, older two-table example and is not used for this existing table. Alert items contain only generated IDs, timestamp, status, and TTL; decision items contain minimized descriptive metadata and no raw health telemetry. Mocked DynamoDB tests validate the key patterns without contacting AWS.

## Migration checklist / status

- [x] Audit Python endpoint/schema/logic modules, frontend API usage and page flows, tests, and CDK definitions.
- [x] Create the modular Express + TypeScript application, request validation, CORS, response compatibility, and Lambda adapter.
- [x] Port forecast, AQI, inversion, ventilation, plume, risk, four-agent helper behavior, and alert simulation logic.
- [x] Add in-memory and DynamoDB repository interfaces and implementations, opt-in configuration, and mocked-client tests.
- [x] Add disabled-by-default Bedrock Converse client and deterministic fallback tests.
- [x] Keep Python backend and Python tests.
- [x] Run verification: frontend production build, backend TypeScript build, 25 backend tests, 18 retained Python tests, npm audit (0 vulnerabilities), and live HTTP checks for the original API routes.
- [x] Browser-test Home, demo Login, Dashboard data fetch, Companion health-event flow, Caregiver alert simulation, English/Hindi/Punjabi switching, and cached Dashboard response while API requests are unavailable.
- [ ] Manual AWS credential/IAM/model access validation and deployment are intentionally out of scope.

The current environmental inputs are deterministic fixtures and the coupled surrogate is an illustrative simulation, not a validated real-world forecast. Historical error metrics are preserved from the Python response but are not independently reproduced or validated by this port. Demo authentication remains a browser-only convenience, not production authentication. AWS infrastructure remains undeployed and optional integrations remain disabled by default. The local `8000` port was occupied by an already-running Python/Uvicorn process in the validation environment, so the migrated server and frontend were exercised on ports `8001` and `5173` respectively; the migrated server uses `8000` by default when that port is available. Browser integration checks covered Home, Login, Dashboard, Companion, Caregiver, all supported languages, and cached dashboard behavior. Forecast outputs were also compared with the Python implementation at seven horizons over six numerical fields.
