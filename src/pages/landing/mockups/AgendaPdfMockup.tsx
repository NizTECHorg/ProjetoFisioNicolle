import { Check, FileText, Repeat } from 'lucide-react'

const DAYS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']
// índice do dia -> sessões (iniciais); a de Ana se repete toda segunda e quarta
const BLOCKS: Record<number, { ini: string; repete?: boolean }[]> = {
  0: [{ ini: 'AN', repete: true }, { ini: 'BR' }],
  1: [{ ini: 'CA' }],
  2: [{ ini: 'AN', repete: true }, { ini: 'DI' }],
  3: [{ ini: 'EL' }],
  4: [{ ini: 'BR' }, { ini: 'FA' }],
}

/** Semana com sessões repetidas e PDF. No hover, as sessões entram e o PDF se monta. */
export function AgendaPdfMockup() {
  let ordem = 0
  return (
    <div aria-hidden="true" className="grid max-w-full grid-cols-5 gap-4 rounded-xl border border-line bg-surface p-4 shadow-sm">
      <div className="col-span-3">
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#1e3a8a]">
          <Repeat size={13} />
          Seg e Qua · toda semana
        </div>
        <div className="grid grid-cols-7 gap-1">
          {DAYS.map((d, i) => (
            <div key={i} className="flex flex-col gap-1">
              <span className="text-center text-sm font-semibold text-muted">{d}</span>
              <div className="flex h-28 flex-col gap-1 rounded-lg bg-canvas p-1">
                {(BLOCKS[i] ?? []).map((b, j) => {
                  const delay = ordem++ * 0.12
                  return (
                    <span
                      key={j}
                      className={[
                        'lp-h-pop flex h-7 items-center justify-center rounded-md text-[10px] font-semibold',
                        b.repete ? 'bg-accent text-white' : 'bg-accent-soft text-[#1e3a8a]',
                      ].join(' ')}
                      style={{ animationDelay: `${delay}s` }}
                    >
                      {b.ini}
                    </span>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative col-span-2 flex flex-col gap-2 rounded-lg border border-line bg-canvas p-3">
        <div className="flex items-center justify-between">
          <FileText size={18} className="text-[#1e3a8a]" />
          <span className="rounded-md bg-forest px-1.5 py-0.5 text-xs font-semibold text-white">PDF</span>
        </div>
        <p className="text-xs font-semibold text-ink">Avaliação · Ana</p>
        {[100, 85, 95, 70, 90].map((w, i) => (
          <span
            key={i}
            className="lp-h-fill block h-1.5 origin-left rounded-full bg-ink/15"
            style={{ width: `${w}%`, animationDelay: `${0.3 + i * 0.12}s` }}
          />
        ))}
        <span
          className="lp-h-pop absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-sage text-white shadow"
          style={{ animationDelay: '1s' }}
        >
          <Check size={14} />
        </span>
      </div>
    </div>
  )
}
