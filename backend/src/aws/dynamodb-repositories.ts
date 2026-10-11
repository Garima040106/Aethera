import {
  DynamoDBClient,
  type DynamoDBClientConfig,
} from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  type ScanCommandInput,
} from '@aws-sdk/lib-dynamodb'
import type { AlertRecord, DecisionAuditItem } from '../schemas/api.js'
import type { AlertRepository, DecisionRepository } from '../repositories/interfaces.js'

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
        Key: { eventId, timestamp },
        ProjectionExpression: 'eventId, #ts, #st, ttl',
        ExpressionAttributeNames: { '#ts': 'timestamp', '#st': 'status' },
      }))
      if (!result.Item) return undefined
      return result.Item as AlertRecord
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
      const items: DecisionAuditItem[] = []
      let exclusiveStartKey: ScanCommandInput['ExclusiveStartKey']
      do {
        const result = await this.documentClient.send(new ScanCommand({
          TableName: this.tableName,
          Limit: Math.min(Math.max(limit, 1), 100),
          ExclusiveStartKey: exclusiveStartKey,
          ProjectionExpression: 'decisionId, createdAt, agent, title, detail, evidenceSource, riskLevel',
        }))
        items.push(...((result.Items ?? []) as DecisionAuditItem[]))
        exclusiveStartKey = result.LastEvaluatedKey
      } while (exclusiveStartKey)

      return items
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit)
    } catch (error) {
      throw new PersistenceError('decision read', error)
    }
  }
}

export function createDocumentClient(config: DynamoDBClientConfig): DynamoDBDocumentClient {
  return DynamoDBDocumentClient.from(new DynamoDBClient(config), {
    marshallOptions: { removeUndefinedValues: true },
  })
}
