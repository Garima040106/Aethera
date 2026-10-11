const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const SCORE_ENDPOINT = import.meta.env.VITE_ROUTE_AQI_SCORE_URL || `${API_BASE_URL}/api/routes/score`

export interface Position {
  label: string
  coordinates: [number, number]
}

export interface RouteAqiScore {
  average_aqi: number
  is_green_corridor: boolean
  source: string
  observed_at: string
}

export interface LocationRoute {
  summary?: {
    Distance?: number
    Duration?: number
  }
  legs?: Array<{
    geometry?: {
      LineString?: [number, number][]
    }
    summary?: {
      Overview?: {
        Distance?: number
        Duration?: number
      }
    }
  }>
  score?: RouteAqiScore
}

export const LOCATION_CONFIG = { hasAqiScoring: Boolean(SCORE_ENDPOINT) }

function isOptionalFiniteNumber(value: unknown): boolean {
  return value === undefined || (typeof value === 'number' && Number.isFinite(value))
}

function isLocationRoute(value: unknown): value is LocationRoute {
  if (typeof value !== 'object' || value === null) return false
  const route = value as Record<string, unknown>
  if (route.summary !== undefined) {
    if (typeof route.summary !== 'object' || route.summary === null) return false
    const summary = route.summary as Record<string, unknown>
    if (!isOptionalFiniteNumber(summary.Distance) || !isOptionalFiniteNumber(summary.Duration)) return false
  }
  if (route.legs === undefined) return true
  if (!Array.isArray(route.legs)) return false
  return route.legs.every((legValue: unknown) => {
    if (typeof legValue !== 'object' || legValue === null) return false
    const leg = legValue as Record<string, unknown>
    if (leg.geometry !== undefined) {
      if (typeof leg.geometry !== 'object' || leg.geometry === null) return false
      const geometry = leg.geometry as Record<string, unknown>
      if (
        geometry.LineString !== undefined
        && (!Array.isArray(geometry.LineString) || !geometry.LineString.every((position: unknown) =>
          Array.isArray(position)
          && position.length === 2
          && typeof position[0] === 'number'
          && Number.isFinite(position[0])
          && typeof position[1] === 'number'
          && Number.isFinite(position[1])))
      ) return false
    }
    if (leg.summary !== undefined) {
      if (typeof leg.summary !== 'object' || leg.summary === null) return false
      const legSummary = leg.summary as Record<string, unknown>
      if (legSummary.Overview !== undefined) {
        if (typeof legSummary.Overview !== 'object' || legSummary.Overview === null) return false
        const overview = legSummary.Overview as Record<string, unknown>
        if (!isOptionalFiniteNumber(overview.Distance) || !isOptionalFiniteNumber(overview.Duration)) return false
      }
    }
    return true
  })
}

export async function calculateRoutes(
  origin: Position,
  destination: Position,
): Promise<LocationRoute[]> {
  const response = await fetch(`${API_BASE_URL}/api/location/routes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin: origin.coordinates,
      destination: destination.coordinates,
    }),
  })

  if (!response.ok) {
    let detail = ''
    try {
      const result: unknown = await response.json()
      if (typeof result === 'object' && result !== null && 'detail' in result && typeof result.detail === 'string') {
        detail = result.detail
      }
    } catch {
      detail = ''
    }
    throw new Error(detail || `Amazon Location route request failed (${response.status}).`)
  }

  const result: unknown = await response.json()
  if (
    typeof result !== 'object'
    || result === null
    || !('routes' in result)
    || !Array.isArray(result.routes)
    || result.routes.length === 0
    || !result.routes.every(isLocationRoute)
  ) {
    throw new Error('Amazon Location route service returned an invalid response.')
  }
  return result.routes
}

export async function getRouteAqiScore(route: LocationRoute): Promise<RouteAqiScore | null> {
  if (!SCORE_ENDPOINT) return null
  const coordinates = route.legs?.flatMap((leg) => leg.geometry?.LineString ?? []) ?? []
  if (coordinates.length < 2) return null

  const response = await fetch(SCORE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      geometry: { type: 'LineString', coordinates },
    }),
  })
  if (!response.ok) {
    throw new Error(`Route air-quality scoring failed (${response.status}).`)
  }

  const result: unknown = await response.json()
  if (
    typeof result !== 'object' ||
    result === null ||
    !('average_aqi' in result) ||
    typeof result.average_aqi !== 'number' ||
    !('is_green_corridor' in result) ||
    typeof result.is_green_corridor !== 'boolean' ||
    !('source' in result) ||
    typeof result.source !== 'string' ||
    !('observed_at' in result) ||
    typeof result.observed_at !== 'string'
  ) {
    throw new Error('Route AQI service returned an invalid score. Expected average_aqi, is_green_corridor, source, and observed_at.')
  }

  return result as RouteAqiScore
}
