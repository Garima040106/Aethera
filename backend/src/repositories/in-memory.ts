import type { AlertRecord, DecisionAuditItem } from '../schemas/api.js'
import type { AlertRepository, DecisionRepository } from './interfaces.js'

export class InMemoryAlertRepository implements AlertRepository {
  private readonly records = new Map<string, AlertRecord>()

  async put(record: AlertRecord): Promise<void> {
    this.records.set(`${record.eventId}#${record.timestamp}`, { ...record })
  }

  async get(eventId: string, timestamp: string): Promise<AlertRecord | undefined> {
    const record = this.records.get(`${eventId}#${timestamp}`)
    return record ? { ...record } : undefined
  }
}

export class InMemoryDecisionRepository implements DecisionRepository {
  private readonly records = new Map<string, DecisionAuditItem>()

  async put(record: DecisionAuditItem): Promise<void> {
    this.records.set(record.decisionId, { ...record })
  }

  async listRecent(limit: number): Promise<DecisionAuditItem[]> {
    return [...this.records.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
      .map((record) => ({ ...record }))
  }
}
