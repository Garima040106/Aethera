import { env } from '../config/env.js'

const DATA_GOV_IN_ENDPOINT = 'https://api.data.gov.in/resource'
const CPCB_AQI_SOURCE = 'CPCB · data.gov.in'
const REQUEST_TIMEOUT_MS = 8_000

interface CpcbRecord {
  [field: string]: unknown
}

interface CpcbApiResponse {
  records?: unknown
}

interface PollutantReading {
  value: number
  unit: string
}

export interface CpcbAqiStation {
  id: string
  name: string
  locality: string
  latitude: number
  longitude: number
  aqi: number
  aqi_system: 'INDIA_CPCB'
  pm25?: number
  pm10?: number
  pollutants: Record<string, PollutantReading>
  observed_at: string
  source: string
}

export interface CpcbAqiProvider {
  readonly configured: boolean
  getDelhiStations(): Promise<CpcbAqiStation[]>
}

export class CpcbAqiUnavailableError extends Error {
  constructor(message = 'CPCB AQI data is temporarily unavailable.') {
    super(message)
    this.name = 'CpcbAqiUnavailableError'
  }
}

const CPCB_BREAKPOINTS: Record<string, readonly [number, number, number, number][]> = {
  'PM2.5': [[0, 30, 0, 50], [31, 60, 51, 100], [61, 90, 101, 200], [91, 120, 201, 300], [121, 250, 301, 400], [251, 500, 401, 500]],
  PM10: [[0, 50, 0, 50], [51, 100, 51, 100], [101, 250, 101, 200], [251, 350, 201, 300], [351, 430, 301, 400], [431, 600, 401, 500]],
  NO2: [[0, 40, 0, 50], [41, 80, 51, 100], [81, 180, 101, 200], [181, 280, 201, 300], [281, 400, 301, 400], [401, 1000, 401, 500]],
  O3: [[0, 50, 0, 50], [51, 100, 51, 100], [101, 168, 101, 200], [169, 208, 201, 300], [209, 748, 301, 400], [749, 1000, 401, 500]],
  CO: [[0, 1, 0, 50], [1.1, 2, 51, 100], [2.1, 10, 101, 200], [10.1, 17, 201, 300], [17.1, 34, 301, 400], [34.1, 100, 401, 500]],
  SO2: [[0, 40, 0, 50], [41, 80, 51, 100], [81, 380, 101, 200], [381, 800, 201, 300], [801, 1600, 301, 400], [1601, 2000, 401, 500]],
  NH3: [[0, 200, 0, 50], [201, 400, 51, 100], [401, 800, 101, 200], [801, 1200, 201, 300], [1201, 1800, 301, 400], [1801, 2000, 401, 500]],
  Pb: [[0, 0.5, 0, 50], [0.51, 1, 51, 100], [1.1, 2, 101, 200], [2.1, 3, 201, 300], [3.1, 3.5, 301, 400], [3.51, 10, 401, 500]],
}

function asRecord(value: unknown): CpcbRecord | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as CpcbRecord
    : undefined
}

function textField(record: CpcbRecord, ...names: string[]): string | undefined {
  for (const name of names) {
    const value = record[name]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return undefined
}

function numberField(record: CpcbRecord, ...names: string[]): number | undefined {
  for (const name of names) {
    const value = record[name]
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value.trim())
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return undefined
}

function parseObservationTime(value: string | undefined): string | undefined {
  if (!value) return undefined
  const isoTime = Date.parse(value)
  if (Number.isFinite(isoTime)) return new Date(isoTime).toISOString()

  const localTime = /^(\d{1,2})-(\d{1,2})-(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(value)
  if (!localTime) return undefined
  const [, day, month, year, hours = '00', minutes = '00', seconds = '00'] = localTime
  const dayNumber = Number(day)
  const monthNumber = Number(month)
  const yearNumber = Number(year)
  const hourNumber = Number(hours)
  const minuteNumber = Number(minutes)
  const secondNumber = Number(seconds)
  const validationDate = new Date(Date.UTC(yearNumber, monthNumber - 1, dayNumber))
  if (
    validationDate.getUTCFullYear() !== yearNumber
    || validationDate.getUTCMonth() !== monthNumber - 1
    || validationDate.getUTCDate() !== dayNumber
    || hourNumber > 23
    || minuteNumber > 59
    || secondNumber > 59
  ) return undefined
  const isoIndiaTime = `${year}-${month!.padStart(2, '0')}-${day!.padStart(2, '0')}T${hours!.padStart(2, '0')}:${minutes}:${seconds}+05:30`
  const parsed = Date.parse(isoIndiaTime)
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : undefined
}

function pollutantName(record: CpcbRecord): string | undefined {
  const raw = textField(record, 'pollutant_id', 'pollutant', 'parameter')?.toUpperCase().replaceAll(' ', '')
  if (!raw) return undefined
  const aliases: Record<string, string> = {
    PM25: 'PM2.5',
    'PM2.5': 'PM2.5',
    PM10: 'PM10',
    NO2: 'NO2',
    SO2: 'SO2',
    O3: 'O3',
    OZONE: 'O3',
    CO: 'CO',
    NH3: 'NH3',
    PB: 'Pb',
    LEAD: 'Pb',
  }
  return aliases[raw]
}

function normalizeConcentration(name: string, value: number, unit: string): number {
  const normalizedUnit = unit.toLowerCase().replaceAll('μ', 'u').replaceAll('µ', 'u').replaceAll('³', '3').replaceAll(' ', '')
  return name === 'CO'
    ? normalizedUnit === 'ug/m3'
      ? value / 1000
      : value
    : normalizedUnit.includes('mg')
      ? value * 1000
      : value
}

function pollutantSubIndex(name: string, concentration: number): number | undefined {
  const roundedConcentration = name === 'CO' || name === 'Pb'
    ? Math.floor(concentration * 10) / 10
    : Math.floor(concentration)
  const breakpoint = CPCB_BREAKPOINTS[name]?.find(([low, high]) =>
    roundedConcentration >= low && roundedConcentration <= high)
  if (!breakpoint) {
    const highestBreakpoint = CPCB_BREAKPOINTS[name]?.at(-1)
    return highestBreakpoint && roundedConcentration > highestBreakpoint[1] ? 500 : undefined
  }
  const [concentrationLow, concentrationHigh, indexLow, indexHigh] = breakpoint
  return Math.round(
    ((indexHigh - indexLow) / (concentrationHigh - concentrationLow))
      * (roundedConcentration - concentrationLow)
      + indexLow,
  )
}

function stationAqi(readings: Record<string, PollutantReading>): number | undefined {
  const entries = Object.entries(readings)
  const particulateCount = entries.filter(([name]) => name === 'PM2.5' || name === 'PM10').length
  if (entries.length < 3 || particulateCount === 0) return undefined

  const indices = entries.flatMap(([name, reading]) => {
    const value = pollutantSubIndex(name, normalizeConcentration(name, reading.value, reading.unit))
    return value === undefined ? [] : [value]
  })
  return indices.length >= 3 ? Math.max(...indices) : undefined
}

function normalizeRecords(records: unknown[]): CpcbAqiStation[] {
  const grouped = new Map<string, {
    name: string
    locality: string
    latitude: number
    longitude: number
    observedAt: string
    explicitAqi?: number
    pollutants: Record<string, PollutantReading>
  }>()

  for (const value of records) {
    const record = asRecord(value)
    if (!record) continue
    const name = textField(record, 'station')
    const latitude = numberField(record, 'latitude', 'lat')
    const longitude = numberField(record, 'longitude', 'lon', 'lng')
    const observedAt = parseObservationTime(textField(record, 'last_update', 'last_updated', 'observed_at', 'timestamp'))
    const pollutant = pollutantName(record)
    const concentration = numberField(record, 'pollutant_avg', 'value', 'concentration')
    const unit = textField(record, 'pollutant_unit', 'unit')
    const explicitAqi = numberField(record, 'aqi', 'aqi_value', 'air_quality_index')
    if (
      !name
      || !observedAt
      || latitude === undefined
      || latitude < -90
      || latitude > 90
      || longitude === undefined
      || longitude < -180
      || longitude > 180
      || Date.parse(observedAt) > Date.now() + 5 * 60 * 1000
    ) continue

    const id = `${name.toLowerCase()}|${latitude}|${longitude}`
    const groupKey = `${id}|${observedAt}`
    const entry = grouped.get(groupKey) ?? {
      name,
      locality: textField(record, 'city', 'district', 'state') ?? 'Delhi',
      latitude,
      longitude,
      observedAt,
      pollutants: {},
    }
    if (Date.parse(observedAt) > Date.parse(entry.observedAt)) entry.observedAt = observedAt
    if (explicitAqi !== undefined && explicitAqi >= 0 && explicitAqi <= 500) entry.explicitAqi = explicitAqi
    if (pollutant && concentration !== undefined && concentration >= 0 && unit) {
      entry.pollutants[pollutant] = { value: concentration, unit }
    }
    grouped.set(groupKey, entry)
  }

  const stations = Array.from(grouped.entries()).flatMap(([groupKey, station]) => {
    const id = groupKey.slice(0, groupKey.lastIndexOf('|'))
    const aqi = station.explicitAqi ?? stationAqi(station.pollutants)
    if (aqi === undefined) return []
    const pm25 = station.pollutants['PM2.5']?.value
    const pm10 = station.pollutants.PM10?.value
    return [{
      id,
      name: station.name,
      locality: station.locality,
      latitude: station.latitude,
      longitude: station.longitude,
      aqi,
      aqi_system: 'INDIA_CPCB' as const,
      ...(station.explicitAqi === undefined ? { estimated: true } : {}),
      ...(pm25 === undefined ? {} : { pm25 }),
      ...(pm10 === undefined ? {} : { pm10 }),
      pollutants: station.pollutants,
      observed_at: station.observedAt,
      source: CPCB_AQI_SOURCE,
    }]
  })
  const latestStations = new Map<string, CpcbAqiStation>()
  for (const station of stations) {
    const current = latestStations.get(station.id)
    if (!current || Date.parse(station.observed_at) > Date.parse(current.observed_at)) {
      latestStations.set(station.id, station)
    }
  }
  return Array.from(latestStations.values())
}

export class CpcbAqiClient implements CpcbAqiProvider {
  constructor(
    private readonly apiKey = env.dataGovInApiKey,
    private readonly resourceId = env.cpcbAqiResourceId,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  get configured(): boolean {
    return Boolean(this.apiKey)
  }

  async getDelhiStations(): Promise<CpcbAqiStation[]> {
    if (!this.apiKey) return []

    const url = new URL(`${DATA_GOV_IN_ENDPOINT}/${encodeURIComponent(this.resourceId)}`)
    url.searchParams.set('api-key', this.apiKey)
    url.searchParams.set('format', 'json')
    url.searchParams.set('limit', '1000')
    url.searchParams.set('filters[city]', 'Delhi')

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    try {
      const response = await this.fetcher(url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      })
      if (!response.ok) {
        console.error(JSON.stringify({
          level: 'error',
          service: 'cpcb-aqi',
          operation: 'data.gov.in.resource',
          status: response.status,
        }))
        throw new CpcbAqiUnavailableError()
      }
      const payload: unknown = await response.json()
      const apiResponse = asRecord(payload) as CpcbApiResponse | undefined
      if (!Array.isArray(apiResponse?.records)) throw new CpcbAqiUnavailableError('CPCB AQI provider returned an invalid records payload.')
      return normalizeRecords(apiResponse.records)
    } catch (error) {
      if (error instanceof CpcbAqiUnavailableError) throw error
      console.error(JSON.stringify({
        level: 'error',
        service: 'cpcb-aqi',
        operation: 'data.gov.in.resource',
        errorName: error instanceof Error ? error.name : 'UnknownError',
      }))
      throw new CpcbAqiUnavailableError()
    } finally {
      clearTimeout(timeout)
    }
  }
}
