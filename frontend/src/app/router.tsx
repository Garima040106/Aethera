import { createBrowserRouter } from 'react-router-dom'
import PublicLayout from '../components/PublicLayout'
import ProtectedRoute from '../components/ProtectedRoute'
import SiteLayout from '../components/layout/SiteLayout'
import HomePage from '../pages/HomePage'
import LoginPage from '../pages/LoginPage'
import DashboardPage from '../pages/DashboardPage'
import CompanionPage from '../pages/CompanionPage'
import CaregiverPage from '../pages/CaregiverPage'

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/login', element: <LoginPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <SiteLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/companion', element: <CompanionPage /> },
          { path: '/caregiver', element: <CaregiverPage /> },
        ],
      },
    ],
  },
])
