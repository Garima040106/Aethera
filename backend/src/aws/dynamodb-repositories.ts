import {
  DynamoDBClient,
  DescribeTableCommand,
  type DynamoDBClientConfig,
} from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb'
import type { AlertRecord, DecisionAuditItem, ForecastResponse } from '../schemas/api.js'
import type { AlertRepository, DecisionRepository, EnvironmentalRepository } from '../repositories/interfaces.js'

export class PersistenceError extends Error {
  constructor(operation: string, cause: unknown) {
    super(`DynamoDB ${operation} failed; verify the configured table, IAM permissions, and AWS connectivity.`, { cause })
    this.name = 'PersistenceError'
  }
}

export class DynamoDBAlertRepository implements AlertRepository {
  constructor(
    private readonly documentClient: DynamoDBDocumentClient,
    private readonly tableName: string,
  ) {}

  async put(record: AlertRecord): Promise<void> {
    try {
      await this.documentClient.send(new PutCommand({
        TableName: this.tableName,
        Item: {
          pk: `ALERT#${record.eventId}`,
          sk: record.timestamp,
          recordType: 'ALERT',
          eventId: record.eventId,
          timestamp: record.timestamp,
          status: record.status,
          ttl: record.ttl,
        },
      }))
    } catch (error) {
      throw new PersistenceError('alert write', error)
    }
  }

  async get(eventId: string, timestamp: string): Promise<AlertRecord | undefined> {
    try {
      const result = await this.documentClient.send(new GetCommand({
        TableName: this.tableName,
        Key: { pk: `ALERT#${eventId}`, sk: timestamp },
        ProjectionExpression: 'eventId, #ts, #st, ttl',
        ExpressionAttributeNames: { '#ts': 'timestamp', '#st': 'status' },
      }))
      if (!result.Item) return undefined
      const item = result.Item as AlertRecord
      return {
        eventId: item.eventId,
        timestamp: item.timestamp,
        status: item.status,
        ttl: item.ttl,
      }
    } catch (error) {
      throw new PersistenceError('alert read', error)
    }
  }
}

export class DynamoDBDecisionRepository implements DecisionRepository {
  constructor(
    private readonly documentClient: DynamoDBDocumentClient,
    private readonly tableName: string,
  ) {}

  async put(record: DecisionAuditItem): Promise<void> {
    try {
      await this.documentClient.send(new PutCommand({
        TableName: this.tableName,
        Item: {
          pk: 'DECISION',
          sk: `${record.createdAt}#${record.decisionId}`,
          recordType: 'DECISION',
          decisionId: record.decisionId,
          createdAt: record.createdAt,
          agent: record.agent,
          title: record.title,
          detail: record.detail,
          evidenceSource: record.evidenceSource,
          riskLevel: record.riskLevel,
        },
      }))
    } catch (error) {
      throw new PersistenceError('decision write', error)
    }
  }

  async listRecent(limit: number): Promise<DecisionAuditItem[]> {
    try {
      if (limit <= 0) return []
      const result = await this.documentClient.send(new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: { ':pk': 'DECISION' },
        ScanIndexForward: false,
        Limit: Math.min(limit, 100),
        ProjectionExpression: 'decisionId, createdAt, agent, title, detail, evidenceSource, riskLevel',
      }))
      return (result.Items ?? []) as DecisionAuditItem[]
    } catch (error) {
      throw new PersistenceError('decision read', error)
    }
  }
}

export class DynamoDBEnvironmentalRepository implements EnvironmentalRepository {
  constructor(
    private readonly documentClient: DynamoDBDocumentClient,
    private readonly tableName: string,
  ) {}

  async putForecast(area: string, forecast: ForecastResponse): Promise<void> {
    try {
      const areaKey = area.trim().toLowerCase()
      await this.documentClient.send(new PutCommand({
        TableName: this.tableName,
        Item: {
          pk: `ENVIRONMENT#${areaKey}`,
          sk: `FORECAST#${forecast.generated_at}`,
          recordType: 'ENVIRONMENTAL_FORECAST',
          area: forecast.area,
          areaKey,
          generatedAt: forecast.generated_at,
          forecast,
        },
      }))
    } catch (error) {
      throw new PersistenceError('environmental forecast write', error)
    }
  }

  async listRecentForecasts(area: string, limit: number): Promise<ForecastResponse[]> {
    try {
      if (limit <= 0) return []
      const normalizedArea = area.trim().toLowerCase()
      const result = await this.documentClient.send(new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
        ExpressionAttributeValues: {
          ':pk': `ENVIRONMENT#${normalizedArea}`,
          ':skPrefix': 'FORECAST#',
        },
        ScanIndexForward: false,
        Limit: Math.min(limit, 100),
        ProjectionExpression: 'forecast',
      }))
      return (result.Items ?? []).map((item) => item.forecast as ForecastResponse)
    } catch (error) {
      throw new PersistenceError('environmental forecast read', error)
    }
  }
}

export function createDocumentClient(config: DynamoDBClientConfig): DynamoDBDocumentClient {
  return DynamoDBDocumentClient.from(new DynamoDBClient(config), {
    marshallOptions: { removeUndefinedValues: true },
  })
}

export async function checkDynamoDBTableConnectivity(
  client: DynamoDBClient,
  tableName: string,
): Promise<void> {
  try {
    const result = await client.send(new DescribeTableCommand({ TableName: tableName }))
    if (!result.Table?.TableName) throw new Error('DynamoDB table was not returned by DescribeTable.')
  } catch (error) {
    throw new PersistenceError('connectivity check', error)
  }
}
