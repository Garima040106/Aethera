# Saans Saathi (Aethera)

**An AI-powered environmental health companion for Delhi NCR. It predicts coupled air-weather pollution spikes, watches over vulnerable people on their phones without leaking raw biometrics, and alerts family caregivers when it matters.**

Built for [Environmental Hacks](https://www.wemakedevs.org/aws/env) (Bharat Builds Tour, WeMakeDevs x AWS). Track: **Air**.
Team: **Prometheus**

---

## Architecture Overview

```
+---------------------------------------------------------------------------------------------------+
|                                      CLIENT LAYER (Browser / PWA)                                 |
|                                                                                                   |
|   +-----------------------+     +------------------------+     +------------------------------+   |
|   | Dashboard Page        |     | Companion Page (Kamla) |     | Caregiver Page (Rohan)       |   |
|   | - 72h Coupled Chart   |     | - Hindi/EN Guidance    |     | - Calm Actionable Cards      |   |
|   | - Inversion Strength  |     | - On-Device Risk AI    |     | - One-Tap Calling            |   |
|   | - Smoke Plume Map     |     | - "Are you ok?" Check  |     | - Cedar Consent Transparency |   |
|   | - Decision Log        |     | - Local Vitals (HR/O2) |     | - Escalation Timeline        |   |
|   +-----------------------+     +------------------------+     +------------------------------+   |
|                                                                                                   |
|               Offline Cache (ServiceWorker / IndexedDB / LocalStorage)                            |
+-------------------------------------------------+-------------------------------------------------+
                                                  | REST / JSON (Coarse Risk & Forecast Queries)
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                 BACKEND API LAYER (FastAPI :8000)                                 |
|                                                                                                   |
|   +------------------------+  +--------------------------+  +---------------------------------+   |
|   | Forecast & Inversion   |  | Multi-Agent Intelligence |  | Deterministic Privacy & Safety  |   |
|   | - 72h Coupled Stepper  |  | - Air Watcher Agent      |  | - Consent Verification          |   |
|   | - Ventilation Proxy    |  | - Health Guardian Agent  |  | - Vitals Coarse Quantization    |   |
|   | - Forward Plume Advect |  | - Care Circle Agent      |  | - Deduplication & Cooldown      |   |
|   | - ML Bias Correction   |  | - Coordinator Agent      |  | - Idempotent Alert Ladder       |   |
|   +------------------------+  +--------------------------+  +---------------------------------+   |
+----------------------------------------+------------------------------------+---------------------+
                                         |                                    |
                                         v                                    v
+------------------------------------------------+   +----------------------------------------------+
|             ENVIRONMENTAL DATA SOURCES         |   |                 AWS CLOUD LAYER              |
|                                                |   | (Deployable via CDK / Local Fallback Mode)   |
| - CPCB / OpenAQ (Station AQI & PM2.5/PM10/O3)  |   | - Amazon Bedrock (Foundation Models)         |
| - NASA FIRMS (Active stubble burning fires)    |   | - AWS Step Functions (Alert Ladder Orchestr.)|
| - NOAA GFS / IMD (Wind, Temp, Boundary Layer)  |   | - Amazon DynamoDB (Alerts & Decision Audit)  |
| - Deterministic Local Replay Fixtures          |   | - Amazon SNS (SMS / Email to Caregiver)      |
+------------------------------------------------+   +----------------------------------------------+
```

---

## Key Features

1. **72-Hour Coupled Air & Weather Forecast:**
   - Couples particulate aerosol optical depth with surface cooling and boundary layer suppression.
   - Accurately captures Delhi NCR nocturnal inversion spikes (+120 AQI higher than uncoupled forecasts).
   - Inversion strength index (Weak, Moderate, Strong) computed via ventilation volume ($V_c = \text{PBLH} \times U_{10}$).
   - Forward Lagrangian parcel advection tracking smoke plumes from upwind Punjab/Haryana fire clusters.

2. **On-Device Personal Companion:**
   - Hindi-first and English guidance with live voice speech synthesis ("सुनें").
   - On-device vitals anomaly detection (HR, SpO2, temperature, respiratory distress).
   - "क्या आप ठीक हैं?" (Are you ok?) check-in with 2-minute escalation timer.
   - 30-second cancellation countdown before emergency dispatch to prevent false alarms.

3. **Privacy-by-Design with Cedar Policy:**
   - Raw biometrics remain strictly on the device.
   - Only coarse risk band (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`) and coarse district are transmitted with user consent.
   - Open-source Cedar policies formally enforce authorization.

4. **Multi-Agent Intelligence (Strands on Amazon Bedrock + Local Fallback):**
   - **Air Watcher:** Interprets forecast trends, plume transit, and inversion strength.
   - **Health Guardian:** Selects safe, verified preventive advice without clinical diagnostic claims.
   - **Care Circle:** Formulates calm caregiver messages and manages the alert ladder.
   - **Master Coordinator:** Orchestrates agent workflows and logs decisions to the audit trail.

5. **AWS Serverless Minimal Infrastructure (`infra/`):**
   - Infrastructure-as-code via AWS CDK.
   - S3 ingestion cache with 14-day auto-purge lifecycle.
   - Pay-per-request DynamoDB tables ($0 idle charges).
   - Step Functions alert ladder state machine with Amazon SNS notifications.
   - Local-first fallback allows 100% functionality without cloud credentials.

---

## Local Setup & Run Commands

### Prerequisites
- Node.js 20+ and npm
- Python 3.11+

### 1. Start the FastAPI Backend
```bash
# From repository root
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Base URL: `http://localhost:8000`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`

### 2. Start the React Frontend
```bash
# In another terminal
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:5173`

### 3. Run Automated Tests
```bash
# Run backend, ML, and privacy test suite
python -m pytest tests/ -v

# Run frontend build validation
cd frontend && npm run build
```

---

## Repository Structure
## Repo layout

Aethera is a **web app first**. The companion and caregiver phone experiences are shown as phone previews inside the web app. Folders marked **(exists)** are present in the repository; the rest are planned.

```text
Aethera/
├── README.md                          (exists)
├── LICENSE                            planned
├── .gitignore
├── .github/
│   └── workflows/
│       └── ci.yml                     lint and build on every push
│
├── frontend/                          (exists) React + TypeScript + Vite
│   ├── index.html
│   ├── package.json
│   ├── public/
│   └── src/
│       ├── main.tsx
│       ├── app/                       router and app setup
│       ├── pages/
│       │   ├── home/                  landing page
│       │   ├── dashboard/             forecast, inversion, plume map, agent log
│       │   ├── companion/             phone preview: Kamla's screen
│       │   └── caregiver/             phone preview: caregiver's message
│       ├── components/
│       │   ├── layout/                header, footer
│       │   ├── phone/                 phone frame used by the previews
│       │   └── ui/                    badges, cards, risk bars
│       ├── data/                      sample data until the API is connected
│       ├── api/                       client for the backend (GraphQL)
│       ├── lib/                       helpers: chart scale, AQI categories
│       └── styles/                    design tokens and global styles
│
├── backend/                           planned: Python services on AWS Lambda
│   ├── ingest/                        CPCB/OpenAQ, NASA FIRMS and weather ingestion
│   ├── forecast/                      inversion index, coupled models, plume tracker
│   ├── agents/                        Strands agents on Bedrock
│   │   ├── air_watcher/
│   │   ├── health_guardian/
│   │   ├── care_circle/
│   │   ├── coordinator/
│   │   └── advice_library/             safe advice text selected by agents
│   ├── alerts/                        SNS messages and alert ladder
│   ├── api/                           GraphQL schema and AppSync resolvers
│   └── shared/                        shared types and helpers
│
├── ml/                                planned: forecast model training and evaluation
├── tools/
│   └── vitals-simulator/              planned: sample heart rate and SpO2 readings
├── infra/                             planned: AWS CDK (TypeScript)
│   ├── bin/                           app entry
│   └── lib/
│       ├── data-stack.ts              S3, DynamoDB, ingestion schedule
│       ├── forecast-stack.ts           forecast Lambdas, SageMaker
│       ├── agents-stack.ts              Bedrock, AgentCore, Step Functions, SNS
│       ├── api-stack.ts                 AppSync, Cognito
│       ├── iot-stack.ts                 IoT Core rules
│       └── web-stack.ts                Amplify Hosting, CloudFront, WAF
└── scripts/                           planned: deployment and local helper scripts
```

Each service in `backend/` will have its own `handler.py`, `requirements.txt`, and `tests/` directory.

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
Aethera/
├── app/                  # FastAPI Backend Application
│   ├── main.py           # Application entrypoint & CORS middleware
│   ├── api/routes.py     # Endpoints (/forecast, /inversion, /plumes, /metrics, etc.)
│   ├── core/             # Config, logging, Bedrock provider, Cedar policies
│   ├── schemas/          # Pydantic request and response models
│   ├── data/             # CPCB, OpenAQ, NASA FIRMS, GFS/IMD adapters & fixtures
│   ├── ml/               # 72h coupled surrogate, bias correction, validation
│   ├── services/         # Forecast, inversion, plume tracker, risk engine
│   ├── agents/           # Air Watcher, Health Guardian, Care Circle, Coordinator
│   └── workflows/        # Step Functions alert ladder simulator
├── frontend/             # React 19 + TypeScript + Vite Client Application
│   ├── src/pages/        # DashboardPage, CompanionPage, CaregiverPage
│   ├── src/services/     # Centralized API client with offline caching
│   └── src/App.tsx       # Landing page & navigation
├── infra/                # AWS CDK Infrastructure as Code
│   ├── bin/              # CDK app entrypoint
│   └── lib/              # AetheraStack (S3, DynamoDB, SNS, Step Functions)
├── tests/                # Automated pytest suite (API, ML, Privacy)
├── docs/                 # Primary Project Documentation
│   ├── saans-saathi-prd.md
│   ├── saans-saathi-implementation-plan.md
│   ├── architecture.md
│   ├── implementation-status.md
│   ├── requirements-traceability.md
│   ├── model-evaluation.md
│   ├── data-sources-and-limitations.md
│   ├── privacy-and-security.md
│   ├── aws-deployment.md
│   └── demo-script.md
├── requirements.txt      # Python dependencies
└── .env.example          # Environment variables template
```

---

Install dependencies:

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
| `/companion` | On-device health companion UI preview |
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

**Note:** The frontend currently uses sample data and UI previews. Backend integration, live data, and some interactive features are not connected yet. The frontend can be run locally without deploying the AWS infrastructure.

## Team Prometheus

## Honest Scientific & Medical Disclaimers

1. **Support Tool, Not a Medical Device:** Saans Saathi is a preventive environmental health companion and caregiver awareness tool. In an emergency, call **112**.
2. **Atmospheric Surrogate:** The 72-hour forecast executes a fast, physically coupled 0D/1D numerical feedback surrogate. It does not claim full 3D WRF-Chem HPC execution.
3. **Inversion & Plumes:** Inversion strength is computed via ventilation volume ($V_c = \text{PBLH} \times U_{10}$), and plume paths represent forward wind advection trajectories rather than legal source attribution.
## License

Powered by AWS architecture.
