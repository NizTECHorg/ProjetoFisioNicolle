import { Sparkles } from 'lucide-react'

const LINES = ['w-full', 'w-11/12', 'w-full', 'w-3/4', 'w-5/6']

export function AiDraftMockup() {
  return (
    <div
      aria-hidden="true"
      className="max-w-full rounded-xl border border-line bg-surface p-4 shadow-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
          <Sparkles size={16} className="text-[#1e3a8a]" />
          Resumo
        </span>
        <span className="rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold text-ink">
          Rascunho para revisão
        </span>
      </div>
      <div className="mt-4 flex flex-col gap-2 rounded-xl bg-canvas p-4">
        {LINES.map((w, i) => (
          <span key={i} className={`h-2.5 rounded-full bg-line ${w}`} />
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <span className="inline-flex items-center rounded-2xl border border-line px-4 py-2 text-sm font-semibold text-ink">
          Revisar e salvar
        </span>
      </div>
    </div>
  )
}
