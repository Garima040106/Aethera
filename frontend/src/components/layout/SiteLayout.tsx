import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  AetheraLogo,
  CompassIcon,
  RouteIcon,
  BarChartIcon,
  HeartPulseIcon,
  BookmarkIcon,
  BellIcon,
  MenuIcon,
  PanelRightIcon,
  MapPinIcon,
} from '../Icons'
import LanguageSwitcher from '../LanguageSwitcher'
import { getDemoUser, signOutDemo } from '../../services/demoAuth'
import CursorEffect from '../CursorEffect'

export default function SiteLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [insightsOpen, setInsightsOpen] = useState(true)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const user = getDemoUser()
  const isCaregiver = user?.role === 'caregiver'
  const dashboardPath = isCaregiver ? '/caregiver-dashboard' : '/dashboard'

  function handleSignOut() {
    signOutDemo()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <CursorEffect />
      {/* Top navigation: full width, 64 px high */}
      <header className="site-header">
        <div className="app-floating-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            className="icon-btn"
            style={{ display: 'none' }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle navigation menu"
          >
            <MenuIcon size={20} />
          </button>

          <NavLink className="brand" to="/" aria-label={t('nav.home')}>
            <AetheraLogo size={28} />
            <span style={{ letterSpacing: '-0.02em', color: '#174D35' }}>Aethera</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#647168', background: '#E8F4EC', padding: '2px 8px', borderRadius: '12px', border: '1px solid #D1E7DC' }}>
              Trinetra
            </span>
          </NavLink>
        </div>

        <div className="header-actions">
          <LanguageSwitcher />

          <button
            type="button"
            className="icon-btn"
            onClick={() => setInsightsOpen(!insightsOpen)}
            title="Toggle insights panel"
            aria-label="Toggle insights panel"
          >
            <PanelRightIcon size={20} />
          </button>

          <button
            type="button"
            className="icon-btn"
            style={{ position: 'relative' }}
            title="Alerts and notifications"
            aria-label="Notifications"
          >
            <BellIcon size={20} />
            <span
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#D95B35',
              }}
            />
          </button>

          <span className="hidden text-xs font-medium text-[#647168] sm:inline">{user?.name}</span>
          <button type="button" className="btn btn-secondary" onClick={handleSignOut}>Sign out</button>
        </div>
        </div>
      </header>

      {/* Left sidebar: 232 px wide below the header */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="nav-section">
          <span className="nav-section-label">Navigation</span>
          <NavLink
            to={dashboardPath}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <CompassIcon size={18} />
            <span>{isCaregiver ? 'Advanced User dashboard' : 'My air dashboard'}</span>
          </NavLink>

          {!isCaregiver && (
            <>
              <NavLink
                to="/routes"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <RouteIcon size={18} />
                <span>Clean Routes</span>
              </NavLink>
              <NavLink
                to="/dashboard"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <BarChartIcon size={18} />
                <span>{t('nav.forecast')}</span>
              </NavLink>
              <NavLink
                to="/companion"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <HeartPulseIcon size={18} />
                <span>{t('nav.companion')}</span>
              </NavLink>
            </>
          )}
        </div>

        {!isCaregiver && <div className="nav-divider" />}

        {!isCaregiver && <div className="nav-section">
          <span className="nav-section-label">Saved Locations</span>
          <NavLink to="/?area=noida" className="nav-item">
            <MapPinIcon size={16} style={{ color: '#218653' }} />
            <span>{t('dashboard.areaNoida')}</span>
          </NavLink>
          <NavLink to="/?area=anand_vihar" className="nav-item">
            <MapPinIcon size={16} style={{ color: '#C83245' }} />
            <span>Anand Vihar</span>
          </NavLink>
          <NavLink to="/?area=punjabi_bagh" className="nav-item">
            <MapPinIcon size={16} style={{ color: '#D99A16' }} />
            <span>Punjabi Bagh</span>
          </NavLink>
          <NavLink to="/?area=gurugram" className="nav-item">
            <MapPinIcon size={16} style={{ color: '#D95B35' }} />
            <span>Gurugram Sec 51</span>
          </NavLink>
        </div>}

        {!isCaregiver && <div className="nav-divider" />}

        <div style={{ padding: '12px', background: '#F7F9F7', borderRadius: '8px', border: '1px solid #E0E7E2', marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <BookmarkIcon size={16} style={{ color: '#174D35' }} />
            <strong style={{ fontSize: '12px', color: '#17231C' }}>{isCaregiver ? 'Care circle active' : 'Delhi NCR Active'}</strong>
          </div>
          <p style={{ margin: 0, fontSize: '11px', color: '#647168', lineHeight: 1.4 }}>
            {isCaregiver ? 'Shared check-ins and consent-aware updates.' : 'Coupled weather-pollution surrogate running hourly.'}
          </p>
        </div>
      </aside>

      {/* Main Outlet (Map or Pages) */}
      <Outlet context={{ insightsOpen, setInsightsOpen }} />
    </div>
  )
}
