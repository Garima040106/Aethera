import dotenv from 'dotenv'

dotenv.config({ path: ['.env.local', '.env'] })

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value.trim() === '') return fallback
  const normalized = value.trim().toLowerCase()
  if (normalized === 'true') return true
  if (normalized === 'false') return false
  throw new Error(`Expected true or false, received invalid boolean configuration: ${value}`)
}

function requiredWhenEnabled(value: string | undefined, name: string, enabled: boolean): string | undefined {
  const normalized = value?.trim()
  if (enabled && !normalized) {
    throw new Error(`${name} must be set when ENABLE_DYNAMODB=true`)
  }
  return normalized || undefined
}

const enableDynamoDB = parseBoolean(process.env.ENABLE_DYNAMODB, false)
const port = Number(process.env.PORT ?? '8000')

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port,
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  enableDynamoDB,
  enableBedrock: parseBoolean(process.env.ENABLE_BEDROCK, false),
  enableOpenAq: parseBoolean(process.env.ENABLE_OPENAQ, false),
  awsRegion: process.env.AWS_REGION ?? 'us-east-1',
  dynamoDBTable: requiredWhenEnabled(process.env.DYNAMODB_TABLE, 'DYNAMODB_TABLE', enableDynamoDB),
  alertsTable: requiredWhenEnabled(process.env.DYNAMODB_ALERTS_TABLE, 'DYNAMODB_ALERTS_TABLE', enableDynamoDB),
  decisionsTable: requiredWhenEnabled(process.env.DYNAMODB_DECISIONS_TABLE, 'DYNAMODB_DECISIONS_TABLE', enableDynamoDB),
  bedrockModelId: process.env.BEDROCK_MODEL_ID ?? 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  openAqApiKey: process.env.OPENAQ_API_KEY?.trim() || undefined,
  openAqLocationId: process.env.OPENAQ_LOCATION_ID?.trim() || '8118',
  appName: 'Saans Saathi API',
  appVersion: '1.0.0',
} as const

if (!Number.isInteger(env.port) || env.port < 1 || env.port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535')
}
