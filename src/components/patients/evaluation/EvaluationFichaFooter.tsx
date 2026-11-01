import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FICHA_PAGES, type FichaPageId } from '@/components/patients/evaluation/EvaluationFichaForm'
import { fichaPagerState } from '@/lib/evaluationFooter'

type EvaluationFichaFooterProps = {
  page: FichaPageId
  onNext: () => void
  onPrev: () => void
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
 * Celular: só setas (voltar na ponta esquerda, avançar na direita). Tablet: setas com texto,
 * menores que Cancelar/Salvar. No desktop (xl) os botões ficam na lateral.
 */
export function EvaluationFichaFooter({
  page,
  onNext,
  onPrev,
  onSave,
  onCancel,
  cancelLabel,
  saving,
  saveDisabled,
  className = '',
}: EvaluationFichaFooterProps) {
  const { n, total, percent, isFirst, isLast } = fichaPagerState(PAGE_IDS, page)
  const progressText = `Página ${n} de ${total}`
  const buttonClassName = 'min-h-10 min-w-0 rounded-full !px-2 !py-2 !text-[13px] !shadow-none'
  // Setas: círculo de 40px no celular; no tablet, pílula baixa com texto (menor que Salvar/Cancelar).
  const navClassName =
    'h-10 w-10 shrink-0 rounded-full !p-0 !shadow-none md:h-9 md:w-auto md:gap-1.5 md:!px-3 md:!text-xs'

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

      <div className="flex items-center gap-1.5 p-2 md:gap-2">
        <Button
          type="button"
          variant="secondary"
          className={navClassName}
          aria-label="Página anterior"
          title="Página anterior"
          onClick={onPrev}
          disabled={saving || isFirst}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span className="hidden md:inline">Anterior</span>
        </Button>

        <span className="hidden shrink-0 text-xs font-semibold tabular-nums text-muted md:inline" aria-hidden="true">
          {n}/{total}
        </span>

        <div className="grid min-w-0 flex-1 grid-cols-2 gap-1.5">
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
        </div>

        {/*
          Na última página a seta só fica desativada (nada de "Concluir" aqui). Trocar este botão
          por um botão de envio no mesmo clique fazia o navegador enviar o formulário ao chegar na
          página 4, sem deixar editar. Para gravar, use Salvar.
        */}
        <Button
          type="button"
          variant="secondary"
          className={navClassName}
          aria-label="Próxima página"
          title={isLast ? 'Você está na última página' : 'Próxima página'}
          onClick={onNext}
          disabled={saving || isLast}
        >
          <span className="hidden md:inline">Próxima</span>
          <ArrowRight size={16} aria-hidden="true" />
        </Button>
      </div>

      {saveDisabled ? (
        <p className="px-3 pb-2 text-xs text-muted">Informe a data da avaliação para salvar.</p>
      ) : null}
    </div>
  )
}
