
import './DashboardPage.css'

const decisions = [
  {
    time: '22:00',
    agent: 'Air Watcher',
    title: 'Raised Delhi NCR risk to High.',
    detail: 'A strong inversion is forecast from +18 h and fire points are upwind.',
  },
  {
    time: '05:30',
    agent: 'Health Guardian',
    title: 'Chose "stay in, light walk indoors" for Kamla.',
    detail: 'Her breathing risk is medium and outside air is very poor. The advice comes from the safe advice list.',
  },
  {
    time: '06:00',
    agent: 'Care Circle',
    title: 'Sent the Hindi morning message to Kamla.',
    detail: 'Her language setting is Hindi.',
  },
  {
    time: '10:12',
    agent: 'Health Guardian',
    title: 'Asked "Are you ok?".',
    detail: 'On her phone, breathing rate rose and blood oxygen dropped from her usual range.',
  },
  {
    time: '10:14',
    agent: 'Care Circle',
    title: 'Messaged Rohan.',
    detail: 'No reply for two minutes. Only the risk level was shared, which is what Kamla allowed.',
  },
]

const sources = [
  ['CPCB and OpenAQ', 'Air quality readings', '18 min ago'],
  ['NASA FIRMS', 'Active fire points', '41 min ago'],
  ['IMD and AWS Open Data', 'Wind, temperature, boundary layer', '1 h ago'],
  ['Aethera model', '72-hour coupled forecast', 'Hourly run'],
]

function AqiChart() {
  return (
    <svg
      viewBox="0 0 720 280"
      className="dashboard-chart"
      role="img"
      aria-label="Sample AQI forecast over 72 hours. The coupled forecast peaks at 436 at 30 hours."
    >
      <rect x="212" y="16" width="218.7" height="224" fill="#EA4335" fillOpacity="0.07" />
      <text x="218" y="32" fontSize="11" fill="#C5221F">Strong inversion</text>
      <g stroke="#E8EAED" strokeWidth="1">
        {[16, 60.8, 105.6, 150.4, 195.2].map((y) => (
          <line key={y} x1="48" y1={y} x2="704" y2={y} />
        ))}
      </g>
      <line x1="48" y1="240" x2="704" y2="240" stroke="#DADCE0" />
      <g fontSize="11" fill="#5F6368" textAnchor="end">
        {['500', '400', '300', '200', '100', '0'].map((value, index) => (
          <text key={value} x="40" y={20 + index * 44.8}>{value}</text>
        ))}
      </g>
      <g fontSize="11" fill="#5F6368" textAnchor="middle">
        {['Now', '+12 h', '+24 h', '+36 h', '+48 h', '+60 h', '+72 h'].map((value, index) => (
          <text key={value} x={48 + index * 109.333} y="262">{value}</text>
        ))}
      </g>
      <polygon
        points="48,240 48,145.9 102.7,133.4 157.3,121.3 212,95.8 266.7,66.2 321.3,44.7 376,55.4 430.7,73.8 485.3,90.4 540,107.4 594.7,122.6 649.3,132 704,139.2 704,240"
        fill="#1A73E8"
        fillOpacity="0.08"
      />
      <polyline
        points="48,148.2 102.7,140.6 157.3,134.3 212,122.6 266.7,106.5 321.3,91.7 376,96.6 430.7,105.6 485.3,114.6 540,122.6 594.7,130.7 649.3,136.1 704,140.6"
        fill="none"
        stroke="#5F6368"
        strokeWidth="2"
        strokeDasharray="5 4"
      />
      <polyline
        points="48,145.9 102.7,133.4 157.3,121.3 212,95.8 266.7,66.2 321.3,44.7 376,55.4 430.7,73.8 485.3,90.4 540,107.4 594.7,122.6 649.3,132 704,139.2"
        fill="none"
        stroke="#1A73E8"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx="321.3" cy="44.7" r="5" fill="#FFFFFF" stroke="#1A73E8" strokeWidth="3" />
      <text x="332" y="40" fontSize="12" fontWeight="700" fill="#202124">436 at +30 h</text>
    </svg>
  )
}

function PlumeMap() {
  return (
    <svg
      viewBox="0 0 560 320"
      className="plume-map"
      role="img"
      aria-label="Schematic smoke plume map from Punjab and Haryana toward Delhi NCR."
    >
      <rect x="0.5" y="0.5" width="559" height="319" rx="8" fill="#F8F9FA" stroke="#DADCE0" />
      <path d="M170 100 L330 190" stroke="#1A73E8" strokeOpacity="0.14" strokeWidth="44" strokeLinecap="round" fill="none" />
      <path d="M170 100 L322 185" stroke="#1A73E8" strokeWidth="2.5" strokeDasharray="6 5" fill="none" />
      <polygon points="334,192 316,190 324,176" fill="#1A73E8" />
      <g fill="#EA4335">
        {[[60, 70], [95, 48], [110, 92], [145, 62], [85, 115], [150, 105], [125, 130]].map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5" />
        ))}
      </g>
      <text x="40" y="168" fontSize="12" fill="#3C4043">Fire points, Punjab and Haryana</text>
      <g fill="#FFFFFF" stroke="#1A73E8" strokeWidth="2">
        <circle cx="210" cy="122.5" r="4" />
        <circle cx="250" cy="145" r="4" />
        <circle cx="290" cy="167.5" r="4" />
      </g>
      <g fontSize="11" fill="#1A73E8">
        <text x="196" y="108">+4 h</text>
        <text x="256" y="136">+8 h</text>
        <text x="296" y="158">+11 h</text>
      </g>
      <rect x="340" y="170" width="170" height="100" rx="8" fill="#FFFFFF" stroke="#202124" strokeWidth="1.5" strokeDasharray="5 4" />
      <text x="356" y="198" fontSize="14" fontWeight="700" fill="#202124">Delhi NCR</text>
      <text x="356" y="220" fontSize="12" fill="#3C4043">Arrives in about 14 h</text>
      <text x="356" y="240" fontSize="12" fill="#C5221F">Held low by inversion</text>
      <g transform="translate(520 40)">
        <path d="M0 14 L0 -14" stroke="#3C4043" strokeWidth="2" />
        <polygon points="0,-18 -5,-8 5,-8" fill="#3C4043" />
        <text x="0" y="30" textAnchor="middle" fontSize="11" fill="#3C4043">N</text>
      </g>
      <text x="544" y="308" textAnchor="end" fontSize="11" fill="#5F6368">Schematic, not to scale</text>
    </svg>
  )
}

export default function DashboardPage() {
  return (
    <main className="dashboard-page">
      <div className="dashboard-content">
        <header className="dashboard-heading">
          <div>
            <h1>Delhi NCR, next 72 hours</h1>
            <p>Coupled weather and air forecast with inversion and plume tracking</p>
          </div>
          <span className="dashboard-sample">Sample data for the design preview</span>
        </header>

        <section className="summary-strip" aria-label="Air quality summary">
          <div className="summary-item">
            <span>AQI now</span>
            <div><strong>210</strong><em className="aqi-poor">Poor</em></div>
          </div>
          <div className="summary-item">
            <span>Peak AQI, at +30 h</span>
            <div><strong>436</strong><em className="aqi-severe">Severe</em></div>
          </div>
          <div className="summary-item">
            <span>Inversion</span>
            <div><strong>Strong</strong><small>+18 h to +42 h</small></div>
          </div>
          <div className="summary-item">
            <span>Smoke plume arrives</span>
            <div><strong>~14 h</strong><small>north-west wind</small></div>
          </div>
        </section>

        <section className="dashboard-row">
          <article className="dashboard-card chart-card">
            <div className="card-heading">
              <h2>AQI forecast, 72 hours</h2>
              <div className="chart-legend">
                <span><i className="legend-line" />Aethera, weather and smoke coupled</span>
                <span><i className="legend-line legend-dashed" />Without feedback</span>
              </div>
            </div>
            <div className="chart-scroll"><AqiChart /></div>
            <p className="dashboard-muted">
              The gap between the two lines is what a forecast without weather feedback would miss. Sample values.
            </p>
          </article>

          <div className="dashboard-side">
            <article className="dashboard-card">
              <h2>Inversion strength</h2>
              <div className="inversion-scale">
                <span>Weak</span><span>Moderate</span><strong>Strong</strong>
              </div>
              <p>Warm air sits over cold air from +18 h to +42 h. Smoke cannot rise, so it stays near the ground. Boundary layer height is low.</p>
            </article>
            <article className="dashboard-card recommendations-card">
              <h2>What to do</h2>
              <div className="recommendation"><time>+12 to +48 h</time><span>Move school assemblies and PE indoors.</span></div>
              <div className="recommendation"><time>Morning</time><span>Outdoor workers: plan the cleanest two hours, wear an N95.</span></div>
              <div className="recommendation"><time>Tonight</time><span>Call parents who live alone with asthma or a heart condition.</span></div>
            </article>
          </div>
        </section>

        <section className="dashboard-row">
          <article className="dashboard-card plume-card">
            <h2>Where the smoke goes</h2>
            <PlumeMap />
            <div className="map-legend">
              <span><i className="fire-dot" />Active fire point</span>
              <span><i className="plume-line" />Plume path with arrival time</span>
            </div>
          </article>

          <article className="dashboard-card sources-card">
            <h2>Where these numbers come from</h2>
            <div className="source-list">
              {sources.map(([name, description, age]) => (
                <div className="source-item" key={name}>
                  <div><strong>{name}</strong><span>{description}</span></div>
                  <time>{age}</time>
                </div>
              ))}
            </div>
            <p className="dashboard-muted">
              Each feed updates on its own schedule, so a station reading and a satellite pass are not the same age. The ages above are samples.
            </p>
          </article>
        </section>

        <section className="dashboard-card decision-card">
          <div className="card-heading">
            <h2>Why did I get this alert?</h2>
            <span className="dashboard-muted">Agent decision log, sample</span>
          </div>
          <div className="decision-list">
            {decisions.map((decision) => (
              <div className="decision-item" key={`${decision.time}-${decision.agent}`}>
                <time>{decision.time}</time>
                <strong>{decision.agent}</strong>
                <div><b>{decision.title}</b><p>{decision.detail}</p></div>
              </div>
            ))}
          </div>
        </section>

        <p className="dashboard-disclaimer">
          Support tool, not a medical device. In an emergency call 112. Aethera · Team Prometheus · Powered by AWS architecture.
        </p>
      </div>
    </main>
  )
}
