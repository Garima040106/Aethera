import { env } from '../config/env.js'
import type { Area } from '../data/fixtures.js'

interface OpenAqSensor {
  id?: number
  parameter?: { name?: string; units?: string }
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
  pollutants: Record<string, { value: number; unit: string; observedAt: string }>
  liveAqi: number
  liveAqiCategory: string
  dominantPollutant: string
}

const AQI_BREAKPOINTS: Record<string, [number, number, number, number, string][]> = {
  pm25: [[0, 30, 0, 50, 'Good'], [30, 60, 51, 100, 'Satisfactory'], [60, 90, 101, 200, 'Moderate'], [90, 120, 201, 300, 'Poor'], [120, 250, 301, 400, 'Very Poor'], [250, 500, 401, 500, 'Severe']],
  pm10: [[0, 50, 0, 50, 'Good'], [50, 100, 51, 100, 'Satisfactory'], [100, 250, 101, 200, 'Moderate'], [250, 350, 201, 300, 'Poor'], [350, 430, 301, 400, 'Very Poor'], [430, 600, 401, 500, 'Severe']],
  no2: [[0, 40, 0, 50, 'Good'], [40, 80, 51, 100, 'Satisfactory'], [80, 180, 101, 200, 'Moderate'], [180, 280, 201, 300, 'Poor'], [280, 400, 301, 400, 'Very Poor'], [400, 800, 401, 500, 'Severe']],
  so2: [[0, 40, 0, 50, 'Good'], [40, 80, 51, 100, 'Satisfactory'], [80, 380, 101, 200, 'Moderate'], [380, 800, 201, 300, 'Poor'], [800, 1600, 301, 400, 'Very Poor'], [1600, 2400, 401, 500, 'Severe']],
  o3: [[0, 50, 0, 50, 'Good'], [50, 100, 51, 100, 'Satisfactory'], [100, 168, 101, 200, 'Moderate'], [168, 208, 201, 300, 'Poor'], [208, 748, 301, 400, 'Very Poor'], [748, 1000, 401, 500, 'Severe']],
  co: [[0, 1, 0, 50, 'Good'], [1, 2, 51, 100, 'Satisfactory'], [2, 10, 101, 200, 'Moderate'], [10, 17, 201, 300, 'Poor'], [17, 34, 301, 400, 'Very Poor'], [34, 50, 401, 500, 'Severe']],
  nh3: [[0, 200, 0, 50, 'Good'], [200, 400, 51, 100, 'Satisfactory'], [400, 800, 101, 200, 'Moderate'], [800, 1200, 201, 300, 'Poor'], [1200, 1800, 301, 400, 'Very Poor'], [1800, 2400, 401, 500, 'Severe']],
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
      const sensorMetadata = new Map(
        (nearest.sensors ?? [])
          .filter((sensor): sensor is OpenAqSensor & { id: number; parameter: { name: string; units?: string } } => (
            typeof sensor.id === 'number' && typeof sensor.parameter?.name === 'string'
          ))
          .map((sensor) => [sensor.id, sensor]),
      )
      const pollutants: LatestPm25Reading['pollutants'] = {}
      for (const result of latest.results ?? []) {
        const sensor = result.sensorsId !== undefined ? sensorMetadata.get(result.sensorsId) : undefined
        const parameter = result.parameter ?? result.sensor?.parameter?.name ?? sensor?.parameter.name
        if (!parameter || typeof result.value !== 'number' || !Number.isFinite(result.value) || result.value < 0) continue
        const timestamp = typeof result.datetime === 'string'
          ? result.datetime
          : result.datetime?.utc ?? result.period?.datetimeFrom?.utc
        if (!timestamp || Number.isNaN(Date.parse(timestamp))) continue
        pollutants[parameter] = {
          value: result.value,
          unit: result.unit ?? sensor?.parameter.units ?? 'µg/m³',
          observedAt: new Date(timestamp).toISOString(),
        }
      }
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
      const subIndices = Object.entries(pollutants)
        .map(([parameter, pollutant]) => {
          const breakpoint = AQI_BREAKPOINTS[parameter]?.find(([low, high]) => pollutant.value >= low && pollutant.value <= high)
          if (!breakpoint) return undefined
          const [low, high, aqiLow, aqiHigh, category] = breakpoint
          return {
            parameter,
            aqi: Math.round(aqiLow + ((aqiHigh - aqiLow) / (high - low)) * (pollutant.value - low)),
            category,
          }
        })
        .filter((item): item is { parameter: string; aqi: number; category: string } => item !== undefined)
      const dominant = subIndices.sort((left, right) => right.aqi - left.aqi)[0]
      if (!dominant) throw new Error('OpenAQ response did not contain a supported pollutant reading')

      return {
        value,
        observedAt: new Date(observedAt).toISOString(),
        source: `OpenAQ location ${nearest.id}${nearest.name ? ` (${nearest.name})` : ''}`,
        pollutants,
        liveAqi: dominant.aqi,
        liveAqiCategory: dominant.category,
        dominantPollutant: dominant.parameter,
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
