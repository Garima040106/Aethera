import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRightIcon,
  HeartPulseIcon,
  LockIcon,
  MapPinIcon,
  RouteIcon,
  ShieldAlertIcon,
  WindIcon,
} from '../components/Icons'
import { api } from '../services/api'
import type { DecisionRecord, ForecastResponse, InversionResponse, PlumeResponse } from '../services/api'
import { getDemoUser } from '../services/demoAuth'

const AREA_OPTIONS = [
  { id: 'noida', label: 'Noida Sector 62' },
  { id: 'anand_vihar', label: 'Anand Vihar, Delhi' },
  { id: 'punjabi_bagh', label: 'Punjabi Bagh, Delhi' },
  { id: 'gurugram', label: 'Gurugram Sector 51' },
]

function getAirStatus(aqi: number | undefined, category: string | undefined) {
  if (aqi === undefined) return { title: 'Checking air quality', tone: 'neutral' }
  if (aqi <= 50) return { title: 'Good for most activities', tone: 'good' }
  if (aqi <= 100) return { title: 'Fair — take it at your pace', tone: 'fair' }
  if (aqi <= 150) return { title: 'Take extra care outdoors', tone: 'caution' }
  if (aqi <= 200) return { title: 'Limit time outdoors', tone: 'warning' }
  if (aqi <= 300) return { title: 'Stay indoors if you can', tone: 'high' }
  return { title: category || 'Very poor air quality', tone: 'high' }
}

function getNextStep(aqi: number | undefined) {
  if (aqi === undefined) return 'Air readings are still loading. Please wait a moment or try again.'
  if (aqi <= 100) return 'Check the forecast before a long outing. Take water and rest when you need to.'
  if (aqi <= 200) return 'Keep outdoor activity shorter today. Consider a well-fitting mask when going out.'
  return 'Avoid strenuous outdoor activity today. Keep windows closed when outside air is poor.'
}

function ForecastChart({ forecast }: { forecast: ForecastResponse }) {
  const points = forecast.points ?? []
  if (points.length === 0) return <p>No forecast points are available yet.</p>

  const chartPoints = points.map((point) => {
    const x = 42 + (point.hour / 72) * 638
    const y = 230 - (Math.min(500, Math.max(0, point.aqi_coupled)) / 500) * 190
    return `${x},${y}`
  }).join(' ')

  return (
    <svg viewBox="0 0 700 270" className="elder-forecast-chart" role="img" aria-label={`72-hour air quality forecast for ${forecast.area}`}>
      {[40, 88, 136, 184, 230].map((y) => <line key={y} x1="42" y1={y} x2="680" y2={y} stroke="#e8e5dc" />)}
      <polyline points={chartPoints} fill="none" stroke="#52674f" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
      <g fill="#5f625b" fontSize="12" textAnchor="middle">
        {['Now', '+12 hours', '+24 hours', '+36 hours', '+48 hours', '+60 hours', '+72 hours'].map((label, index) => (
          <text key={label} x={42 + index * 106.3} y="255">{label}</text>
        ))}
      </g>
    </svg>
  )
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const [selectedArea, setSelectedArea] = useState('noida')
  const [forecast, setForecast] = useState<ForecastResponse | null>(null)
  const [inversion, setInversion] = useState<InversionResponse | null>(null)
  const [plumes, setPlumes] = useState<PlumeResponse | null>(null)
  const [decisions, setDecisions] = useState<DecisionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshCount, setRefreshCount] = useState(0)
  const user = getDemoUser()

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [forecastData, inversionData, plumeData, decisionData] = await Promise.all([
          api.getForecast(selectedArea),
          api.getInversion(selectedArea),
          api.getPlumes(selectedArea),
          api.getDecisions(),
        ])
        if (!isMounted) return
        setForecast(forecastData)
        setInversion(inversionData)
        setPlumes(plumeData)
        setDecisions(decisionData.decisions ?? [])
      } catch (reason: unknown) {
        if (!isMounted) return
        setError(reason instanceof Error ? reason.message : 'Could not load air quality information.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    void load()
    return () => { isMounted = false }
  }, [selectedArea, refreshCount])

  const aqi = forecast?.summary.aqi_now
  const airStatus = getAirStatus(aqi, forecast?.summary.category_now)
  const nextStep = getNextStep(aqi)
  const firstName = user?.name.split(' ')[0] || 'there'

  return (
    <main className="elder-dashboard min-w-0 overflow-y-auto px-4 py-6 sm:px-7 sm:py-8 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 pb-10 sm:gap-8">
        <header className="elder-dashboard-header">
          <div>
            <p className="elder-eyebrow">Your daily air check</p>
            <h1 className="mt-2">Good day, {firstName}.</h1>
            <p className="mt-2 text-lg leading-7 text-[#62635c]">Here is a simple look at the air around you.</p>
          </div>
          <label className="elder-location-picker">
            <span><MapPinIcon size={20} /> Choose your area</span>
            <select value={selectedArea} onChange={(event) => setSelectedArea(event.target.value)}>
              {AREA_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
            </select>
          </label>
        </header>

        {error && (
          <div className="elder-alert" role="alert">
            <div>
              <strong>We could not refresh the air report.</strong>
              <p>{error}</p>
            </div>
            <button type="button" onClick={() => setRefreshCount((count) => count + 1)}>Try again</button>
          </div>
        )}

        <section className={`elder-air-status elder-air-status-${airStatus.tone}`} aria-live="polite" aria-label="Current air quality">
          <div className="elder-air-reading">
            <p className="elder-eyebrow">Air quality right now</p>
            {loading && !forecast ? (
              <p className="elder-air-value">…</p>
            ) : (
              <p className="elder-air-value">{aqi ?? '—'} <span>AQI</span></p>
            )}
            <p className="elder-air-category">{loading && !forecast ? 'Getting your local report…' : airStatus.title}</p>
            <p className="elder-air-area">{forecast?.area || AREA_OPTIONS.find((area) => area.id === selectedArea)?.label}</p>
          </div>
          <div className="elder-next-step">
            <span className="elder-next-step-icon"><WindIcon size={26} /></span>
            <div>
              <p className="elder-eyebrow">What should I do?</p>
              <p className="elder-next-step-copy">{nextStep}</p>
            </div>
          </div>
        </section>

        <section className="elder-quick-actions" aria-labelledby="quick-actions-heading">
          <div>
            <p className="elder-eyebrow">Help and tools</p>
            <h2 id="quick-actions-heading">What would you like to do?</h2>
          </div>
          <div className="elder-action-grid">
            <Link to="/companion" className="elder-action-card elder-action-card-sage">
              <span className="elder-action-icon"><HeartPulseIcon size={27} /></span>
              <span><strong>Check how I feel</strong><small>Open your personal companion</small></span>
              <ArrowRightIcon size={21} />
            </Link>
            <Link to="/caregiver-login" className="elder-action-card elder-action-card-sand">
              <span className="elder-action-icon"><ShieldAlertIcon size={27} /></span>
              <span><strong>Contact my care circle</strong><small>See trusted people and support</small></span>
              <ArrowRightIcon size={21} />
            </Link>
            <Link to="/routes" className="elder-action-card elder-action-card-sky">
              <span className="elder-action-icon"><RouteIcon size={27} /></span>
              <span><strong>Plan a route</strong><small>Compare routes around the city</small></span>
              <ArrowRightIcon size={21} />
            </Link>
          </div>
        </section>

        <section className="elder-summary-grid" aria-label="Today's forecast summary">
          <article className="elder-summary-card">
            <p className="elder-eyebrow">Later today</p>
            <h2>{forecast ? `${forecast.summary.peak_category} conditions expected` : loading ? 'Forecast is loading' : 'Forecast unavailable'}</h2>
            <p>{forecast ? `Air quality may be highest in about ${forecast.summary.peak_hour} hours. Plan outdoor activities for a time that feels comfortable.` : 'We will show the forecast here when it is available.'}</p>
          </article>
          <article className="elder-summary-card elder-summary-card-sand">
            <p className="elder-eyebrow">Weather and air</p>
            <h2>{inversion?.inversion_status_now || (loading ? 'Checking conditions' : 'No update yet')}</h2>
            <p>{inversion ? `Still air may hold pollution near the ground. Forecast window: ${inversion.peak_inversion_window}.` : 'We are checking whether weather may keep pollution near the ground.'}</p>
          </article>
          <article className="elder-summary-card elder-summary-card-sage">
            <p className="elder-eyebrow">Smoke activity</p>
            <h2>{plumes ? `${plumes.fire_count_upwind} upwind hotspots` : loading ? 'Checking activity' : 'No update yet'}</h2>
            <p>{plumes ? `Wind is from the ${plumes.wind_direction_cardinal}. Estimated plume arrival: about ${plumes.estimated_arrival_hours} hours.` : 'We are checking for reported upwind fire activity.'}</p>
          </article>
        </section>

        <details className="elder-details">
          <summary>Show detailed air forecast and data</summary>
          {forecast && (
            <div className="elder-details-content">
              <div>
                <h2>Air quality over the next 72 hours</h2>
                <p>Use this chart as a forecast guide. Conditions can change.</p>
                <div className="elder-chart-scroll"><ForecastChart forecast={forecast} /></div>
              </div>
              <div className="elder-data-note">
                <LockIcon size={19} />
                <p>Your personal health readings stay on your device. The air report uses environmental data and forecasts.</p>
              </div>
              {decisions.length > 0 && (
                <div>
                  <h2>Recent report updates</h2>
                  <ul className="elder-decision-list">
                    {decisions.slice(0, 3).map((decision) => (
                      <li key={decision.id}>
                        <strong>{decision.title}</strong>
                        <span>{decision.agent} · {decision.time}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </details>

        <p className="elder-disclaimer">{t('dashboard.disclaimer')} This information helps with planning and is not medical advice.</p>
      </div>
    </main>
  )
}
