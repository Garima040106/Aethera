import { Link } from 'react-router-dom'
import {
  AetheraLogo,
  ArrowRightIcon,
  HeartPulseIcon,
  LockIcon,
  RouteIcon,
  ShieldAlertIcon,
  WindIcon,
} from '../components/Icons'

const signals = [
  { number: '01', title: 'Air, ahead of time', text: 'A rolling 72-hour outlook brings local AQI, inversion strength and changing conditions into one view.', tone: 'signal-card-sand' },
  { number: '02', title: 'Smoke, in motion', text: 'Follow upwind fire activity and an illustrative plume trajectory toward Delhi NCR.', tone: 'signal-card-sage' },
  { number: '03', title: 'Guidance, made human', text: 'Hindi-first and English guidance turns environmental signals into practical, calm next steps.', tone: 'signal-card-rose' },
]

const architecture = [
  { name: 'Observe', detail: 'CPCB · OpenAQ · NASA FIRMS · weather' },
  { name: 'Understand', detail: 'Forecast models · inversion · plume' },
  { name: 'Respond', detail: 'On-device signals · consent · care circle' },
]

function ForecastArtwork() {
  return (
    <div className="relative overflow-hidden rounded-[1.5rem] border border-[#e6e2d6] bg-[#fffdf6] shadow-[0_28px_90px_-44px_rgba(25,25,27,.45)]">
      <div className="flex items-center justify-between border-b border-[#ece9df] px-5 py-4 sm:px-6">
        <div>
          <p className="text-[10px] uppercase tracking-[.18em] text-[#85857b]">Aethera / live view</p>
          <p className="mt-1 font-display text-2xl leading-none text-[#19191b]">Delhi NCR</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-[#e6dfc8] bg-[#f8f2de] px-3 py-1.5 text-[11px] text-[#756333]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#bb8730]" />
          Conditions elevated
        </span>
      </div>

      <div className="grid gap-0 sm:grid-cols-[1fr_168px]">
        <div className="min-w-0 p-4 sm:p-6">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-xs text-[#82837c]">Coupled AQI outlook</p>
              <p className="mt-1 font-display text-4xl leading-none tracking-tight text-[#19191b]">Next 72 hours</p>
            </div>
            <span className="text-[10px] text-[#888980]">Illustrative preview</span>
          </div>
          <div className="overflow-x-auto">
            <svg viewBox="0 0 620 245" className="block min-w-[480px] w-full" role="img" aria-label="Illustrative 72-hour air quality forecast chart">
              <defs>
                <linearGradient id="forecast-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#9b6546" stopOpacity=".22" />
                  <stop offset="100%" stopColor="#9b6546" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[34, 78, 122, 166, 210].map((y) => <line key={y} x1="38" y1={y} x2="600" y2={y} stroke="#eeece4" />)}
              <rect x="238" y="34" width="112" height="176" rx="4" fill="#e8ddbd" fillOpacity=".38" />
              <path d="M38 174 C82 159 105 163 144 136 S205 118 238 127 S290 151 326 94 S385 76 421 95 S477 129 517 86 S572 70 600 61 L600 210 L38 210Z" fill="url(#forecast-fill)" />
              <path d="M38 174 C82 159 105 163 144 136 S205 118 238 127 S290 151 326 94 S385 76 421 95 S477 129 517 86 S572 70 600 61" fill="none" stroke="#80553f" strokeWidth="3" strokeLinecap="round" />
              <path d="M38 183 C82 176 105 167 144 166 S205 156 238 158 S290 148 326 142 S385 134 421 129 S477 123 517 116 S572 110 600 104" fill="none" stroke="#aaa99c" strokeWidth="2" strokeDasharray="5 6" />
              <g fill="#85867e" fontSize="10">
                <text x="38" y="232">NOW</text><text x="205" y="232">+24 H</text><text x="380" y="232">+48 H</text><text x="565" y="232">+72 H</text>
              </g>
            </svg>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-[#73756f]">
            <span className="inline-flex items-center gap-2"><i className="h-[2px] w-5 bg-[#80553f]" />Coupled outlook</span>
            <span className="inline-flex items-center gap-2"><i className="w-5 border-t border-dashed border-[#aaa99c]" />Without feedback</span>
            <span className="inline-flex items-center gap-2"><i className="h-3 w-3 rounded-sm bg-[#e8ddbd]/70" />Inversion window</span>
          </div>
        </div>

        <div className="grid grid-cols-2 border-t border-[#ece9df] sm:grid-cols-1 sm:border-l sm:border-t-0">
          <div className="border-r border-[#ece9df] p-4 sm:border-b sm:border-r-0 sm:p-5">
            <p className="text-[10px] uppercase tracking-[.15em] text-[#87877e]">Inversion</p>
            <p className="mt-3 font-display text-3xl leading-none text-[#19191b]">Strong</p>
            <p className="mt-2 text-[11px] leading-5 text-[#787970]">Reduced ventilation can keep pollution near the surface.</p>
          </div>
          <div className="p-4 sm:p-5">
            <p className="text-[10px] uppercase tracking-[.15em] text-[#87877e]">Upwind activity</p>
            <div className="mt-3 flex items-center gap-2 text-[#80553f]">
              <WindIcon size={19} />
              <span className="font-display text-2xl leading-none text-[#19191b]">Plume watch</span>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-[#787970]">Fire signals and weather, brought into context.</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-[#ece9df] bg-[#f8f6ed] px-5 py-3 text-[11px] text-[#75766f] sm:px-6">
        <span>Designed for neighborhood-scale awareness</span>
        <span className="shrink-0">Model preview</span>
      </div>
    </div>
  )
}

function CompanionPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[310px] rounded-[2.2rem] border border-[#d9d5c9] bg-[#19191b] p-2.5 shadow-[0_24px_60px_-24px_rgba(25,25,27,.5)]">
      <div className="overflow-hidden rounded-[1.7rem] bg-[#fffef3]">
        <div className="flex items-center justify-between px-5 pb-4 pt-5">
          <div>
            <p className="text-[10px] uppercase tracking-[.15em] text-[#82837c]">Aethera companion</p>
            <p className="mt-1 font-display text-2xl leading-none text-[#19191b]">नमस्ते, Kamla</p>
          </div>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#eeece1] text-[#19191b]"><HeartPulseIcon size={18} /></span>
        </div>
        <div className="mx-4 rounded-2xl bg-[#f2efe4] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#696b65]">आपकी हवा</span>
            <span className="rounded-full bg-[#e8ddbd] px-2.5 py-1 text-[10px] text-[#756333]">ध्यान दें</span>
          </div>
          <p className="mt-3 font-display text-[2.6rem] leading-none text-[#19191b]">286</p>
          <p className="mt-2 text-xs leading-5 text-[#73756f]">बाहर जाने से पहले हवा की स्थिति देखें।</p>
        </div>
        <div className="mx-4 my-3 flex items-start gap-3 rounded-2xl border border-[#e8e5dc] bg-[#fffdf6] p-3.5">
          <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#19191b] text-white"><LockIcon size={14} /></span>
          <div>
            <p className="text-xs text-[#333430]">आपकी जानकारी, आपके पास</p>
            <p className="mt-1 text-[11px] leading-4 text-[#81827a]">व्यक्तिगत स्वास्थ्य संकेत इसी डिवाइस पर रहते हैं।</p>
          </div>
        </div>
        <div className="mx-4 mb-4 rounded-2xl bg-[#19191b] px-4 py-3 text-white">
          <p className="text-[10px] uppercase tracking-[.14em] text-white/55">Check-in</p>
          <p className="mt-1 font-display text-xl">क्या आप ठीक हैं?</p>
          <div className="mt-3 flex gap-2">
            <span className="rounded-full bg-[#fffef3] px-4 py-1.5 text-[11px] text-[#19191b]">हाँ, ठीक हूँ</span>
            <span className="rounded-full border border-white/25 px-4 py-1.5 text-[11px] text-white/75">मदद चाहिए</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <main className="public-home overflow-hidden bg-[#fffef3] text-[#19191b]">
      <section className="relative isolate">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_78%_20%,#e8e5d5_0%,transparent_40%),linear-gradient(135deg,#fffef3_0%,#f5f2e7_100%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24 lg:grid-cols-[.88fr_1.12fr] lg:gap-14 lg:px-10 lg:pb-32 lg:pt-28">
          <div className="relative z-10">
            <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-[#e4dfd0] bg-[#fffef3]/80 px-3.5 py-2 text-[10px] uppercase tracking-[.17em] text-[#62635c]">
              <AetheraLogo size={17} />
              Environmental intelligence · Delhi NCR
            </div>
            <h1 className="max-w-2xl font-display text-[3.5rem] font-medium leading-[.92] tracking-[-.045em] text-[#19191b] sm:text-7xl lg:text-[5.6rem]">
              The air has a story.
              <span className="mt-2 block italic text-[#80553f]">See what comes next.</span>
            </h1>
            <p className="mt-7 max-w-lg text-base leading-7 text-[#62635c] sm:text-lg sm:leading-8">
              Aethera brings air quality, weather and upwind fire activity into one evolving picture—then makes it useful for the people you care about.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/login" className="group inline-flex min-h-12 items-center gap-3 rounded-full bg-[#19191b] px-6 text-sm text-white no-underline transition hover:bg-[#38383a]">
                Enter the experience <ArrowRightIcon className="transition-transform group-hover:translate-x-1" size={17} />
              </Link>
              <a href="#product" className="inline-flex min-h-12 items-center rounded-full border border-[#d9d5c9] px-5 text-sm text-[#42433f] no-underline transition hover:bg-white/70">
                Explore the product
              </a>
            </div>
            <div className="mt-12 flex max-w-lg flex-wrap gap-x-8 gap-y-4 border-t border-[#e2dfd4] pt-5">
              <div><p className="font-display text-3xl leading-none">72h</p><p className="mt-1 text-[10px] uppercase tracking-[.12em] text-[#77786f]">forecast window</p></div>
              <div><p className="font-display text-3xl leading-none">On-device</p><p className="mt-1 text-[10px] uppercase tracking-[.12em] text-[#77786f]">personal signals</p></div>
              <div><p className="font-display text-3xl leading-none">Hindi + English</p><p className="mt-1 text-[10px] uppercase tracking-[.12em] text-[#77786f]">human guidance</p></div>
            </div>
          </div>
          <ForecastArtwork />
        </div>
      </section>

      <section className="border-y border-[#e8e4d9] bg-[#19191b] text-[#fffef3]">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-7 sm:grid-cols-[.7fr_2fr] sm:items-center sm:px-8 lg:px-10">
          <p className="text-[10px] uppercase tracking-[.18em] text-white/50">One connected picture</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {architecture.map((item) => (
              <div key={item.name} className="border-l border-white/20 pl-4">
                <p className="font-display text-2xl leading-none">{item.name}</p>
                <p className="mt-2 text-[11px] leading-5 text-white/55">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="product" className="mx-auto max-w-7xl px-6 py-20 sm:px-8 sm:py-28 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-[10px] uppercase tracking-[.18em] text-[#80553f]">A clearer forecast</p>
            <h2 className="mt-4 max-w-xl font-display text-5xl font-medium leading-[.96] tracking-[-.035em] sm:text-6xl">
              Not just what the air is.
              <span className="italic text-[#80553f]"> What it might become.</span>
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-[#66675f] lg:justify-self-end">
            A coupled 72-hour forecast brings together pollution and weather behavior. Inversion strength and forward plume movement add context beyond a single reading.
          </p>
        </div>
        <div className="mt-12 grid gap-3 md:grid-cols-3 md:gap-4">
          {signals.map((item) => (
            <article key={item.number} className={`signal-card ${item.tone}`}>
              <p className="font-display text-3xl italic text-[#80553f]/75">{item.number}</p>
              <h3 className="mt-5 font-display text-3xl font-medium tracking-tight">{item.title}</h3>
              <p className="mt-3 max-w-sm text-sm leading-6 text-[#62635c]">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="companion" className="relative overflow-hidden bg-[#edeadd]">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 sm:px-8 sm:py-24 lg:grid-cols-[1fr_.9fr] lg:px-10">
          <div className="order-2 lg:order-1">
            <CompanionPreview />
          </div>
          <div className="order-1 lg:order-2 lg:pl-10">
            <p className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[.18em] text-[#80553f]">
              <HeartPulseIcon size={16} /> Personal companion
            </p>
            <h2 className="mt-5 max-w-lg font-display text-5xl font-medium leading-[.96] tracking-[-.035em] sm:text-6xl">
              Care that feels close.
              <span className="block italic text-[#80553f]">Privacy that stays closer.</span>
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-[#62635c]">
              The companion experience pairs simple check-ins and Hindi-first guidance with on-device signal awareness. Personal readings stay on the phone; only consented, coarse risk information is intended to be shared.
            </p>
            <div className="mt-7 flex items-start gap-3 border-t border-[#d7d2c4] pt-5">
              <LockIcon className="mt-0.5 shrink-0 text-[#80553f]" size={17} />
              <p className="max-w-md text-xs leading-5 text-[#72736b]">Privacy-by-design is part of the product—not a setting hidden at the end.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="care-circle" className="mx-auto max-w-7xl px-6 py-20 sm:px-8 sm:py-28 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[.18em] text-[#80553f]">
              <ShieldAlertIcon size={16} /> A calmer care circle
            </p>
            <h2 className="mt-5 max-w-xl font-display text-5xl font-medium leading-[.96] tracking-[-.035em] sm:text-6xl">
              When it matters,
              <span className="block italic text-[#80553f]">make the next step clear.</span>
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-[#66675f]">
              A consent-aware alert ladder is designed to check in first, allow time to respond, and give caregivers calm, actionable context instead of raw personal data.
            </p>
            <Link to="/login" className="group mt-7 inline-flex items-center gap-2 text-sm text-[#19191b] no-underline">
              See the caregiver experience <ArrowRightIcon className="transition-transform group-hover:translate-x-1" size={16} />
            </Link>
          </div>
          <div className="relative">
            <div className="absolute -inset-5 rounded-[2rem] bg-[#e5e1d3] blur-2xl" />
            <div className="relative rounded-[1.5rem] border border-[#e5e1d4] bg-[#fffdf6] p-5 shadow-[0_20px_60px_-38px_rgba(25,25,27,.4)] sm:p-7">
              <div className="flex items-center justify-between border-b border-[#ece9df] pb-5">
                <div>
                  <p className="text-[10px] uppercase tracking-[.16em] text-[#82837c]">Care circle · preview</p>
                  <p className="mt-1 font-display text-3xl">A check-in, not a panic button.</p>
                </div>
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#19191b] text-white"><RouteIcon size={19} /></span>
              </div>
              <ol className="mt-5 space-y-0">
                {[
                  ['01', 'Notice', 'A potential concern is flagged on the device.'],
                  ['02', 'Check in', 'The person gets a clear chance to confirm they are okay.'],
                  ['03', 'Escalate with consent', 'Only coarse, permitted context is shared with the care circle.'],
                ].map(([number, title, detail], index) => (
                  <li key={number} className="grid grid-cols-[42px_1fr] gap-3">
                    <div className="flex flex-col items-center">
                      <span className="grid h-8 w-8 place-items-center rounded-full border border-[#d9d5c9] font-display text-lg">{number}</span>
                      {index < 2 && <span className="my-1 h-8 w-px bg-[#dedacf]" />}
                    </div>
                    <div className="pb-5">
                      <p className="text-sm text-[#343530]">{title}</p>
                      <p className="mt-1 text-xs leading-5 text-[#77786f]">{detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="rounded-xl bg-[#f2efe4] px-4 py-3 text-[11px] leading-5 text-[#72736b]">
                Prototype workflow for demonstration. Not emergency monitoring or medical diagnosis.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 sm:px-8 sm:pb-28 lg:px-10">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#19191b] px-6 py-12 text-[#fffef3] sm:px-10 sm:py-16 lg:px-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-[10px] uppercase tracking-[.18em] text-white/50">A more human way to read the environment</p>
              <h2 className="mt-5 max-w-3xl font-display text-5xl font-medium leading-[.94] tracking-[-.035em] sm:text-7xl">
                See the signals.
                <span className="block italic text-[#d9c7a8]">Choose your next move.</span>
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/60">
                Explore the Aethera prototype for neighborhood forecasts, personal guidance and a more thoughtful care circle.
              </p>
            </div>
            <Link to="/login" className="group inline-flex min-h-12 items-center justify-center gap-3 self-start rounded-full bg-[#fffef3] px-6 text-sm text-[#19191b] no-underline transition hover:bg-[#e9e5d8] lg:self-end">
              Open the experience <ArrowRightIcon className="transition-transform group-hover:translate-x-1" size={17} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
