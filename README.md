# Aethera

**A breath companion for Delhi NCR. It sees the bad air coming, watches over the people most at risk, and calls their family when it matters.**

Built for [Environmental Hacks](https://www.wemakedevs.org/aws/env) (Bharat Builds Tour, WeMakeDevs x AWS). Track: **Air**.

> Status: work in progress. Links below are filled in at submission.

| | |
|---|---|
| Live demo | _TBA_ |
| Demo video (3 min) | _TBA_ |
| Blog (AWS Builder Center) | _TBA_ |

---

## The problem

In Delhi NCR, inversion traps stubble-burning smoke near the ground. That smoke then changes the local weather, which traps more smoke. Most AQI forecasts treat weather and pollution separately, so they miss the spikes.

A correct forecast still does not help Kamla, 68, who has asthma and lives alone in Noida. Nobody watches her health, her son is in another city, and most health apps send private data to the cloud and fail when the network drops.

## What Aethera does

1. **72-hour coupled air and weather forecast** for Delhi NCR. It tracks inversion strength and predicts where fire plumes travel and when they arrive.
2. **On-device health companion** (offline-first phone app). It watches heart rate, SpO2, temperature, activity and falls, and keeps raw health data on the phone.
3. **Agents that decide what to do next.** They turn the forecast and her vitals into one clear action, then choose who to tell: Kamla first, then her son, then emergency contacts. She can cancel before SOS fires.

The caregiver gets one calm message in Hindi or English, not 30 alerts.

## How it works

```
Phone app (on-device AI, offline)
   | MQTT, only if sharing is on
   v
AWS IoT Core -> EventBridge -> Step Functions -> Strands agents on Bedrock -> SNS
                                                       |
Hourly ingest (AQI, fires, weather) -> S3 -> coupled forecast + plume tracker -> DynamoDB
                                                       |
                                          AppSync -> Web dashboard (Amplify + CloudFront)
```

**Agents:** Air Watcher, Health Guardian, Care Circle, Coordinator (built with the Strands Agents SDK).

## Built on AWS

- **Core:** IoT Core, EventBridge, Step Functions, Lambda, S3, DynamoDB, AppSync, Amplify, CloudFront, Cognito, SNS, CloudWatch, Bedrock
- **Extended (as built):** Bedrock AgentCore, Knowledge Bases, Guardrails, Verified Permissions (Cedar), Polly, Glue and Athena, SageMaker, Kinesis Data Firehose, SQS, Location Service, WAF, Secrets Manager and KMS
- **AWS open source:** Strands Agents SDK, Cedar, AWS CDK
- **Open data:** Registry of Open Data on AWS

The extended list is trimmed at submission to the services that actually run.

## Data sources

CPCB and OpenAQ (air quality), NASA FIRMS (fires), IMD and weather data on AWS Open Data (weather). Every card on the dashboard shows its source and last update time.

## Privacy

- Health data is processed and stored on the phone.
- The cloud only receives a coarse risk band and coarse area, and only if the user turns sharing on.
- Sharing is off by default, per contact, and enforced by Cedar policies.
- SOS has a cancel countdown. Location is sent only if the user allows it.

## Honest limits

- The forecast uses two small coupled models, not a full WRF-Chem run. WRF-Chem on AWS is future work.
- The wearable is simulated, plus the phone's motion sensor for falls.
- The health model is not clinically validated. **Aethera is a support tool, not a medical device. In an emergency call 112.**

## Repo layout

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

_Member names TBA_

## License

Powered by AWS architecture.
