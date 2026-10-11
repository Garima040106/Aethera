import { useState } from 'react'
import { LOCATION_CONFIG, calculateRoutes, getRouteAqiScore } from '../services/locationRoutes'
import type { LocationRoute, Position } from '../services/locationRoutes'
import { RouteIcon } from '../components/Icons'

const LOCATIONS: Position[] = [
  { label: 'Noida Sector 62', coordinates: [77.3649, 28.628] },
  { label: 'Anand Vihar, Delhi', coordinates: [77.316, 28.6469] },
  { label: 'Punjabi Bagh, Delhi', coordinates: [77.131, 28.674] },
  { label: 'Gurugram Sector 51', coordinates: [77.0266, 28.4595] },
  { label: 'Central Delhi', coordinates: [77.209, 28.6139] },
]

function formatDistance(meters: number | undefined): string {
  if (meters === undefined) return 'Distance unavailable'
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`
}

function formatDuration(seconds: number | undefined): string {
  if (seconds === undefined) return 'ETA unavailable'
  const totalMinutes = Math.round(seconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`
}

function routeDistance(route: LocationRoute): number | undefined {
  return route.summary?.Distance ?? (route.legs?.reduce((sum, leg) => sum + (leg.summary?.Overview?.Distance ?? 0), 0) || undefined)
}

function routeDuration(route: LocationRoute): number | undefined {
  return route.summary?.Duration ?? (route.legs?.reduce((sum, leg) => sum + (leg.summary?.Overview?.Duration ?? 0), 0) || undefined)
}

function RoutePreview({ route, green }: { route: LocationRoute; green: boolean }) {
  const coordinates = route.legs?.flatMap((leg) => leg.geometry?.LineString ?? []) ?? []
  if (coordinates.length < 2) return null

  const longitudes = coordinates.map(([longitude]) => longitude)
  const latitudes = coordinates.map(([, latitude]) => latitude)
  const minLongitude = Math.min(...longitudes)
  const maxLongitude = Math.max(...longitudes)
  const minLatitude = Math.min(...latitudes)
  const maxLatitude = Math.max(...latitudes)
  const width = maxLongitude - minLongitude || 0.001
  const height = maxLatitude - minLatitude || 0.001
  const points = coordinates.map(([longitude, latitude]) => {
    const x = 12 + ((longitude - minLongitude) / width) * 276
    const y = 88 - ((latitude - minLatitude) / height) * 76
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-[#e7ede8] bg-[#f7f9f7]">
      <svg viewBox="0 0 300 100" className="block h-28 w-full" role="img" aria-label={`Route ${green ? 'green corridor' : ''} path`}>
        <polyline points={points} fill="none" stroke={green ? '#218653' : '#2878e5'} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={points.split(' ')[0].split(',')[0]} cy={points.split(' ')[0].split(',')[1]} r="5" fill="#174d35" stroke="white" strokeWidth="2" />
        <circle cx={points.split(' ').at(-1)?.split(',')[0]} cy={points.split(' ').at(-1)?.split(',')[1]} r="5" fill="#d95b35" stroke="white" strokeWidth="2" />
      </svg>
    </div>
  )
}

export default function RoutePlannerPage() {
  const [originIndex, setOriginIndex] = useState(0)
  const [destinationIndex, setDestinationIndex] = useState(1)
  const [routes, setRoutes] = useState<LocationRoute[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scoringError, setScoringError] = useState<string | null>(null)

  async function findRoutes() {
    if (originIndex === destinationIndex) {
      setError('Choose two different locations to find a route.')
      return
    }
    setLoading(true)
    setError(null)
    setScoringError(null)
    setRoutes([])
    try {
      const alternatives = await calculateRoutes(LOCATIONS[originIndex], LOCATIONS[destinationIndex])
      setRoutes(alternatives)
      if (LOCATION_CONFIG.hasAqiScoring) {
        const scoringResults = await Promise.all(alternatives.map(async (route) => {
          try {
            return await getRouteAqiScore(route)
          } catch (reason: unknown) {
            const message = reason instanceof Error ? reason.message : 'Could not score the route AQI.'
            setScoringError(message)
            return null
          }
        }))
        setRoutes(alternatives.map((route, index) => ({ ...route, score: scoringResults[index] ?? undefined })))
      }
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'Could not calculate routes.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="route-page min-w-0 overflow-y-auto bg-[#f5f8f5] px-4 py-6 sm:px-7 lg:px-9">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-5 pb-8">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#548066]">Delhi NCR · journey planning</p>
          <h1 className="font-display mt-2 text-4xl font-semibold tracking-[-.03em] text-[#17231c] sm:text-5xl">Find a better way through the city.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#718077]">
            Compare driving routes from Amazon Location. Green corridors are identified only from recent CPCB station observations near each route.
          </p>
        </header>

        <section className="rounded-2xl border border-[#e1e9e3] bg-white p-5 shadow-[0_2px_12px_rgba(23,35,28,.04)] sm:p-6">
          <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr_auto] md:items-end">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#78847d]">Starting point</span>
              <select value={originIndex} onChange={(event) => setOriginIndex(Number(event.target.value))} className="h-12 w-full rounded-xl border border-[#dce5de] bg-white px-3 text-sm text-[#26382d] outline-none focus:border-[#55916c]">
                {LOCATIONS.map((place, index) => <option key={place.label} value={index}>{place.label}</option>)}
              </select>
            </label>
            <button
              type="button"
              aria-label="Swap start and destination"
              onClick={() => {
                setOriginIndex(destinationIndex)
                setDestinationIndex(originIndex)
              }}
              className="h-11 w-11 rounded-xl border border-[#dce5de] bg-[#f7f9f7] text-lg text-[#246b49] hover:bg-[#e8f4ec] md:mb-0.5"
            >
              ⇄
            </button>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#78847d]">Destination</span>
              <select value={destinationIndex} onChange={(event) => setDestinationIndex(Number(event.target.value))} className="h-12 w-full rounded-xl border border-[#dce5de] bg-white px-3 text-sm text-[#26382d] outline-none focus:border-[#55916c]">
                {LOCATIONS.map((place, index) => <option key={place.label} value={index}>{place.label}</option>)}
              </select>
            </label>
            <button type="button" onClick={findRoutes} disabled={loading} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#174d35] px-5 text-sm font-semibold text-white transition hover:bg-[#1f6b47] disabled:cursor-wait disabled:opacity-60">
              <RouteIcon size={17} /> {loading ? 'Finding routes…' : 'Find routes'}
            </button>
          </div>
          <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#87938b]">
            <span>Amazon Location Routes SDK · backend</span>
            <span>•</span>
            <span>AWS credentials stay on the backend</span>
            <span>•</span>
            <span>{LOCATION_CONFIG.hasAqiScoring ? 'CPCB route AQI scoring enabled' : 'Route AQI scorer unavailable'}</span>
          </p>
        </section>

        {error && <div role="alert" className="rounded-xl border border-[#f0c8c2] bg-[#fff1ef] px-5 py-4 text-sm leading-6 text-[#a33a2d]">{error}</div>}
        {scoringError && <div role="status" className="rounded-xl border border-[#f2dfbd] bg-[#fff9eb] px-5 py-4 text-sm leading-6 text-[#855d12]">Routes loaded, but the AQI scorer could not classify them: {scoringError}</div>}

        {routes.length > 0 && (
          <section aria-live="polite" className="flex flex-col gap-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#7b8b81]">Your alternatives</p>
                <h2 className="mt-1 text-xl font-semibold text-[#17231c]">{routes.length} driving {routes.length === 1 ? 'route' : 'routes'}</h2>
              </div>
              <p className="text-xs text-[#78847d]">Route time is Amazon’s estimate and may change with traffic.</p>
            </div>
            {routes.map((route, index) => (
              <article key={index} className={`rounded-2xl border bg-white p-5 shadow-[0_2px_12px_rgba(23,35,28,.04)] ${
                route.score?.is_green_corridor ? 'border-[#9acaaa]' : 'border-[#e1e9e3]'
              }`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eef4ef] text-[#246b49]"><RouteIcon size={18} /></span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-[#17231c]">Route {index + 1}</h3>
                        {route.score?.is_green_corridor && <span className="rounded-full bg-[#d8f0e3] px-2.5 py-1 text-[11px] font-semibold text-[#218653]">Green corridor</span>}
                      </div>
                      <p className="mt-1 text-sm text-[#718077]">{LOCATIONS[originIndex].label} <span aria-hidden="true">→</span> {LOCATIONS[destinationIndex].label}</p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div><p className="text-xl font-semibold text-[#17231c]">{formatDuration(routeDuration(route))}</p><p className="text-xs text-[#87938b]">estimated time</p></div>
                    <div><p className="text-xl font-semibold text-[#17231c]">{formatDistance(routeDistance(route))}</p><p className="text-xs text-[#87938b]">route length</p></div>
                  </div>
                </div>
                <RoutePreview route={route} green={route.score?.is_green_corridor === true} />
                <div className="mt-4 border-t border-[#edf1ee] pt-3">
                  {route.score ? (
                    <p className="text-xs leading-5 text-[#647168]">
                      Route AQI: <strong>{route.score.average_aqi}</strong> · {route.score.source} · observed {route.score.observed_at}
                    </p>
                  ) : (
                    <p className="text-xs leading-5 text-[#87938b]">
                      Route-level AQI score unavailable. This route is not classified as a green corridor.
                    </p>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}

        <aside className="rounded-xl border border-[#e1e9e3] bg-[#eef4ef] p-4 text-xs leading-5 text-[#647168]">
          A green-corridor classification requires recent CPCB AQI observations within 1.5 km of the route and an average Indian AQI of 100 or below. If observations are missing or stale, the route remains unclassified.
        </aside>
      </div>
    </main>
  )
}
