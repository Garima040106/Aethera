
import { NavLink } from 'react-router-dom'

function AetheraMark() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
      <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
      <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

export function Header() {
  return (
    <header className="site-header">
      <nav className="nav container" aria-label="Main navigation">
        <NavLink className="brand" to="/" aria-label="Aethera home">
          <span className="brand-icon">
            <AetheraMark />
          </span>
          <span>Aethera</span>
        </NavLink>

        <div className="nav-links">
          <NavLink to="/dashboard">Forecast</NavLink>
          <NavLink to="/companion">Companion</NavLink>
          <NavLink to="/caregiver">Care circle</NavLink>
          <NavLink
            to="/dashboard"
            className="button button-primary nav-cta"
          >
            Open dashboard
          </NavLink>
        </div>
      </nav>
    </header>
  )
}

function ForecastPreview() {
  return (
    <article className="preview-card">
      <div className="preview-heading">
        <strong>Tomorrow, 6:00 AM</strong>
        <span className="sample-badge">Sample data</span>
      </div>

      <div className="metric-grid">
        <div className="metric-tile">
          <span className="muted">Inversion</span>
          <strong className="status-danger">Strong</strong>
        </div>
        <div className="metric-tile">
          <span className="muted">Smoke reaches NCR in</span>
          <strong>about 14 h</strong>
        </div>
      </div>

      <div className="message-card">
        <span className="muted">Message to Kamla</span>
        <p className="message-hindi" lang="hi">
          माँ, आज सुबह बाहर टहलने न जाएँ। हवा बहुत खराब है। घर के अंदर हल्का टहल लें।
        </p>
        <p className="message-translation">
          Today, skip the walk outside. The air is very bad. A light walk
          indoors is better.
        </p>
      </div>

      <div className="privacy-note">
        <LockIcon />
        <span>Her health readings stay on her phone.</span>
      </div>
    </article>
  )
}

function Hero() {
  return (
    <section className="hero container" id="home">
      <div className="hero-copy">
        <span className="eyebrow">DELHI NCR · AIR AND HEALTH</span>

        <h1>See the bad air coming. Look after the people breathing it.</h1>

        <p className="hero-description">
          Aethera forecasts Delhi NCR air quality for the next 72 hours, with
          weather and smoke affecting each other. Then it watches over the
          people most at risk, on their own phone, and tells their family when
          it matters.
        </p>

        <div className="hero-actions">
          <NavLink className="button button-primary" to="/dashboard">
            Open the dashboard
          </NavLink>
          <NavLink className="button button-secondary" to="/companion">
            See the phone app
          </NavLink>
        </div>

        <p className="disclaimer">
          Support tool, not a medical device. In an emergency call 112.
        </p>
      </div>

      <div className="hero-visual">
        <ForecastPreview />
      </div>
    </section>
  )
}

function FeedbackDiagram() {
  return (
    <div
      className="feedback-diagram"
      role="img"
      aria-label="Weather and smoke influence each other in the 72-hour forecast"
    >
      <div className="diagram-box">
        <strong>Weather</strong>
        <span>Temperature</span>
        <span>Wind</span>
        <span>Boundary layer height</span>
      </div>

      <div className="diagram-arrows" aria-hidden="true">
        <span>traps →</span>
        <span>← alters</span>
      </div>

      <div className="diagram-box">
        <strong>Smoke</strong>
        <span>PM2.5 and PM10</span>
        <span>Ozone</span>
        <span>NOx</span>
      </div>

      <div className="diagram-caption">
        <span>Each hour, for 72 hours</span>
        <div className="diagram-result">
          <strong>AQI forecast for Delhi NCR</strong>
          <span>With inversion strength and plume arrival time</span>
        </div>
      </div>
    </div>
  )
}

function ForecastSection() {
  return (
    <section className="feature-section section-muted" id="forecast">
      <div className="container feature-grid">
        <div className="feature-copy">
          <span className="eyebrow">THE FORECAST</span>
          <h2>Weather and smoke change each other. The forecast should too.</h2>
          <p>
            When smoke from stubble burning gets trapped near the ground by an
            inversion, it blocks sunlight, cools the surface and slows the wind,
            which traps more smoke. Aethera steps weather and pollution forward
            together, hour by hour, for 72 hours.
          </p>
          <p>
            The dashboard shows inversion strength, the path of each fire plume
            and when it arrives, with the source and age of every number.
          </p>
          <NavLink className="text-link" to="/dashboard">
            Explore the forecast <span aria-hidden="true">→</span>
          </NavLink>
        </div>

        <div className="feature-visual">
          <FeedbackDiagram />
        </div>
      </div>
    </section>
  )
}

function RiskPreview() {
  const risks = [
    { label: 'Heat', score: 24, level: 'Low', color: 'green' },
    { label: 'Breathing', score: 78, level: 'High', color: 'red' },
    { label: 'Heart', score: 46, level: 'Medium', color: 'amber' },
  ]

  return (
    <article className="risk-card">
      <div className="preview-heading">
        <strong>Today's risk</strong>
        <span className="sample-badge">Sample data</span>
      </div>

      {risks.map((risk) => (
        <div className="risk-item" key={risk.label}>
          <div className="risk-label">
            <span>{risk.label}</span>
            <span>
              {risk.score} · {risk.level}
            </span>
          </div>
          <div
            className="risk-track"
            role="progressbar"
            aria-label={`${risk.label} risk`}
            aria-valuenow={risk.score}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span
              className={`risk-fill risk-${risk.color}`}
              style={{ width: `${risk.score}%` }}
            />
          </div>
        </div>
      ))}

      <div className="privacy-note privacy-note-bordered">
        <LockIcon />
        <span>Calculated on this phone. Works with no network.</span>
      </div>
    </article>
  )
}

function CompanionSection() {
  return (
    <section className="feature-section" id="companion">
      <div className="container feature-grid companion-grid">
        <div className="feature-visual">
          <RiskPreview />
        </div>

        <div className="feature-copy">
          <span className="eyebrow">THE COMPANION</span>
          <h2>Health checks that never leave the phone.</h2>
          <p>
            Heart rate, blood oxygen, temperature, activity, sleep and falls
            are read and understood on the device. It learns what is normal for
            one person and flags heat stress, dehydration, fatigue and
            breathing trouble.
          </p>
          <p>
            Only a coarse risk level and area can leave the phone, and only
            when the user turns sharing on. Alerts are in Hindi or English and
            can be read aloud.
          </p>
          <NavLink className="text-link" to="/companion">
            Explore the companion <span aria-hidden="true">→</span>
          </NavLink>
        </div>
      </div>
    </section>
  )
}

const careSteps = [
  {
    title: 'Nudge Kamla',
    description: 'Stay in, wear a mask, drink water.',
  },
  {
    title: 'Ask “Are you ok?”',
    description: 'Waits for her reply.',
  },
  {
    title: 'Message her son',
    description: 'Risk level only, in plain words.',
  },
  {
    title: 'SOS to emergency contact',
    description:
      'After a 30 second cancel countdown. Location only if she allowed it.',
    danger: true,
  },
]

function CareSection() {
  return (
    <section className="feature-section section-muted" id="care">
      <div className="container feature-grid">
        <div className="feature-copy">
          <span className="eyebrow">THE CARE CIRCLE</span>
          <h2>One calm message to family, not thirty alerts.</h2>
          <p>
            Agents decide what to do from the forecast, her readings and
            whether she replies. They start with her, then her son, then an
            emergency contact. She can cancel before an SOS goes out.
          </p>
          <p>
            Every decision is logged, so anyone can open “Why did I get this
            alert?” and see the steps.
          </p>
          <NavLink className="text-link" to="/caregiver">
            Explore the care circle <span aria-hidden="true">→</span>
          </NavLink>
        </div>

        <div className="feature-visual">
          <article className="care-card">
            {careSteps.map((step, index) => (
              <div className="care-step" key={step.title}>
                <div className="care-step-marker">
                  <span
                    className={
                      step.danger ? 'step-number step-danger' : 'step-number'
                    }
                  >
                    {index + 1}
                  </span>
                  {index < careSteps.length - 1 && (
                    <span className="step-connector" />
                  )}
                </div>
                <div className="care-step-content">
                  <strong>{step.title}</strong>
                  <p>{step.description}</p>
                </div>
              </div>
            ))}
          </article>
        </div>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="site-footer container">
      <div>
        <strong>Aethera · Team Prometheus</strong>
        <p>
          Built for Environmental Hacks, Air track. Powered by AWS architecture.
        </p>
      </div>
      <p className="footer-disclaimer">
        Support tool, not a medical device. Values on these screens are sample
        data for the design preview.
      </p>
    </footer>
  )
}

export default function App() {
  return (
    <main>
      <Hero />
      <ForecastSection />
      <CompanionSection />
      <CareSection />
    </main>
  )
}
