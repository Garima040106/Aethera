import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../services/api'
import type { DecisionRecord, ForecastResponse, InversionResponse, PlumeResponse } from '../services/api'

const AREA_OPTIONS = [
  { id: 'noida', label: 'Noida Sector 62' },
  { id: 'anand_vihar', label: 'Anand Vihar, Delhi' },
  { id: 'punjabi_bagh', label: 'Punjabi Bagh, Delhi' },
  { id: 'gurugram', label: 'Gurugram Sector 51' },
]

function ForecastChart({ forecast }: { forecast: ForecastResponse }) {
  const points = forecast.points ?? []
  if (points.length === 0) return <p className="p-6 text-sm text-[#78847d]">Forecast points are not available.</p>

  const chartPoints = points.map((point) => {
    const x = 42 + (point.hour / 72) * 638
    const y = 230 - (Math.min(500, Math.max(0, point.aqi_coupled)) / 500) * 190
    return `${x},${y}`
  }).join(' ')
  const comparisonPoints = points.map((point) => {
    const x = 42 + (point.hour / 72) * 638
    const y = 230 - (Math.min(500, Math.max(0, point.aqi_uncoupled)) / 500) * 190
    return `${x},${y}`
  }).join(' ')

  return (
    <svg viewBox="0 0 700 270" className="block h-auto min-w-[520px] w-full" role="img" aria-label={`72-hour AQI forecast for ${forecast.area}`}>
      {[40, 88, 136, 184, 230].map((y) => <line key={y} x1="42" y1={y} x2="680" y2={y} stroke="#edf1ee" />)}
      <rect x="201.5" y="40" width="213" height="190" rx="5" fill="#f7e9cc" fillOpacity=".65" />
      <text x="208" y="56" fontSize="10" fill="#996600">Elevated inversion window</text>
      <polyline points={comparisonPoints} fill="none" stroke="#9aa69e" strokeWidth="2" strokeDasharray="5 5" />
      <polyline points={chartPoints} fill="none" stroke="#2878e5" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      <g fill="#78847d" fontSize="10" textAnchor="middle">
        {['Now', '+12 h', '+24 h', '+36 h', '+48 h', '+60 h', '+72 h'].map((label, index) => (
          <text key={label} x={42 + index * 106.3} y="252">{label}</text>
        ))}
      </g>
      <g fill="#87938b" fontSize="10" textAnchor="end">
        {['500', '400', '300', '200', '100'].map((label, index) => (
          <text key={label} x="34" y={44 + index * 48}>{label}</text>
        ))}
      </g>
    </svg>
  )
}

function PlumeGraphic({ plumes }: { plumes: PlumeResponse }) {
  const dots = plumes.hotspots ?? []
  return (
    <svg viewBox="0 0 560 220" className="block h-auto w-full" role="img" aria-label="Illustrative smoke movement toward Delhi NCR">
      <rect width="560" height="220" rx="12" fill="#f3f7f3" />
      <path d="M95 55 C175 65 212 116 297 122 S393 102 475 151" fill="none" stroke="#d99a16" strokeWidth="34" strokeOpacity=".14" strokeLinecap="round" />
      <path d="M95 55 C175 65 212 116 297 122 S393 102 475 151" fill="none" stroke="#2878e5" strokeWidth="2.5" strokeDasharray="7 6" />
      {dots.slice(0, 10).map((dot, index) => (
        <circle key={dot.id || index} cx={70 + (index % 4) * 24} cy={48 + Math.floor(index / 4) * 24} r="4" fill="#d95b35" />
      ))}
      <circle cx="475" cy="151" r="9" fill="#174d35" stroke="white" strokeWidth="4" />
      <text x="58" y="157" fill="#647168" fontSize="11">Punjab &amp; Haryana</text>
      <text x="414" y="180" fill="#174d35" fontSize="12" fontWeight="700">{plumes.area_target || 'Delhi NCR'}</text>
      <text x="414" y="197" fill="#647168" fontSize="10">Estimated arrival ~{plumes.estimated_arrival_hours} h</text>
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        setError(reason instanceof Error ? reason.message : 'Could not load forecast data')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    void load()
    return () => { isMounted = false }
  }, [selectedArea])

  const peak = forecast?.summary
  const decisionRows = decisions.length > 0 ? decisions.slice(0, 4) : [
    { id: 'station', time: '18 min ago', agent: 'CPCB + OpenAQ', title: 'Station observations', detail: 'Official air-quality readings for local monitoring.' },
    { id: 'fire', time: '41 min ago', agent: 'NASA FIRMS', title: 'Upwind fire activity', detail: 'Active fire points from MODIS and VIIRS observations.' },
    { id: 'model', time: 'Hourly', agent: 'Aethera model', title: 'Coupled 72-hour forecast', detail: 'Weather and pollution feedback surrogate; not a WRF-Chem run.' },
  ]

  return (
    <main className="min-w-0 overflow-y-auto bg-[#f5f8f5] px-4 py-6 sm:px-7 lg:px-9">
      <div className="mx-auto flex max-w-[1450px] flex-col gap-5 pb-8">
        <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#548066]">Environmental overview</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-.045em] text-[#17231c]">{forecast?.area || t('dashboard.title')}</h1>
            <p className="mt-1 text-sm text-[#718077]">{t('dashboard.subtitle')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {AREA_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedArea(option.id)}
                aria-pressed={selectedArea === option.id}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                  selectedArea === option.id ? 'border-[#174d35] bg-[#174d35] text-white' : 'border-[#dce5de] bg-white text-[#526158] hover:border-[#9cbaa5]'
                }`}
              >
                {option.label.split(',')[0]}
              </button>
            ))}
            <span className="rounded-full bg-[#e8f4ec] px-3 py-2 text-xs font-medium text-[#246b49]">
              {forecast?.is_cached ? t('dashboard.offlineCached') : t('dashboard.liveApi')}
            </span>
          </div>
        </header>

        {loading && <div role="status" className="rounded-xl border border-[#dce5de] bg-white px-5 py-4 text-sm text-[#647168]">{t('dashboard.updatingForecast')}</div>}
        {error && <div role="alert" className="rounded-xl border border-[#f0c8c2] bg-[#fff1ef] px-5 py-4 text-sm text-[#a33a2d]"><strong>{t('dashboard.connectionNotice')}:</strong> {error}. {t('dashboard.servingFallback')}</div>}

        {forecast && (
          <>
            <section aria-label="Air quality summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: t('dashboard.aqiNow'), value: peak?.aqi_now, note: peak?.category_now, color: '#d95b35' },
                { label: `Peak AQI · +${peak?.peak_hour} h`, value: peak?.peak_aqi, note: peak?.peak_category, color: '#c83245' },
                { label: t('dashboard.inversionStrength'), value: inversion?.inversion_status_now || 'Strong', note: inversion?.peak_inversion_window || '+18 h to +42 h', color: '#d99a16' },
                { label: t('dashboard.plumeForecast'), value: `~${plumes?.estimated_arrival_hours || 14} h`, note: 'north-west wind', color: '#246b49' },
              ].map((metric) => (
                <article key={metric.label} className="rounded-2xl border border-[#e1e9e3] bg-white p-5 shadow-[0_2px_12px_rgba(23,35,28,.04)]">
                  <p className="text-xs font-medium text-[#78847d]">{metric.label}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-[-.04em]" style={{ color: metric.color }}>{metric.value}</p>
                  <p className="mt-1 text-xs text-[#78847d]">{metric.note}</p>
                </article>
              ))}
            </section>

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(290px,.8fr)]">
              <article className="min-w-0 rounded-2xl border border-[#e1e9e3] bg-white p-5 shadow-[0_2px_12px_rgba(23,35,28,.04)] sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#7b8b81]">Next 72 hours</p>
                    <h2 className="mt-1 text-lg font-semibold text-[#17231c]">{t('dashboard.aqiForecast')}</h2>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#647168]">
                    <span className="inline-flex items-center gap-2"><i className="h-0.5 w-5 rounded bg-[#2878e5]" /> Weather + smoke</span>
                    <span className="inline-flex items-center gap-2"><i className="w-5 border-t-2 border-dashed border-[#839087]" /> Without feedback</span>
                  </div>
                </div>
                <div className="mt-5 overflow-x-auto"><ForecastChart forecast={forecast} /></div>
                <p className="mt-3 text-xs leading-5 text-[#78847d]">
                  Coupled surrogate compared with an outlook without weather feedback. At the peak, the difference is{' '}
                  {peak!.peak_aqi - (forecast.points[peak!.peak_hour]?.aqi_uncoupled || 320)} AQI units.
                </p>
              </article>

              <div className="flex flex-col gap-4">
                <article className="rounded-2xl border border-[#e1e9e3] bg-white p-5 shadow-[0_2px_12px_rgba(23,35,28,.04)]">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#7b8b81]">Atmospheric conditions</p>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-[#17231c]">{t('dashboard.inversionStrength')}</h2>
                    <span className="rounded-full bg-[#f7e9cc] px-3 py-1 text-xs font-semibold text-[#996600]">{inversion?.inversion_status_now || 'Strong'}</span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[#647168]">Warm air can hold pollution near the surface during the forecast inversion window and reduce ventilation.</p>
                  <div className="mt-4 flex gap-1.5" aria-label={`Current inversion: ${inversion?.inversion_status_now || 'Strong'}`}>
                    {['Weak', 'Moderate', 'Strong'].map((level, index) => (
                      <span key={level} className={`h-2 flex-1 rounded-full ${
                        ['Weak', 'Moderate', 'Strong'].indexOf(inversion?.inversion_status_now || 'Strong') >= index ? 'bg-[#d99a16]' : 'bg-[#e9efea]'
                      }`} />
                    ))}
                  </div>
                </article>
                <article className="rounded-2xl bg-[#174d35] p-5 text-white shadow-[0_8px_24px_rgba(23,77,53,.14)]">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/65">Suggested actions</p>
                  <ul className="mt-3 space-y-3 text-sm leading-5">
                    <li className="flex gap-2"><span className="text-[#9bd2a9]">•</span><span>Move outdoor school activities indoors during the peak window.</span></li>
                    <li className="flex gap-2"><span className="text-[#9bd2a9]">•</span><span>Plan outdoor work for cleaner hours and use a well-fitting mask.</span></li>
                    <li className="flex gap-2"><span className="text-[#9bd2a9]">•</span><span>Check on family members who may be more affected by poor air.</span></li>
                  </ul>
                </article>
              </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
              <article className="rounded-2xl border border-[#e1e9e3] bg-white p-5 shadow-[0_2px_12px_rgba(23,35,28,.04)] sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div><p className="text-xs font-semibold uppercase tracking-wider text-[#7b8b81]">Upwind activity</p><h2 className="mt-1 text-lg font-semibold text-[#17231c]">Smoke movement</h2></div>
                  <span className="rounded-full bg-[#e3eefb] px-3 py-1 text-xs font-semibold text-[#2878e5]">{plumes?.fire_count_upwind || 7} hotspots</span>
                </div>
                <div className="mt-4 overflow-hidden rounded-xl border border-[#e5ece7] bg-[#f7f9f7]">{plumes && <PlumeGraphic plumes={plumes} />}</div>
                <p className="mt-3 text-xs text-[#78847d]">Illustrative plume trajectory; not a street-level map.</p>
              </article>

              <article className="rounded-2xl border border-[#e1e9e3] bg-white p-5 shadow-[0_2px_12px_rgba(23,35,28,.04)] sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div><p className="text-xs font-semibold uppercase tracking-wider text-[#7b8b81]">Data and decisions</p><h2 className="mt-1 text-lg font-semibold text-[#17231c]">{t('dashboard.decisionLog')}</h2></div>
                  <span className="rounded-full bg-[#f0f4f1] px-3 py-1 text-xs font-medium text-[#647168]">{decisions.length} records</span>
                </div>
                <div className="mt-4 divide-y divide-[#edf1ee]">
                  {decisionRows.map((record) => (
                    <div key={record.id || `${record.time}-${record.agent}`} className="grid grid-cols-[72px_1fr] gap-3 py-3 first:pt-1">
                      <time className="pt-0.5 text-[11px] text-[#87938b]">{record.time}</time>
                      <div>
                        <p className="text-xs font-semibold text-[#246b49]">{record.agent}</p>
                        <p className="mt-1 text-sm font-medium text-[#27382e]">{record.title}</p>
                        <p className="mt-1 text-xs leading-5 text-[#78847d]">{record.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          </>
        )}

        <p className="text-xs leading-5 text-[#87938b]">{t('dashboard.disclaimer')}</p>
      </div>
    </main>
  )
}
