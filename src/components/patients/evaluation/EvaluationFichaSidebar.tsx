import { useEffect, useState } from 'react'
import {
  Activity,
  ChevronDown,
  ClipboardList,
  PersonStanding,
  ShieldCheck,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react'
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
import { scrollToElement } from '@/lib/scrollToElement'

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

/** Ícone de cada página da avaliação na navegação lateral. */
const ICONES_PAGINA: Record<FichaPageId, LucideIcon> = {
  '01': ClipboardList,
  '02': Activity,
  '03': ShieldCheck,
  '04': Stethoscope,
  '05': PersonStanding,
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

  /**
   * Clique na linha inteira. Outra página: vai até ela e abre a lista de blocos.
   * Página atual: abre ou fecha a lista.
   */
  function alternarPagina(id: FichaPageId) {
    if (id !== page) {
      onPageChange(id)
      setAbertas((atual) => new Set([...atual, id]))
      return
    }
    setAbertas((atual) => {
      const proximo = new Set(atual)
      if (proximo.has(id)) proximo.delete(id)
      else proximo.add(id)
      return proximo
    })
  }

  function irParaBloco(id: FichaPageId, titulo: string) {
    const rolar = () =>
      scrollToElement(document.getElementById(fichaBlocoDomId(titulo)))
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
      <div className="sticky top-4 flex h-[calc(100dvh-3.25rem)] flex-col">
        <p className="shrink-0 px-2 pb-3 text-sm font-semibold text-ink">
          Avaliação fisioterapêutica
        </p>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]">
          {FICHA_PAGES.map((item, index) => {
            const atual = item.id === page
            const aberta = abertas.has(item.id)
            const Icone = ICONES_PAGINA[item.id]
            const listaId = `ficha-lateral-${item.id}`
            return (
              <div key={item.id}>
                <button
                  type="button"
                  onClick={() => alternarPagina(item.id)}
                  aria-expanded={aberta}
                  aria-controls={listaId}
                  aria-current={atual ? 'page' : undefined}
                  title={nomePagina(item.label)}
                  className={[
                    'flex min-h-10 w-full items-center gap-2 rounded-xl px-2.5 text-left text-sm transition-colors',
                    atual ? 'bg-accent-soft font-semibold text-[#1e3a8a]' : 'font-medium text-ink hover:bg-canvas',
                  ].join(' ')}
                >
                  <span
                    aria-hidden
                    className={[
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors',
                      atual ? 'bg-[#1e3a8a] text-white' : 'bg-canvas text-muted',
                    ].join(' ')}
                  >
                    <Icone size={14} strokeWidth={2} />
                  </span>
                  <span className="sr-only">{index + 1}. </span>
                  <span className="min-w-0 flex-1 truncate">{nomePagina(item.label)}</span>
                  <ChevronDown
                    size={16}
                    aria-hidden
                    className={[
                      'shrink-0 text-muted transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                      aberta ? 'rotate-0' : '-rotate-90',
                    ].join(' ')}
                  />
                </button>

                {/* Abre/fecha deslizando a altura (grid 1fr/0fr) com fade; fechado fica inert. */}
                <div
                  id={listaId}
                  inert={aberta ? undefined : true}
                  className={[
                    'grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                    aberta ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                  ].join(' ')}
                >
                  <div className="min-h-0 overflow-hidden">
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
                                'h-2 w-2 shrink-0 rounded-full transition-colors',
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
                  </div>
                </div>
              </div>
            )
          })}
        </nav>

        <div className="shrink-0 space-y-3 pb-1 pt-3">
          <Button type="submit" form={formId} fullWidth isLoading={saving} disabled={submitDisabled} className="!py-2.5">
            {submitLabel}
          </Button>
          <Button type="button" variant="secondary" fullWidth onClick={onCancel} disabled={saving} className="!py-2.5">
            {cancelLabel}
          </Button>
        </div>
      </div>
    </aside>
  )
}
