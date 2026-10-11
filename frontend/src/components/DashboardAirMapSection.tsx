import { useEffect, useMemo, useRef, useState } from 'react'
import { Map as MapLibreMap, setWorkerUrl, type GeoJSONSource } from 'maplibre-gl'
import type { Feature, FeatureCollection, LineString, Point } from 'geojson'
import mapLibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import type { AqiMapBounds, AqiStation, AqiStationsResponse, ModeledAqiReading, ModeledAqiResponse } from '../services/api'
import { calculateRoutes, getRouteAqiScore } from '../services/locationRoutes'
import type { RouteAqiScore } from '../services/locationRoutes'

setWorkerUrl(mapLibreWorkerUrl)

const DELHI_BOUNDS: [[number, number], [number, number]] = [[76.83, 28.39], [77.36, 28.89]]
const MAX_OBSERVATION_AGE_MS = 2 * 60 * 60 * 1000

const OSM_STYLE = {
  version: 8 as const,
  sources: {
    openstreetmap: {
      type: 'raster' as const,
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    },
  },
  layers: [{ id: 'openstreetmap', type: 'raster' as const, source: 'openstreetmap' }],
}

type RouteFeatureProperties = {
  averageAqi: number
  isGreen: boolean
}

function isCurrentReading(station: AqiStation): boolean {
  const age = Date.now() - Date.parse(station.observed_at)
  return Number.isFinite(age) && age >= 0 && age <= MAX_OBSERVATION_AGE_MS
}

function createStationFeatures(stations: AqiStation[]): FeatureCollection<Point, { id: string; name: string; aqi: number }> {
  return {
    type: 'FeatureCollection',
    features: stations.map((station) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [station.longitude, station.latitude] },
      properties: { id: station.id, name: station.name, aqi: station.aqi },
    })),
  }
}

function usAqiColor(aqi: number): string {
  if (aqi <= 50) return '#23864b'
  if (aqi <= 100) return '#dfaa23'
  if (aqi <= 150) return '#e87932'
  if (aqi <= 200) return '#c9473d'
  if (aqi <= 300) return '#8c4da8'
  return '#7d3042'
}

function createModeledFeatures(readings: ModeledAqiReading[]): FeatureCollection<Point, { id: string; aqi: number; color: string }> {
  return {
    type: 'FeatureCollection',
    features: readings.map((reading) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [reading.longitude, reading.latitude] },
      properties: { id: reading.id, aqi: reading.aqi, color: usAqiColor(reading.aqi) },
    })),
  }
}

function mapViewBounds(map: MapLibreMap): AqiMapBounds | undefined {
  const [[west, south], [east, north]] = map.getBounds().toArray()
  if (west >= east || south >= north) return undefined
  return { west, south, east, north }
}

function createRouteFeatures(
  routes: { coordinates: [number, number][]; score: RouteAqiScore }[],
): FeatureCollection<LineString, RouteFeatureProperties> {
  return {
    type: 'FeatureCollection',
    features: routes.flatMap(({ coordinates, score }): Feature<LineString, RouteFeatureProperties>[] =>
      coordinates.length < 2
        ? []
        : [{
          type: 'Feature',
          geometry: { type: 'LineString', coordinates },
          properties: { averageAqi: score.average_aqi, isGreen: score.is_green_corridor },
        }]),
  }
}

function distanceKm(first: AqiStation, second: AqiStation): number {
  const latitudeDelta = (second.latitude - first.latitude) * Math.PI / 180
  const longitudeDelta = (second.longitude - first.longitude) * Math.PI / 180
  const value = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(first.latitude * Math.PI / 180)
    * Math.cos(second.latitude * Math.PI / 180)
    * Math.sin(longitudeDelta / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
}

function chooseCleanStationPair(stations: AqiStation[]): [AqiStation, AqiStation] | undefined {
  const candidates = stations
    .filter((station) => station.aqi <= 100 && isCurrentReading(station))
    .sort((first, second) => first.aqi - second.aqi)
    .slice(0, 12)
  let selectedPair: [AqiStation, AqiStation] | undefined
  let largestDistance = 0

  for (let firstIndex = 0; firstIndex < candidates.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < candidates.length; secondIndex += 1) {
      const first = candidates[firstIndex]!
      const second = candidates[secondIndex]!
      const distance = distanceKm(first, second)
      if (distance >= 2 && distance > largestDistance) {
        selectedPair = [first, second]
        largestDistance = distance
      }
    }
  }
  return selectedPair
}

function routeCoordinates(route: Awaited<ReturnType<typeof calculateRoutes>>[number]): [number, number][] {
  return route.legs?.flatMap((leg) => leg.geometry?.LineString ?? []) ?? []
}

function observationTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}

export default function DashboardAirMapSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [response, setResponse] = useState<AqiStationsResponse | null>(null)
  const [modeledAqiResponse, setModeledAqiResponse] = useState<ModeledAqiResponse | null>(null)
  const [modeledAqiError, setModeledAqiError] = useState<string | null>(null)
  const [loadingModeledAqi, setLoadingModeledAqi] = useState(false)
  const [loadingStations, setLoadingStations] = useState(true)
  const [stationError, setStationError] = useState<string | null>(null)
  const [routeStatus, setRouteStatus] = useState<{ key: string; message: string } | null>(null)
  const [corridorResult, setCorridorResult] = useState<{ key: string; score: RouteAqiScore } | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)

  const currentStations = useMemo(
    () => (response?.stations ?? []).filter(isCurrentReading),
    [response],
  )
  const cleanStations = useMemo(
    () => currentStations.filter((station) => station.aqi <= 100).sort((first, second) => first.aqi - second.aqi),
    [currentStations],
  )
  const corridorEndpoints = useMemo(
    () => chooseCleanStationPair(currentStations),
    [currentStations],
  )
  const corridorKey = corridorEndpoints
    ? `${corridorEndpoints[0].id}:${corridorEndpoints[1].id}`
    : null
  const loadingRoute = Boolean(
    mapLoaded && !loadingStations && corridorKey && routeStatus?.key !== corridorKey,
  )
  const corridorScore = corridorKey && corridorResult?.key === corridorKey
    ? corridorResult.score
    : null

  useEffect(() => {
    const controller = new AbortController()
    void api.getAqiStations(controller.signal)
      .then(setResponse)
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setStationError(reason instanceof Error ? reason.message : 'AQI station data could not be loaded.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingStations(false)
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const map = new MapLibreMap({
      container,
      style: OSM_STYLE,
      center: [77.209, 28.6139],
      zoom: 9.5,
      attributionControl: { compact: true },
    })
    mapRef.current = map
    map.on('error', () => setMapError('OpenStreetMap tiles could not be loaded. Check your connection.'))
    map.on('load', () => {
      map.fitBounds(DELHI_BOUNDS, { padding: 28, duration: 0 })
      map.addSource('dashboard-aqi-model', {
        type: 'geojson',
        data: createModeledFeatures([]),
      })
      map.addLayer({
        id: 'dashboard-aqi-model-points',
        type: 'circle',
        source: 'dashboard-aqi-model',
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': 7,
          'circle-opacity': 0.82,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      })
      map.addLayer({
        id: 'dashboard-aqi-model-labels',
        type: 'symbol',
        source: 'dashboard-aqi-model',
        layout: {
          'text-field': ['to-string', ['get', 'aqi']],
          'text-offset': [0, 1.4],
          'text-size': 10,
          'text-allow-overlap': false,
        },
        paint: { 'text-color': '#26382d', 'text-halo-color': '#fffdf6', 'text-halo-width': 1.5 },
      })
      map.addSource('dashboard-aqi-stations', {
        type: 'geojson',
        data: createStationFeatures([]),
      })
      map.addLayer({
        id: 'dashboard-aqi-points',
        type: 'circle',
        source: 'dashboard-aqi-stations',
        paint: {
          'circle-color': ['step', ['get', 'aqi'], '#25854c', 101, '#d89a1b', 201, '#d95b35'],
          'circle-radius': 7,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      })
      map.addLayer({
        id: 'dashboard-aqi-labels',
        type: 'symbol',
        source: 'dashboard-aqi-stations',
        layout: {
          'text-field': ['to-string', ['get', 'aqi']],
          'text-offset': [0, 1.4],
          'text-size': 10,
          'text-allow-overlap': false,
        },
        paint: { 'text-color': '#26382d', 'text-halo-color': '#fffdf6', 'text-halo-width': 1.5 },
      })
      map.addSource('dashboard-aqi-routes', {
        type: 'geojson',
        data: createRouteFeatures([]),
      })
      map.addLayer({
        id: 'dashboard-green-corridors',
        type: 'line',
        source: 'dashboard-aqi-routes',
        paint: {
          'line-color': ['case', ['get', 'isGreen'], '#16834b', '#d17a31'],
          'line-width': ['case', ['get', 'isGreen'], 6, 4],
          'line-opacity': 0.9,
        },
      })
      map.moveLayer('dashboard-green-corridors', 'dashboard-aqi-points')
      setMapLoaded(true)
    })

    const resizeObserver = new ResizeObserver(() => map.resize())
    resizeObserver.observe(container)
    return () => {
      resizeObserver.disconnect()
      map.remove()
      mapRef.current = null
      setMapLoaded(false)
    }
  }, [])

  const modeledReadings = useMemo(() => modeledAqiResponse?.readings ?? [], [modeledAqiResponse])
  useEffect(() => {
    const map = mapRef.current
    const source = map?.getSource('dashboard-aqi-model') as GeoJSONSource | undefined
    source?.setData(createModeledFeatures(modeledReadings))
  }, [mapLoaded, modeledReadings])

  useEffect(() => {
    const map = mapRef.current
    if (!mapLoaded || !map) return
    let timer: number | undefined
    let controller: AbortController | undefined
    let active = true
    const loadEstimates = () => {
      if (timer !== undefined) window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        controller?.abort()
        const bounds = mapViewBounds(map)
        if (!bounds) {
          setModeledAqiError('Modeled AQI is unavailable for a map view crossing the date line.')
          setModeledAqiResponse(null)
          setLoadingModeledAqi(false)
          return
        }
        const requestController = new AbortController()
        controller = requestController
        setModeledAqiResponse(null)
        setModeledAqiError(null)
        setLoadingModeledAqi(true)
        void api.getModeledAqi(bounds, requestController.signal)
          .then((result) => {
            if (!active) return
            setModeledAqiResponse(result)
            setModeledAqiError(null)
          })
          .catch((reason: unknown) => {
            if (!active || requestController.signal.aborted) return
            setModeledAqiError(reason instanceof Error ? reason.message : 'Modeled AQI estimates could not be loaded.')
          })
          .finally(() => {
            if (active && !requestController.signal.aborted) setLoadingModeledAqi(false)
          })
      }, 500)
    }
    map.on('moveend', loadEstimates)
    loadEstimates()
    return () => {
      active = false
      if (timer !== undefined) window.clearTimeout(timer)
      controller?.abort()
      map.off('moveend', loadEstimates)
    }
  }, [mapLoaded])

  useEffect(() => {
    if (!mapLoaded) return
    const map = mapRef.current
    const source = map?.getSource('dashboard-aqi-stations') as GeoJSONSource | undefined
    source?.setData(createStationFeatures(currentStations))
  }, [currentStations, mapLoaded])

  useEffect(() => {
    if (!mapLoaded || loadingStations) return
    const map = mapRef.current
    const source = map?.getSource('dashboard-aqi-routes') as GeoJSONSource | undefined
    if (!source) return

    if (!corridorEndpoints) {
      source.setData(createRouteFeatures([]))
      return
    }
    const pair = corridorEndpoints
    const routeKey = `${pair[0].id}:${pair[1].id}`

    let cancelled = false
    source.setData(createRouteFeatures([]))
    void calculateRoutes(
      { label: pair[0].name, coordinates: [pair[0].longitude, pair[0].latitude] },
      { label: pair[1].name, coordinates: [pair[1].longitude, pair[1].latitude] },
    ).then(async (routes) => {
      const scored = await Promise.all(routes.map(async (route) => {
        const coordinates = routeCoordinates(route)
        if (coordinates.length < 2) return undefined
        const score = await getRouteAqiScore(route)
        return score ? { coordinates, score } : undefined
      }))
      const available = scored.filter((route): route is { coordinates: [number, number][]; score: RouteAqiScore } => route !== undefined)
      if (cancelled) return
      source.setData(createRouteFeatures(available))
      const greenRoute = available.find((route) => route.score.is_green_corridor)
      if (greenRoute) {
        setCorridorResult({ key: routeKey, score: greenRoute.score })
        setRouteStatus({ key: routeKey, message: `Green pathway between ${pair[0].name} and ${pair[1].name}.` })
      } else if (available.length) {
        setRouteStatus({ key: routeKey, message: 'Routes were checked, but none met the green-corridor AQI threshold.' })
      } else {
        setRouteStatus({ key: routeKey, message: 'No recent CPCB observations were close enough to score a pathway.' })
      }
    }).catch((reason: unknown) => {
      if (!cancelled) {
        setRouteStatus({
          key: routeKey,
          message: reason instanceof Error ? reason.message : 'Could not calculate a clean-air pathway.',
        })
      }
    })

    return () => { cancelled = true }
  }, [corridorEndpoints, currentStations, loadingStations, mapLoaded])

  const noCorridorReason = cleanStations.length < 2
    ? 'A green pathway needs two current low-AQI stations with enough distance between them.'
    : 'Current low-AQI stations are too close together to form a useful pathway.'
  const displayedRouteMessage = corridorEndpoints
    ? routeStatus?.key === corridorKey ? routeStatus.message : null
    : !loadingStations && !stationError ? noCorridorReason : null

  return (
    <section className="rounded-2xl border border-[#dce5de] bg-white p-4 shadow-[0_2px_12px_rgba(23,35,28,.04)] sm:p-6" aria-labelledby="dashboard-air-map-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-[#548066]">Live Delhi air map</p>
          <h2 id="dashboard-air-map-heading" className="mt-1 text-xl font-semibold text-[#17231c] sm:text-2xl">Lower-AQI areas &amp; green pathways</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#718077]">Free global US AQI model estimates appear separately from current Delhi CPCB monitor readings. A green pathway uses only nearby CPCB observations and is never inferred from model estimates.</p>
        </div>
        <Link to="/air-map" className="rounded-lg border border-[#dce5de] px-3 py-2 text-sm font-semibold text-[#24583b] hover:bg-[#f5f8f4]">
          Open full map
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_250px]">
        <div className="relative h-[300px] overflow-hidden rounded-xl border border-[#dce5de] bg-[#e8ece6] sm:h-[360px]">
          <div ref={containerRef} className="h-full w-full" aria-label="Map of current AQI readings and scored green pathways in Delhi" />
          {mapError && (
            <div className="absolute inset-x-3 top-3 rounded-lg bg-white/95 px-3 py-2 text-xs text-[#9a3e35] shadow" role="alert">
              {mapError}
            </div>
          )}
          {(!mapLoaded || (loadingStations && loadingModeledAqi)) && (
            <div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-white/95 px-3 py-2 text-xs text-[#526258] shadow" role="status">
              {!mapLoaded ? 'Loading map…' : 'Loading AQI data…'}
            </div>
          )}
          {loadingRoute && (
            <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-white/95 px-3 py-2 text-xs text-[#526258] shadow" role="status">
              Checking low-AQI pathway…
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-3" aria-label="Current lower-AQI areas">
          <div className="rounded-lg border border-[#dce5de] bg-[#f6f8f5] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#526258]">Global modeled AQI · US scale</p>
            <p className="mt-1 text-sm text-[#26382d]">
              {loadingModeledAqi
                ? 'Loading model estimates…'
                : modeledAqiError
                ? `Model data unavailable: ${modeledAqiError}`
                : `${modeledReadings.length} model estimates in this map view`}
            </p>
            <p className="mt-1 text-xs leading-5 text-[#718077]">Open-Meteo / CAMS model output, not station readings. Estimates update when the map moves.</p>
          </div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#26382d]">Current lower-AQI areas</h3>
            <span className="rounded-full bg-[#e8f4ec] px-2 py-1 text-xs font-semibold text-[#246b49]">{cleanStations.length}</span>
          </div>
          {stationError ? (
            <p role="alert" className="rounded-lg bg-[#fff3ef] p-3 text-sm text-[#9a3e35]">{stationError}</p>
          ) : cleanStations.length ? (
            <ul className="flex flex-col gap-2">
              {cleanStations.slice(0, 5).map((station) => (
                <li key={station.id} className="flex items-center justify-between gap-3 rounded-lg bg-[#f6f8f5] px-3 py-2">
                  <span className="min-w-0">
                    <strong className="block truncate text-sm text-[#26382d]">{station.name}</strong>
                    <span className="text-xs text-[#78847d]">{station.locality || 'Delhi'} · {observationTime(station.observed_at)}</span>
                  </span>
                  <span className="shrink-0 rounded-md bg-[#d8f0e3] px-2 py-1 text-sm font-bold text-[#1e7042]">{station.aqi}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg bg-[#f6f8f5] p-3 text-sm leading-5 text-[#718077]">
              {loadingStations ? 'Checking recent CPCB readings…' : response?.detail || 'No current CPCB stations at AQI 100 or below were returned.'}
            </p>
          )}
          {corridorScore && (
            <div className="rounded-lg border border-[#b9ddc5] bg-[#edf8f0] p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#247345]">Green pathway verified</p>
              <p className="mt-1 text-sm font-semibold text-[#1b5937]">Route AQI {corridorScore.average_aqi}</p>
              <p className="mt-1 text-xs text-[#587565]">Observed {observationTime(corridorScore.observed_at)} · {corridorScore.source}</p>
            </div>
          )}
          {displayedRouteMessage && (
            <p className="text-xs leading-5 text-[#718077]" role="status">{displayedRouteMessage}</p>
          )}
          <p className="mt-auto border-t border-[#edf1ee] pt-3 text-xs leading-5 text-[#87938b]">
            Green dots indicate recent Indian CPCB AQI ≤ 100. Green lines are route geometry verified with nearby recent readings.
          </p>
        </aside>
      </div>
    </section>
  )
}
