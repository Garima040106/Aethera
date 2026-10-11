import { afterEach, describe, expect, it } from 'vitest'
import { mockClient } from 'aws-sdk-client-mock'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { DynamoDBAlertRepository, DynamoDBDecisionRepository, PersistenceError } from '../aws/dynamodb-repositories.js'
import { InMemoryAlertRepository, InMemoryDecisionRepository } from '../repositories/in-memory.js'
import { createRepositories } from '../aws/repositories.js'

const ddbMock = mockClient(DynamoDBDocumentClient)

afterEach(() => ddbMock.reset())

describe('persistence repositories', () => {
  it('uses memory repositories without requiring AWS', async () => {
    expect(createRepositories().mode).toBe('memory')
    const alerts = new InMemoryAlertRepository()
    const decisions = new InMemoryDecisionRepository()
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
  })

  it('writes and reads alerts using the CDK eventId/timestamp key schema', async () => {
    const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'ap-south-1' }))
    const repo = new DynamoDBAlertRepository(client, 'configured-alerts-table')
    ddbMock.on(PutCommand).resolves({})
    ddbMock.on(GetCommand).resolves({ Item: { eventId: 'evt-1', timestamp: 't1', status: 'ACCEPTED', ttl: 123 } })

    const record = { eventId: 'evt-1', timestamp: 't1', status: 'ACCEPTED', ttl: 123 }
    await repo.put(record)
    expect(await repo.get('evt-1', 't1')).toEqual(record)
    expect(ddbMock.commandCalls(PutCommand)[0]?.args[0].input.Item).toEqual(record)
    expect(ddbMock.commandCalls(GetCommand)[0]?.args[0].input.Key).toEqual({ eventId: 'evt-1', timestamp: 't1' })
  })

  it('uses decisionId as the decisions table partition key and exposes write errors', async () => {
    const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'ap-south-1' }))
    const repo = new DynamoDBDecisionRepository(client, 'configured-decisions-table')
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
    ddbMock.on(ScanCommand).resolves({ Items: [item] })
    await repo.put(item)
    expect(ddbMock.commandCalls(PutCommand)[0]?.args[0].input.Item?.decisionId).toBe('dec-1')
    expect(await repo.listRecent(10)).toEqual([item])

    ddbMock.on(PutCommand).rejects(new Error('AccessDenied'))
    await expect(repo.put(item)).rejects.toBeInstanceOf(PersistenceError)
  })

  it('paginates decision scans before selecting the most recent records', async () => {
    const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'ap-south-1' }))
    const repo = new DynamoDBDecisionRepository(client, 'configured-decisions-table')
    const older = {
      decisionId: 'dec-old',
      createdAt: '2026-10-10T00:00:00.000Z',
      agent: 'Care Circle',
      title: 'Older',
      detail: 'Redacted.',
      evidenceSource: 'Simulation',
      riskLevel: 'LOW',
    }
    const newer = { ...older, decisionId: 'dec-new', createdAt: '2026-10-12T00:00:00.000Z', title: 'Newer' }
    ddbMock.on(ScanCommand).resolvesOnce({
      Items: [older],
      LastEvaluatedKey: { decisionId: 'cursor' },
    }).resolves({ Items: [newer] })

    expect(await repo.listRecent(1)).toEqual([newer])
    const calls = ddbMock.commandCalls(ScanCommand)
    expect(calls).toHaveLength(2)
    expect(calls[1]?.args[0].input.ExclusiveStartKey).toEqual({ decisionId: 'cursor' })
  })
})
