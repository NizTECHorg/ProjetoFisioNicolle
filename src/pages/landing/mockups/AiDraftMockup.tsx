import { Check, Quote, Sparkles } from 'lucide-react'

// Rascunho fictício: cada frase vem de um trecho do prontuário (a origem aparece ao lado).
const LINHAS = [
  { rotulo: 'Queixa', texto: 'Dor lombar ao sentar há 3 meses.', origem: 'Cadastro' },
  { rotulo: 'Evolução', texto: 'EVA caiu de 7 para 3 em 6 sessões.', origem: 'Sessões' },
  { rotulo: 'Conduta', texto: 'Fortalecimento de core e mobilidade.', origem: 'Sessão 6' },
]

/** Resumo com IA. O texto é "digitado" linha a linha em loop. */
export function AiDraftMockup() {
  return (
    <div aria-hidden="true" className="max-w-full rounded-xl border border-line bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
          <span className="lp-m-wobble inline-flex">
            <Sparkles size={16} className="text-accent" />
          </span>
          Resumo
        </span>
        <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-[#1e3a8a]">
          Rascunho para revisão
        </span>
      </div>
      <ul className="mt-4 flex flex-col gap-2.5 rounded-xl bg-canvas p-3">
        {LINHAS.map((l, i) => (
          <li key={l.rotulo} className="flex items-start justify-between gap-2">
            <p
              className="lp-m-type min-w-0 text-sm leading-5 text-ink"
              style={{ animationDelay: `${i * 0.7}s` }}
            >
              <span className="font-semibold text-[#1e3a8a]">{l.rotulo}: </span>
              {l.texto}
            </p>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-muted ring-1 ring-line">
              <Quote size={10} />
              {l.origem}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="text-xs text-muted">Só usa o que está escrito</p>
        <span className="lp-m-glow inline-flex items-center gap-1.5 rounded-2xl bg-forest px-4 py-2 text-sm font-semibold text-white">
          <Check size={14} />
          Revisar e salvar
        </span>
      </div>
    </div>
  )
}
