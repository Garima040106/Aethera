import { createBrowserRouter } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute'
import SiteLayout from '../components/layout/SiteLayout'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import DashboardPage from '../pages/DashboardPage'
import CompanionPage from '../pages/CompanionPage'
import CaregiverPage from '../pages/CaregiverPage'
import RoutePlannerPage from '../pages/RoutePlannerPage'

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <SiteLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/routes', element: <RoutePlannerPage /> },
          { path: '/companion', element: <CompanionPage /> },
          { path: '/caregiver', element: <CaregiverPage /> },
        ],
      },
    ],
  },
])
