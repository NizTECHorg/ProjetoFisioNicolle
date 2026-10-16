import { CalendarClock, LayoutDashboard, Users, Wallet, ClipboardList } from 'lucide-react'
import homiLp from '@/assets/landing/homi-lp.webp'
import { smoothLinePath } from '@/lib/smoothPath'
import { HERO_DESKTOP_IMAGE, HERO_MOBILE_IMAGE } from './landing.config'
import { useParallax } from './useParallax'

const CHART = smoothLinePath([
  { x: 0, y: 46 },
  { x: 40, y: 38 },
  { x: 80, y: 42 },
  { x: 120, y: 26 },
  { x: 160, y: 30 },
  { x: 200, y: 14 },
  { x: 240, y: 10 },
])

const PAIN = smoothLinePath([
  { x: 2, y: 4 },
  { x: 20, y: 8 },
  { x: 38, y: 14 },
  { x: 56, y: 20 },
  { x: 78, y: 26 },
])

const SIDEBAR = [LayoutDashboard, Users, CalendarClock, ClipboardList, Wallet]

/** Prévia ilustrada da tela do computador (placeholder até ter a captura real). */
function DesktopPreview() {
  return (
    <div className="flex h-full w-full bg-canvas">
      <div className="flex w-[13%] flex-col items-center gap-2 bg-forest py-3 sm:gap-3.5 sm:py-4">
        <span className="mb-1 h-3 w-3 rounded-md bg-accent sm:h-4 sm:w-4" />
        {SIDEBAR.map((Icon, i) => (
          <Icon key={i} className={['h-2.5 w-2.5 sm:h-4 sm:w-4', i === 1 ? 'text-white' : 'text-white/40'].join(' ')} />
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-[3.5%] p-[3.5%]">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="h-2 w-24 rounded-full bg-ink/80 sm:h-2.5 sm:w-32" />
            <span className="h-1.5 w-16 rounded-full bg-muted/40 sm:h-2 sm:w-20" />
          </div>
          <span className="h-4 w-14 rounded-full bg-forest sm:h-6 sm:w-20" />
        </div>
        <div className="grid grid-cols-3 gap-[3%]">
          {['bg-accent', 'bg-sage', 'bg-[#1e3a8a]'].map((color) => (
            <div key={color} className="rounded-lg bg-surface p-[8%] shadow-sm">
              <span className={['block h-1 w-1/3 rounded-full', color].join(' ')} />
              <span className="mt-2 block h-2 w-2/3 rounded-full bg-ink/70 sm:h-3" />
              <span className="mt-1.5 block h-1.5 w-1/2 rounded-full bg-muted/30" />
            </div>
          ))}
        </div>
        <div className="grid flex-1 grid-cols-5 gap-[3%]">
          <div className="col-span-3 rounded-lg bg-surface p-[5%] shadow-sm">
            <span className="block h-1.5 w-1/3 rounded-full bg-ink/60 sm:h-2" />
            <svg viewBox="0 0 240 56" className="mt-2 h-[70%] w-full" preserveAspectRatio="none" fill="none">
              <path d={`${CHART} L 240 56 L 0 56 Z`} fill="#2f7dff" fillOpacity="0.12" />
              <path d={CHART} stroke="#2f7dff" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
          <div className="col-span-2 flex flex-col gap-[8%] rounded-lg bg-surface p-[6%] shadow-sm">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-[8%]">
                <span className={['h-3 w-3 shrink-0 rounded-full sm:h-4 sm:w-4', i % 2 ? 'bg-sage/30' : 'bg-accent/25'].join(' ')} />
                <span className="h-1.5 flex-1 rounded-full bg-ink/20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Prévia ilustrada da tela do celular. */
function MobilePreview() {
  return (
    <div className="flex h-full w-full flex-col gap-[4%] bg-canvas p-[7%] pt-[16%]">
      <div className="flex items-center gap-[6%]">
        <span className="aspect-square w-[22%] rounded-full bg-accent-soft ring-2 ring-white" />
        <div className="flex flex-1 flex-col gap-1">
          <span className="h-1.5 w-4/5 rounded-full bg-ink/80" />
          <span className="h-1 w-1/2 rounded-full bg-muted/40" />
        </div>
      </div>
      <div className="relative rounded-xl bg-surface p-[6%] shadow-sm">
        <img src={homiLp} alt="" width={640} height={623} className="mx-auto w-[85%]" loading="eager" decoding="async" />
        <span className="absolute left-[33%] top-[27%] h-2 w-2 rounded-full bg-accent ring-2 ring-accent/25" />
        <span className="absolute left-[47%] top-[50%] h-2 w-2 rounded-full bg-accent ring-2 ring-accent/25" />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-[6%] rounded-lg bg-surface p-[5%] shadow-sm">
          <span className={['h-2.5 w-2.5 shrink-0 rounded-full', i === 0 ? 'bg-sage' : 'bg-accent/40'].join(' ')} />
          <span className="h-1.5 flex-1 rounded-full bg-ink/25" />
        </div>
      ))}
    </div>
  )
}

/** Hero: tela do computador atrás e celular na frente, sobrepostos. */
export function HeroDevices() {
  const desktopRef = useParallax<HTMLDivElement>(0.05)
  const phoneRef = useParallax<HTMLDivElement>(-0.1)
  const chipRef = useParallax<HTMLDivElement>(-0.18)

  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-xl pb-10 pl-6 sm:pl-12 lg:max-w-none lg:pl-16">
      {/* Computador (a captura já vem com a moldura do navegador) */}
      <div ref={desktopRef}>
        {HERO_DESKTOP_IMAGE ? (
          <img
            src={HERO_DESKTOP_IMAGE}
            alt=""
            width={1600}
            height={1067}
            className="lp-hero-in block h-auto w-full drop-shadow-[0_30px_50px_rgba(11,29,54,0.22)] [animation-delay:150ms]"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        ) : (
          <div className="lp-hero-in overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_30px_80px_rgba(11,29,54,0.18)] [animation-delay:150ms]">
            <div className="flex items-center gap-1.5 border-b border-line bg-surface px-3 py-2 sm:px-4 sm:py-2.5">
              <span className="h-2 w-2 rounded-full bg-[#ff6b6b] sm:h-2.5 sm:w-2.5" />
              <span className="h-2 w-2 rounded-full bg-[#ffc94d] sm:h-2.5 sm:w-2.5" />
              <span className="h-2 w-2 rounded-full bg-sage sm:h-2.5 sm:w-2.5" />
              <span className="ml-3 hidden h-4 flex-1 rounded-full bg-canvas sm:block" />
            </div>
            <div className="aspect-[16/10] w-full">
              <DesktopPreview />
            </div>
          </div>
        )}
      </div>

      {/* Celular, na frente e sobreposto (a captura já vem com a moldura) */}
      <div ref={phoneRef} className="absolute bottom-0 left-0 z-10 w-[30%] min-w-[104px] max-w-[200px] lg:w-[31%]">
        <div className="lp-float">
          {HERO_MOBILE_IMAGE ? (
            <img
              src={HERO_MOBILE_IMAGE}
              alt=""
              width={600}
              height={1199}
              className="lp-hero-in block h-auto w-full drop-shadow-[0_24px_40px_rgba(11,29,54,0.35)] [animation-delay:350ms]"
              loading="eager"
              decoding="async"
            />
          ) : (
            <div className="lp-hero-in rounded-[1.6rem] border-[5px] border-forest bg-forest shadow-[0_24px_60px_rgba(11,29,54,0.35)] [animation-delay:350ms] sm:rounded-[2rem] sm:border-[7px]">
              <div className="relative aspect-[9/19] overflow-hidden rounded-[1.2rem] bg-canvas sm:rounded-[1.55rem]">
                <span className="absolute left-1/2 top-[2.5%] z-10 h-[3%] w-[34%] -translate-x-1/2 rounded-full bg-forest" />
                <MobilePreview />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chip flutuante */}
      <div ref={chipRef} className="absolute -right-1 top-[12%] z-20 sm:-right-4">
        <div className="lp-float lp-float-delay">
          <div className="lp-hero-in flex items-center gap-3 rounded-2xl border border-line bg-surface/95 px-3 py-2.5 shadow-lg backdrop-blur [animation-delay:550ms] sm:px-4 sm:py-3">
            <div>
              <p className="text-sm font-semibold text-ink">Dor: 7 → 3</p>
              <svg viewBox="0 0 80 32" className="mt-1 h-6 w-16 sm:h-8 sm:w-20" fill="none">
                <path d={PAIN} stroke="#24b296" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
