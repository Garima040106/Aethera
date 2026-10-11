import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AetheraLogo, ArrowRightIcon, LockIcon } from '../components/Icons'
import { DEMO_CREDENTIALS, signInDemo } from '../services/demoAuth'

export default function LoginPage() {
  const [email, setEmail] = useState<string>(DEMO_CREDENTIALS.email)
  const [password, setPassword] = useState<string>(DEMO_CREDENTIALS.password)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const destination = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!signInDemo(email, password)) {
      setError('Those demo credentials did not match. Use the account shown below.')
      return
    }
    navigate(destination, { replace: true })
  }

  return (
    <main className="grid min-h-[calc(100vh-72px)] bg-[#f7f9f7] pt-4 lg:grid-cols-2">
      <section className="flex items-center justify-center px-6 py-14 sm:px-10 lg:px-16">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-[#647168] no-underline hover:text-[#174d35]">
            <span aria-hidden="true">←</span> Back to Aethera
          </Link>
          <div className="mb-7 grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f4ec]">
            <AetheraLogo size={30} />
          </div>
          <p className="text-xs font-semibold tracking-[.16em] text-[#246b49]">YOUR AIR, IN CONTEXT</p>
          <h1 className="font-display mt-3 text-4xl font-semibold tracking-[-.035em] text-[#17231c] sm:text-5xl">Welcome to Aethera</h1>
          <p className="mt-3 text-sm leading-6 text-[#647168]">Sign in with the demo account to explore your local air forecast and environmental dashboard.</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#34483c]">Email address</label>
              <input id="email" name="email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 w-full rounded-xl border border-[#dce5de] bg-white px-4 text-sm text-[#17231c] outline-none transition focus:border-[#55916c] focus:ring-4 focus:ring-[#174d35]/10" />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-[#34483c]">Password</label>
              <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 w-full rounded-xl border border-[#dce5de] bg-white px-4 text-sm text-[#17231c] outline-none transition focus:border-[#55916c] focus:ring-4 focus:ring-[#174d35]/10" />
            </div>
            {error && <p role="alert" className="rounded-lg border border-[#f2c9c4] bg-[#fff1ef] px-3 py-2 text-sm text-[#a33a2d]">{error}</p>}
            <button type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#174d35] text-sm font-semibold text-white shadow-md shadow-[#174d35]/15 transition hover:bg-[#1f6b47]">
              Sign in to dashboard <ArrowRightIcon size={17} />
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-[#d7e8dc] bg-[#edf6f0] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#246b49]">Demo account</p>
            <dl className="mt-3 grid grid-cols-[72px_1fr] gap-x-2 gap-y-2 text-sm">
              <dt className="text-[#647168]">Email</dt><dd className="font-medium text-[#17231c]">{DEMO_CREDENTIALS.email}</dd>
              <dt className="text-[#647168]">Password</dt><dd className="font-medium text-[#17231c]">{DEMO_CREDENTIALS.password}</dd>
            </dl>
          </div>
          <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-[#78847d]">
            <LockIcon size={14} className="mt-0.5 shrink-0" />
            Demo sign-in is stored in this browser only. It is not production authentication and does not protect sensitive data.
          </p>
        </div>
      </section>

      <aside className="relative hidden overflow-hidden bg-[#174d35] px-12 py-16 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-32 -top-24 h-[520px] w-[520px] rounded-full border border-white/10" />
        <div className="absolute -right-16 -top-8 h-[390px] w-[390px] rounded-full border border-white/10" />
        <div className="absolute -bottom-56 -left-32 h-[560px] w-[560px] rounded-full bg-[#246b49]/70 blur-2xl" />
        <div className="relative max-w-lg">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/85">
            <span className="h-2 w-2 rounded-full bg-[#9bd2a9]" /> Delhi NCR · Air and health
          </span>
          <h2 className="mt-8 text-4xl font-semibold leading-tight tracking-[-.04em]">Better context for the air you breathe.</h2>
          <p className="mt-5 max-w-md text-base leading-7 text-white/75">
            Explore neighborhood forecasts, watch conditions change, and find practical guidance for the people who need it.
          </p>
        </div>
        <p className="relative max-w-md text-xs leading-5 text-white/60">
          Aethera is a support tool, not a medical device. Forecast and sample values are for demonstration.
        </p>
      </aside>
    </main>
  )
}
