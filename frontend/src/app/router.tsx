
import { createBrowserRouter } from 'react-router-dom'
import App from '../App'
import SiteLayout from '../components/layout/SiteLayout'
import DashboardPage from '../pages/DashboardPage'
import CompanionPage from '../pages/CompanionPage'
import CaregiverPage from '../pages/CaregiverPage'

export const router = createBrowserRouter([
  {
    element: <SiteLayout />,
    children: [
      { path: '/', element: <App /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/companion', element: <CompanionPage /> },
      { path: '/caregiver', element: <CaregiverPage /> },
    ],
  },
])
