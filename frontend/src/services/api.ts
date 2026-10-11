/**
 * Centralized API client for Saans Saathi / Aethera.
 * Supports configurable base URL, timeout, local offline caching, and graceful fallback.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export interface ForecastPoint {
  hour: number
  timestamp: string
  temperature_c: number
  relative_humidity_pct: number
  wind_speed_ms: number
  wind_direction_deg: number
  boundary_layer_height_m: number
  pm25_ugm3: number
  pm10_ugm3: number
  ozone_ugm3: number
  nox_ugm3: number
  aqi_coupled: number
  aqi_category: string
  aqi_uncoupled: number
  inversion_level: 'Weak' | 'Moderate' | 'Strong'
  ventilation_coefficient_m2s: number
  feedback_enhancement_aqi: number
  data_quality: string
}

export interface ForecastResponse {
  area: string
  latitude: number
  longitude: number
  generated_at: string
  model_version: string
  source_provenance: Record<string, string>
  horizon_hours: number
  points: ForecastPoint[]
  summary: {
    aqi_now: number
    category_now: string
    peak_aqi: number
    peak_category: string
    peak_hour: number
    peak_timestamp: string
    inversion_risk: string
    plume_arrival_estimate_h: number
    weather_coupling_note: string
  }
  is_cached?: boolean
}

export interface InversionPoint {
  hour: number
  timestamp: string
  strength: 'Weak' | 'Moderate' | 'Strong'
  ventilation_coefficient: number
  surface_temp_c: number
  air_temp_gradient_c: number
  pblh_meters: number
  trapping_risk: string
}

export interface InversionResponse {
  area: string
  updated_at: string
  inversion_status_now: 'Weak' | 'Moderate' | 'Strong'
  peak_inversion_window: string
  proxy_notes: string
  timeline: InversionPoint[]
  is_cached?: boolean
}

export interface FireHotspot {
  id: string
  latitude: number
  longitude: number
  brightness: number
  confidence: string
  region: string
}

export interface PlumeTrajectoryPoint {
  hour_offset: number
  latitude: number
  longitude: number
  dispersion_radius_km: number
  concentration_factor: number
}

export interface PlumeResponse {
  area_target: string
  updated_at: string
  estimated_arrival_hours: number
  wind_direction_cardinal: string
  fire_count_upwind: number
  hotspots: FireHotspot[]
  plume_path: PlumeTrajectoryPoint[]
  trapping_factor: string
  data_source: string
  is_cached?: boolean
}

export interface DecisionRecord {
  id: string
  time: string
  agent: string
  title: string
  detail: string
  evidence_source: string
  risk_level: string
  redacted: boolean
}

export interface AqiStation {
  id: string
  name: string
  locality?: string
  latitude: number
  longitude: number
  aqi: number
  aqi_system: 'INDIA_CPCB'
  pm25?: number
  pm10?: number
  pollutants?: Record<string, { value: number; unit: string }>
  estimated?: boolean
  observed_at: string
  source: string
}

export interface AqiStationsResponse {
  status: 'available' | 'unavailable' | 'stale'
  updated_at: string | null
  source: string | null
  stations: AqiStation[]
  detail?: string
}

export interface PlaceSearchResult {
  id: string
  label: string
  address: string
  longitude: number
  latitude: number
}

function isAqiStation(value: unknown): value is AqiStation {
  if (typeof value !== 'object' || value === null) return false
  const station = value as Partial<AqiStation>
  return (
    typeof station.id === 'string'
    && station.id.length > 0
    && typeof station.name === 'string'
    && typeof station.latitude === 'number'
    && Number.isFinite(station.latitude)
    && station.latitude >= -90
    && station.latitude <= 90
    && typeof station.longitude === 'number'
    && Number.isFinite(station.longitude)
    && station.longitude >= -180
    && station.longitude <= 180
    && typeof station.aqi === 'number'
    && Number.isFinite(station.aqi)
    && station.aqi >= 0
    && station.aqi <= 500
    && station.aqi_system === 'INDIA_CPCB'
    && typeof station.observed_at === 'string'
    && Number.isFinite(Date.parse(station.observed_at))
    && typeof station.source === 'string'
    && station.source.length > 0
    && (station.pm25 === undefined || (typeof station.pm25 === 'number' && Number.isFinite(station.pm25) && station.pm25 >= 0))
    && (station.pm10 === undefined || (typeof station.pm10 === 'number' && Number.isFinite(station.pm10) && station.pm10 >= 0))
    && (station.estimated === undefined || typeof station.estimated === 'boolean')
    && (
      station.pollutants === undefined
      || (
        typeof station.pollutants === 'object'
        && station.pollutants !== null
        && Object.values(station.pollutants).every((reading) =>
          typeof reading === 'object'
          && reading !== null
          && typeof reading.value === 'number'
          && Number.isFinite(reading.value)
          && reading.value >= 0
          && typeof reading.unit === 'string'
          && reading.unit.length > 0,
        )
      )
    )
  )
}

export interface DecisionsResponse {
  decisions: DecisionRecord[]
  total_count: number
  redaction_policy: string
  is_cached?: boolean
}

export interface AlertSimulateStep {
  step_number: number
  step_name: string
  status: string
  actor: string
  detail: string
  timestamp: string
}

export interface AlertSimulateResponse {
  simulation_id: string
  scenario: string
  final_state: string
  steps: AlertSimulateStep[]
  disclaimer: string
}

export interface HealthEventResponse {
  event_id: string
  status: 'ACCEPTED' | 'REJECTED_NO_CONSENT' | 'DEDUPLICATED' | 'ESCALATED'
  action_taken: string
  coarse_risk_band: string
  caregiver_notified: boolean
  message_to_caregiver: string | null
  audit_trace_id: string
}

// Helper with timeout and localStorage fallback
async function fetchWithFallback<T>(endpoint: string, cacheKey: string): Promise<T> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 4000)
    const response = await fetch(`${BASE_URL}${endpoint}`, { signal: controller.signal })
    clearTimeout(timer)

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`)
    }

    const data = await response.json()
    try {
      localStorage.setItem(`aethera_${cacheKey}`, JSON.stringify({ data, savedAt: Date.now() }))
    } catch {
      // ignore storage quota issues
    }
    return data
  } catch (err) {
    // Offline or network error: attempt cached retrieval
    try {
      const cachedStr = localStorage.getItem(`aethera_${cacheKey}`)
      if (cachedStr) {
        const parsed = JSON.parse(cachedStr)
        return { ...parsed.data, is_cached: true }
      }
    } catch {
      // ignore
    }
    throw err
  }
}

export const api = {
  async getHealth() {
    const res = await fetch(`${BASE_URL}/health`)
    return res.json()
  },

  async getForecast(area: string = 'noida', hours: number = 72): Promise<ForecastResponse> {
    return fetchWithFallback<ForecastResponse>(`/api/forecast?area=${encodeURIComponent(area)}&hours=${hours}`, `forecast_${area}`)
  },

  async getInversion(area: string = 'noida'): Promise<InversionResponse> {
    return fetchWithFallback<InversionResponse>(`/api/inversion?area=${encodeURIComponent(area)}`, `inversion_${area}`)
  },

  async getPlumes(area: string = 'noida'): Promise<PlumeResponse> {
    return fetchWithFallback<PlumeResponse>(`/api/plumes?area=${encodeURIComponent(area)}`, `plumes_${area}`)
  },

  async getDecisions(): Promise<DecisionsResponse> {
    return fetchWithFallback<DecisionsResponse>('/api/decisions', 'decisions')
  },

  async getAqiStations(signal?: AbortSignal): Promise<AqiStationsResponse> {
    const response = await fetch(`${BASE_URL}/api/aqi/stations`, signal ? { signal } : {})
    if (!response.ok) throw new Error(`Server returned HTTP ${response.status}`)
    const data: unknown = await response.json()
    if (typeof data !== 'object' || data === null || !('status' in data) || !('stations' in data)) {
      throw new Error('AQI station service returned an invalid response.')
    }
    const payload = data as Partial<AqiStationsResponse>
    if (!['available', 'unavailable', 'stale'].includes(payload.status ?? '') || !Array.isArray(payload.stations)) {
      throw new Error('AQI station service returned an invalid response.')
    }
    return {
      status: payload.status as AqiStationsResponse['status'],
      updated_at: typeof payload.updated_at === 'string' ? payload.updated_at : null,
      source: typeof payload.source === 'string' ? payload.source : null,
      stations: payload.stations.filter(isAqiStation),
      ...(typeof payload.detail === 'string' ? { detail: payload.detail } : {}),
    }
  },

  async searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceSearchResult[]> {
    const response = await fetch(
      `${BASE_URL}/api/location/search?q=${encodeURIComponent(query)}`,
      signal ? { signal } : {},
    )
    if (!response.ok) throw new Error(`Place search returned HTTP ${response.status}`)
    const data = await response.json() as { results?: PlaceSearchResult[] }
    return Array.isArray(data.results) ? data.results : []
  },

  async getAgentStatus() {
    return fetchWithFallback('/api/agents/status', 'agent_status')
  },

  async submitHealthEvent(payload: {
    user_id?: string
    consent_given: boolean
    sharing_enabled: boolean
    coarse_risk_band: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
    coarse_area: string
    event_trigger: 'ANOMALOUS_VITALS' | 'NO_REPLY_CHECKIN' | 'MANUAL_CHECKIN' | 'MOTION_FALL'
    client_timestamp: string
  }): Promise<HealthEventResponse> {
    const res = await fetch(`${BASE_URL}/api/events/health`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return res.json()
  },

  async simulateAlert(payload: {
    scenario: string
    sharing_enabled?: boolean
    allow_location_on_sos?: boolean
    language?: 'hi' | 'en'
  }): Promise<AlertSimulateResponse> {
    const res = await fetch(`${BASE_URL}/api/alerts/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return res.json()
  },
}
