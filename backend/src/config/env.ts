import dotenv from 'dotenv'

dotenv.config({ path: ['.env.local', '.env', 'backend/.env.local', 'backend/.env'] })

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value.trim() === '') return fallback
  const normalized = value.trim().toLowerCase()
  if (normalized === 'true') return true
  if (normalized === 'false') return false
  throw new Error(`Expected true or false, received invalid boolean configuration: ${value}`)
}

const enableDynamoDB = parseBoolean(process.env.ENABLE_DYNAMODB, false)
const port = Number(process.env.PORT ?? '8000')

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port,
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  enableDynamoDB,
  enableBedrock: parseBoolean(process.env.ENABLE_BEDROCK, false),
  enableOpenAq: parseBoolean(process.env.ENABLE_OPENAQ, Boolean(process.env.OPENAQ_API_KEY?.trim())),
  awsRegion: process.env.AWS_REGION ?? 'us-east-1',
  awsProfile: process.env.AWS_PROFILE?.trim() || undefined,
  dynamoDBTable: process.env.DYNAMODB_TABLE?.trim() || 'AtheraEnvironmentalData',
  alertsTable: process.env.DYNAMODB_ALERTS_TABLE?.trim() || undefined,
  decisionsTable: process.env.DYNAMODB_DECISIONS_TABLE?.trim() || undefined,
  bedrockModelId: process.env.BEDROCK_MODEL_ID ?? 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  openAqApiKey: process.env.OPENAQ_API_KEY?.trim() || undefined,
  dataGovInApiKey: process.env.CPCB_API_KEY?.trim() || process.env.DATA_GOV_IN_API_KEY?.trim() || undefined,
  cpcbAqiResourceId: process.env.CPCB_AQI_RESOURCE_ID?.trim() || '3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69',
  nasaFirmsMapKey: process.env.NASA_FIRMS_MAP_KEY?.trim() || undefined,
  openAiApiKey: process.env.OPENAI_API_KEY?.trim() || undefined,
  openAiBaseUrl: process.env.OPENAI_BASE_URL?.trim() || 'https://bedrock-mantle.us-east-1.api.aws/v1',
  openAiProjectId: process.env.OPENAI_PROJECT_ID?.trim() || 'default',
  appName: 'Saans Saathi API',
  appVersion: '1.0.0',
} as const

if (!Number.isInteger(env.port) || env.port < 1 || env.port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535')
}
