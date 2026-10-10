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

```
phone/       PWA, on-device model, simulator
data/        ingestion, inversion index, forecast, plume tracker
agents/      Strands agents, alert ladder
dashboard/   web dashboard
infra/       AWS CDK stack
docs/        PRD and implementation plan
```

## Run it

_Setup steps added once the stack is deployed._

```
cd infra && cdk deploy
```

## Team Prometheus

_Member names TBA_

## License

Powered by AWS architecture.