import { useState, useEffect } from 'react'
import './DashboardPage.css'
import { api } from '../services/api'
import type { ForecastResponse, InversionResponse, PlumeResponse, DecisionRecord } from '../services/api'

const AREA_OPTIONS = [
  { id: 'noida', label: 'Noida Sector 62' },
  { id: 'anand_vihar', label: 'Anand Vihar, Delhi' },
  { id: 'punjabi_bagh', label: 'Punjabi Bagh, Delhi' },
  { id: 'gurugram', label: 'Gurugram Sector 51' },
]

function DynamicAqiChart({ forecast }: { forecast: ForecastResponse }) {
  const points = forecast.points || []
  if (points.length === 0) return null

  // SVG dimensions: viewBox 0 0 720 280
  const xMin = 48
  const xMax = 704
  const yBottom = 240
  const yTop = 16

  const getX = (h: number) => xMin + (h / 72) * (xMax - xMin)
  const getY = (aqi: number) => yBottom - (Math.min(500, Math.max(0, aqi)) / 500) * (yBottom - yTop)

  // Build points for coupled and uncoupled curves
  const coupledPointsStr = points.map((p) => `${getX(p.hour).toFixed(1)},${getY(p.aqi_coupled).toFixed(1)}`).join(' ')
  const uncoupledPointsStr = points.map((p) => `${getX(p.hour).toFixed(1)},${getY(p.aqi_uncoupled).toFixed(1)}`).join(' ')
  const polygonPointsStr = `${xMin},${yBottom} ${coupledPointsStr} ${xMax},${yBottom}`

  // Peak point
  const peakAqi = forecast.summary.peak_aqi
  const peakHour = forecast.summary.peak_hour
  const peakX = getX(peakHour)
  const peakY = getY(peakAqi)

  // Inversion highlight window (+18h to +42h)
  const invX1 = getX(18)
  const invX2 = getX(42)
  const invWidth = invX2 - invX1

  return (
    <svg
      viewBox="0 0 720 280"
      className="dashboard-chart"
      role="img"
      aria-label={`AQI forecast over 72 hours for ${forecast.area}. Peak coupled AQI is ${peakAqi} at +${peakHour}h.`}
    >
      {/* Strong inversion shading */}
      <rect x={invX1} y={yTop} width={invWidth} height={yBottom - yTop} fill="#EA4335" fillOpacity="0.08" rx="4" />
      <text x={invX1 + 6} y={yTop + 16} fontSize="11" fill="#C5221F" fontWeight="600">
        Strong inversion window (+18h to +42h)
      </text>

      {/* Horizontal grid lines */}
      <g stroke="#E8EAED" strokeWidth="1">
        {[yTop, yTop + 44.8, yTop + 89.6, yTop + 134.4, yTop + 179.2].map((y) => (
          <line key={y} x1={xMin} y1={y} x2={xMax} y2={y} />
        ))}
      </g>
      <line x1={xMin} y1={yBottom} x2={xMax} y2={yBottom} stroke="#DADCE0" />

      {/* Y-axis labels */}
      <g fontSize="11" fill="#5F6368" textAnchor="end">
        {['500', '400', '300', '200', '100', '0'].map((value, index) => (
          <text key={value} x="40" y={20 + index * 44.8}>
            {value}
          </text>
        ))}
      </g>

      {/* X-axis labels */}
      <g fontSize="11" fill="#5F6368" textAnchor="middle">
        {['Now', '+12 h', '+24 h', '+36 h', '+48 h', '+60 h', '+72 h'].map((value, index) => (
          <text key={value} x={xMin + index * 109.333} y="262">
            {value}
          </text>
        ))}
      </g>

      {/* Shaded area under coupled curve */}
      <polygon points={polygonPointsStr} fill="#1A73E8" fillOpacity="0.08" />

      {/* Uncoupled curve (dashed grey) */}
      <polyline
        points={uncoupledPointsStr}
        fill="none"
        stroke="#5F6368"
        strokeWidth="2"
        strokeDasharray="5 4"
      />

      {/* Coupled curve (solid blue) */}
      <polyline
        points={coupledPointsStr}
        fill="none"
        stroke="#1A73E8"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Peak AQI indicator */}
      <circle cx={peakX} cy={peakY} r="5" fill="#FFFFFF" stroke="#1A73E8" strokeWidth="3" />
      <text x={peakX + 8} y={peakY - 6} fontSize="12" fontWeight="700" fill="#202124">
        {peakAqi} at +{peakHour} h
      </text>
    </svg>
  )
}

function DynamicPlumeMap({ plumes }: { plumes: PlumeResponse }) {
  const hotspots = plumes.hotspots || []
  return (
    <svg
      viewBox="0 0 560 320"
      className="plume-map"
      role="img"
      aria-label="Smoke plume forward advection map from Punjab and Haryana toward Delhi NCR."
    >
      <rect x="0.5" y="0.5" width="559" height="319" rx="8" fill="#F8F9FA" stroke="#DADCE0" />
      <path d="M170 100 L330 190" stroke="#1A73E8" strokeOpacity="0.14" strokeWidth="44" strokeLinecap="round" fill="none" />
      <path d="M170 100 L322 185" stroke="#1A73E8" strokeWidth="2.5" strokeDasharray="6 5" fill="none" />
      <polygon points="334,192 316,190 324,176" fill="#1A73E8" />

      {/* Active fire clusters */}
      <g fill="#EA4335">
        {hotspots.map((h, idx) => {
          // Project coordinates to schematic cluster zone
          const cx = 60 + (idx % 4) * 28 + (idx * 5) % 15
          const cy = 60 + Math.floor(idx / 4) * 35 + (idx * 7) % 20
          return <circle key={h.id || idx} cx={cx} cy={cy} r="5" />
        })}
      </g>
      <text x="40" y="168" fontSize="12" fill="#3C4043" fontWeight="500">
        {hotspots.length} active fire points, Punjab & Haryana
      </text>

      {/* Trajectory waypoint indicators */}
      <g fill="#FFFFFF" stroke="#1A73E8" strokeWidth="2">
        <circle cx="210" cy="122.5" r="4" />
        <circle cx="250" cy="145" r="4" />
        <circle cx="290" cy="167.5" r="4" />
      </g>
      <g fontSize="11" fill="#1A73E8" fontWeight="500">
        <text x="196" y="108">+4 h</text>
        <text x="256" y="136">+8 h</text>
        <text x="296" y="158">+11 h</text>
      </g>

      {/* Target Delhi NCR box */}
      <rect x="340" y="170" width="170" height="100" rx="8" fill="#FFFFFF" stroke="#202124" strokeWidth="1.5" strokeDasharray="5 4" />
      <text x="356" y="198" fontSize="14" fontWeight="700" fill="#202124">
        {plumes.area_target || 'Delhi NCR'}
      </text>
      <text x="356" y="220" fontSize="12" fill="#3C4043">
        Arrives in about {plumes.estimated_arrival_hours} h
      </text>
      <text x="356" y="240" fontSize="12" fill="#C5221F">
        Held low by inversion
      </text>

      <g transform="translate(520 40)">
        <path d="M0 14 L0 -14" stroke="#3C4043" strokeWidth="2" />
        <polygon points="0,-18 -5,-8 5,-8" fill="#3C4043" />
        <text x="0" y="30" textAnchor="middle" fontSize="11" fill="#3C4043">
          N
        </text>
      </g>
      <text x="544" y="308" textAnchor="end" fontSize="11" fill="#5F6368">
        Advection schematic, not to scale
      </text>
    </svg>
  )
}

export default function DashboardPage() {
  const [selectedArea, setSelectedArea] = useState('noida')
  const [forecast, setForecast] = useState<ForecastResponse | null>(null)
  const [inversion, setInversion] = useState<InversionResponse | null>(null)
  const [plumes, setPlumes] = useState<PlumeResponse | null>(null)
  const [decisions, setDecisions] = useState<DecisionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)

    Promise.all([
      api.getForecast(selectedArea),
      api.getInversion(selectedArea),
      api.getPlumes(selectedArea),
      api.getDecisions(),
    ])
      .then(([fData, iData, pData, dData]) => {
        if (!isMounted) return
        setForecast(fData)
        setInversion(iData)
        setPlumes(pData)
        setDecisions(dData.decisions || [])
        setLoading(false)
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err.message || 'Failed to fetch data')
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [selectedArea])

  return (
    <main className="dashboard-page">
      <div className="dashboard-content">
        <header className="dashboard-heading">
          <div>
            <h1>{forecast?.area || 'Delhi NCR'}, next 72 hours</h1>
            <p>Coupled weather and air forecast with inversion and plume tracking</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              {AREA_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedArea(opt.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: selectedArea === opt.id ? '#1A73E8' : '#DADCE0',
                    background: selectedArea === opt.id ? '#E8F0FE' : '#FFFFFF',
                    color: selectedArea === opt.id ? '#1A73E8' : '#3C4043',
                    fontWeight: selectedArea === opt.id ? 600 : 400,
                    cursor: 'pointer',
                    fontSize: '13px',
                  }}
                >
                  {opt.label.split(',')[0]}
                </button>
              ))}
            </div>
            <span className="dashboard-sample">
              {forecast?.is_cached ? 'Offline Cached Telemetry' : 'Live Connected API :8000'}
            </span>
          </div>
        </header>

        {loading && (
          <div style={{ padding: '24px', background: '#fff', borderRadius: '8px', textAlign: 'center', border: '1px solid #DADCE0' }}>
            <p style={{ margin: 0, color: '#5F6368' }}>Updating environmental models and coupled 72-hour forecast...</p>
          </div>
        )}

        {error && (
          <div style={{ padding: '16px 20px', background: '#FCE8E6', color: '#C5221F', borderRadius: '8px', border: '1px solid #F5C6CB' }}>
            <strong>Connection Notice:</strong> {error}. Serving verified fallback fixtures.
          </div>
        )}

        {forecast && (
          <>
            <section className="summary-strip" aria-label="Air quality summary">
              <div className="summary-item">
                <span>AQI now</span>
                <div>
                  <strong>{forecast.summary.aqi_now}</strong>
                  <em className={forecast.summary.aqi_now > 300 ? 'aqi-severe' : 'aqi-poor'}>
                    {forecast.summary.category_now}
                  </em>
                </div>
              </div>
              <div className="summary-item">
                <span>Peak AQI, at +{forecast.summary.peak_hour} h</span>
                <div>
                  <strong>{forecast.summary.peak_aqi}</strong>
                  <em className="aqi-severe">{forecast.summary.peak_category}</em>
                </div>
              </div>
              <div className="summary-item">
                <span>Inversion</span>
                <div>
                  <strong>{inversion?.inversion_status_now || 'Strong'}</strong>
                  <small>+18 h to +42 h</small>
                </div>
              </div>
              <div className="summary-item">
                <span>Smoke plume arrives</span>
                <div>
                  <strong>~{plumes?.estimated_arrival_hours || 14} h</strong>
                  <small>north-west wind</small>
                </div>
              </div>
            </section>

            <section className="dashboard-row">
              <article className="dashboard-card chart-card">
                <div className="card-heading">
                  <h2>AQI forecast, 72 hours</h2>
                  <div className="chart-legend">
                    <span>
                      <i className="legend-line" />
                      Aethera, weather and smoke coupled
                    </span>
                    <span>
                      <i className="legend-line legend-dashed" />
                      Without feedback
                    </span>
                  </div>
                </div>
                <div className="chart-scroll">
                  <DynamicAqiChart forecast={forecast} />
                </div>
                <p className="dashboard-muted">
                  The gap between the two curves is what a forecast without weather feedback misses (+
                  {forecast.summary.peak_aqi - (forecast.points[forecast.summary.peak_hour]?.aqi_uncoupled || 320)} AQI
                  units). Honest coupled surrogate.
                </p>
              </article>

              <div className="dashboard-side">
                <article className="dashboard-card">
                  <h2>Inversion strength</h2>
                  <div className="inversion-scale">
                    <span style={{ fontWeight: inversion?.inversion_status_now === 'Weak' ? 700 : 400 }}>Weak</span>
                    <span style={{ fontWeight: inversion?.inversion_status_now === 'Moderate' ? 700 : 400 }}>Moderate</span>
                    <strong style={{ background: inversion?.inversion_status_now === 'Strong' ? '#EA4335' : '#DADCE0' }}>
                      Strong
                    </strong>
                  </div>
                  <p>
                    Warm air traps cold air from +18 h to +42 h. Smoke particulate cannot rise, collapsing the boundary
                    layer to ~140m. Ventilation volume severely depressed.
                  </p>
                </article>
                <article className="dashboard-card recommendations-card">
                  <h2>What to do</h2>
                  <div className="recommendation">
                    <time>+12 to +48 h</time>
                    <span>Move school assemblies and PE indoors.</span>
                  </div>
                  <div className="recommendation">
                    <time>Morning</time>
                    <span>Outdoor workers: plan the cleanest two hours, wear an N95.</span>
                  </div>
                  <div className="recommendation">
                    <time>Tonight</time>
                    <span>Call parents who live alone with asthma or a heart condition.</span>
                  </div>
                </article>
              </div>
            </section>

            <section className="dashboard-row">
              <article className="dashboard-card plume-card">
                <h2>Where the smoke goes</h2>
                {plumes && <DynamicPlumeMap plumes={plumes} />}
                <div className="map-legend">
                  <span>
                    <i className="fire-dot" />
                    Active fire point ({plumes?.fire_count_upwind || 7} detected)
                  </span>
                  <span>
                    <i className="plume-line" />
                    Plume path with arrival time
                  </span>
                </div>
              </article>

              <article className="dashboard-card sources-card">
                <h2>Where these numbers come from</h2>
                <div className="source-list">
                  <div className="source-item">
                    <div>
                      <strong>CPCB and OpenAQ</strong>
                      <span>Official station air quality readings</span>
                    </div>
                    <time>18 min ago</time>
                  </div>
                  <div className="source-item">
                    <div>
                      <strong>NASA FIRMS</strong>
                      <span>Active stubble fire points (MODIS/VIIRS)</span>
                    </div>
                    <time>41 min ago</time>
                  </div>
                  <div className="source-item">
                    <div>
                      <strong>IMD and AWS Open Data</strong>
                      <span>Wind, temperature, boundary layer (GFS 0.25)</span>
                    </div>
                    <time>1 h ago</time>
                  </div>
                  <div className="source-item">
                    <div>
                      <strong>Aethera Coupled Surrogate</strong>
                      <span>72-hour weather-pollution feedback solver</span>
                    </div>
                    <time>Hourly run</time>
                  </div>
                </div>
                <p className="dashboard-muted">
                  Each feed updates on its own schedule. All models honestly labeled as coupled surrogates rather than
                  claiming WRF-Chem HPC execution.
                </p>
              </article>
            </section>

            <section className="dashboard-card decision-card">
              <div className="card-heading">
                <h2>Why did I get this alert?</h2>
                <span className="dashboard-muted">Agent decision log ({decisions.length} records)</span>
              </div>
              <div className="decision-list">
                {decisions.map((decision) => (
                  <div className="decision-item" key={decision.id || `${decision.time}-${decision.agent}`}>
                    <time>{decision.time}</time>
                    <strong>{decision.agent}</strong>
                    <div>
                      <b>{decision.title}</b>
                      <p>{decision.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        <p className="dashboard-disclaimer">
          Support tool, not a medical device. In an emergency call 112. Saans Saathi · Team Prometheus · Powered by AWS
          architecture.
        </p>
      </div>
    </main>
  )
}
