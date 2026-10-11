import type { AlertRecord, DecisionAuditItem, ForecastResponse } from '../schemas/api.js'
import type { AlertRepository, DecisionRepository, EnvironmentalRepository } from './interfaces.js'

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

export class InMemoryEnvironmentalRepository implements EnvironmentalRepository {
  private readonly forecasts = new Map<string, ForecastResponse>()

  async putForecast(area: string, forecast: ForecastResponse): Promise<void> {
    const key = `${area.trim().toLowerCase()}#${forecast.generated_at}`
    this.forecasts.set(key, structuredClone(forecast))
  }

  async listRecentForecasts(area: string, limit: number): Promise<ForecastResponse[]> {
    const prefix = `${area.trim().toLowerCase()}#`
    return [...this.forecasts.entries()]
      .filter(([key]) => key.startsWith(prefix))
      .map(([, forecast]) => forecast)
      .sort((a, b) => b.generated_at.localeCompare(a.generated_at))
      .slice(0, limit)
      .map((forecast) => structuredClone(forecast))
  }
}
