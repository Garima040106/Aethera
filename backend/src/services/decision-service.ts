import { randomUUID } from 'node:crypto'
import { historicalDecisions } from '../data/fixtures.js'
import type { DecisionAuditItem, DecisionRecord, DecisionsResponse } from '../schemas/api.js'
import type { DecisionRepository } from '../repositories/interfaces.js'

export class DecisionService {
  private readonly recent: DecisionRecord[] = historicalDecisions.map((record) => ({ ...record }))

  constructor(private readonly repository: DecisionRepository) {}

  async list(): Promise<DecisionsResponse> {
    const saved = await this.repository.listRecent(100)
    const persisted: DecisionRecord[] = saved.map((record) => ({
      id: record.decisionId,
      time: 'Recently',
      agent: record.agent,
      title: record.title,
      detail: record.detail,
      evidence_source: record.evidenceSource,
      risk_level: record.riskLevel,
      redacted: true,
    }))
    const decisions = [...persisted, ...this.recent]
    return {
      decisions,
      total_count: decisions.length,
      redaction_policy: 'Cedar Privacy Engine: Raw health telemetry is never stored. Only minimal, redacted decision metadata is retained.',
    }
  }

  async record(
    agent: string,
    title: string,
    detail: string,
    evidenceSource: string,
    riskLevel = 'MODERATE',
  ): Promise<DecisionRecord> {
    const decisionId = `dec-${randomUUID().replaceAll('-', '').slice(0, 6)}`
    const createdAt = new Date().toISOString()
    const safeRecord: DecisionAuditItem = {
      decisionId,
      createdAt,
      agent,
      title,
      detail,
      evidenceSource,
      riskLevel,
    }
    await this.repository.put(safeRecord)
    const record: DecisionRecord = {
      id: decisionId,
      time: 'Just now',
      agent,
      title,
      detail,
      evidence_source: evidenceSource,
      risk_level: riskLevel,
      redacted: true,
    }
    return record
  }
}
