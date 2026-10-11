# Saans Saathi (Aethera)

**An environmental health companion demonstration for Delhi NCR. Forecasts and alert workflows remain illustrative; the AQI map shows free, global Open-Meteo/CAMS model estimates and can overlay Delhi CPCB station readings when a data.gov.in API key is configured on the backend.**

Built for [Environmental Hacks](https://www.wemakedevs.org/aws/env) (Bharat Builds Tour, WeMakeDevs x AWS). Track: **Air**.
Team: **Prometheus**

> **Migration status:** the Express + TypeScript backend in `backend/` is the local API implementation and has a separate CDK stack for deployment to Lambda behind API Gateway HTTP API. Environmental data and alert workflows are deterministic demonstrations. The Python FastAPI application and tests remain behavioral references. See [docs/migration-checklist.md](./docs/migration-checklist.md) for the route/module compatibility matrix.

---

## Architecture Overview

The diagram below shows the product's intended system context. The local frontend and Express API are runnable; AWS resources are not deployed, and live CPCB readings require the optional provider token.

```
+---------------------------------------------------------------------------------------------------+
|                                      CLIENT LAYER (Browser / PWA)                                 |
|                                                                                                   |
|   +-----------------------+     +------------------------+     +------------------------------+   |
|   | Dashboard Page        |     | Companion Page (Kamla) |     | Caregiver Page (Rohan)       |   |
|   | - 72h Coupled Chart   |     | - Multilingual Guidance Preview | | - Caregiver UI Preview       |   |
|   | - Inversion Strength  |     | - Deterministic Risk Demo |      | - Call UI Preview             |   |
|   | - Sample Plume Map    |     | - Health-Event Simulation |      | - Simulated Alert Trace       |   |
|   | - Decision Log        |     | - No Sensor Integration |       | - Sample Data Clearly Marked  |   |
|   +-----------------------+     +------------------------+     +------------------------------+   |
|                                                                                                   |
|                   Frontend API Response Cache (LocalStorage)                                      |
+-------------------------------------------------+-------------------------------------------------+
                                                  | REST / JSON (Coarse Risk & Forecast Queries)
                                                  v
+---------------------------------------------------------------------------------------------------+
|               BACKEND API LAYER (Express + TypeScript :8000 locally / Lambda in AWS)              |
|                                                                                                   |
|   +------------------------+  +--------------------------+  +---------------------------------+   |
|   | Forecast & Inversion   |  | Multi-Agent Intelligence |  | Deterministic Privacy & Safety  |   |
|   | - 72h Coupled Surrogate|  | - Air Watcher Agent      |  | - Consent Verification          |   |
|   | - Ventilation Proxy    |  | - Health Guardian Agent  |  | - Reject Raw Health Telemetry   |   |
|   | - Sample Plume Advect  |  | - Care Circle Agent      |  | - Deduplication & Cooldown      |   |
|   | - Coupled Feedback Model | | - Coordinator Agent      |  | - Simulated Alert Ladder        |   |
|   +------------------------+  +--------------------------+  +---------------------------------+   |
+----------------------------------------+------------------------------------+---------------------+
                                         |                                    |
                                         v                                    v
+------------------------------------------------+   +----------------------------------------------+
|             ENVIRONMENTAL DATA SOURCES         |   |                 AWS CLOUD LAYER              |
|                                                |   | (Lambda API stack / existing table / local mode)|
| - CPCB AQI (optional data.gov.in integration)  |   | - Bedrock (opt-in; not deployed)              |
| - OpenAQ PM2.5 for forecast when configured    |   | - DynamoDB (opt-in; not deployed)             |
| - NASA FIRMS (not connected in local port)     |   | - Step Functions (CDK definition only)        |
| - NOAA GFS / IMD (not connected in local port) |   | - Lambda/API Gateway (CDK definition only)    |
| - Deterministic Local Replay Fixtures          |   | - SNS (CDK definition only; no messages)      |
+------------------------------------------------+   +----------------------------------------------+
```

---

## Key Features

1. **72-Hour Coupled Air & Weather Forecast:**
   - Applies the existing illustrative coupled surrogate to deterministic local inputs.
   - Demonstrates how a numerical coupled surrogate can diverge from an uncoupled run; it is not a validated real-world forecast.
   - Inversion strength index (Weak, Moderate, Strong) computed via ventilation volume ($V_c = \text{PBLH} \times U_{10}$).
   - Sample forward parcel-advection paths; no live fire or weather feed is connected.

2. **Companion UI Demonstration:**
   - Hindi, English, and Punjabi interface and guidance previews.
   - No sensor access or on-device vitals anomaly detector is implemented in this web demo.
   - Health-event submissions exercise consent checks and simulated deterministic responses.
   - No call, emergency dispatch, or real-world escalation is initiated.

3. **Privacy Controls:**
   - The API rejects raw health telemetry and accepts only coarse event fields.
   - Consent and sharing checks are enforced before health-event processing.
   - Deterministic Cedar-style rules model consent policy; this is not a deployed Cedar authorization service.

4. **Four-Agent Behaviors (Bedrock-ready provider + Local Fallback):**
   - **Air Watcher:** Interprets forecast trends, plume transit, and inversion strength.
   - **Health Guardian:** Selects safe, verified preventive advice without clinical diagnostic claims.
   - **Care Circle:** Prepares simulated caregiver messages and alert-ladder outcomes.
   - **Master Coordinator:** Provides orchestration helpers and redacted decision records. Bedrock client support is opt-in; model output does not drive safety or escalation decisions.

5. **AWS Serverless Backend (`infra/`):**
   - `AetheraBackendApiStack` bundles the Express Lambda handler and connects it to an API Gateway HTTP API.
   - The stack imports the existing `AtheraEnvironmentalData` table; it does not create, replace, or delete that table.
   - Local deterministic backend operation does not require AWS credentials. DynamoDB-backed Lambda deployment does.
   - The HTTP API currently has no authentication; the frontend demo login is not an API security control. Do not use this public demo stack with sensitive health data.

---

## Local Setup & Run Commands

### Prerequisites
- Node.js 20+ and npm

### 1. Start the Express Backend (PowerShell)
```powershell
# From the repository root, in a backend terminal
Set-Location backend
npm install
npm run dev
```
The API listens at `http://localhost:8000`. Its Lambda proxy handler is in `backend/src/lambda.ts`.

### 2. Start the React Frontend
```powershell
# From the repository root, in another PowerShell terminal
Set-Location frontend
npm install
npm run dev
```
The frontend uses `VITE_API_BASE_URL` when set and otherwise requests `http://localhost:8000`. Set it to the deployed API Gateway URL and rebuild the frontend for an AWS-hosted deployment.

### 3. Build and Test
```powershell
# From the repository root
Set-Location backend
npm test
npm run build

Set-Location ..\frontend
npm run build
```

Backend configuration can be supplied through `backend/.env.local`, `backend/.env`, or process environment variables; these local files are git-ignored. DynamoDB and Bedrock remain disabled by default unless enabled in the backend environment.

### Deploy the backend API to AWS

The CDK app deploys only the separate `AetheraBackendApiStack` and imports the existing table. It does not deploy the legacy infrastructure stack or create a new DynamoDB table.

```powershell
Set-Location infra
npm install
npm run build
npm run synth:api -- -c corsOrigins=https://your-frontend.example
npm run deploy:api -- -c corsOrigins=https://your-frontend.example
```

Configure AWS CLI credentials and bootstrap CDK in the target account/region first. The stack defaults to `us-east-1`, table `AtheraEnvironmentalData`, and local Vite CORS origins; pass the actual deployed frontend origin with `-c corsOrigins=...`. After deployment, set the frontend's `VITE_API_BASE_URL` to the `BackendApiUrl` stack output and rebuild it. The API has no authentication and should only be used as an explicitly approved demo; do not send real personal or health data.

The frontend's demo login is stored in browser `localStorage`; it is a navigation/demo convenience, not authentication or access control. Never use it to protect production health data.

### API endpoints

| Method | Endpoint |
|---|---|
| GET | `/health` |
| GET | `/api/aqi/stations` |
| GET | `/api/location/search?q=Connaught%20Place` |
| GET | `/api/forecast?area=noida&hours=72` |
| GET | `/api/environmental-data?area=noida&limit=10` |
| GET | `/api/inversion?area=noida` |
| GET | `/api/plumes?area=noida` |
| GET | `/api/metrics` |
| GET | `/api/agents/status` |
| GET | `/api/decisions` |
| POST | `/api/location/routes` |
| POST | `/api/routes/score` |
| POST | `/api/events/health` |
| POST | `/api/alerts/simulate` |
| POST | `/api/scenarios/compare` |

### Optional AWS integrations (manual activation only)

* **DynamoDB:** to use the existing `AtheraEnvironmentalData` table, set `ENABLE_DYNAMODB=true`, `DYNAMODB_TABLE=AtheraEnvironmentalData`, `AWS_REGION=us-east-1`, and locally `AWS_PROFILE=nickhilverma` in `backend/.env.local` (or export them in the backend process environment). The verified table schema uses string partition and sort keys named `PK` and `SK`. The backend uses the AWS SDK for JavaScript v3 `DynamoDBDocumentClient`; local credentials come from the selected AWS CLI profile and production credentials from the Lambda execution role. Grant `dynamodb:PutItem`, `dynamodb:GetItem`, `dynamodb:UpdateItem`, `dynamodb:DeleteItem`, and `dynamodb:Query` on that table only. Environmental forecast snapshots, alert states, and redacted decision records use distinct `PK` namespaces. `GET /api/environmental-data?area=noida&limit=10` reads recent stored forecast snapshots, and `GET /health/dynamodb` verifies table access with a read-only `DescribeTable`. DynamoDB errors are returned as service-unavailable errors; the app does not silently fall back to memory after a failed operation.
* **Bedrock:** set `ENABLE_BEDROCK=true`, `AWS_REGION`, and `BEDROCK_MODEL_ID`, then configure the standard AWS credential provider chain and grant `bedrock:Converse` for that model. The deterministic local mode remains the default. Agent-generated text is not used to make authorization, consent, health escalation, or emergency decisions.
* **Amazon Location:** backend `/api/location/search` and `/api/location/routes` use AWS SDK for JavaScript v3 (`GeoPlacesClient` and `GeoRoutesClient`) with the local AWS credential profile or Lambda execution role; the Lambda role needs `geo-places:SearchText` and `geo-routes:CalculateRoutes`. Frontend map rendering uses MapLibre with OpenStreetMap tiles; no AWS map key is needed.
* **Global modeled AQI map:** `/api/aqi/model?west=77&south=28.4&east=77.4&north=28.8` queries the free Open-Meteo Air Quality API (CAMS model data) for the current map viewport. No API key is required. The free service is subject to Open-Meteo's non-commercial use terms and fair-use limits. The map uses the US AQI scale for these global model estimates; they are not monitor observations and are not converted or relabeled as Indian CPCB AQI. Map requests are bounded to a zoomed-in viewport and refresh as the user pans. Attribute Open-Meteo and CAMS when redistributing this data.
* **Delhi CPCB AQI and corridors:** set `CPCB_API_KEY` (or `DATA_GOV_IN_API_KEY`) in the ignored `backend/.env.local` and optionally set `CPCB_AQI_RESOURCE_ID`. `/api/aqi/stations` returns coordinate-bearing Delhi monitor readings; `/api/routes/score` evaluates route-adjacent recent monitor readings using Indian CPCB AQI. OpenAQ remains an optional complementary PM2.5 input to forecasts. NASA FIRMS is a satellite fire-hotspot source, not an AQI feed. Dashboard green pathways continue to rely only on current CPCB station observations, never on model estimates.

No `cdk deploy` is part of this setup. For a future deployment, review `infra/lib/aethera-stack.ts`, add and review explicit Lambda/API Gateway resources and least-privilege grants, deploy only through a separately approved process, configure the backend environment and IAM role, then set `VITE_API_BASE_URL` to the API Gateway URL and rebuild/redeploy the static frontend. `docs/migration-checklist.md` records the CDK resource keys, endpoint contracts, and remaining limitations.

---

## Repository Structure

The companion and caregiver phone experiences are previews inside the web app. AWS integrations are optional and disabled by default.

```text
Aethera/
├── README.md
├── .gitignore
├── frontend/              React + TypeScript + Vite
├── backend/               Express + TypeScript REST API
├── app/                   Retained FastAPI behavioral reference
├── tests/                 Retained Python tests
├── infra/                 AWS CDK definitions; not deployed
└── docs/                  Migration and project documentation
```

The `app/` FastAPI backend and Python tests remain in the repository as behavioral references. The AWS CDK source defines resources but does not deploy them.

## Run the frontend

The Aethera frontend is a React + TypeScript web application built with Vite.

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- npm (included with Node.js)
- Git

### Setup

Clone the repository and navigate to the frontend directory:

```bash
git clone <repository-url>
cd Aethera/frontend
```
Install frontend dependencies:

```bash
npm install
```

### Development server

Start the local development server:

```bash
npm run dev
```

Open the URL printed in the terminal, usually `http://localhost:5173`.

### Available pages

| Route | Description |
|---|---|
| `/` | Aethera landing page |
| `/dashboard` | Air quality forecast dashboard |
| `/companion` | Health-event simulation and companion UI preview |
| `/caregiver` | Care Circle caregiver UI preview |

### Production build

Build the frontend for production:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

**Note:** The dashboard and interactive Companion/Caregiver flows use the Express backend for API data and deterministic simulations. The environmental readings remain sample fixtures; no live data sources or AWS alert services are connected. The frontend can be run locally without deploying AWS infrastructure.

## Team Prometheus

## Honest Scientific & Medical Disclaimers

1. **Support Tool, Not a Medical Device:** Saans Saathi is a preventive environmental health companion and caregiver awareness tool. In an emergency, call **112**.
2. **Atmospheric Surrogate:** The 72-hour forecast executes a fast, physically coupled 0D/1D numerical feedback surrogate. It does not claim full 3D WRF-Chem HPC execution.
3. **Inversion & Plumes:** Inversion strength is computed via ventilation volume ($V_c = \text{PBLH} \times U_{10}$), and plume paths represent forward wind advection trajectories rather than legal source attribution.
## License

Prepared for optional AWS integrations; no AWS resources are deployed by this project setup.
