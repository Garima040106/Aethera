import { Link } from 'react-router-dom'
import { ArrowRightIcon, HeartPulseIcon, ShieldAlertIcon } from '../components/Icons'
import CursorEffect from '../components/CursorEffect'

export default function LoginChoicePage() {
  return (
    <>
      <CursorEffect />
      <main className="role-choice-page">
        <section className="role-choice-content">
          <Link to="/" className="elder-back-link"><span aria-hidden="true">←</span> Back to Aethera</Link>
          <p className="elder-eyebrow">Choose your Aethera experience</p>
          <h1>Who is signing in?</h1>
          <p className="role-choice-intro">Choose the view that is right for you. Each sign-in opens its own dashboard.</p>
          <div className="role-choice-grid">
            <Link to="/elder-login" className="role-choice-card role-choice-elder">
              <span className="role-choice-icon"><HeartPulseIcon size={28} /></span>
              <span className="role-choice-label">For me</span>
              <strong>Older adult</strong>
              <span className="role-choice-description">A simple daily air check, practical guidance, and personal companion.</span>
              <span className="role-choice-action">Continue to my sign-in <ArrowRightIcon size={18} /></span>
            </Link>
            <Link to="/caregiver-login" className="role-choice-card role-choice-caregiver">
              <span className="role-choice-icon"><ShieldAlertIcon size={28} /></span>
              <span className="role-choice-label">For advanced tools</span>
              <strong>Advanced User</strong>
              <span className="role-choice-description">A focused view with shared check-ins, care-circle updates, and clear next steps.</span>
              <span className="role-choice-action">Continue to advanced sign-in <ArrowRightIcon size={18} /></span>
            </Link>
          </div>
          <p className="role-choice-note">Demo accounts are provided on each sign-in page. This is a browser-only demonstration, not production authentication.</p>
        </section>
      </main>
    </>
  )
}
