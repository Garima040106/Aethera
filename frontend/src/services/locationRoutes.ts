const API_KEY = import.meta.env.VITE_AWS_LOCATION_API_KEY
const REGION = import.meta.env.VITE_AWS_REGION || 'us-east-1'
const SCORE_ENDPOINT = import.meta.env.VITE_ROUTE_AQI_SCORE_URL

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

interface CalculateRoutesResponse {
  Routes?: Array<{
    Summary?: {
      Distance?: number
      Duration?: number
    }
    Legs?: Array<{
      Geometry?: {
        LineString?: [number, number][]
      }
      Summary?: {
        Overview?: {
          Distance?: number
          Duration?: number
        }
      }
    }>
  }>
}

export const LOCATION_CONFIG = {
  configured: Boolean(API_KEY && REGION),
  missing: [
    !API_KEY && 'AMAZON_LOCATION',
    !REGION && 'VITE_AWS_REGION',
  ].filter((item): item is string => Boolean(item)),
  hasAqiScoring: Boolean(SCORE_ENDPOINT),
}

export async function calculateRoutes(
  origin: Position,
  destination: Position,
): Promise<LocationRoute[]> {
  if (!API_KEY || !REGION) {
    throw new Error(`Amazon Location is not configured. Add ${LOCATION_CONFIG.missing.join(' and ')} to frontend/.env.local.`)
  }

  const endpoint = `https://routes.geo.${encodeURIComponent(REGION)}.amazonaws.com/routes/v2/routes?key=${encodeURIComponent(API_KEY)}`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      Origin: origin.coordinates,
      Destination: destination.coordinates,
      TravelMode: 'Car',
      OptimizeRoutingFor: 'FastestRoute',
      MaxAlternatives: 2,
      DepartNow: true,
      LegGeometryFormat: 'Simple',
      LegAdditionalFeatures: ['Summary'],
      InstructionsMeasurementSystem: 'Metric',
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Amazon Location route request failed (${response.status}): ${detail.slice(0, 240)}`)
  }

  const result = (await response.json()) as CalculateRoutesResponse
  if (!Array.isArray(result.Routes) || result.Routes.length === 0) {
    throw new Error('Amazon Location returned no routes for the selected locations.')
  }

  return result.Routes.map((route) => ({
    summary: route.Summary,
    legs: route.Legs?.map((leg) => ({
      geometry: leg.Geometry,
      summary: leg.Summary,
    })),
  }))
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
