import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useWatch, type Control } from 'react-hook-form'
import type { EvaluationFormData } from '@/schemas/evaluation.schema'
import { Button } from '@/components/ui/Button'
import {
  FICHA_BLOCOS,
  FICHA_PAGES,
  type FichaPageId,
} from '@/components/patients/evaluation/EvaluationFichaForm'
import { fichaBlocoDomId } from '@/components/patients/evaluation/fichaFormPrimitives'
import { blocoPreenchido } from '@/lib/fichaPreenchimento'

type Props = {
  page: FichaPageId
  onPageChange: (page: FichaPageId) => void
  onCancel: () => void
  cancelLabel: string
  submitLabel: string
  saving: boolean
  submitDisabled?: boolean
  /** id do <form>: a lateral fica fora dele no DOM (portal), então o Salvar usa form=… */
  formId: string
  /** Para ler a ficha (useWatch só re-renderiza a lateral) e pintar os bullets preenchidos. */
  control: Control<EvaluationFormData>
}

function nomePagina(label: string): string {
  return label.replace(/^\d+\s*·\s*/, '')
}

/**
 * Navegação da avaliação só no desktop (xl+): páginas e blocos à direita, fixa na rolagem
 * (sticky dentro da coluna, então não passa do topo do editor) e com Salvar sempre visível.
 */
export function EvaluationFichaSidebar({
  page,
  onPageChange,
  onCancel,
  cancelLabel,
  submitLabel,
  saving,
  submitDisabled,
  formId,
  control,
}: Props) {
  const ficha = useWatch({ control, name: 'ficha' })
  const [abertas, setAbertas] = useState<ReadonlySet<FichaPageId>>(() => new Set([page]))
  const [blocoAtivo, setBlocoAtivo] = useState<string | null>(null)

  // A página atual sempre aparece aberta na lateral.
  const abertasComAtual = abertas.has(page) ? abertas : new Set([...abertas, page])

  useEffect(() => {
    // Bloco "em que estou": o primeiro visível na metade de cima da tela.
    const blocos = Array.from(document.querySelectorAll<HTMLElement>('[data-ficha-bloco]'))
    if (blocos.length === 0 || typeof IntersectionObserver === 'undefined') return
    const visiveis = new Map<string, number>()
    const observer = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          const titulo = (entrada.target as HTMLElement).dataset.fichaBloco ?? ''
          if (entrada.isIntersecting) visiveis.set(titulo, entrada.boundingClientRect.top)
          else visiveis.delete(titulo)
        }
        const primeiro = [...visiveis.entries()].sort((a, b) => a[1] - b[1])[0]
        if (primeiro) setBlocoAtivo(primeiro[0])
      },
      { rootMargin: '0px 0px -55% 0px', threshold: 0 },
    )
    blocos.forEach((bloco) => observer.observe(bloco))
    return () => observer.disconnect()
  }, [page])

  function alternarPagina(id: FichaPageId) {
    setAbertas((atual) => {
      const proximo = new Set(atual)
      if (proximo.has(id) && id !== page) proximo.delete(id)
      else proximo.add(id)
      return proximo
    })
  }

  function irParaBloco(id: FichaPageId, titulo: string) {
    const rolar = () =>
      document.getElementById(fichaBlocoDomId(titulo))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (id !== page) {
      onPageChange(id)
      // Espera a página nova montar antes de rolar até o bloco.
      window.setTimeout(rolar, 80)
    } else {
      rolar()
    }
    setBlocoAtivo(titulo)
  }

  return (
    <aside aria-label="Navegação da avaliação" className="h-full">
      {/* sticky precisa de espaço para deslizar: o aside estica na altura do editor (h-full no slot). */}
      <div className="sticky top-4 flex max-h-[calc(100dvh-2rem)] flex-col">
        <p className="shrink-0 px-2 pb-3 text-sm font-semibold text-ink">
          Avaliação fisioterapêutica
        </p>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]">
          {FICHA_PAGES.map((item, index) => {
            const atual = item.id === page
            const aberta = abertasComAtual.has(item.id)
            return (
              <div key={item.id}>
                <div
                  className={[
                    'flex items-center gap-1 rounded-xl',
                    atual ? 'bg-accent-soft' : 'hover:bg-canvas',
                  ].join(' ')}
                >
                  <button
                    type="button"
                    onClick={() => onPageChange(item.id)}
                    aria-current={atual ? 'page' : undefined}
                    className={[
                      'flex min-h-10 min-w-0 flex-1 items-center gap-2 px-2.5 text-left text-sm',
                      atual ? 'font-semibold text-[#1e3a8a]' : 'font-medium text-ink',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold',
                        atual ? 'bg-[#1e3a8a] text-white' : 'bg-canvas text-muted',
                      ].join(' ')}
                    >
                      {index + 1}
                    </span>
                    <span className="truncate">{nomePagina(item.label)}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => alternarPagina(item.id)}
                    aria-expanded={aberta}
                    aria-label={aberta ? `Recolher blocos de ${nomePagina(item.label)}` : `Mostrar blocos de ${nomePagina(item.label)}`}
                    className="flex h-10 w-8 shrink-0 items-center justify-center text-muted hover:text-ink"
                  >
                    <ChevronDown
                      size={16}
                      aria-hidden
                      className={['transition-transform duration-200', aberta ? 'rotate-0' : '-rotate-90'].join(' ')}
                    />
                  </button>
                </div>

                {aberta ? (
                  <ul className="mb-1 ml-3 mt-0.5 space-y-0.5">
                    {FICHA_BLOCOS[item.id].map((bloco) => {
                      const ativo = atual && blocoAtivo === bloco.title
                      const preenchido = blocoPreenchido(ficha, bloco.path)
                      return (
                        <li key={bloco.title}>
                          <button
                            type="button"
                            onClick={() => irParaBloco(item.id, bloco.title)}
                            className={[
                              'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors',
                              ativo
                                ? 'bg-accent-soft font-semibold text-[#1e3a8a]'
                                : 'text-muted hover:bg-canvas hover:text-ink',
                            ].join(' ')}
                          >
                            <span
                              aria-hidden
                              className={[
                                'h-2 w-2 shrink-0 rounded-full',
                                preenchido ? 'bg-accent' : 'bg-line',
                              ].join(' ')}
                            />
                            <span className="truncate">{bloco.title}</span>
                            {preenchido ? <span className="sr-only"> (preenchido)</span> : null}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                ) : null}
              </div>
            )
          })}
        </nav>

        <div className="shrink-0 space-y-2 pt-3">
          <Button type="submit" form={formId} fullWidth isLoading={saving} disabled={submitDisabled} className="!py-2.5">
            {submitLabel}
          </Button>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="w-full rounded-xl py-1.5 text-xs font-medium text-muted transition-colors hover:bg-canvas hover:text-ink disabled:opacity-50"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </aside>
  )
}
