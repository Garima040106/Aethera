import { useEffect, useMemo, useRef, useState } from 'react'
import { Map as MapLibreMap, setWorkerUrl, type GeoJSONSource, type MapLayerMouseEvent } from 'maplibre-gl'
import type { FeatureCollection, Point } from 'geojson'
import mapLibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import 'maplibre-gl/dist/maplibre-gl.css'
import { api } from '../services/api'
import type { AqiMapBounds, AqiStation, AqiStationsResponse, ModeledAqiReading, ModeledAqiResponse, PlaceSearchResult } from '../services/api'

setWorkerUrl(mapLibreWorkerUrl)

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
const DELHI_BOUNDS: [[number, number], [number, number]] = [[76.83, 28.39], [77.36, 28.89]]
const SEVERITY_FILTERS = ['Good', 'Satisfactory', 'Moderate', 'Poor', 'Very Poor', 'Severe'] as const
type Severity = typeof SEVERITY_FILTERS[number]

interface StationFeatureProperties {
  id: string
  name: string
  locality: string
  aqi: number
  category: Severity
  color: string
}

function indianAqiCategory(aqi: number): { category: Severity; color: string } {
  if (aqi <= 50) return { category: 'Good', color: '#23864b' }
  if (aqi <= 100) return { category: 'Satisfactory', color: '#7f9c32' }
  if (aqi <= 200) return { category: 'Moderate', color: '#dfaa23' }
  if (aqi <= 300) return { category: 'Poor', color: '#e87932' }
  if (aqi <= 400) return { category: 'Very Poor', color: '#c9473d' }
  return { category: 'Severe', color: '#7d3042' }
}

function isValidStation(station: AqiStation): boolean {
  return (
    typeof station.id === 'string'
    && station.id.length > 0
    && typeof station.name === 'string'
    && Number.isFinite(station.latitude)
    && station.latitude >= -90
    && station.latitude <= 90
    && Number.isFinite(station.longitude)
    && station.longitude >= -180
    && station.longitude <= 180
    && Number.isFinite(station.aqi)
    && station.aqi >= 0
    && station.aqi <= 500
    && station.aqi_system === 'INDIA_CPCB'
    && Number.isFinite(Date.parse(station.observed_at))
    && typeof station.source === 'string'
    && station.source.length > 0
  )
}

function createStationFeatures(stations: AqiStation[]): FeatureCollection<Point, StationFeatureProperties> {
  return {
    type: 'FeatureCollection',
    features: stations.map((station) => {
      const { category, color } = indianAqiCategory(station.aqi)
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [station.longitude, station.latitude] },
        properties: {
          id: station.id,
          name: station.name,
          locality: station.locality ?? '',
          aqi: station.aqi,
          category,
          color,
        },
      }
    }),
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

function formatUpdatedAt(value: string | null): string {
  if (!value || !Number.isFinite(Date.parse(value))) return 'No station observations'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function stationFreshness(
  station: AqiStation,
  datasetStatus: AqiStationsResponse['status'] | undefined,
): 'current' | 'stale' | 'estimated' {
  if (station.estimated) return 'estimated'
  return datasetStatus === 'stale' || Date.now() - Date.parse(station.observed_at) > 2 * 60 * 60 * 1000
    ? 'stale'
    : 'current'
}

export default function AqiMapPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const stationDataRef = useRef<AqiStation[]>([])
  const modeledDataRef = useRef<ModeledAqiReading[]>([])
  const visibleStationDataRef = useRef<AqiStation[]>([])
  const [stationResponse, setStationResponse] = useState<AqiStationsResponse | null>(null)
  const [modeledAqiResponse, setModeledAqiResponse] = useState<ModeledAqiResponse | null>(null)
  const [modeledAqiError, setModeledAqiError] = useState<string | null>(null)
  const [loadingModeledAqi, setLoadingModeledAqi] = useState(false)
  const [loadingStations, setLoadingStations] = useState(true)
  const [stationError, setStationError] = useState<string | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [selectedStation, setSelectedStation] = useState<AqiStation | null>(null)
  const [selectedModelReading, setSelectedModelReading] = useState<ModeledAqiReading | null>(null)
  const [stationsVisible, setStationsVisible] = useState(true)
  const [modeledAqiVisible, setModeledAqiVisible] = useState(true)
  const [enabledSeverities, setEnabledSeverities] = useState<Severity[]>([...SEVERITY_FILTERS])
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<PlaceSearchResult[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locationMessage, setLocationMessage] = useState<string | null>(null)
  const [visibleArea, setVisibleArea] = useState({
    count: 0,
    averageAqi: null as number | null,
    modeledCount: 0,
    modeledAverageAqi: null as number | null,
  })
  const [mapLoaded, setMapLoaded] = useState(false)

  const stations = useMemo(
    () => (stationResponse?.stations ?? []).filter(isValidStation),
    [stationResponse],
  )
  const modeledReadings = useMemo(() => modeledAqiResponse?.readings ?? [], [modeledAqiResponse])

  useEffect(() => {
    const controller = new AbortController()
    void api.getAqiStations(controller.signal)
      .then(setStationResponse)
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
    stationDataRef.current = stations
    const source = mapRef.current?.getSource('aqi-stations') as GeoJSONSource | undefined
    if (source) source.setData(createStationFeatures(stations))
  }, [stations])

  useEffect(() => {
    if (!mapContainerRef.current) return
    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: OSM_STYLE,
      center: [77.209, 28.6139],
      zoom: 9.7,
      attributionControl: { compact: true },
    })
    mapRef.current = map

    map.on('error', () => {
      setMapError('The OpenStreetMap tiles could not be loaded. Check your network connection and try again.')
    })
    map.on('load', () => {
      map.fitBounds(DELHI_BOUNDS, { padding: 24, duration: 0 })
      map.addSource('aqi-model-estimates', {
        type: 'geojson',
        data: createModeledFeatures([]),
      })
      map.addLayer({
        id: 'aqi-model-points',
        type: 'circle',
        source: 'aqi-model-estimates',
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': 7,
          'circle-opacity': 0.82,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      })
      map.addLayer({
        id: 'aqi-model-labels',
        type: 'symbol',
        source: 'aqi-model-estimates',
        layout: {
          'text-field': ['to-string', ['get', 'aqi']],
          'text-offset': [0, 1.5],
          'text-size': 10,
          'text-allow-overlap': false,
        },
        paint: { 'text-color': '#24342b', 'text-halo-color': '#fffdf6', 'text-halo-width': 1.5 },
      })
      map.addSource('aqi-stations', {
        type: 'geojson',
        data: createStationFeatures(stationDataRef.current),
        cluster: true,
        clusterMaxZoom: 11,
        clusterRadius: 48,
      })
      map.addLayer({
        id: 'aqi-clusters',
        type: 'circle',
        source: 'aqi-stations',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#174d35',
          'circle-radius': ['step', ['get', 'point_count'], 18, 10, 22, 30, 27],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      })
      map.addLayer({
        id: 'aqi-cluster-count',
        type: 'symbol',
        source: 'aqi-stations',
        filter: ['has', 'point_count'],
        layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 12 },
        paint: { 'text-color': '#ffffff' },
      })
      map.addLayer({
        id: 'aqi-station-points',
        type: 'circle',
        source: 'aqi-stations',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': 8,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      })
      map.addLayer({
        id: 'aqi-station-labels',
        type: 'symbol',
        source: 'aqi-stations',
        filter: ['!', ['has', 'point_count']],
        layout: {
          'text-field': ['to-string', ['get', 'aqi']],
          'text-offset': [0, 1.5],
          'text-size': 11,
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': '#24342b',
          'text-halo-color': '#fffdf6',
          'text-halo-width': 1.5,
        },
      })

      map.on('click', 'aqi-clusters', (event: MapLayerMouseEvent) => {
        const feature = map.queryRenderedFeatures(event.point, { layers: ['aqi-clusters'] })[0]
        const clusterId = feature?.properties?.cluster_id
        const source = map.getSource('aqi-stations') as GeoJSONSource
        if (typeof clusterId !== 'number') return
        void source.getClusterExpansionZoom(clusterId).then((zoom: number) => {
          const geometry = feature?.geometry
          if (geometry?.type === 'Point') {
            map.easeTo({ center: geometry.coordinates as [number, number], zoom })
          }
        }).catch(() => {
          setMapError('Could not expand the station cluster. Please try zooming in with the map controls.')
        })
      })
      map.on('click', 'aqi-station-points', (event: MapLayerMouseEvent) => {
        const id = event.features?.[0]?.properties?.id
        if (typeof id === 'string') {
          setSelectedModelReading(null)
          setSelectedStation(stationDataRef.current.find((station) => station.id === id) ?? null)
        }
      })
      map.on('click', 'aqi-model-points', (event: MapLayerMouseEvent) => {
        const id = event.features?.[0]?.properties?.id
        if (typeof id === 'string') {
          setSelectedStation(null)
          setSelectedModelReading(modeledDataRef.current.find((reading) => reading.id === id) ?? null)
        }
      })
      map.on('mouseenter', 'aqi-clusters', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'aqi-clusters', () => { map.getCanvas().style.cursor = '' })
      map.on('mouseenter', 'aqi-station-points', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'aqi-station-points', () => { map.getCanvas().style.cursor = '' })
      map.on('mouseenter', 'aqi-model-points', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'aqi-model-points', () => { map.getCanvas().style.cursor = '' })
      setMapLoaded(true)
    })

    const resizeObserver = new ResizeObserver(() => map.resize())
    resizeObserver.observe(mapContainerRef.current)
    return () => {
      resizeObserver.disconnect()
      map.remove()
      mapRef.current = null
      setMapLoaded(false)
    }
  }, [])

  useEffect(() => {
    modeledDataRef.current = modeledReadings
    const source = mapRef.current?.getSource('aqi-model-estimates') as GeoJSONSource | undefined
    if (source) source.setData(createModeledFeatures(modeledReadings))
  }, [modeledReadings])

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
        setSelectedModelReading(null)
        setModeledAqiResponse(null)
        setModeledAqiError(null)
        setLoadingModeledAqi(true)
        void api.getModeledAqi(bounds, requestController.signal)
          .then((response) => {
            if (!active) return
            setModeledAqiResponse(response)
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
    const map = mapRef.current
    if (!mapLoaded || !map || !map.getLayer('aqi-station-points')) return
    const source = map.getSource('aqi-stations') as GeoJSONSource
    const filtered = stationsVisible
      ? stations.filter((station) => enabledSeverities.includes(indianAqiCategory(station.aqi).category))
      : []
    visibleStationDataRef.current = filtered
    source.setData(createStationFeatures(filtered))
    map.setLayoutProperty('aqi-station-labels', 'visibility', stationsVisible ? 'visible' : 'none')
    map.setLayoutProperty('aqi-clusters', 'visibility', stationsVisible ? 'visible' : 'none')
    map.setLayoutProperty('aqi-cluster-count', 'visibility', stationsVisible ? 'visible' : 'none')
    map.setLayoutProperty('aqi-station-points', 'visibility', stationsVisible ? 'visible' : 'none')
  }, [enabledSeverities, mapLoaded, stations, stationsVisible])

  useEffect(() => {
    const map = mapRef.current
    if (!mapLoaded || !map) return
    map.setLayoutProperty('aqi-model-points', 'visibility', modeledAqiVisible ? 'visible' : 'none')
    map.setLayoutProperty('aqi-model-labels', 'visibility', modeledAqiVisible ? 'visible' : 'none')
  }, [mapLoaded, modeledAqiVisible])

  useEffect(() => {
    const map = mapRef.current
    if (!mapLoaded || !map) return
    const updateVisibleSummary = () => {
      const bounds = map.getBounds()
      const visible = visibleStationDataRef.current.filter((station) =>
        bounds.contains([station.longitude, station.latitude]),
      )
      const classified = visible.filter((station) => station.aqi_system === 'INDIA_CPCB')
      const visibleModeled = modeledReadings.filter((reading) =>
        modeledAqiVisible && bounds.contains([reading.longitude, reading.latitude]),
      )
      setVisibleArea({
        count: visible.length,
        averageAqi: classified.length
          ? Math.round(classified.reduce((sum, station) => sum + station.aqi, 0) / classified.length)
          : null,
        modeledCount: visibleModeled.length,
        modeledAverageAqi: visibleModeled.length
          ? Math.round(visibleModeled.reduce((sum, reading) => sum + reading.aqi, 0) / visibleModeled.length)
          : null,
      })
    }
    map.on('moveend', updateVisibleSummary)
    updateVisibleSummary()
    return () => { map.off('moveend', updateVisibleSummary) }
  }, [enabledSeverities, mapLoaded, modeledAqiVisible, modeledReadings, stations, stationsVisible])

  useEffect(() => {
    const normalizedQuery = query.trim()
    if (normalizedQuery.length < 2) return

    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setSearching(true)
      setSearchError(null)
      void api.searchPlaces(normalizedQuery, controller.signal)
        .then(setSuggestions)
        .catch((reason: unknown) => {
          if (!controller.signal.aborted) {
            setSearchError(reason instanceof Error ? reason.message : 'Locality search is unavailable.')
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false)
        })
    }, 300)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  function resetDelhiView() {
    mapRef.current?.fitBounds(DELHI_BOUNDS, { padding: 24, duration: 600 })
    setSelectedStation(null)
    setSelectedModelReading(null)
    setLocationMessage(null)
  }

  function locateUser() {
    if (!navigator.geolocation) {
      setLocationMessage('Location is not supported by this browser.')
      return
    }
    setLocating(true)
    setLocationMessage(null)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        mapRef.current?.flyTo({ center: [coords.longitude, coords.latitude], zoom: 13 })
        setLocationMessage('Map centered on your location.')
        setLocating(false)
      },
      () => {
        setLocationMessage('Location permission was not granted or the position is unavailable.')
        setLocating(false)
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    )
  }

  function selectPlace(place: PlaceSearchResult) {
    mapRef.current?.flyTo({ center: [place.longitude, place.latitude], zoom: 14 })
    setQuery(place.label)
    setSuggestions([])
    setSearchError(null)
  }

  function toggleSeverity(severity: Severity) {
    setEnabledSeverities((current) =>
      current.includes(severity) ? current.filter((item) => item !== severity) : [...current, severity],
    )
  }

  return (
    <main className="global-aqi-map-page min-w-0 overflow-y-auto bg-[#f8f7ef] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-5 pb-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#548066]">Global modeled air quality · Delhi station data</p>
            <h1 className="mt-1 text-3xl font-medium tracking-[-.03em] text-[#17231c] sm:text-4xl">Air quality map</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#718077]">
              Explore global, model-estimated US AQI. CPCB monitor readings are shown separately when available; pan and zoom to load estimates for another region.
            </p>
          </div>
          <div className="rounded-xl border border-[#dce5de] bg-white px-4 py-2 text-sm text-[#526258]">
            Last station update: <strong className="font-semibold text-[#26382d]">{stationResponse ? formatUpdatedAt(stationResponse.updated_at) : loadingStations ? 'Checking stations…' : 'No station observations'}</strong>
          </div>
        </header>

        <section className="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]" aria-label="Interactive global AQI map">
          <div className="min-w-0">
            <div className="relative h-[62vh] min-h-[440px] overflow-hidden rounded-2xl border border-[#dce5de] bg-[#e8ece6] shadow-[0_8px_28px_rgba(23,35,28,.08)] sm:h-[68vh] xl:h-[calc(100vh-240px)]">
              <>
                  <div ref={mapContainerRef} className="h-full w-full" aria-label="Interactive global AQI map" />
                  {!mapLoaded && !mapError && (
                    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white/95 px-4 py-3 text-sm text-[#526258] shadow">
                      Loading OpenStreetMap…
                    </div>
                  )}
                  {mapError && (
                    <div className="absolute inset-x-4 top-4 z-10 rounded-xl border border-[#efcfaa] bg-[#fff8ec] px-4 py-3 text-sm text-[#795817]" role="alert">
                      {mapError}
                    </div>
                  )}
                  <div className="absolute left-3 top-3 z-10 flex w-[min(360px,calc(100%-24px))] flex-col gap-2">
                    <form className="flex rounded-xl border border-[#dce5de] bg-white shadow-md" onSubmit={(event) => event.preventDefault()}>
                      <label className="sr-only" htmlFor="delhi-place-search">Search locality or address</label>
                      <input
                        id="delhi-place-search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search a locality or address"
                        className="h-11 min-w-0 flex-1 rounded-l-xl bg-transparent px-3 text-sm outline-none placeholder:text-[#89958d]"
                      />
                      <button type="button" onClick={() => setQuery('')} className="px-3 text-xs font-semibold text-[#52735e]" aria-label="Clear place search">Clear</button>
                    </form>
                    {query.trim().length >= 2 && (searching || searchError || suggestions.length > 0) && (
                      <div className="overflow-hidden rounded-xl border border-[#dce5de] bg-white shadow-md">
                        {searching && <p className="px-3 py-2 text-xs text-[#718077]" role="status">Searching places…</p>}
                        {searchError && <p className="px-3 py-2 text-xs text-[#9a3e35]" role="alert">{searchError}</p>}
                        {!searching && !searchError && suggestions.length === 0 && query.trim().length >= 2 && (
                          <p className="px-3 py-2 text-xs text-[#718077]">No matching places found.</p>
                        )}
                        {suggestions.map((place) => (
                          <button key={place.id} type="button" onClick={() => selectPlace(place)} className="block w-full border-b border-[#edf0eb] px-3 py-2 text-left last:border-0 hover:bg-[#f5f8f4]">
                            <span className="block text-sm font-medium text-[#24342b]">{place.label}</span>
                            {place.address && <span className="block text-xs text-[#718077]">{place.address}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
                    <button type="button" onClick={resetDelhiView} className="rounded-xl border border-[#dce5de] bg-white px-3 py-2 text-xs font-semibold text-[#24583b] shadow-md hover:bg-[#f5f8f4]">Full Delhi</button>
                    <button type="button" onClick={locateUser} disabled={locating} className="rounded-xl border border-[#dce5de] bg-white px-3 py-2 text-xs font-semibold text-[#24583b] shadow-md hover:bg-[#f5f8f4] disabled:opacity-60">
                      {locating ? 'Locating…' : 'My location'}
                    </button>
                  </div>
                  {locationMessage && (
                    <div className="absolute bottom-3 left-3 z-10 max-w-[80%] rounded-lg bg-white/95 px-3 py-2 text-xs text-[#526258] shadow" role="status">{locationMessage}</div>
                  )}
              </>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#78847d]">
              <span>Map tiles &copy; OpenStreetMap contributors</span>
              <span>Model estimates are available worldwide as you pan and zoom</span>
            </div>
          </div>

          <aside className="flex min-w-0 flex-col gap-4">
            <section className="rounded-2xl border border-[#dce5de] bg-white p-4 shadow-sm" aria-labelledby="aqi-legend-title">
              <div className="flex items-center justify-between gap-3">
                <h2 id="aqi-legend-title" className="text-lg text-[#17231c]">AQI data layers</h2>
              </div>
              <div className="mt-3 flex flex-col gap-2 text-xs text-[#526258]">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={modeledAqiVisible} onChange={(event) => setModeledAqiVisible(event.target.checked)} className="accent-[#174d35]" />
                  Show global modeled estimates · US AQI
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={stationsVisible} onChange={(event) => setStationsVisible(event.target.checked)} className="accent-[#174d35]" />
                  Show Delhi CPCB monitor observations
                </label>
              </div>
              <p className="mt-3 text-xs text-[#78847d]">Indian National AQI · CPCB station bands</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {SEVERITY_FILTERS.map((severity) => {
                  const color = indianAqiCategory(({ Good: 25, Satisfactory: 75, Moderate: 150, Poor: 250, 'Very Poor': 350, Severe: 450 })[severity]).color
                  const range = ({ Good: '0–50', Satisfactory: '51–100', Moderate: '101–200', Poor: '201–300', 'Very Poor': '301–400', Severe: '401–500' })[severity]
                  return (
                    <label key={severity} className="flex min-w-0 items-center gap-2 rounded-lg bg-[#f8f9f6] px-2 py-2 text-xs text-[#405247]">
                      <input type="checkbox" checked={enabledSeverities.includes(severity)} onChange={() => toggleSeverity(severity)} className="accent-[#174d35]" />
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                      <span className="min-w-0 flex-1">{severity}</span>
                      <span className="text-[#87938b]">{range}</span>
                    </label>
                  )
                })}
              </div>
              <p className="mt-3 text-xs font-semibold text-[#526258]">Global model · US AQI bands</p>
              <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-[#526258]">
                {[
                  ['Good 0–50', '#23864b'],
                  ['Moderate 51–100', '#dfaa23'],
                  ['USG 101–150', '#e87932'],
                  ['Unhealthy 151–200', '#c9473d'],
                  ['Very unhealthy 201–300', '#8c4da8'],
                  ['Hazardous 301+', '#7d3042'],
                ].map(([label, color]) => (
                  <span key={label} className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                    {label}
                  </span>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-[#dce5de] bg-white p-4 shadow-sm" aria-live="polite">
              <p className="text-xs font-semibold uppercase tracking-[.12em] text-[#78847d]">Current map view</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-2xl font-semibold text-[#174d35]">{visibleArea.count}</p>
                  <p className="text-xs text-[#718077]">visible stations</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-[#174d35]">{visibleArea.averageAqi ?? '—'}</p>
                  <p className="text-xs text-[#718077]">average CPCB AQI</p>
                </div>
              </div>
              <div className="mt-3 rounded-lg bg-[#f4f7f3] p-3">
                <div className="flex items-center justify-between gap-2 text-xs text-[#718077]">
                  <span>US AQI model estimates in view</span>
                  <strong className="text-sm text-[#174d35]">{visibleArea.modeledCount}</strong>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 text-xs text-[#718077]">
                  <span>Average modeled US AQI</span>
                  <strong className="text-sm text-[#174d35]">{visibleArea.modeledAverageAqi ?? '—'}</strong>
                </div>
              </div>
              <p className="mt-3 border-t border-[#edf0eb] pt-3 text-xs leading-5 text-[#718077]">
                {loadingModeledAqi
                  ? 'Loading free global model estimates…'
                  : modeledAqiError
                  ? `Modeled AQI request failed: ${modeledAqiError}`
                  : modeledAqiResponse?.detail ?? 'US AQI values are CAMS-based model estimates from Open-Meteo, not monitoring-station readings.'}
              </p>
              <p className="mt-2 text-xs leading-5 text-[#718077]">
                {loadingStations
                  ? 'Loading Delhi CPCB monitor observations…'
                  : stationError
                  ? `CPCB station request failed: ${stationError}`
                  : stationResponse?.detail ?? 'CPCB monitor readings use the Indian National AQI scale and are kept separate from model estimates.'}
              </p>
              {stationResponse?.status === 'stale' && <p className="mt-2 text-xs font-medium text-[#9a6b17]">These station observations are stale.</p>}
              {stationResponse?.status === 'available' && stations.length === 0 && <p className="mt-2 text-xs text-[#718077]">No valid, coordinate-bearing AQI stations were returned.</p>}
            </section>

            {selectedStation && (
              <section className="rounded-2xl border border-[#dce5de] bg-white p-4 shadow-sm" aria-labelledby="selected-station-title">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[.12em] text-[#78847d]">Selected monitor</p>
                    <h2 id="selected-station-title" className="mt-1 text-lg text-[#17231c]">{selectedStation.name}</h2>
                  </div>
                  <button type="button" onClick={() => setSelectedStation(null)} className="rounded-lg px-2 py-1 text-xs text-[#52735e]" aria-label="Close station details">Close</button>
                </div>
                <p className="mt-1 text-sm text-[#647168]">{selectedStation.locality || 'Locality not reported'}</p>
                <p className="mt-3 text-3xl font-semibold text-[#174d35]">{selectedStation.aqi} <span className="text-sm font-normal">AQI · {indianAqiCategory(selectedStation.aqi).category}</span></p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#647168]">
                  <div><dt>PM2.5</dt><dd className="font-medium text-[#24342b]">{selectedStation.pm25 ?? '—'} µg/m³</dd></div>
                  <div><dt>PM10</dt><dd className="font-medium text-[#24342b]">{selectedStation.pm10 ?? '—'} µg/m³</dd></div>
                  <div><dt>Coordinates</dt><dd className="font-medium text-[#24342b]">{selectedStation.latitude.toFixed(4)}, {selectedStation.longitude.toFixed(4)}</dd></div>
                  <div><dt>Observed</dt><dd className="font-medium text-[#24342b]">{formatUpdatedAt(selectedStation.observed_at)}</dd></div>
                  <div><dt>Reading status</dt><dd className="font-medium capitalize text-[#24342b]">{stationFreshness(selectedStation, stationResponse?.status)}</dd></div>
                </dl>
                {selectedStation.pollutants && Object.entries(selectedStation.pollutants).length > 0 && (
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#647168]">
                    {Object.entries(selectedStation.pollutants).map(([name, reading]) => (
                      <div key={name}>
                        <dt>{name}</dt>
                        <dd className="font-medium text-[#24342b]">{reading.value} {reading.unit}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                <p className="mt-3 text-xs text-[#78847d]">Source: {selectedStation.source}</p>
              </section>
            )}
            {selectedModelReading && (
              <section className="rounded-2xl border border-[#dce5de] bg-white p-4 shadow-sm" aria-labelledby="selected-model-title">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[.12em] text-[#78847d]">Modeled estimate · US AQI</p>
                    <h2 id="selected-model-title" className="mt-1 text-lg text-[#17231c]">{selectedModelReading.name}</h2>
                  </div>
                  <button type="button" onClick={() => setSelectedModelReading(null)} className="rounded-lg px-2 py-1 text-xs text-[#52735e]" aria-label="Close estimate details">Close</button>
                </div>
                <p className="mt-3 text-3xl font-semibold text-[#174d35]">{selectedModelReading.aqi} <span className="text-sm font-normal">US AQI</span></p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#647168]">
                  <div><dt>PM2.5</dt><dd className="font-medium text-[#24342b]">{selectedModelReading.pm25 ?? '—'} µg/m³</dd></div>
                  <div><dt>PM10</dt><dd className="font-medium text-[#24342b]">{selectedModelReading.pm10 ?? '—'} µg/m³</dd></div>
                  <div><dt>Coordinates</dt><dd className="font-medium text-[#24342b]">{selectedModelReading.latitude.toFixed(3)}, {selectedModelReading.longitude.toFixed(3)}</dd></div>
                  <div><dt>Model time</dt><dd className="font-medium text-[#24342b]">{formatUpdatedAt(selectedModelReading.observed_at)}</dd></div>
                </dl>
                <p className="mt-3 text-xs text-[#78847d]">Estimate, not a live station observation. Source: {selectedModelReading.source}.</p>
              </section>
            )}

            <div className="rounded-xl border border-[#e6dfcc] bg-[#fffaf0] px-4 py-3 text-xs leading-5 text-[#756746]">
              Modeled estimates are clearly distinguished from CPCB monitor observations. No synthetic station locations or AQI readings are plotted. Data: Open-Meteo Air Quality API (CAMS model); OpenStreetMap map tiles.
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}
