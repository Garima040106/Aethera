
import './CompanionPage.css'

const riskItems = [
  { label: 'गर्मी', value: 24, level: 'कम', color: 'green' },
  { label: 'साँस', value: 78, level: 'ज़्यादा', color: 'red' },
  { label: 'दिल', value: 46, level: 'मध्यम', color: 'amber' },
]

function AetheraIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A73E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
      <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
      <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A73E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function PhonePreview() {
  return (
    <div className="phone-frame">
      <header className="phone-header">
        <div className="phone-brand"><AetheraIcon /> <strong>Aethera</strong></div>
        <div className="phone-header-actions">
          <span className="offline-badge">Works offline</span>
          <div className="language-switch" aria-label="Language preview">
            <span className="language-active">हिं</span>
            <span>EN</span>
          </div>
        </div>
      </header>

      <div className="phone-content">
        <section className="phone-card phone-alert">
          <div className="phone-card-meta">
            <span>आज सुबह 6:00 बजे</span>
            <span className="phone-sample">Sample</span>
          </div>
          <p className="phone-alert-hindi" lang="hi">
            कमला जी, आज सुबह बाहर टहलने न जाएँ। हवा बहुत खराब है। घर के अंदर हल्का टहल लें।
          </p>
          <p className="phone-translation">
            Skip the walk outside. The air is very bad. A light walk indoors is better.
          </p>
          <button className="phone-listen" type="button" onClick={() => window.alert('Audio preview is not connected yet.')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
            सुनें
          </button>
        </section>

        <section className="phone-card phone-checkin">
          <div>
            <h2 lang="hi">क्या आप ठीक हैं?</h2>
            <p>Are you ok? Your breathing looks harder than usual.</p>
          </div>
          <button className="phone-response phone-response-ok" type="button" onClick={() => window.alert('Sample check-in: marked as okay.')}>
            मैं ठीक हूँ
          </button>
          <button className="phone-response phone-response-help" type="button" onClick={() => window.alert('Sample check-in: help requested. No alert was sent.')}>
            मदद चाहिए
          </button>
          <p className="phone-followup" lang="hi">
            अगर आप जवाब नहीं देंगी, तो 1:48 में रोहन को बताया जाएगा।
          </p>
        </section>

        <section className="phone-card phone-risk">
          <div className="phone-risk-heading">
            <strong lang="hi">आज का जोखिम</strong>
            <span>HR 96 · SpO2 93% · 36.9 °C</span>
          </div>
          {riskItems.map((risk) => (
            <div className="phone-risk-item" key={risk.label}>
              <div className="phone-risk-label">
                <span lang="hi">{risk.label}</span>
                <span>{risk.value} · {risk.level}</span>
              </div>
              <div
                className="phone-risk-track"
                role="progressbar"
                aria-label={`${risk.label} risk`}
                aria-valuenow={risk.value}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span className={`phone-risk-fill risk-fill-${risk.color}`} style={{ width: `${risk.value}%` }} />
              </div>
            </div>
          ))}
        </section>

        <div className="phone-privacy">
          <LockIcon />
          <span lang="hi">आपकी सेहत की जानकारी इसी फ़ोन पर रहती है।</span>
        </div>
      </div>

      <nav className="phone-bottom-nav" aria-label="Phone app preview navigation">
        <div className="phone-tab phone-tab-active"><span>⌂</span>Home</div>
        <div className="phone-tab"><span>⌁</span>Trends</div>
        <div className="phone-tab"><span>♡</span>Family</div>
        <div className="phone-tab"><span>☷</span>Settings</div>
      </nav>
    </div>
  )
}

export default function CompanionPage() {
  return (
    <main className="companion-page">
      <div className="companion-intro">
        <span className="eyebrow">PERSONAL COMPANION</span>
        <h1>Health support, designed for the person carrying it.</h1>
        <p>
          A preview of Kamla’s phone experience: Hindi-first guidance,
          simple check-ins, personal risk indicators, and offline access.
        </p>
        <p className="companion-disclaimer">
          Sample values only. This is a design preview, not a medical device.
          Check-in actions are demonstrations and do not contact anyone.
        </p>
      </div>
      <PhonePreview />
    </main>
  )
}
