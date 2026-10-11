import { createBrowserRouter } from 'react-router-dom'
import ProtectedRoute from '../components/ProtectedRoute'
import SiteLayout from '../components/layout/SiteLayout'
import PublicLayout from '../components/PublicLayout'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import LoginChoicePage from '../pages/LoginChoicePage'
import DashboardPage from '../pages/DashboardPage'
import CompanionPage from '../pages/CompanionPage'
import CaregiverPage from '../pages/CaregiverPage'
import RoutePlannerPage from '../pages/RoutePlannerPage'
import AqiMapRoute from '../pages/AqiMapRoute'

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <HomePage /> },
    ],
  },
  { path: '/login', element: <LoginChoicePage /> },
  { path: '/elder-login', element: <LoginPage role="elder" /> },
  { path: '/caregiver-login', element: <LoginPage role="caregiver" /> },
  {
    element: <ProtectedRoute role="elder" />,
    children: [
      {
        element: <SiteLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/routes', element: <RoutePlannerPage /> },
          { path: '/companion', element: <CompanionPage /> },
          { path: '/air-map', element: <AqiMapRoute /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute role="caregiver" />,
    children: [
      {
        element: <SiteLayout />,
        children: [
          { path: '/caregiver-dashboard', element: <CaregiverPage /> },
          { path: '/caregiver', element: <CaregiverPage /> },
          { path: '/air-map', element: <AqiMapRoute /> },
        ],
      },
    ],
  },
])
