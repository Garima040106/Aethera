# Aethera Backend on AWS Lambda

The `AetheraBackendApiStack` deploys the existing Express + TypeScript API as an AWS Lambda
function behind an API Gateway HTTP API. It imports the existing `AtheraEnvironmentalData` table
and does not create, replace, or delete DynamoDB tables.

## Prerequisites

- Node.js 20+ and npm
- AWS CLI credentials for the target account, with permissions to deploy CDK/CloudFormation, Lambda,
  API Gateway, IAM roles/policies, and CloudWatch Logs
- CDK bootstrap completed in the deployment account and region
- An existing DynamoDB table named `AtheraEnvironmentalData` in `us-east-1`, with string partition
  and sort keys `PK` and `SK`
- An approved frontend origin for CORS

The Lambda execution role receives only `dynamodb:PutItem`, `dynamodb:GetItem`,
`dynamodb:UpdateItem`, `dynamodb:DeleteItem`, and `dynamodb:Query` permissions on the imported
table ARN, plus `geo-places:SearchText` for place search and `geo-routes:CalculateRoutes` for route
calculation. Both Location operations currently use resource `*`. It does not need
`dynamodb:DescribeTable` for the database health check. AWS
credentials are not embedded in the bundle; the AWS SDK uses the Lambda execution role.

## Synthesize and deploy

From PowerShell:

```powershell
Set-Location infra
npm install
npm run build

# First-time setup for the account/region, if CDK has not already been bootstrapped:
npm run cdk -- bootstrap

# Review the generated CloudFormation template and planned changes:
npm run synth:api -- -c corsOrigins=https://your-frontend.example
npm run cdk -- diff AetheraBackendApiStack -c corsOrigins=https://your-frontend.example

# Deploy only after reviewing the diff:
npm run deploy:api -- -c corsOrigins=https://your-frontend.example
```

The stack defaults to the `us-east-1` region and local Vite origins. Pass the deployed frontend
origin using `-c corsOrigins=...`; multiple origins can be comma-separated. Set `CDK_DEFAULT_REGION`
and configure AWS CLI credentials for the target account before synthesis/deployment. The output
`BackendApiUrl` is the API base URL; set `VITE_API_BASE_URL` to it and rebuild/redeploy the frontend.

## API routes and DynamoDB records

The HTTP API sends all paths to the existing Lambda proxy handler. Forecast requests persist a
snapshot and `GET /api/environmental-data?area=noida&limit=10` reads recent snapshots. Alerts and
redacted decision audits are stored in the same table using separate `PK` namespaces and `SK`
sort-key prefixes. `GET /health/dynamodb` performs a real `GetItem` against the table and returns
healthy only when DynamoDB access succeeds. No raw health
measurements are persisted by these repositories.

## Local DynamoDB development

Set the following variables in the ignored `backend/.env.local` file. The backend loads this file
before creating the SDK client:

```dotenv
ENABLE_DYNAMODB=true
AWS_PROFILE=nickhilverma
AWS_REGION=us-east-1
DYNAMODB_TABLE=AtheraEnvironmentalData
```

The profile name selects credentials from the local AWS CLI profile chain; do not put access keys in
the frontend or environment file. Run the backend from `backend` with `npm run dev`, then verify
actual table access with:

```powershell
Invoke-RestMethod http://localhost:8000/health/dynamodb
```

The endpoint uses a read-only `GetItem` for a reserved health-check key with the verified uppercase
`PK`/`SK` schema; it does not create or modify records. Forecast requests, decisions, and health
events exercise the existing application repositories. For production, omit `AWS_PROFILE` and
grant the Lambda execution role the table-scoped permissions listed above.

## Live Delhi AQI and place search

The backend reads Delhi station data from the data.gov.in CPCB resource when
`DATA_GOV_IN_API_KEY` is set. For local development, keep it only in the ignored
`backend/.env.local` file and use the default resource or set `CPCB_AQI_RESOURCE_ID`. Never put
this token or AWS credentials in frontend environment variables. Lambda does not receive the
data.gov.in token from the CDK stack; configure it through an approved protected runtime-secret
process before expecting live AQI data in production. Without it, the endpoint explicitly reports
that the station feed is unavailable.

Backend place search uses IAM/SigV4 through the AWS SDK credential chain: the named local profile
for development and the Lambda execution role in production. The CDK grants
`geo-places:SearchText` and `geo-routes:CalculateRoutes`; it does not grant permission to create
or modify Location resources. Route calculation runs through `GeoRoutesClient` and
`CalculateRoutesCommand` in the backend, not a direct browser request.

## Important security limitation

The demo API has no authentication or authorization. The role-aware frontend sign-in is
browser-only and does not protect API routes. CORS restricts browser origins but is not an access
control mechanism; anyone who obtains the API URL can call the API directly. Deploy this stack only
for an approved demo with non-sensitive data. Add a real API authorizer and production data controls
before using it with personal or health information.

This document describes deployable infrastructure. No AWS resources are created until the CDK
deployment command is explicitly run and approved.
