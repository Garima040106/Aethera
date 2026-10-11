# Saans Saathi (Aethera)

**An environmental health companion demonstration for Delhi NCR. It presents an illustrative coupled air-weather surrogate, privacy-conscious API examples, and caregiver workflow previews. It does not connect sensors, live environmental feeds, or real alert services.**

Built for [Environmental Hacks](https://www.wemakedevs.org/aws/env) (Bharat Builds Tour, WeMakeDevs x AWS). Track: **Air**.
Team: **Prometheus**

> **Migration status:** the Express + TypeScript backend in `backend/` is the local API implementation. The Python FastAPI application and its tests are retained as behavioral references. Environmental data and alert workflows are deterministic demonstrations; no AWS resources are deployed, and DynamoDB/Bedrock are disabled by default. See [docs/migration-checklist.md](./docs/migration-checklist.md) for the route/module compatibility matrix.

---

## Architecture Overview

The diagram below shows the product's intended system context. Only the local frontend and Express API are runnable from this repository today; AWS resources and external data feeds are definitions/design references, not deployed or connected services.

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
|                           BACKEND API LAYER (Express + TypeScript :8000)                          |
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
|                                                |   | (Deployable via CDK / Local Fallback Mode)   |
| - CPCB / OpenAQ (not connected in local port)  |   | - Bedrock (opt-in; not deployed)              |
| - NASA FIRMS (not connected in local port)     |   | - Step Functions (CDK definition only)        |
| - NOAA GFS / IMD (not connected in local port) |   | - DynamoDB (opt-in; not deployed)             |
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

5. **AWS Serverless Minimal Infrastructure (`infra/`):**
   - Infrastructure-as-code definitions via AWS CDK; defining a resource does not mean it has been deployed or connected.
   - CDK defines an S3 ingestion bucket with a 14-day lifecycle; no ingestion is connected.
   - CDK defines DynamoDB tables; the local app uses memory unless manually enabled.
   - CDK defines a Step Functions alert ladder and SNS topic; the local simulator sends no messages.
   - Local deterministic backend operation requires no AWS credentials. Alert/SNS and Step Functions behavior is simulated locally.

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
The API listens at `http://localhost:8000`. The app factory is also exported through `backend/src/lambda.ts` for a future API Gateway HTTP API deployment; no Lambda is created automatically.

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

The frontend's demo login is stored in browser `localStorage`; it is a navigation/demo convenience, not authentication or access control. Never use it to protect production health data.

### API endpoints

| Method | Endpoint |
|---|---|
| GET | `/health` |
| GET | `/api/forecast?area=noida&hours=72` |
| GET | `/api/environmental-data?area=noida&limit=10` |
| GET | `/api/inversion?area=noida` |
| GET | `/api/plumes?area=noida` |
| GET | `/api/metrics` |
| GET | `/api/agents/status` |
| GET | `/api/decisions` |
| POST | `/api/events/health` |
| POST | `/api/alerts/simulate` |
| POST | `/api/scenarios/compare` |

### Optional AWS integrations (manual activation only)

* **DynamoDB:** to use the existing `AtheraEnvironmentalData` table, set `ENABLE_DYNAMODB=true`, `DYNAMODB_TABLE=AtheraEnvironmentalData`, and `AWS_REGION=us-east-1` in `backend/.env.local` (or export them in the backend process environment). The table must use string partition and sort keys named `pk` and `sk`. The backend uses the standard AWS SDK credential provider chain; configure an AWS CLI profile or runtime role, and grant `dynamodb:PutItem`, `dynamodb:GetItem`, and `dynamodb:Query` on that table. Environmental forecast snapshots, alert states, and redacted decision records use distinct `pk` namespaces. `GET /api/environmental-data?area=noida&limit=10` reads recent stored forecast snapshots. DynamoDB errors are returned as service-unavailable errors; the app does not silently fall back to memory after a failed operation.
* **Bedrock:** set `ENABLE_BEDROCK=true`, `AWS_REGION`, and `BEDROCK_MODEL_ID`, then configure the standard AWS credential provider chain and grant `bedrock:Converse` for that model. The deterministic local mode remains the default. Agent-generated text is not used to make authorization, consent, health escalation, or emergency decisions.

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
