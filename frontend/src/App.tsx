
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './components/LanguageSwitcher'

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
  const { t } = useTranslation()
  return (
    <header className="site-header">
      <nav className="nav container" aria-label="Main navigation">
        <NavLink className="brand" to="/" aria-label={t('nav.home')}>
          <span className="brand-icon">
            <AetheraMark />
          </span>
          <span>Aethera</span>
        </NavLink>

        <div className="nav-links">
          <NavLink to="/dashboard">{t('nav.forecast')}</NavLink>
          <NavLink to="/companion">{t('nav.companion')}</NavLink>
          <NavLink to="/caregiver">{t('nav.careCircle')}</NavLink>
          <NavLink
            to="/dashboard"
            className="button button-primary nav-cta"
          >
            {t('nav.openDashboard')}
          </NavLink>
          <LanguageSwitcher />
        </div>
      </nav>
    </header>
  )
}

function ForecastPreview() {
  const { t } = useTranslation()
  return (
    <article className="preview-card">
      <div className="preview-heading">
        <strong>{t('forecastPreview.tomorrow')}</strong>
        <span className="sample-badge">{t('forecastPreview.sampleData')}</span>
      </div>

      <div className="metric-grid">
        <div className="metric-tile">
          <span className="muted">{t('forecastPreview.inversion')}</span>
          <strong className="status-danger">{t('forecastPreview.strong')}</strong>
        </div>
        <div className="metric-tile">
          <span className="muted">{t('forecastPreview.smokeReaches')}</span>
          <strong>{t('forecastPreview.about14h')}</strong>
        </div>
      </div>

      <div className="message-card">
        <span className="muted">{t('forecastPreview.messageTo')}</span>
        <p className="message-hindi" lang="hi">
          {t('forecastPreview.messageHindi')}
        </p>
        <p className="message-translation">
          {t('forecastPreview.messageTranslation')}
        </p>
      </div>

      <div className="privacy-note">
        <LockIcon />
        <span>{t('forecastPreview.privacyNote')}</span>
      </div>
    </article>
  )
}

function Hero() {
  const { t } = useTranslation()
  return (
    <section className="hero container" id="home">
      <div className="hero-copy">
        <span className="eyebrow">{t('hero.eyebrow')}</span>

        <h1>{t('hero.headline')}</h1>

        <p className="hero-description">
          {t('hero.description')}
        </p>

        <div className="hero-actions">
          <NavLink className="button button-primary" to="/dashboard">
            {t('hero.openDashboard')}
          </NavLink>
          <NavLink className="button button-secondary" to="/companion">
            {t('hero.seePhoneApp')}
          </NavLink>
        </div>

        <p className="disclaimer">
          {t('hero.disclaimer')}
        </p>
      </div>

      <div className="hero-visual">
        <ForecastPreview />
      </div>
    </section>
  )
}

function FeedbackDiagram() {
  const { t } = useTranslation()
  return (
    <div
      className="feedback-diagram"
      role="img"
      aria-label="Weather and smoke influence each other in the 72-hour forecast"
    >
      <div className="diagram-box">
        <strong>{t('diagram.weather')}</strong>
        <span>{t('diagram.temperature')}</span>
        <span>{t('diagram.wind')}</span>
        <span>{t('diagram.boundaryLayer')}</span>
      </div>

      <div className="diagram-arrows" aria-hidden="true">
        <span>{t('diagram.traps')}</span>
        <span>{t('diagram.alters')}</span>
      </div>

      <div className="diagram-box">
        <strong>{t('diagram.smoke')}</strong>
        <span>{t('diagram.pm25')}</span>
        <span>{t('diagram.ozone')}</span>
        <span>{t('diagram.nox')}</span>
      </div>

      <div className="diagram-caption">
        <span>{t('diagram.eachHour')}</span>
        <div className="diagram-result">
          <strong>{t('diagram.aqiForecast')}</strong>
          <span>{t('diagram.withInversion')}</span>
        </div>
      </div>
    </div>
  )
}

function ForecastSection() {
  const { t } = useTranslation()
  return (
    <section className="feature-section section-muted" id="forecast">
      <div className="container feature-grid">
        <div className="feature-copy">
          <span className="eyebrow">{t('forecastSection.eyebrow')}</span>
          <h2>{t('forecastSection.headline')}</h2>
          <p>{t('forecastSection.para1')}</p>
          <p>{t('forecastSection.para2')}</p>
          <NavLink className="text-link" to="/dashboard">
            {t('forecastSection.exploreLink')} <span aria-hidden="true">→</span>
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
  const { t } = useTranslation()
  const risks = [
    { labelKey: 'riskPreview.heat', score: 24, levelKey: 'riskPreview.low', color: 'green' },
    { labelKey: 'riskPreview.breathing', score: 78, levelKey: 'riskPreview.high', color: 'red' },
    { labelKey: 'riskPreview.heart', score: 46, levelKey: 'riskPreview.medium', color: 'amber' },
  ]

  return (
    <article className="risk-card">
      <div className="preview-heading">
        <strong>{t('riskPreview.todayRisk')}</strong>
        <span className="sample-badge">{t('riskPreview.sampleData')}</span>
      </div>

      {risks.map((risk) => (
        <div className="risk-item" key={risk.labelKey}>
          <div className="risk-label">
            <span>{t(risk.labelKey)}</span>
            <span>
              {risk.score} · {t(risk.levelKey)}
            </span>
          </div>
          <div
            className="risk-track"
            role="progressbar"
            aria-label={`${t(risk.labelKey)} risk`}
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
        <span>{t('riskPreview.privacyNote')}</span>
      </div>
    </article>
  )
}

function CompanionSection() {
  const { t } = useTranslation()
  return (
    <section className="feature-section" id="companion">
      <div className="container feature-grid companion-grid">
        <div className="feature-visual">
          <RiskPreview />
        </div>

        <div className="feature-copy">
          <span className="eyebrow">{t('companionSection.eyebrow')}</span>
          <h2>{t('companionSection.headline')}</h2>
          <p>{t('companionSection.para1')}</p>
          <p>{t('companionSection.para2')}</p>
          <NavLink className="text-link" to="/companion">
            {t('companionSection.exploreLink')} <span aria-hidden="true">→</span>
          </NavLink>
        </div>
      </div>
    </section>
  )
}

function CareSection() {
  const { t } = useTranslation()

  const careSteps = [
    {
      titleKey: 'careSection.steps.nudgeKamla.title',
      descriptionKey: 'careSection.steps.nudgeKamla.description',
      danger: false,
    },
    {
      titleKey: 'careSection.steps.askOk.title',
      descriptionKey: 'careSection.steps.askOk.description',
      danger: false,
    },
    {
      titleKey: 'careSection.steps.messageSon.title',
      descriptionKey: 'careSection.steps.messageSon.description',
      danger: false,
    },
    {
      titleKey: 'careSection.steps.sos.title',
      descriptionKey: 'careSection.steps.sos.description',
      danger: true,
    },
  ]

  return (
    <section className="feature-section section-muted" id="care">
      <div className="container feature-grid">
        <div className="feature-copy">
          <span className="eyebrow">{t('careSection.eyebrow')}</span>
          <h2>{t('careSection.headline')}</h2>
          <p>{t('careSection.para1')}</p>
          <p>{t('careSection.para2')}</p>
          <NavLink className="text-link" to="/caregiver">
            {t('careSection.exploreLink')} <span aria-hidden="true">→</span>
          </NavLink>
        </div>

        <div className="feature-visual">
          <article className="care-card">
            {careSteps.map((step, index) => (
              <div className="care-step" key={step.titleKey}>
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
                  <strong>{t(step.titleKey)}</strong>
                  <p>{t(step.descriptionKey)}</p>
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
  const { t } = useTranslation()
  return (
    <footer className="site-footer container">
      <div>
        <strong>{t('footer.brand')}</strong>
        <p>{t('footer.built')}</p>
      </div>
      <p className="footer-disclaimer">
        {t('footer.disclaimer')}
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
