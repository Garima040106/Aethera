import { Link, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AetheraLogo } from './Icons'
import LanguageSwitcher from './LanguageSwitcher'
import CursorEffect from './CursorEffect'

export default function PublicLayout() {
  const { t } = useTranslation()

  return (
    <>
      <CursorEffect />
      <header className="sticky top-0 z-40 mx-auto w-full px-3 pt-3">
        <nav
          className="mx-auto flex h-14 max-w-7xl items-center justify-between rounded-full border border-[#e7e4d9]/90 bg-[#fffef3]/90 px-5 shadow-[0_8px_28px_rgba(25,25,27,.09)] backdrop-blur-xl sm:px-7"
          aria-label="Main navigation"
        >
          <Link to="/" className="flex items-center gap-2.5 text-lg tracking-tight text-[#19191b] no-underline">
            <AetheraLogo size={32} />
            <span>Aethera</span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden items-center gap-5 md:flex">
              <a href="/#product" className="text-sm text-[#52534e] no-underline hover:text-[#80553f]">Forecast</a>
              <a href="/#companion" className="text-sm text-[#52534e] no-underline hover:text-[#80553f]">Companion</a>
              <a href="/#care-circle" className="text-sm text-[#52534e] no-underline hover:text-[#80553f]">Care circle</a>
            </div>
            <LanguageSwitcher />
            <Link to="/login" className="rounded-full bg-[#19191b] px-4 py-2.5 text-sm text-white no-underline transition hover:bg-[#303034]">
              {t('nav.openDashboard')}
            </Link>
          </div>
        </nav>
      </header>
      <Outlet />
      <footer className="bg-[#fffef3] text-[#19191b]">
        <div className="rounded-t-[2rem] bg-[#19191b] text-[#fffef3]">
          <div className="mx-auto flex max-w-7xl items-center gap-8 overflow-hidden px-6 py-6 sm:px-8 lg:px-10">
            <span className="shrink-0 text-[10px] font-medium uppercase tracking-[.18em] text-white/55">
              Built with
            </span>
            <div className="services-marquee" role="group" aria-label="Amazon DynamoDB, AWS Lambda, Amazon Bedrock, and Amazon Location">
              <div className="services-marquee-track">
                {[0, 1].map((copy) => (
                  <ul key={copy} className="services-marquee-group" aria-hidden={copy === 1}>
                    <li>Amazon DynamoDB</li>
                    <li>AWS Lambda</li>
                    <li>Amazon Bedrock</li>
                    <li>Amazon Location</li>
                  </ul>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 pb-8 pt-10 sm:px-8 sm:pb-10 sm:pt-12 lg:px-10">
          <nav className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-4" aria-label="Footer">
            <div>
              <h2 className="text-[11px] font-medium uppercase tracking-[.14em] text-[#788078]">Product</h2>
              <ul className="mt-3 space-y-1.5 text-sm">
                <li><Link className="text-inherit no-underline hover:text-[#174d35]" to="/">Home</Link></li>
                <li><a className="text-inherit no-underline hover:text-[#174d35]" href="#how-it-works">How it works</a></li>
                <li><Link className="text-inherit no-underline hover:text-[#174d35]" to="/login">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h2 className="text-[11px] font-medium uppercase tracking-[.14em] text-[#788078]">Explore</h2>
              <ul className="mt-3 space-y-1.5 text-sm">
                <li>Local air outlook</li>
                <li>Route planning</li>
                <li>Community guidance</li>
              </ul>
            </div>
            <div>
              <h2 className="text-[11px] font-medium uppercase tracking-[.14em] text-[#788078]">Trust</h2>
              <ul className="mt-3 space-y-1.5 text-sm">
                <li>Privacy-aware by design</li>
                <li>Health readings stay on-device</li>
                <li>Support tool, not a medical device</li>
              </ul>
            </div>
            <div>
              <h2 className="text-[11px] font-medium uppercase tracking-[.14em] text-[#788078]">Project</h2>
              <ul className="mt-3 space-y-1.5 text-sm">
                <li>
                  <a className="text-inherit no-underline hover:text-[#174d35]" href="https://github.com/nickhil-verma/Aethera" target="_blank" rel="noreferrer">
                    GitHub repository
                  </a>
                </li>
                <li>Environmental intelligence for Delhi NCR</li>
                <li>Built for clearer, safer decisions</li>
              </ul>
            </div>
          </nav>

          <div className="mt-12 flex flex-col gap-4 border-t border-[#e7e4d9] pt-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-display text-6xl leading-[.85] tracking-[-.045em] sm:text-7xl">Aethera</p>
              <p className="mt-3 text-xs text-[#6f766f]">Environmental intelligence for Delhi NCR</p>
            </div>
            <p className="max-w-md text-xs leading-5 text-[#6f766f] sm:text-right">
              Forecasts are informational and not medical advice. In an emergency, call 112.
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}
