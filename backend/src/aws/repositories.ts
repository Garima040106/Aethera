import { env } from '../config/env.js'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { InMemoryAlertRepository, InMemoryDecisionRepository, InMemoryEnvironmentalRepository } from '../repositories/in-memory.js'
import type { AlertRepository, DecisionRepository, EnvironmentalRepository } from '../repositories/interfaces.js'
import { checkDynamoDBTableConnectivity, createDocumentClient, DynamoDBAlertRepository, DynamoDBDecisionRepository, DynamoDBEnvironmentalRepository } from './dynamodb-repositories.js'

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

  const tableName = configuration.dynamoDBTable
  const client = createDocumentClient({ region: configuration.awsRegion })
  const connectivityClient = new DynamoDBClient({ region: configuration.awsRegion })
  return {
    alerts: new DynamoDBAlertRepository(client, tableName),
    decisions: new DynamoDBDecisionRepository(client, tableName),
    environmental: new DynamoDBEnvironmentalRepository(client, tableName),
    mode: 'dynamodb',
    checkConnectivity: () => checkDynamoDBTableConnectivity(connectivityClient, tableName),
  }
}
