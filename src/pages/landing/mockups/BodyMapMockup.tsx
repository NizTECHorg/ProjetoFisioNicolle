import { Activity, Gauge } from 'lucide-react'
import homiLp from '@/assets/landing/homi-lp.webp'
import muirLp from '@/assets/landing/muir-lp.webp'

const CHIPS = [
  { icon: Activity, label: 'Tipo de dor: em pontada', selected: false },
  { icon: Gauge, label: 'EVA 7', selected: true },
]

export function BodyMapMockup() {
  return (
    <div
      aria-hidden="true"
      className="max-w-full rounded-xl border border-line bg-surface p-4 shadow-sm"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="relative aspect-[640/623] rounded-xl bg-canvas">
          <img
            src={homiLp}
            width={640}
            height={623}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain"
          />
          <span className="absolute left-[30%] top-[22%] h-4 w-4 rounded-full bg-accent/70 ring-4 ring-accent/20" />
          <span className="absolute left-[58%] top-[72%] h-4 w-4 rounded-full bg-accent/70 ring-4 ring-accent/20" />
        </div>
        <div className="relative aspect-[640/623] rounded-xl bg-canvas">
          <img
            src={muirLp}
            width={640}
            height={623}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain"
          />
          <span className="absolute left-[48%] top-[46%] h-4 w-4 rounded-full bg-accent/70 ring-4 ring-accent/20" />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {CHIPS.map(({ icon: Icon, label, selected }) => (
          <span
            key={label}
            className={[
              'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold',
              selected
                ? 'border-accent bg-accent text-white'
                : 'border-line bg-accent-soft text-ink',
            ].join(' ')}
          >
            <Icon size={16} className={selected ? 'text-white' : 'text-[#1e3a8a]'} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
