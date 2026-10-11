import { env } from '../config/env.js'

interface OpenAqLatestResult {
  parameter?: string
  value?: number
  unit?: string
  period?: {
    datetimeFrom?: { utc?: string }
  }
}

interface OpenAqLatestResponse {
  results?: OpenAqLatestResult[]
}

export interface LatestPm25Reading {
  value: number
  observedAt: string
  source: string
}

export class OpenAqClient {
  constructor(
    private readonly apiKey = env.openAqApiKey,
    private readonly locationId = env.openAqLocationId,
    private readonly fetcher: typeof fetch = fetch,
    private readonly enabled = env.enableOpenAq,
  ) {}

  async getLatestPm25(): Promise<LatestPm25Reading | undefined> {
    if (!this.enabled || !this.apiKey) return undefined

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3_000)
    try {
      const response = await this.fetcher(
        `https://api.openaq.org/v3/locations/${encodeURIComponent(this.locationId)}/latest`,
        {
          headers: { 'X-API-Key': this.apiKey, Accept: 'application/json' },
          signal: controller.signal,
        },
      )
      if (!response.ok) {
        throw new Error(`OpenAQ request failed with HTTP ${response.status}`)
      }

      const payload = await response.json() as OpenAqLatestResponse
      const reading = payload.results?.find((result) => result.parameter === 'pm25')
      const value = reading?.value
      const observedAt = reading?.period?.datetimeFrom?.utc
      if (
        typeof value !== 'number'
        || !Number.isFinite(value)
        || value < 0
        || typeof observedAt !== 'string'
        || Number.isNaN(Date.parse(observedAt))
      ) {
        throw new Error('OpenAQ response did not contain a valid PM2.5 reading')
      }

      return {
        value,
        observedAt: new Date(observedAt).toISOString(),
        source: `OpenAQ location ${this.locationId}`,
      }
    } finally {
      clearTimeout(timeout)
    }
  }
}
