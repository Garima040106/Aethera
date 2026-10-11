import type { AlertRecord, DecisionAuditItem, ForecastResponse } from '../schemas/api.js'

export interface AlertRepository {
  put(record: AlertRecord): Promise<void>
  get(eventId: string, timestamp: string): Promise<AlertRecord | undefined>
}

export interface DecisionRepository {
  put(record: DecisionAuditItem): Promise<void>
  listRecent(limit: number): Promise<DecisionAuditItem[]>
}

export interface EnvironmentalRepository {
  putForecast(area: string, forecast: ForecastResponse): Promise<void>
  listRecentForecasts(area: string, limit: number): Promise<ForecastResponse[]>
}
