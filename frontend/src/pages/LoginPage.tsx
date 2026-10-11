import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AetheraLogo, ArrowRightIcon, HeartPulseIcon, LockIcon } from '../components/Icons'
import CursorEffect from '../components/CursorEffect'
import { DEMO_ACCOUNTS, signInDemo, type DemoRole } from '../services/demoAuth'

export default function LoginPage({ role }: { role: DemoRole }) {
  const account = DEMO_ACCOUNTS[role]
  const isCaregiver = role === 'caregiver'
  const [email, setEmail] = useState<string>(account.email)
  const [password, setPassword] = useState<string>(account.password)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const requestedDestination = (location.state as { from?: string } | null)?.from
  const allowedDestinations = isCaregiver
    ? ['/caregiver-dashboard']
    : ['/dashboard', '/companion', '/routes']
  const destination = requestedDestination && allowedDestinations.includes(requestedDestination)
    ? requestedDestination
    : isCaregiver ? '/caregiver-dashboard' : '/dashboard'

  function enterDemo() {
    signInDemo(account.email, account.password, role)
    navigate(destination, { replace: true })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!signInDemo(email, password, role)) {
      setError('Those details do not match this demo account. You can use quick sign-in above.')
      return
    }
    navigate(destination, { replace: true })
  }

  return (
    <>
      <CursorEffect />
      <main className={`elder-login min-h-screen ${isCaregiver ? 'caregiver-login' : 'elder-login'}`}>
        <section className="elder-login-main">
          <div className="elder-login-content">
            <Link to="/" className="elder-back-link"><span aria-hidden="true">←</span> Back to Aethera</Link>
            <div className="elder-login-brand">
              <AetheraLogo size={38} />
              <span>Aethera</span>
            </div>

            <p className="elder-eyebrow">{isCaregiver ? 'Advanced support tools' : 'A calmer way to plan your day'}</p>
            <h1>
              {isCaregiver ? <>Welcome, Advanced User.<br /><span>We’ll keep it clear.</span></> : <>Welcome.<br /><span>You’re in the right place.</span></>}
            </h1>
            <p className="elder-login-intro">
              {isCaregiver
                ? 'Sign in to see shared check-ins, the coarse risk status, and clear next steps for your care circle.'
                : 'Sign in to see the air near you, get simple guidance, and reach your care circle.'}
            </p>

            <button type="button" onClick={enterDemo} className="elder-login-primary">
              {isCaregiver ? 'Continue to Advanced User dashboard' : 'Continue to my dashboard'} <ArrowRightIcon size={21} />
            </button>
            <p className="elder-login-hint">This demo opens directly. No typing is needed.</p>

            <details className="elder-manual-login">
              <summary>Enter demo sign-in details instead</summary>
              <form className="elder-login-form" onSubmit={handleSubmit}>
                <label>
                  <span>Email address</span>
                  <input
                    name="email"
                    type="email"
                    autoComplete="username"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </label>
                <label>
                  <span>Password</span>
                  <input
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </label>
                {error && <p role="alert" className="elder-login-error">{error}</p>}
                <button type="submit" className="elder-login-secondary">Sign in</button>
              </form>
            </details>

            <div className="elder-demo-account">
              <p className="elder-demo-title">{isCaregiver ? 'Advanced User demo account' : 'Older adult demo account'}</p>
              <p><span>Email</span><strong>{account.email}</strong></p>
              <p><span>Password</span><strong>{account.password}</strong></p>
            </div>

            <p className="elder-login-privacy"><LockIcon size={18} /> This demo stores sign-in on this browser only. It is not production authentication.</p>
            <p className="elder-role-switch">
              {isCaregiver ? 'Looking for the older adult view?' : 'Signing in as an Advanced User?'}{' '}
              <Link to={isCaregiver ? '/elder-login' : '/caregiver-login'}>
                {isCaregiver ? 'Older adult sign-in' : 'Advanced User sign-in'}
              </Link>
            </p>
          </div>
        </section>

        <aside className="elder-login-aside">
          <div className="elder-login-orbit elder-login-orbit-one" />
          <div className="elder-login-orbit elder-login-orbit-two" />
          <div className="elder-login-aside-content">
            <span className="elder-login-aside-icon"><HeartPulseIcon size={30} /></span>
            <p className="elder-eyebrow">{isCaregiver ? 'Care circle' : 'Air, health and people'}</p>
            <h2>{isCaregiver ? <>Stay close.<br /><em>Know the next step.</em></> : <>Useful information.<br /><em>Without the overwhelm.</em></>}</h2>
            <ul>
              {isCaregiver ? (
                <>
                  <li>See only information shared with consent</li>
                  <li>Understand check-in and escalation status</li>
                  <li>Get calm, actionable context</li>
                </>
              ) : (
                <>
                  <li>See a simple local air report</li>
                  <li>Get practical, easy-to-read guidance</li>
                  <li>Keep personal health readings private</li>
                </>
              )}
            </ul>
          </div>
          <p className="elder-login-disclaimer">Aethera is a support tool, not a medical device. In an emergency, call 112.</p>
        </aside>
      </main>
    </>
  )
}
