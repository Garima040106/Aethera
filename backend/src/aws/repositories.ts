import { env } from '../config/env.js'
import { InMemoryAlertRepository, InMemoryDecisionRepository, InMemoryEnvironmentalRepository } from '../repositories/in-memory.js'
import type { AlertRepository, DecisionRepository, EnvironmentalRepository } from '../repositories/interfaces.js'
import { createDocumentClient, DynamoDBAlertRepository, DynamoDBDecisionRepository, DynamoDBEnvironmentalRepository } from './dynamodb-repositories.js'

export interface RepositorySet {
  alerts: AlertRepository
  decisions: DecisionRepository
  environmental: EnvironmentalRepository
  mode: 'memory' | 'dynamodb'
}

type RepositoryConfiguration = Pick<typeof env, 'enableDynamoDB' | 'awsRegion' | 'dynamoDBTable'>

export function createRepositories(configuration: RepositoryConfiguration = env): RepositorySet {
  if (!configuration.enableDynamoDB) {
    return {
      alerts: new InMemoryAlertRepository(),
      decisions: new InMemoryDecisionRepository(),
      environmental: new InMemoryEnvironmentalRepository(),
      mode: 'memory',
    }
  }

  if (!configuration.dynamoDBTable) {
    throw new Error('DynamoDB is enabled but DYNAMODB_TABLE must be configured.')
  }

  const client = createDocumentClient({ region: configuration.awsRegion })
  return {
    alerts: new DynamoDBAlertRepository(client, configuration.dynamoDBTable),
    decisions: new DynamoDBDecisionRepository(client, configuration.dynamoDBTable),
    environmental: new DynamoDBEnvironmentalRepository(client, configuration.dynamoDBTable),
    mode: 'dynamodb',
  }
}
