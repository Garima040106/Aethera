const OPEN_METEO_AIR_QUALITY_ENDPOINT = 'https://air-quality-api.open-meteo.com/v1/air-quality'
const OPEN_METEO_SOURCE = 'Open-Meteo Air Quality API · CAMS model estimate'
const REQUEST_TIMEOUT_MS = 8_000
const GRID_STEPS = 5

export interface AqiMapBounds {
  west: number
  south: number
  east: number
  north: number
}

export interface ModeledAqiReading {
  id: string
  name: string
  latitude: number
  longitude: number
  aqi: number
  aqi_system: 'US_AQI'
  pm25?: number
  pm10?: number
  observed_at: string
  source: string
  estimated: true
}

interface OpenMeteoCurrent {
  time?: unknown
  us_aqi?: unknown
  pm2_5?: unknown
  pm10?: unknown
}

interface OpenMeteoLocation {
  latitude?: unknown
  longitude?: unknown
  current?: OpenMeteoCurrent
}

export interface ModeledAqiProvider {
  getReadings(bounds: AqiMapBounds): Promise<ModeledAqiReading[]>
}

export class OpenMeteoAqiUnavailableError extends Error {
  constructor(message = 'The free global modeled AQI service is temporarily unavailable.') {
    super(message)
    this.name = 'OpenMeteoAqiUnavailableError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function gridCoordinates(bounds: AqiMapBounds): [number, number][] {
  const points: [number, number][] = []
  for (let row = 0; row < GRID_STEPS; row += 1) {
    const latitude = bounds.south + (bounds.north - bounds.south) * row / (GRID_STEPS - 1)
    for (let column = 0; column < GRID_STEPS; column += 1) {
      const longitude = bounds.west + (bounds.east - bounds.west) * column / (GRID_STEPS - 1)
      points.push([Number(latitude.toFixed(4)), Number(longitude.toFixed(4))])
    }
  }
  return points
}

function locationEntries(payload: unknown): OpenMeteoLocation[] {
  const values = Array.isArray(payload) ? payload : [payload]
  if (!values.every(isRecord)) throw new OpenMeteoAqiUnavailableError('The modeled AQI provider returned an invalid payload.')
  return values as OpenMeteoLocation[]
}

function normalizeReadings(payload: unknown): ModeledAqiReading[] {
  const latestByLocation = new Map<string, ModeledAqiReading>()
  for (const location of locationEntries(payload)) {
    const current = location.current
    if (
      !current
      || !validNumber(location.latitude)
      || location.latitude < -90
      || location.latitude > 90
      || !validNumber(location.longitude)
      || location.longitude < -180
      || location.longitude > 180
      || !validNumber(current.us_aqi)
      || current.us_aqi < 0
      || current.us_aqi > 500
      || typeof current.time !== 'string'
      || !Number.isFinite(Date.parse(current.time))
    ) continue

    const latitude = location.latitude
    const longitude = location.longitude
    const id = `open-meteo:${latitude.toFixed(3)}:${longitude.toFixed(3)}`
    const reading: ModeledAqiReading = {
      id,
      name: 'Open-Meteo modeled AQI',
      latitude,
      longitude,
      aqi: Math.round(current.us_aqi),
      aqi_system: 'US_AQI',
      observed_at: new Date(current.time).toISOString(),
      source: OPEN_METEO_SOURCE,
      estimated: true,
      ...(validNumber(current.pm2_5) ? { pm25: current.pm2_5 } : {}),
      ...(validNumber(current.pm10) ? { pm10: current.pm10 } : {}),
    }
    latestByLocation.set(id, reading)
  }
  return Array.from(latestByLocation.values())
}

export class OpenMeteoAqiClient implements ModeledAqiProvider {
  constructor(
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  async getReadings(bounds: AqiMapBounds): Promise<ModeledAqiReading[]> {
    const coordinates = gridCoordinates(bounds)
    const url = new URL(OPEN_METEO_AIR_QUALITY_ENDPOINT)
    url.searchParams.set('latitude', coordinates.map(([latitude]) => latitude).join(','))
    url.searchParams.set('longitude', coordinates.map(([, longitude]) => longitude).join(','))
    url.searchParams.set('current', 'us_aqi,pm2_5,pm10')
    url.searchParams.set('timezone', 'UTC')

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    try {
      const response = await this.fetcher(url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      })
      if (!response.ok) {
        throw new OpenMeteoAqiUnavailableError(`The modeled AQI provider returned HTTP ${response.status}.`)
      }
      return normalizeReadings(await response.json())
    } catch (error) {
      if (error instanceof OpenMeteoAqiUnavailableError) throw error
      throw new OpenMeteoAqiUnavailableError()
    } finally {
      clearTimeout(timeout)
    }
  }
}
