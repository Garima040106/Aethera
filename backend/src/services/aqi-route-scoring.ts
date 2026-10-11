import type { CpcbAqiStation } from './cpcb-aqi-client.js'
import type { Coordinate } from './location-routes-service.js'

const MAX_STATION_DISTANCE_KM = 1.5
const MAX_STATION_AGE_MS = 2 * 60 * 60 * 1000

export interface RouteAqiScore {
  average_aqi: number
  is_green_corridor: boolean
  source: string
  observed_at: string
}

function distanceToSegmentKm(
  point: Coordinate,
  start: Coordinate,
  end: Coordinate,
): number {
  const latitudeRadians = point[1] * Math.PI / 180
  const longitudeScale = 111.32 * Math.cos(latitudeRadians)
  const latitudeScale = 111.32
  const x = (longitude: number) => (longitude - point[0]) * longitudeScale
  const y = (latitude: number) => (latitude - point[1]) * latitudeScale
  const endX = x(end[0])
  const endY = y(end[1])
  const startX = x(start[0])
  const startY = y(start[1])
  const segmentLengthSquared = endX * endX + endY * endY
  const fraction = segmentLengthSquared === 0
    ? 0
    : Math.max(0, Math.min(1, -(startX * endX + startY * endY) / segmentLengthSquared))
  return Math.hypot(startX + fraction * endX, startY + fraction * endY)
}

function stationDistanceKm(station: CpcbAqiStation, line: Coordinate[]): number {
  let minimumDistance = Number.POSITIVE_INFINITY
  for (let index = 1; index < line.length; index += 1) {
    minimumDistance = Math.min(
      minimumDistance,
      distanceToSegmentKm(
        [station.longitude, station.latitude],
        line[index - 1]!,
        line[index]!,
      ),
    )
  }
  return minimumDistance
}

export function scoreRouteAqi(
  stations: CpcbAqiStation[],
  line: Coordinate[],
  now = Date.now(),
): RouteAqiScore | undefined {
  const nearbyStations = stations.filter((station) => (
    station.aqi_system === 'INDIA_CPCB'
    && station.aqi >= 0
    && station.aqi <= 500
    && Number.isFinite(Date.parse(station.observed_at))
    && now - Date.parse(station.observed_at) <= MAX_STATION_AGE_MS
    && stationDistanceKm(station, line) <= MAX_STATION_DISTANCE_KM
  ))
  if (nearbyStations.length === 0) return undefined

  const averageAqi = Math.round(
    nearbyStations.reduce((total, station) => total + station.aqi, 0) / nearbyStations.length,
  )
  const latestObservation = nearbyStations.reduce((latest, station) =>
    Date.parse(station.observed_at) > Date.parse(latest.observed_at) ? station : latest,
  )
  const sources = [...new Set(nearbyStations.map((station) => station.source))]

  return {
    average_aqi: averageAqi,
    is_green_corridor: averageAqi <= 100,
    source: sources.join(', '),
    observed_at: latestObservation.observed_at,
  }
}
