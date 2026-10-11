import { lazy, Suspense } from 'react'

const DashboardAirMapSection = lazy(() => import('./DashboardAirMapSection'))

export default function DashboardAirMapRoute() {
  return (
    <Suspense fallback={<section className="rounded-2xl border border-[#dce5de] bg-white p-6 text-sm text-[#647168]">Loading the Delhi air map…</section>}>
      <DashboardAirMapSection />
    </Suspense>
  )
}
