import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getDemoUser, type DemoRole } from '../services/demoAuth'

export default function ProtectedRoute({ role }: { role?: DemoRole }) {
  const location = useLocation()
  const user = getDemoUser()

  if (!user) {
    const loginPath = role === 'caregiver' ? '/caregiver-login' : '/elder-login'
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />
  }

  if (role && user.role !== role) {
    const destination = user.role === 'caregiver' ? '/caregiver-dashboard' : '/dashboard'
    return <Navigate to={destination} replace />
  }

  return <Outlet />
}
