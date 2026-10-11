import { lazy, Suspense } from 'react'

const AqiMapPage = lazy(() => import('./AqiMapPage'))

export default function AqiMapRoute() {
  return (
    <Suspense fallback={<main className="p-8 text-sm text-[#647168]">Loading the Delhi map…</main>}>
      <AqiMapPage />
    </Suspense>
  )
}
