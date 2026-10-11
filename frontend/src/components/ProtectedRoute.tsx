import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getDemoUser } from '../services/demoAuth'

export default function ProtectedRoute() {
  const location = useLocation()

  if (!getDemoUser()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
