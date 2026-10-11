import { Link } from 'react-router-dom'
import { AetheraLogo, ArrowRightIcon, LockIcon, WindIcon } from '../components/Icons'

const highlights = [
  { value: '72 hr', label: 'rolling air-quality outlook' },
  { value: '4 areas', label: 'across Delhi NCR' },
  { value: 'On-device', label: 'personal health signals' },
]

export default function HomePage() {
  return (
    <main className="min-h-[calc(100vh-72px)] bg-[#f7f9f7] text-[#17231c]">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_75%_25%,#dcece1_0%,transparent_42%),linear-gradient(135deg,#f7f9f7_0%,#eef4ef_100%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.02fr_.98fr] lg:px-10 lg:py-28">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#d3e4d8] bg-white/80 px-3 py-1.5 text-xs font-semibold tracking-wide text-[#246b49] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#218653]" />
              ENVIRONMENTAL INTELLIGENCE FOR DELHI NCR
            </div>
            <h1 className="max-w-2xl text-5xl font-semibold leading-[1.04] tracking-[-0.055em] text-[#17231c] sm:text-6xl lg:text-[4.4rem]">
              Know what’s in the air.
              <span className="mt-2 block text-[#246b49]">Know what to do next.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-[#526158]">
              Aethera brings local air forecasts, smoke movement and practical health guidance into one clear view —
              so families and communities can plan ahead.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to="/login"
                className="inline-flex min-h-12 items-center gap-3 rounded-xl bg-[#174d35] px-6 text-sm font-semibold text-white shadow-lg shadow-[#174d35]/15 transition hover:bg-[#1f6b47]"
              >
                Open your dashboard <ArrowRightIcon size={17} />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex min-h-12 items-center rounded-xl border border-[#d4dfd7] bg-white/80 px-5 text-sm font-semibold text-[#345144] transition hover:bg-white"
              >
                How Aethera helps
              </a>
            </div>
            <div className="mt-12 grid max-w-xl grid-cols-3 gap-4 border-t border-[#dce6df] pt-6">
              {highlights.map((item) => (
                <div key={item.label}>
                  <p className="text-lg font-semibold tracking-tight text-[#174d35]">{item.value}</p>
                  <p className="mt-1 text-xs leading-5 text-[#6a786f]">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[570px]">
            <div className="absolute -inset-5 rounded-[2rem] bg-[#d9e8dd]/70 blur-2xl" />
            <div className="relative overflow-hidden rounded-[1.5rem] border border-[#dce5de] bg-white shadow-[0_30px_80px_-35px_rgba(23,77,53,.35)]">
              <div className="flex items-center justify-between border-b border-[#edf1ee] px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e8f4ec] text-[#174d35]">
                    <AetheraLogo size={22} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#17231c]">Delhi NCR air outlook</p>
                    <p className="text-xs text-[#78847d]">Aethera environmental view</p>
                  </div>
                </div>
                <span className="rounded-full bg-[#f7e9cc] px-3 py-1 text-xs font-semibold text-[#996600]">Elevated</span>
              </div>

              <div className="relative h-[300px] overflow-hidden bg-[#edf3ed] sm:h-[340px]">
                <div className="absolute inset-0 opacity-60" style={{ backgroundImage: 'linear-gradient(#dbe5dd 1px, transparent 1px), linear-gradient(90deg, #dbe5dd 1px, transparent 1px)', backgroundSize: '34px 34px' }} />
                <svg viewBox="0 0 560 340" className="absolute inset-0 h-full w-full" role="img" aria-label="Illustration of air-quality zones and a smoke plume near Delhi">
                  <defs>
                    <radialGradient id="air-zone">
                      <stop offset="0%" stopColor="#d95b35" stopOpacity=".54" />
                      <stop offset="100%" stopColor="#d95b35" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id="plume" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#d99a16" stopOpacity=".10" />
                      <stop offset="100%" stopColor="#d95b35" stopOpacity=".28" />
                    </linearGradient>
                  </defs>
                  <path d="M45 52 C134 22 192 80 244 125 C293 168 335 147 392 182 C445 214 471 263 524 278 L524 340 L35 340 Z" fill="url(#plume)" />
                  <ellipse cx="352" cy="205" rx="152" ry="105" fill="url(#air-zone)" />
                  <path d="M80 257 C157 220 190 190 270 202 S388 263 475 218" fill="none" stroke="#fff" strokeWidth="3" strokeDasharray="8 9" opacity=".9" />
                  <path d="M80 257 C157 220 190 190 270 202 S388 263 475 218" fill="none" stroke="#2878e5" strokeWidth="1.5" strokeDasharray="3 6" />
                  {[
                    [132, 230, 'Noida'],
                    [268, 188, 'Delhi'],
                    [410, 205, 'Anand Vihar'],
                  ].map(([x, y, label]) => (
                    <g key={label}>
                      <circle cx={x} cy={y} r="13" fill="#174d35" fillOpacity=".12" />
                      <circle cx={x} cy={y} r="6" fill="#174d35" stroke="white" strokeWidth="3" />
                      <text x={Number(x) + 12} y={Number(y) + 4} fill="#34483c" fontSize="12" fontWeight="600">{label}</text>
                    </g>
                  ))}
                  <g transform="translate(48 55)">
                    <circle cx="25" cy="25" r="25" fill="white" fillOpacity=".9" />
                    <path d="M25 37V14m0 0-7 8m7-8 7 8M13 37h24" fill="none" stroke="#246b49" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <text x="25" y="52" textAnchor="middle" fill="#647168" fontSize="9" fontWeight="700">N</text>
                  </g>
                </svg>
                <div className="absolute bottom-4 left-4 flex items-center gap-3 rounded-xl border border-white/80 bg-white/90 px-3 py-2 shadow-md backdrop-blur">
                  <span className="h-3 w-3 rounded-full bg-[#d95b35]" />
                  <span className="text-xs font-medium text-[#526158]">Air quality zones</span>
                  <span className="h-4 w-px bg-[#dce5de]" />
                  <span className="h-0.5 w-5 border-t-2 border-dashed border-[#2878e5]" />
                  <span className="text-xs font-medium text-[#526158]">Smoke path</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 sm:p-5">
                <div className="rounded-xl bg-[#f7f9f7] p-4">
                  <p className="text-xs font-medium text-[#78847d]">Current air quality</p>
                  <div className="mt-2 flex items-end gap-2">
                    <strong className="text-3xl font-semibold tracking-tight text-[#d95b35]">286</strong>
                    <span className="mb-1 text-xs font-semibold text-[#a64c2f]">Poor</span>
                  </div>
                </div>
                <div className="rounded-xl bg-[#f7f9f7] p-4">
                  <p className="text-xs font-medium text-[#78847d]">Upwind smoke arrival</p>
                  <div className="mt-2 flex items-center gap-2 text-[#174d35]">
                    <WindIcon size={20} />
                    <strong className="text-xl font-semibold">~14 hours</strong>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 border-t border-[#edf1ee] px-5 py-3 text-xs text-[#6a786f]">
                <LockIcon size={14} />
                Personal health readings stay on the user’s device.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[.16em] text-[#246b49]">ONE CLEARER PICTURE</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-.04em] text-[#17231c] sm:text-4xl">
            From changing weather to practical next steps.
          </h2>
        </div>
        <div className="mt-9 grid gap-4 md:grid-cols-3">
          {[
            { number: '01', title: 'See what is coming', text: 'Follow local AQI, inversion conditions and smoke movement with a rolling 72-hour outlook.' },
            { number: '02', title: 'Make a safer plan', text: 'Turn environmental signals into understandable guidance for families, schools and communities.' },
            { number: '03', title: 'Keep health private', text: 'Sensitive readings stay on-device. Sharing is limited to coarse risk information and explicit consent.' },
          ].map((item) => (
            <article key={item.number} className="rounded-2xl border border-[#e1e9e3] bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold tracking-widest text-[#7c9986]">{item.number}</p>
              <h3 className="mt-5 text-lg font-semibold text-[#17231c]">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#647168]">{item.text}</p>
            </article>
          ))}
        </div>
      </section>
      <footer className="border-t border-[#e1e9e3] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-6 text-xs text-[#78847d] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <span>Aethera · Environmental intelligence for Delhi NCR</span>
          <span>Support tool, not a medical device. In an emergency call 112.</span>
        </div>
      </footer>
    </main>
  )
}
