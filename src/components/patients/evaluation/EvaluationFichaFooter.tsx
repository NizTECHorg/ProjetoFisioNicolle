import { ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FICHA_PAGES, type FichaPageId } from '@/components/patients/evaluation/EvaluationFichaForm'
import { fichaPagerState } from '@/lib/evaluationFooter'

type EvaluationFichaFooterProps = {
  page: FichaPageId
  onNext: () => void
  onSave: () => void
  onCancel: () => void
  cancelLabel: string
  saving: boolean
  saveDisabled: boolean
  className?: string
}

const PAGE_IDS = FICHA_PAGES.map((p) => p.id)

/**
 * Rodapé compacto da avaliação (abaixo de xl): gruda logo acima da navegação móvel
 * (52px + área segura, com 8px de folga) e, sem ela (lg+), perto do fim da tela.
 */
export function EvaluationFichaFooter({
  page,
  onNext,
  onSave,
  onCancel,
  cancelLabel,
  saving,
  saveDisabled,
  className = '',
}: EvaluationFichaFooterProps) {
  const { n, total, percent, isLast } = fichaPagerState(PAGE_IDS, page)
  const progressText = `Página ${n} de ${total}`
  const buttonClassName = 'min-h-10 min-w-0 rounded-full !px-2 !py-2 !text-[13px] !shadow-none'

  return (
    <div
      className={[
        'sticky bottom-[calc(3.75rem+max(0.5rem,env(safe-area-inset-bottom)))] z-20 lg:bottom-3',
        'overflow-hidden rounded-2xl border border-line bg-surface/95 shadow-[0_6px_20px_rgba(11,29,54,0.14)] backdrop-blur-md',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        className="h-1 bg-canvas"
        role="progressbar"
        aria-label="Progresso da avaliação clínica"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={n}
        aria-valuetext={progressText}
      >
        <div
          className="h-full rounded-r-full bg-accent transition-[width] duration-200 motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex items-center gap-2 p-2">
        <span className="shrink-0 pl-1 text-xs font-semibold tabular-nums text-muted" aria-hidden="true">
          {n}/{total}
        </span>

        <div className="grid min-w-0 flex-1 grid-cols-3 gap-1.5">
          <Button
            type="button"
            variant="ghost"
            className={buttonClassName}
            onClick={onCancel}
            disabled={saving}
          >
            {cancelLabel}
          </Button>

          <Button
            type="button"
            variant="primary"
            className={buttonClassName}
            aria-label="Salvar avaliação"
            aria-busy={saving}
            onClick={onSave}
            isLoading={saving}
            disabled={saveDisabled}
          >
            Salvar
          </Button>

          {!isLast ? (
            <Button
              type="button"
              variant="secondary"
              className={buttonClassName}
              aria-label="Próxima página"
              onClick={onNext}
              disabled={saving}
            >
              <span>Próxima</span>
              <ArrowRight size={15} aria-hidden="true" />
            </Button>
          ) : (
            <Button
              type="submit"
              variant="secondary"
              className={buttonClassName}
              aria-label="Concluir avaliação"
              disabled={saveDisabled || saving}
            >
              <Check size={15} aria-hidden="true" />
              <span>Concluir</span>
            </Button>
          )}
        </div>
      </div>

      {saveDisabled ? (
        <p className="px-3 pb-2 text-xs text-muted">Informe a data da avaliação para salvar.</p>
      ) : null}
    </div>
  )
}
