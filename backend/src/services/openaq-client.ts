import { env } from '../config/env.js'
import type { Area } from '../data/fixtures.js'

interface OpenAqSensor {
  id?: number
  parameter?: { name?: string }
}

interface OpenAqLocation {
  id?: number
  name?: string
  coordinates?: { latitude?: number; longitude?: number }
  sensors?: OpenAqSensor[]
}

interface OpenAqLocationsResponse {
  results?: OpenAqLocation[]
}

interface OpenAqLatestResult {
  parameter?: string
  sensor?: { parameter?: { name?: string } }
  sensorsId?: number
  value?: number
  unit?: string
  datetime?: { utc?: string } | string
  period?: { datetimeFrom?: { utc?: string } }
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
    private readonly fetcher: typeof fetch = fetch,
    private readonly enabled = env.enableOpenAq,
  ) {}

  async getLatestPm25(area: Area): Promise<LatestPm25Reading | undefined> {
    if (!this.enabled || !this.apiKey) return undefined

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3_000)
    try {
      const locations = await this.request<OpenAqLocationsResponse>(
        `https://api.openaq.org/v3/locations?coordinates=${area.lat},${area.lon}&radius=25000&limit=100`,
        controller.signal,
      )
      const nearest = locations.results
        ?.filter((location) => location.id && this.hasPm25Sensor(location))
        .map((location) => ({
          location,
          distance: this.distanceKm(area, location.coordinates),
        }))
        .filter(({ distance }) => Number.isFinite(distance))
        .sort((left, right) => left.distance - right.distance)[0]?.location
      if (!nearest?.id) return undefined

      const pm25SensorIds = (nearest.sensors ?? [])
        .filter((sensor) => sensor.parameter?.name === 'pm25')
        .map((sensor) => sensor.id)
        .filter((id): id is number => id !== undefined)
      const latest = await this.request<OpenAqLatestResponse>(
        `https://api.openaq.org/v3/locations/${nearest.id}/latest`,
        controller.signal,
      )
      const reading = latest.results?.find((result) => (
        result.parameter === 'pm25'
        || result.sensor?.parameter?.name === 'pm25'
        || (result.sensorsId !== undefined && pm25SensorIds.includes(result.sensorsId))
      ))
      const value = reading?.value
      const observedAt = typeof reading?.datetime === 'string'
        ? reading.datetime
        : reading?.datetime?.utc ?? reading?.period?.datetimeFrom?.utc
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
        source: `OpenAQ location ${nearest.id}${nearest.name ? ` (${nearest.name})` : ''}`,
      }
    } finally {
      clearTimeout(timeout)
    }
  }

  private async request<T>(url: string, signal: AbortSignal): Promise<T> {
    const response = await this.fetcher(url, {
      headers: { 'X-API-Key': this.apiKey!, Accept: 'application/json' },
      signal,
    })
    if (!response.ok) throw new Error(`OpenAQ request failed with HTTP ${response.status}`)
    return response.json() as Promise<T>
  }

  private hasPm25Sensor(location: OpenAqLocation): boolean {
    return location.sensors?.some((sensor) => sensor.parameter?.name === 'pm25') ?? false
  }

  private distanceKm(area: Area, coordinates: OpenAqLocation['coordinates']): number {
    if (
      coordinates?.latitude === undefined
      || coordinates.longitude === undefined
    ) return Number.POSITIVE_INFINITY
    const latitude = (coordinates.latitude - area.lat) * Math.PI / 180
    const longitude = (coordinates.longitude - area.lon) * Math.PI / 180
    const a = Math.sin(latitude / 2) ** 2
      + Math.cos(area.lat * Math.PI / 180)
      * Math.cos(coordinates.latitude * Math.PI / 180)
      * Math.sin(longitude / 2) ** 2
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }
}
