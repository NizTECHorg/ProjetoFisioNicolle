import { FileText } from 'lucide-react'

const DAYS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']
// índice do dia -> blocos (true = destacado)
const BLOCKS: Record<number, boolean[]> = {
  0: [false, false],
  1: [false],
  2: [false, true],
  3: [false],
  4: [false, false],
}

export function AgendaPdfMockup() {
  return (
    <div
      aria-hidden="true"
      className="grid max-w-full grid-cols-5 gap-4 rounded-xl border border-line bg-surface p-4 shadow-sm"
    >
      <div className="col-span-3">
        <div className="grid grid-cols-7 gap-1">
          {DAYS.map((d, i) => (
            <div key={i} className="flex flex-col gap-1">
              <span className="text-center text-sm font-semibold text-muted">
                {d}
              </span>
              <div className="flex h-28 flex-col gap-1 rounded-lg bg-canvas p-1">
                {(BLOCKS[i] ?? []).map((hl, j) => (
                  <span
                    key={j}
                    className={['h-6 rounded-md', hl ? 'bg-accent' : 'bg-accent-soft'].join(' ')}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="col-span-2 flex flex-col gap-2 rounded-lg border border-line bg-canvas p-3">
        <div className="flex items-center justify-between">
          <FileText size={18} className="text-[#1e3a8a]" />
          <span className="rounded-md bg-forest px-1.5 py-0.5 text-sm font-semibold text-white">
            PDF
          </span>
        </div>
        <span className="h-2.5 w-3/4 rounded-full bg-ink/20" />
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className={`h-2 rounded-full bg-line ${i % 2 ? 'w-5/6' : 'w-full'}`} />
        ))}
      </div>
    </div>
  )
}
