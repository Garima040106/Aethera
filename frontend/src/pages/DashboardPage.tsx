import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRightIcon,
  HeartPulseIcon,
  MapPinIcon,
  RouteIcon,
  ShieldAlertIcon,
  WindIcon,
} from '../components/Icons'
import DashboardAirMapRoute from '../components/DashboardAirMapRoute'
import { api } from '../services/api'
import type { ForecastResponse } from '../services/api'
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

export default function DashboardPage() {
  const { t } = useTranslation()
  const [selectedArea, setSelectedArea] = useState('noida')
  const [forecast, setForecast] = useState<ForecastResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshCount, setRefreshCount] = useState(0)
  const [showFamilyForm, setShowFamilyForm] = useState(false)
  const [familyName, setFamilyName] = useState('')
  const [familyContact, setFamilyContact] = useState('')
  const [familyMembers, setFamilyMembers] = useState<string[]>(['Rohan', 'Priya', 'Amit'])
  const [alertStatus, setAlertStatus] = useState<string | null>(null)
  const user = getDemoUser()

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const forecastData = await api.getForecast(selectedArea)
        if (!isMounted) return
        setForecast(forecastData)
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
  const greenWindows = forecast?.points
    .filter((point) => point.aqi_coupled <= 100)
    .slice(0, 3)
    .map((point) => new Date(point.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })) ?? []

  function addFamilyMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!familyName.trim() || !familyContact.trim()) return
    setFamilyMembers((members) => [...members, familyName.trim()])
    setFamilyName('')
    setFamilyContact('')
    setShowFamilyForm(false)
    setAlertStatus(`${familyName.trim()} was added to your alert circle.`)
  }

  return (
    <main className="elder-dashboard min-w-0 overflow-y-auto px-4 py-6 sm:px-7 sm:py-8 lg:px-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 pb-10 sm:gap-8">
        <header className="elder-dashboard-header">
          <div>
            <p className="elder-eyebrow">Your personal air dashboard</p>
            <h1 className="mt-2">Good day, {firstName}.</h1>
            <p className="mt-2 text-lg leading-7 text-[#62635c]">See today’s air, plan your day, and stay connected to the people you trust.</p>
          </div>
          <label className="elder-location-picker">
            <span><MapPinIcon size={20} /> I am checking</span>
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
            <p className="elder-eyebrow">If you need a hand</p>
            <h2 id="quick-actions-heading">Quick help</h2>
          </div>
          <div className="elder-action-grid">
            <Link to="/check-in" className="elder-action-card elder-action-card-sage">
              <span className="elder-action-icon"><HeartPulseIcon size={27} /></span>
              <span><strong>Check how I feel</strong><small>Talk through how you are feeling</small></span>
              <ArrowRightIcon size={21} />
            </Link>
            <Link to="/alerts" className="elder-action-card elder-action-card-sand">
              <span className="elder-action-icon"><ShieldAlertIcon size={27} /></span>
              <span><strong>Contact my care circle</strong><small>Reach someone you trust</small></span>
              <ArrowRightIcon size={21} />
            </Link>
            <Link to="/plan-outing" className="elder-action-card elder-action-card-sky">
              <span className="elder-action-icon"><RouteIcon size={27} /></span>
              <span><strong>Plan a route</strong><small>Find a more comfortable way out</small></span>
              <ArrowRightIcon size={21} />
            </Link>
            <button type="button" className="elder-action-card elder-action-card-family" onClick={() => setShowFamilyForm(true)}>
              <span className="elder-action-icon"><span className="elder-plus-icon" aria-hidden="true">+</span></span>
              <span><strong>Add family or friend</strong><small>Choose who should receive alerts</small></span>
              <ArrowRightIcon size={21} />
            </button>
          </div>
        </section>

        <section className="elder-corridor-card" aria-labelledby="green-corridors-heading">
          <div className="elder-corridor-heading">
            <div>
              <p className="elder-eyebrow">Plan ahead</p>
              <h2 id="green-corridors-heading">Better times to go out</h2>
            </div>
            <span className="elder-corridor-badge">Next 72 hours</span>
          </div>
          <p className="elder-corridor-copy">These are the clearest forecast hours for your area. Check again before leaving.</p>
          <div className="elder-corridor-times">
            {(greenWindows.length > 0 ? greenWindows : ['Checking now']).map((time) => (
              <span key={time}>{time}</span>
            ))}
          </div>
        </section>

        <DashboardAirMapRoute />

        {familyMembers.length > 0 && (
          <section className="elder-family-card" aria-label="Alert circle">
            <div>
              <p className="elder-eyebrow">My alert circle</p>
              <p className="elder-family-names">{familyMembers.join(', ')}</p>
            </div>
            <button type="button" onClick={() => setAlertStatus('Your alert circle has been notified.')}>Send an air alert</button>
          </section>
        )}

        {alertStatus && <p className="elder-alert-status" role="status">{alertStatus}</p>}

        <section className="elder-simple-note" aria-label="Helpful reminder">
          <span className="elder-simple-note-mark" aria-hidden="true">✓</span>
          <div>
            <strong>That is all you need for now.</strong>
            <p>Check again before you go out. The air can change during the day.</p>
          </div>
        </section>

        <p className="elder-disclaimer">{t('dashboard.disclaimer')} This is guidance for planning, not medical advice.</p>
      </div>
      {showFamilyForm && (
        <div className="elder-modal-backdrop" role="presentation" onClick={() => setShowFamilyForm(false)}>
          <section className="elder-family-modal" role="dialog" aria-modal="true" aria-labelledby="family-modal-title" onClick={(event) => event.stopPropagation()}>
            <p className="elder-eyebrow">Your alert circle</p>
            <h2 id="family-modal-title">Add someone you trust</h2>
            <p>They can receive a simple air-quality alert from you.</p>
            <form onSubmit={addFamilyMember}>
              <label>Name<input value={familyName} onChange={(event) => setFamilyName(event.target.value)} autoFocus required /></label>
              <label>Phone or email<input value={familyContact} onChange={(event) => setFamilyContact(event.target.value)} required /></label>
              <div className="elder-modal-actions">
                <button type="button" onClick={() => setShowFamilyForm(false)}>Cancel</button>
                <button type="submit">Add to my circle</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}
