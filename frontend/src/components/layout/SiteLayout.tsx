
import { Outlet } from 'react-router-dom'
import { Header, Footer } from '../../App'

export default function SiteLayout() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  )
}
