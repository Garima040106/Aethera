# Saans Saathi: AWS Architecture, Deployment & Cost Review

## 1. Environment Inspection & Authorization Report

In accordance with Phase 5.1 requirements, an environmental audit was executed on the host system:

- **AWS CLI Status:** `aws` CLI is not installed on the system PATH.
- **AWS STS Identity:** Unauthenticated / No credentials configured in environment.
- **Operational Mode:** **Stage 5.7 Local-First Fallback Active.**
  All capabilities (FastAPI backend, 72-hour coupled surrogate forecasting, inversion index, plume tracking, Cedar policy consent engine, and multi-agent intelligence) run locally with zero AWS credential requirements.
- **Bedrock Mode:** Seamless deterministic local provider active with full traceability.

---

## 2. Infrastructure as Code: Minimal Serverless Footprint (`infra/`)

To support live deployment upon credential provisioning, a minimal, cost-controlled AWS CDK stack (`infra/lib/aethera-stack.ts`) is provided.

### 2.1 Provisioned Services

| Service | Resource Name | Purpose | Billing Mode & Cost Driver |
|---|---|---|---|
| **Amazon S3** | `SaansSaathiDataBucket` | Ingestion cache for CPCB & FIRMS telemetry | Standard S3 ($0.023/GB), 14-day auto-purge lifecycle |
| **Amazon DynamoDB** | `AlertRecordsTable` | Idempotent alert ladder state and event history | **Pay-per-Request** ($0 idle charges) |
| **Amazon DynamoDB** | `DecisionsAuditTable` | Redacted agent reasoning and audit records | **Pay-per-Request** ($0 idle charges) |
| **Amazon SNS** | `CaregiverAlertTopic` | Calm SMS / Email notifications to Rohan | Free tier includes 100 SMS & 1,000,000 pushes |
| **AWS Step Functions** | `SaansSaathi-AlertLadder` | 5-stage deterministic alert escalation workflow | Express/Standard state machine ($0.025/1,000 runs) |
| **Amazon Bedrock** | `anthropic.claude-3-5-sonnet` | Grounded multi-agent reasoning and explanation | Pay-per-token inference (only on active triggers) |
| **Amazon CloudWatch** | `/aws/vendedlogs/states/AlertLadder` | Operational logs and audit tracing | 14-day retention rule applied |

---

## 3. Strict Architecture Exclusions (Cost Control)

To strictly enforce Section 5.6 of the Master Prompt, the following expensive services are **explicitly excluded**:

- **NO WRF-Chem HPC clusters** (ParallelCluster, Slurm, MPI). The MVP executes our coupled surrogate solver.
- **NO Persistent EC2 instances** (t3, m5, etc.). All compute is serverless Lambda / local.
- **NO Always-on SageMaker Inference Endpoints** (saves ~$50–$150/month).
- **NO AWS NAT Gateways** (saves ~$32.40/month per gateway).
- **NO Amazon FSx for Lustre or large shared storage**.

---

## 4. Cost Assessment & Budget Assumptions

- **Expected monthly idle charge:** **$0.00** (All components are serverless pay-per-request).
- **Demo workload estimate (100 runs):**
  - DynamoDB writes/reads: < $0.01
  - Step Functions transitions: < $0.02
  - Bedrock model inferences (approx. 50 calls): ~$0.15
  - S3 storage (under 50 MB): < $0.01
  - **Total Estimated Demo Cost:** **< $0.20** (Fully covered by standard $200 AWS builder credits).

---

## 5. Live Deployment Steps (When AWS CLI is Installed)

```bash
# 1. Configure credentials
aws configure

# 2. Verify identity
aws sts get-caller-identity

# 3. Navigate to infra and install CDK dependencies
cd infra
npm install

# 4. Synthesize CloudFormation template
npx cdk synth

# 5. Review proposed resource changes
npx cdk diff

# 6. Deploy the minimal stack
npx cdk deploy
```

---

## 6. Teardown Procedure (Complete Clean-up)

To ensure zero ongoing charges after the hackathon demonstration:

```bash
cd infra
npx cdk destroy --force
```

All DynamoDB tables, S3 buckets, and Step Functions workflows have `RemovalPolicy.DESTROY` configured with `autoDeleteObjects: true` to prevent orphaned billable artifacts.
