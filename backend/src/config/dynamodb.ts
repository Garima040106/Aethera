import { DynamoDBClient, type DynamoDBClientConfig } from '@aws-sdk/client-dynamodb'
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  type NativeAttributeValue,
} from '@aws-sdk/lib-dynamodb'
import { env } from './env.js'

export type DynamoDBRecord = Record<string, NativeAttributeValue>
export type DynamoDBKey = DynamoDBRecord & { PK: string; SK: string }

export class PersistenceError extends Error {
  constructor(operation: string, tableName: string, cause: unknown) {
    super(`DynamoDB ${operation} failed; verify the configured table, IAM permissions, and AWS connectivity.`, { cause })
    this.name = 'PersistenceError'
    logDynamoDBFailure(operation, tableName, cause)
  }
}

export class DynamoDBRecordNotFoundError extends Error {
  constructor() {
    super('The DynamoDB record does not exist.')
    this.name = 'DynamoDBRecordNotFoundError'
  }
}

export class DynamoDBInputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DynamoDBInputError'
  }
}

export const dynamoDBClientConfig: DynamoDBClientConfig = {
  region: env.awsRegion,
  ...(process.env.AWS_PROFILE?.trim() ? { profile: process.env.AWS_PROFILE.trim() } : {}),
}

export function createDocumentClient(config: DynamoDBClientConfig = dynamoDBClientConfig): DynamoDBDocumentClient {
  const localProfile = process.env.AWS_PROFILE?.trim()
  const clientConfig = {
    ...(localProfile && !config.profile ? { profile: localProfile } : {}),
    ...config,
  }
  return DynamoDBDocumentClient.from(new DynamoDBClient(clientConfig), {
    marshallOptions: { removeUndefinedValues: true },
  })
}

export const dynamoDBDocumentClient = createDocumentClient()

export async function putRecord<T extends object>(
  tableName: string,
  item: T,
  client: DynamoDBDocumentClient = dynamoDBDocumentClient,
): Promise<void> {
  validateTableName(tableName)
  const document = validateRecord(item, 'item')
  validateKey(document, 'item', false)
  await executeDynamoDBOperation('PutItem', tableName, () => client.send(new PutCommand({
    TableName: tableName,
    Item: document,
  })))
}

export async function getRecord<T extends object>(
  tableName: string,
  key: DynamoDBKey,
  client: DynamoDBDocumentClient = dynamoDBDocumentClient,
): Promise<T | undefined> {
  validateTableName(tableName)
  validateKey(key, 'key')
  const result = await executeDynamoDBOperation('GetItem', tableName, () => client.send(new GetCommand({
    TableName: tableName,
    Key: key,
  })))
  return result.Item as T | undefined
}

export async function updateRecord<T extends object>(
  tableName: string,
  key: DynamoDBKey,
  updates: Record<string, unknown>,
  client: DynamoDBDocumentClient = dynamoDBDocumentClient,
): Promise<T> {
  validateTableName(tableName)
  validateKey(key, 'key')
  const patch = validateRecord(updates, 'updates')
  const fields = Object.entries(patch)
  if (fields.length === 0) {
    throw new DynamoDBInputError('At least one non-key field is required for a DynamoDB update.')
  }
  if (fields.some(([name]) => name === 'PK' || name === 'SK')) {
    throw new DynamoDBInputError('DynamoDB primary-key attributes cannot be changed.')
  }

  const names: Record<string, string> = { '#keyPk': 'PK', '#keySk': 'SK' }
  const values: Record<string, NativeAttributeValue> = {}
  const assignments = fields.map(([name, value], index) => {
    const nameToken = `#field${index}`
    const valueToken = `:value${index}`
    names[nameToken] = name
    values[valueToken] = value
    return `${nameToken} = ${valueToken}`
  })

  try {
    const result = await executeDynamoDBOperation('UpdateItem', tableName, () => client.send(new UpdateCommand({
      TableName: tableName,
      Key: key,
      UpdateExpression: `SET ${assignments.join(', ')}`,
      ConditionExpression: 'attribute_exists(#keyPk) AND attribute_exists(#keySk)',
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: 'ALL_NEW',
    })))
    if (!result.Attributes) {
      throw new Error('DynamoDB returned no attributes for a successful update.')
    }
    return result.Attributes as T
  } catch (error) {
    if (isConditionalCheckFailure(error)) {
      throw new DynamoDBRecordNotFoundError()
    }
    throw error
  }
}

export async function deleteRecord<T extends object = DynamoDBRecord>(
  tableName: string,
  key: DynamoDBKey,
  client: DynamoDBDocumentClient = dynamoDBDocumentClient,
): Promise<T | undefined> {
  validateTableName(tableName)
  validateKey(key, 'key')
  const result = await executeDynamoDBOperation('DeleteItem', tableName, () => client.send(new DeleteCommand({
    TableName: tableName,
    Key: key,
    ReturnValues: 'ALL_OLD',
  })))
  return result.Attributes as T | undefined
}

export async function executeDynamoDBOperation<T>(
  operation: string,
  tableName: string,
  action: () => Promise<T>,
): Promise<T> {
  try {
    return await action()
  } catch (error) {
    if (error instanceof PersistenceError || error instanceof DynamoDBRecordNotFoundError) {
      throw error
    }
    if (isConditionalCheckFailure(error)) {
      throw new DynamoDBRecordNotFoundError()
    }
    throw new PersistenceError(operation, tableName, error)
  }
}

function validateTableName(tableName: string): void {
  if (typeof tableName !== 'string' || tableName.trim() === '') {
    throw new DynamoDBInputError('A non-empty DynamoDB table name is required.')
  }
}

function validateKey(value: unknown, label: string, exact = true): asserts value is DynamoDBKey {
  const record = validateRecord(value, label)
  if (
    (exact && Object.keys(record).length !== 2) ||
    typeof record.PK !== 'string' ||
    record.PK.trim() === '' ||
    typeof record.SK !== 'string' ||
    record.SK.trim() === ''
  ) {
    throw new DynamoDBInputError(`${label} must contain exactly the non-empty string keys PK and SK.`)
  }
}

function validateRecord(value: unknown, label: string): DynamoDBRecord {
  if (!isPlainObject(value)) {
    throw new DynamoDBInputError(`${label} must be a plain object.`)
  }
  for (const [name, attribute] of Object.entries(value)) {
    if (name.trim() === '') {
      throw new DynamoDBInputError(`${label} attribute names cannot be empty.`)
    }
    validateDocumentValue(attribute, `${label}.${name}`)
  }
  return value
}

function validateDocumentValue(value: unknown, path: string): asserts value is NativeAttributeValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  ) {
    return
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateDocumentValue(item, `${path}[${index}]`))
    return
  }
  if (isPlainObject(value)) {
    for (const [name, item] of Object.entries(value)) {
      validateDocumentValue(item, `${path}.${name}`)
    }
    return
  }
  throw new DynamoDBInputError(`${path} must contain only JSON-compatible DynamoDB values.`)
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function isConditionalCheckFailure(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'name' in error
    && error.name === 'ConditionalCheckFailedException'
}

function logDynamoDBFailure(operation: string, tableName: string, error: unknown): void {
  const details: Record<string, string | number> = {
    level: 'error',
    service: 'dynamodb',
    operation,
    table: tableName,
    errorName: error instanceof Error ? error.name : 'UnknownError',
  }
  if (typeof error === 'object' && error !== null && '$metadata' in error) {
    const metadata = error.$metadata
    if (typeof metadata === 'object' && metadata !== null) {
      if ('httpStatusCode' in metadata && typeof metadata.httpStatusCode === 'number') {
        details.httpStatusCode = metadata.httpStatusCode
      }
      if ('requestId' in metadata && typeof metadata.requestId === 'string') {
        details.requestId = metadata.requestId
      }
    }
  }
  console.error(JSON.stringify(details))
}
