/**
 * Centralized API client for Saans Saathi / Aethera.
 * Supports configurable base URL, timeout, local offline caching, and graceful fallback.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"

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
  inversion_level: "Weak" | "Moderate" | "Strong"
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
  strength: "Weak" | "Moderate" | "Strong"
  ventilation_coefficient: number
  surface_temp_c: number
  air_temp_gradient_c: number
  pblh_meters: number
  trapping_risk: string
}

export interface InversionResponse {
  area: string
  updated_at: string
  inversion_status_now: "Weak" | "Moderate" | "Strong"
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
  status: "ACCEPTED" | "REJECTED_NO_CONSENT" | "DEDUPLICATED" | "ESCALATED"
  action_taken: string
  coarse_risk_band: string
  caregiver_notified: boolean
  message_to_caregiver: string | null
  audit_trace_id: string
}

// AQI Station types for map
export interface AqiStation {
  id: string
  name: string
  latitude: number
  longitude: number
  aqi: number
  pm25?: number
  pm10?: number
  aqi_system: string
  observed_at: string
  source: string
  locality?: string
  estimated?: boolean
  pollutants?: Record<string, { value: number; unit: string }>
}

export interface AqiStationsResponse {
  stations: AqiStation[]
  updated_at: string | null
  status: "available" | "stale" | "empty" | "unavailable"
  detail?: string
}

export interface ModeledAqiReading {
  id: string
  name: string
  latitude: number
  longitude: number
  aqi: number
  aqi_system: "US_AQI"
  pm25?: number
  pm10?: number
  observed_at: string
  source: string
  estimated: true
}

export interface ModeledAqiResponse {
  readings: ModeledAqiReading[]
  updated_at: string | null
  status: "available" | "empty"
  source: string
  aqi_system: "US_AQI"
  detail?: string
}

export interface AqiMapBounds {
  west: number
  south: number
  east: number
  north: number
}

export interface PlaceSearchResult {
  id: string
  label: string
  address?: string
  latitude: number
  longitude: number
}

export interface RouteScoreRequest {
  geometry: {
    type: "LineString"
    coordinates: [number, number][]
  }
}

export interface RouteScoreResponse {
  average_aqi: number
  is_green_corridor: boolean
  source: string
  observed_at: string
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

  async getForecast(area: string = "noida", hours: number = 72): Promise<ForecastResponse> {
    return fetchWithFallback<ForecastResponse>(
      `/api/forecast?area=${encodeURIComponent(area)}&hours=${hours}`,
      `forecast_${area}`,
    )
  },

  async getInversion(area: string = "noida"): Promise<InversionResponse> {
    return fetchWithFallback<InversionResponse>(
      `/api/inversion?area=${encodeURIComponent(area)}`,
      `inversion_${area}`,
    )
  },

  async getPlumes(area: string = "noida"): Promise<PlumeResponse> {
    return fetchWithFallback<PlumeResponse>(
      `/api/plumes?area=${encodeURIComponent(area)}`,
      `plumes_${area}`,
    )
  },

  async getDecisions(): Promise<DecisionsResponse> {
    return fetchWithFallback<DecisionsResponse>("/api/decisions", "decisions")
  },

  async getAgentStatus() {
    return fetchWithFallback("/api/agents/status", "agent_status")
  },

  // AQI Stations for map
  async getAqiStations(signal?: AbortSignal): Promise<AqiStationsResponse> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 6000)
    try {
      const res = await fetch(`${BASE_URL}/api/aqi/stations`, {
        signal: signal ?? controller.signal,
      })
      clearTimeout(timer)
      if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`)
      return res.json()
    } catch (err) {
      clearTimeout(timer)
      throw err
    }
  },

  async getModeledAqi(bounds: AqiMapBounds, signal?: AbortSignal): Promise<ModeledAqiResponse> {
    const params = new URLSearchParams({
      west: String(bounds.west),
      south: String(bounds.south),
      east: String(bounds.east),
      north: String(bounds.north),
    })
    const res = await fetch(`${BASE_URL}/api/aqi/model?${params}`, { signal })
    if (!res.ok) {
      const payload: unknown = await res.json().catch(() => undefined)
      const detail = typeof payload === "object" && payload !== null && "detail" in payload
        ? String(payload.detail)
        : `Modeled AQI service returned HTTP ${res.status}`
      throw new Error(detail)
    }
    return res.json()
  },

  async searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceSearchResult[]> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 4000)
    try {
      const res = await fetch(
        `${BASE_URL}/api/location/search?q=${encodeURIComponent(query)}`,
        { signal: signal ?? controller.signal },
      )
      clearTimeout(timer)
      if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`)
      const data: unknown = await res.json()
      if (Array.isArray(data)) return data as PlaceSearchResult[]
      if (
        typeof data === 'object'
        && data !== null
        && 'results' in data
        && Array.isArray((data as { results: unknown[] }).results)
      ) {
        return (data as { results: PlaceSearchResult[] }).results
      }
      return []
    } catch (err) {
      clearTimeout(timer)
      throw err
    }
  },

  async submitHealthEvent(payload: {
    user_id?: string
    consent_given: boolean
    sharing_enabled: boolean
    coarse_risk_band: "LOW" | "MODERATE" | "HIGH" | "CRITICAL"
    coarse_area: string
    event_trigger:
      | "ANOMALOUS_VITALS"
      | "NO_REPLY_CHECKIN"
      | "MANUAL_CHECKIN"
      | "MOTION_FALL"
    client_timestamp: string
  }): Promise<HealthEventResponse> {
    const res = await fetch(`${BASE_URL}/api/events/health`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    return res.json()
  },

  async simulateAlert(payload: {
    scenario: string
    sharing_enabled?: boolean
    allow_location_on_sos?: boolean
    language?: "hi" | "en"
  }): Promise<AlertSimulateResponse> {
    const res = await fetch(`${BASE_URL}/api/alerts/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    return res.json()
  },
}
