import { FileClock } from 'lucide-react'
import { rotuloRascunho } from '@/lib/rascunhosLocais'

type Props = {
  salvoEm: number
  texto: string
  onDescartar: () => void
  /** Sem ele o aviso só informa (o formulário já está aberto com o rascunho). */
  onContinuar?: () => void
}

/** Aviso de rascunho guardado neste aparelho, com continuar e descartar. */
export function RascunhoAviso({ salvoEm, texto, onDescartar, onContinuar }: Props) {
  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
    >
      <FileClock size={16} className="shrink-0" aria-hidden />
      <span className="min-w-0 flex-1">
        {texto} <span className="text-amber-800/80">Salvo em {rotuloRascunho(salvoEm)}, neste aparelho.</span>
      </span>
      <span className="flex shrink-0 items-center gap-1">
        {onContinuar ? (
          <button type="button" onClick={onContinuar} className="min-h-9 rounded-lg px-2 font-semibold text-forest">
            Continuar
          </button>
        ) : null}
        <button type="button" onClick={onDescartar} className="min-h-9 rounded-lg px-2 font-medium text-amber-900 hover:text-error">
          Descartar
        </button>
      </span>
    </div>
  )
}
