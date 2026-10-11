import { QueryCommand, type DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'
import {
  executeDynamoDBOperation,
  getRecord,
  putRecord,
  type DynamoDBKey,
} from '../config/dynamodb.js'
import type { AlertRecord, DecisionAuditItem, ForecastResponse } from '../schemas/api.js'
import type { AlertRepository, DecisionRepository, EnvironmentalRepository } from '../repositories/interfaces.js'

export { PersistenceError, createDocumentClient } from '../config/dynamodb.js'

export class DynamoDBAlertRepository implements AlertRepository {
  constructor(
    private readonly documentClient: DynamoDBDocumentClient,
    private readonly tableName: string,
  ) {}

  async put(record: AlertRecord): Promise<void> {
    await putRecord(this.tableName, {
      PK: `ALERT#${record.eventId}`,
      SK: record.timestamp,
      recordType: 'ALERT',
      eventId: record.eventId,
      timestamp: record.timestamp,
      status: record.status,
      ttl: record.ttl,
    }, this.documentClient)
  }

  async get(eventId: string, timestamp: string): Promise<AlertRecord | undefined> {
    const item = await getRecord<{
      eventId: string
      timestamp: string
      status: string
      ttl: number
    }>(this.tableName, { PK: `ALERT#${eventId}`, SK: timestamp }, this.documentClient)
    if (!item) return undefined
    return {
      eventId: item.eventId,
      timestamp: item.timestamp,
      status: item.status,
      ttl: item.ttl,
    }
  }
}

export class DynamoDBDecisionRepository implements DecisionRepository {
  constructor(
    private readonly documentClient: DynamoDBDocumentClient,
    private readonly tableName: string,
  ) {}

  async put(record: DecisionAuditItem): Promise<void> {
    await putRecord(this.tableName, {
      PK: 'DECISION',
      SK: `${record.createdAt}#${record.decisionId}`,
      recordType: 'DECISION',
      decisionId: record.decisionId,
      createdAt: record.createdAt,
      agent: record.agent,
      title: record.title,
      detail: record.detail,
      evidenceSource: record.evidenceSource,
      riskLevel: record.riskLevel,
    }, this.documentClient)
  }

  async listRecent(limit: number): Promise<DecisionAuditItem[]> {
    if (limit <= 0) return []
    const result = await executeDynamoDBOperation('Query decisions', this.tableName, () =>
      this.documentClient.send(new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: '#pk = :pk',
        ExpressionAttributeNames: {
          '#pk': 'PK',
          '#decisionId': 'decisionId',
          '#createdAt': 'createdAt',
          '#agent': 'agent',
          '#title': 'title',
          '#detail': 'detail',
          '#evidenceSource': 'evidenceSource',
          '#riskLevel': 'riskLevel',
        },
        ExpressionAttributeValues: { ':pk': 'DECISION' },
        ScanIndexForward: false,
        Limit: Math.min(limit, 100),
        ProjectionExpression: '#decisionId, #createdAt, #agent, #title, #detail, #evidenceSource, #riskLevel',
      })),
    )
    return (result.Items ?? []).map((item) => {
      const fields = ['decisionId', 'createdAt', 'agent', 'title', 'detail', 'evidenceSource', 'riskLevel'] as const
      if (fields.some((field) => typeof item[field] !== 'string')) {
        throw new Error('DynamoDB decision record does not match the expected shape.')
      }
      return {
        decisionId: item.decisionId as string,
        createdAt: item.createdAt as string,
        agent: item.agent as string,
        title: item.title as string,
        detail: item.detail as string,
        evidenceSource: item.evidenceSource as string,
        riskLevel: item.riskLevel as string,
      }
    })
  }
}

export class DynamoDBEnvironmentalRepository implements EnvironmentalRepository {
  constructor(
    private readonly documentClient: DynamoDBDocumentClient,
    private readonly tableName: string,
  ) {}

  async putForecast(area: string, forecast: ForecastResponse): Promise<void> {
    const areaKey = area.trim().toLowerCase()
    await putRecord(this.tableName, {
      PK: `ENVIRONMENT#${areaKey}`,
      SK: `FORECAST#${forecast.generated_at}`,
      recordType: 'ENVIRONMENTAL_FORECAST',
      area: forecast.area,
      areaKey,
      generatedAt: forecast.generated_at,
      forecast,
    }, this.documentClient)
  }

  async listRecentForecasts(area: string, limit: number): Promise<ForecastResponse[]> {
    if (limit <= 0) return []
    const normalizedArea = area.trim().toLowerCase()
    const result = await executeDynamoDBOperation('Query forecast history', this.tableName, () =>
      this.documentClient.send(new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :skPrefix)',
        ExpressionAttributeNames: { '#pk': 'PK', '#sk': 'SK' },
        ExpressionAttributeValues: {
          ':pk': `ENVIRONMENT#${normalizedArea}`,
          ':skPrefix': 'FORECAST#',
        },
        ScanIndexForward: false,
        Limit: Math.min(limit, 100),
        ProjectionExpression: 'forecast',
      })),
    )
    return (result.Items ?? []).flatMap((item) => {
      if (typeof item.forecast !== 'object' || item.forecast === null || Array.isArray(item.forecast)) {
        throw new Error('DynamoDB forecast record is missing its forecast document.')
      }
      return [item.forecast as ForecastResponse]
    })
  }
}

export async function checkDynamoDBConnectivity(
  tableName: string,
  client: DynamoDBDocumentClient,
): Promise<void> {
  const key: DynamoDBKey = { PK: '__AETHERA_HEALTH_CHECK__', SK: '__AETHERA_HEALTH_CHECK__' }
  await getRecord(tableName, key, client)
}
