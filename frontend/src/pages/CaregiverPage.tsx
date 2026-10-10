
import './CaregiverPage.css'

function AetheraIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A73E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
      <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
      <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

const sharingItems = [
  { label: 'Risk level', value: 'Shared', shared: true },
  { label: 'General area, Noida', value: 'Shared', shared: true },
  { label: 'Heart rate and oxygen', value: 'Stays on her phone', shared: false },
  { label: 'Exact location', value: 'Only if she sends an SOS', shared: false },
]

export default function CaregiverPage() {
  return (
    <main className="caregiver-page">
      <div className="caregiver-intro">
        <span className="eyebrow">CARE CIRCLE</span>
        <h1>Know when someone you love needs you.</h1>
        <p>
          A caregiver view designed to make urgent information clear while
          respecting the privacy of the person receiving care.
        </p>
        <p className="caregiver-disclaimer">
          Sample interface only. Calling and emergency notifications are not
          connected in this design preview.
        </p>
      </div>

      <section className="caregiver-phone" aria-label="Caregiver phone preview">
        <header className="caregiver-phone-header">
          <div className="caregiver-brand">
            <AetheraIcon />
            <strong>Aethera</strong>
          </div>
          <span>Care circle</span>
        </header>

        <div className="caregiver-phone-content">
          <section className="caregiver-card caregiver-alert">
            <div className="caregiver-alert-meta">
              <strong>Please call Maa</strong>
              <span>10:14 AM · Sample</span>
            </div>
            <h2>Maa's breathing looks harder than usual.</h2>
            <p>
              The air outside is at a very unhealthy level, and she has not
              replied to the app for two minutes.
            </p>
          </section>

          <div className="caregiver-actions">
            <button
              className="caregiver-call-button"
              type="button"
              onClick={() => window.alert('Demo only: calling is not connected yet.')}
            >
              <PhoneIcon />
              Call Maa
            </button>
            <button
              className="caregiver-secondary-button"
              type="button"
              onClick={() => window.alert('Demo only: no emergency notification was sent.')}
            >
              I could not reach her
            </button>
          </div>

          <section className="caregiver-card caregiver-sharing">
            <h3>What Maa shares with you</h3>
            {sharingItems.map((item) => (
              <div className="caregiver-sharing-row" key={item.label}>
                <span>{item.label}</span>
                <span className={item.shared ? 'sharing-status shared' : 'sharing-status private'}>
                  {item.value}
                </span>
              </div>
            ))}
          </section>

          <section className="caregiver-card caregiver-escalation">
            <h3>If nobody reaches her</h3>
            <p>
              The next step is her emergency contact. Maa can cancel before it
              is sent.
            </p>
          </section>

          <p className="caregiver-emergency-note">
            Support tool, not a medical device. In an emergency call 112.
          </p>
        </div>
      </section>
    </main>
  )
}
