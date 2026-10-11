import { env } from '../config/env.js'
import { dynamoDBDocumentClient } from '../config/dynamodb.js'
import { InMemoryAlertRepository, InMemoryDecisionRepository, InMemoryEnvironmentalRepository } from '../repositories/in-memory.js'
import type { AlertRepository, DecisionRepository, EnvironmentalRepository } from '../repositories/interfaces.js'
import { checkDynamoDBConnectivity, DynamoDBAlertRepository, DynamoDBDecisionRepository, DynamoDBEnvironmentalRepository } from './dynamodb-repositories.js'

export interface RepositorySet {
  alerts: AlertRepository
  decisions: DecisionRepository
  environmental: EnvironmentalRepository
  mode: 'memory' | 'dynamodb'
  checkConnectivity?: () => Promise<void>
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

  const client = dynamoDBDocumentClient
  const tableName = configuration.dynamoDBTable
  return {
    alerts: new DynamoDBAlertRepository(client, tableName),
    decisions: new DynamoDBDecisionRepository(client, tableName),
    environmental: new DynamoDBEnvironmentalRepository(client, tableName),
    mode: 'dynamodb',
    checkConnectivity: () => checkDynamoDBConnectivity(tableName, client),
  }
}
