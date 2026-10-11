import { afterEach, describe, expect, it } from 'vitest'
import { mockClient } from 'aws-sdk-client-mock'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { DynamoDBAlertRepository, DynamoDBDecisionRepository, DynamoDBEnvironmentalRepository, PersistenceError } from '../aws/dynamodb-repositories.js'
import { InMemoryAlertRepository, InMemoryDecisionRepository, InMemoryEnvironmentalRepository } from '../repositories/in-memory.js'
import { createRepositories } from '../aws/repositories.js'

const ddbMock = mockClient(DynamoDBDocumentClient)

afterEach(() => ddbMock.reset())

describe('persistence repositories', () => {
  it('uses memory repositories without requiring AWS', async () => {
    expect(createRepositories({
      enableDynamoDB: false,
      awsRegion: 'us-east-1',
      dynamoDBTable: undefined,
    }).mode).toBe('memory')
    const alerts = new InMemoryAlertRepository()
    const decisions = new InMemoryDecisionRepository()
    const environmental = new InMemoryEnvironmentalRepository()
    const record = { eventId: 'evt-1', timestamp: '2026-10-11T00:00:00.000Z', status: 'ACCEPTED', ttl: 1 }
    await alerts.put(record)
    await decisions.put({
      decisionId: 'dec-1',
      createdAt: '2026-10-11T00:00:00.000Z',
      agent: 'Care Circle',
      title: 'Simulated alert',
      detail: 'No external notification sent.',
      evidenceSource: 'Alert Ladder Simulation',
      riskLevel: 'LOW',
    })

    expect(await alerts.get(record.eventId, record.timestamp)).toEqual(record)
    expect(await decisions.listRecent(10)).toHaveLength(1)
    const forecast = {
      area: 'noida',
      latitude: 28.5,
      longitude: 77.4,
      generated_at: '2026-10-11T00:00:00.000Z',
      model_version: 'test',
      source_provenance: {},
      horizon_hours: 0,
      points: [],
      summary: {
        aqi_now: 0,
        category_now: 'Low',
        peak_aqi: 0,
        peak_category: 'Low',
        peak_hour: 0,
        peak_timestamp: '',
        inversion_risk: 'Low',
        plume_arrival_estimate_h: 0,
        weather_coupling_note: '',
      },
    }
    await environmental.putForecast('NOIDA', forecast)
    expect(await environmental.listRecentForecasts('NOIDA', 1)).toEqual([forecast])
  })

  it('configures all repositories against the supplied single DynamoDB table', () => {
    expect(createRepositories({
      enableDynamoDB: true,
      awsRegion: 'us-east-1',
      dynamoDBTable: 'AtheraEnvironmentalData',
    }).mode).toBe('dynamodb')
  })

  it('writes and reads alerts using the shared pk/sk table schema', async () => {
    const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }))
    const repo = new DynamoDBAlertRepository(client, 'AtheraEnvironmentalData')
    ddbMock.on(PutCommand).resolves({})
    ddbMock.on(GetCommand).resolves({ Item: { pk: 'ALERT#evt-1', sk: 't1', recordType: 'ALERT', eventId: 'evt-1', timestamp: 't1', status: 'ACCEPTED', ttl: 123 } })

    const record = { eventId: 'evt-1', timestamp: 't1', status: 'ACCEPTED', ttl: 123 }
    await repo.put(record)
    expect(await repo.get('evt-1', 't1')).toEqual(record)
    expect(ddbMock.commandCalls(PutCommand)[0]?.args[0].input).toMatchObject({
      TableName: 'AtheraEnvironmentalData',
      Item: { pk: 'ALERT#evt-1', sk: 't1', recordType: 'ALERT', ...record },
    })
    expect(ddbMock.commandCalls(GetCommand)[0]?.args[0].input.Key).toEqual({ pk: 'ALERT#evt-1', sk: 't1' })
  })

  it('stores redacted decisions in the shared table and queries recent items', async () => {
    const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }))
    const repo = new DynamoDBDecisionRepository(client, 'AtheraEnvironmentalData')
    const item = {
      decisionId: 'dec-1',
      createdAt: '2026-10-11T00:00:00.000Z',
      agent: 'Care Circle',
      title: 'Simulated alert',
      detail: 'Redacted.',
      evidenceSource: 'Simulation',
      riskLevel: 'LOW',
    }
    ddbMock.on(PutCommand).resolves({})
    ddbMock.on(QueryCommand).resolves({ Items: [item] })
    await repo.put(item)
    expect(ddbMock.commandCalls(PutCommand)[0]?.args[0].input.Item?.decisionId).toBe('dec-1')
    expect(await repo.listRecent(10)).toEqual([item])
    expect(ddbMock.commandCalls(PutCommand)[0]?.args[0].input.Item).toMatchObject({
      pk: 'DECISION',
      sk: `${item.createdAt}#${item.decisionId}`,
      recordType: 'DECISION',
    })
    expect(ddbMock.commandCalls(QueryCommand)[0]?.args[0].input).toMatchObject({
      TableName: 'AtheraEnvironmentalData',
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: { ':pk': 'DECISION' },
      ScanIndexForward: false,
      Limit: 10,
    })

    ddbMock.on(PutCommand).rejects(new Error('AccessDenied'))
    await expect(repo.put(item)).rejects.toBeInstanceOf(PersistenceError)
    ddbMock.on(QueryCommand).rejects(new Error('AccessDenied'))
    await expect(repo.listRecent(10)).rejects.toBeInstanceOf(PersistenceError)
  })

  it('writes and queries forecast history using the shared pk/sk table schema', async () => {
    const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }))
    const repo = new DynamoDBEnvironmentalRepository(client, 'AtheraEnvironmentalData')
    const forecast = {
      area: 'Noida',
      latitude: 28.5,
      longitude: 77.4,
      generated_at: '2026-10-11T00:00:00.000Z',
      model_version: 'test',
      source_provenance: {},
      horizon_hours: 0,
      points: [],
      summary: {
        aqi_now: 0,
        category_now: 'Low',
        peak_aqi: 0,
        peak_category: 'Low',
        peak_hour: 0,
        peak_timestamp: '',
        inversion_risk: 'Low',
        plume_arrival_estimate_h: 0,
        weather_coupling_note: '',
      },
    }
    ddbMock.on(PutCommand).resolves({})
    ddbMock.on(QueryCommand).resolves({ Items: [{ forecast }] })

    await repo.putForecast('Noida', forecast)
    expect(await repo.listRecentForecasts('Noida', 5)).toEqual([forecast])
    expect(ddbMock.commandCalls(PutCommand)[0]?.args[0].input).toMatchObject({
      TableName: 'AtheraEnvironmentalData',
      Item: {
        pk: 'ENVIRONMENT#noida',
        sk: `FORECAST#${forecast.generated_at}`,
        recordType: 'ENVIRONMENTAL_FORECAST',
        forecast,
      },
    })
    expect(ddbMock.commandCalls(QueryCommand)[0]?.args[0].input).toMatchObject({
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :skPrefix)',
      ExpressionAttributeValues: { ':pk': 'ENVIRONMENT#noida', ':skPrefix': 'FORECAST#' },
      ScanIndexForward: false,
      Limit: 5,
    })
  })
})
