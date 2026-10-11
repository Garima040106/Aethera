import { Link, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AetheraLogo } from './Icons'
import LanguageSwitcher from './LanguageSwitcher'

export default function PublicLayout() {
  const { t } = useTranslation()

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#e1e9e3] bg-white/90 backdrop-blur-xl">
        <nav className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-10" aria-label="Main navigation">
          <Link to="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-[#17231c] no-underline">
            <AetheraLogo size={32} />
            <span>Aethera</span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-5">
            <a href="/#how-it-works" className="hidden text-sm font-medium text-[#526158] no-underline hover:text-[#174d35] sm:inline">
              How it works
            </a>
            <LanguageSwitcher />
            <Link to="/login" className="rounded-lg bg-[#174d35] px-4 py-2.5 text-sm font-semibold text-white no-underline transition hover:bg-[#1f6b47]">
              {t('nav.openDashboard')}
            </Link>
          </div>
        </nav>
      </header>
      <Outlet />
    </>
  )
}
