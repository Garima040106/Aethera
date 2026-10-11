import { env } from '../config/env.js'
import { InMemoryAlertRepository, InMemoryDecisionRepository } from '../repositories/in-memory.js'
import type { AlertRepository, DecisionRepository } from '../repositories/interfaces.js'
import { createDocumentClient, DynamoDBAlertRepository, DynamoDBDecisionRepository } from './dynamodb-repositories.js'

export interface RepositorySet {
  alerts: AlertRepository
  decisions: DecisionRepository
  mode: 'memory' | 'dynamodb'
}

export function createRepositories(): RepositorySet {
  if (!env.enableDynamoDB) {
    return {
      alerts: new InMemoryAlertRepository(),
      decisions: new InMemoryDecisionRepository(),
      mode: 'memory',
    }
  }

  if (!env.alertsTable || !env.decisionsTable) {
    throw new Error('DynamoDB is enabled but DYNAMODB_ALERTS_TABLE and DYNAMODB_DECISIONS_TABLE must both be configured.')
  }

  const client = createDocumentClient({ region: env.awsRegion })
  return {
    alerts: new DynamoDBAlertRepository(client, env.alertsTable),
    decisions: new DynamoDBDecisionRepository(client, env.decisionsTable),
    mode: 'dynamodb',
  }
}
