import { useEffect, useRef, useState } from 'react'
import type { Control, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form'
import type { EvaluationFormData } from '@/schemas/evaluation.schema'
import { EvaluationPage01 } from '@/components/patients/evaluation/EvaluationPage01'
import { EvaluationPage02 } from '@/components/patients/evaluation/EvaluationPage02'
import { EvaluationPage03 } from '@/components/patients/evaluation/EvaluationPage03'
import { EvaluationPage04 } from '@/components/patients/evaluation/EvaluationPage04'
import { FichaCollapseProvider } from '@/components/patients/evaluation/fichaFormPrimitives'
import { fichaPageAnnouncement, fichaPageName, fichaPagerState } from '@/lib/evaluationFooter'
import { scrollToElement } from '@/lib/scrollToElement'

export const FICHA_PAGES = [
  { id: '01', label: '01 · Anamnese inicial' },
  { id: '02', label: '02 · Comportamento dos sintomas' },
  { id: '03', label: '03 · Função, contexto e segurança' },
  { id: '04', label: '04 · Avaliação e plano' },
] as const

export type FichaPageId = (typeof FICHA_PAGES)[number]['id']

/** Blocos de cada página (letra e título iguais aos FichaBlock) para a navegação lateral. */
export const FICHA_BLOCOS: Record<
  FichaPageId,
  ReadonlyArray<{ letter: string; title: string; path: readonly string[] }>
> = {
  '01': [
    { letter: 'A', title: 'Identificação', path: ['anamnese', 'identificacao'] },
    { letter: 'B', title: 'Queixa principal', path: ['anamnese', 'queixa'] },
    { letter: 'C', title: 'História atual', path: ['anamnese', 'historiaAtual'] },
    { letter: 'D', title: 'Esportes', path: ['funcao', 'esportes'] },
    { letter: 'E', title: 'Tratamentos e investigações anteriores', path: ['anamnese', 'tratamentos'] },
    { letter: 'F', title: 'Histórico pregresso resumido', path: ['anamnese', 'historicoPregresso'] },
  ],
  '02': [
    { letter: 'A', title: 'Mapa de sintomas', path: ['mapaSintomas'] },
    { letter: 'B', title: 'Característica predominante', path: ['sintomas', 'caracteristica'] },
    { letter: 'C', title: 'Intensidade (0–10)', path: ['sintomas', 'intensidade'] },
    { letter: 'D', title: 'Comportamento em 24 horas', path: ['sintomas', 'comportamento24h'] },
    { letter: 'E', title: 'O que piora?', path: ['sintomas', 'piora'] },
    { letter: 'F', title: 'O que melhora?', path: ['sintomas', 'melhora'] },
    { letter: 'G', title: 'Irritabilidade / resposta', path: ['sintomas', 'irritabilidade'] },
  ],
  '03': [
    { letter: 'A', title: 'Principal limitação funcional', path: ['funcao', 'limitacaoFuncional'] },
    { letter: 'B', title: 'Atividades afetadas', path: ['funcao', 'atividadesAfetadas'] },
    { letter: 'C', title: 'Rotina e demanda', path: ['funcao', 'rotina'] },
    { letter: 'D', title: 'Expectativas e objetivos do paciente', path: ['funcao', 'expectativas'] },
    { letter: 'E', title: 'Triagem de segurança', path: ['funcao', 'triagemSeguranca'] },
    { letter: 'F', title: 'Medicações / outras informações', path: ['funcao', 'medicacoes'] },
  ],
  '04': [
    { letter: 'A', title: 'Inspeção / observação', path: ['avaliacaoPlano', 'inspecao'] },
    { letter: 'B', title: 'Mobilidade', path: ['avaliacaoPlano', 'mobilidade'] },
    { letter: 'C', title: 'Força', path: ['avaliacaoPlano', 'forca'] },
    { letter: 'D', title: 'Avaliação neurológica (se indicada)', path: ['avaliacaoPlano', 'neurologico'] },
    { letter: 'E', title: 'Palpação, testes e função', path: ['avaliacaoPlano', 'palpacaoTestes'] },
    { letter: 'F', title: 'Síntese dos principais achados', path: ['avaliacaoPlano', 'sintese'] },
    { letter: 'G', title: 'Objetivos', path: ['avaliacaoPlano', 'objetivos'] },
    { letter: 'H', title: 'Planejamento', path: ['avaliacaoPlano', 'planejamento'] },
    { letter: 'ID', title: 'Identificação profissional', path: ['avaliacaoPlano', 'profissional'] },
  ],
}

type EvaluationFichaFormProps = {
  register: UseFormRegister<EvaluationFormData>
  watch: UseFormWatch<EvaluationFormData>
  setValue: UseFormSetValue<EvaluationFormData>
  control: Control<EvaluationFormData>
  readOnly?: boolean
  initialPage?: FichaPageId
  /** Página controlada por fora. */
  page?: FichaPageId
  onPageChange?: (page: FichaPageId) => void
  /** Esconde os chips de página no desktop (xl+) quando a lateral está ativa. */
  hideChipsOnDesktop?: boolean
}

const FICHA_PAGE_IDS = FICHA_PAGES.map((p) => p.id)

export function EvaluationFichaForm({
  register,
  watch,
  setValue,
  control,
  readOnly,
  initialPage = '01',
  page: pageControlada,
  onPageChange,
  hideChipsOnDesktop,
}: EvaluationFichaFormProps) {
  const [pageLocal, setPageLocal] = useState<FichaPageId>(initialPage)
  const page = pageControlada ?? pageLocal
  const setPage = (next: FichaPageId) => (onPageChange ? onPageChange(next) : setPageLocal(next))
  const navRef = useRef<HTMLElement | null>(null)
  const headingRef = useRef<HTMLHeadingElement | null>(null)
  const prevPageRef = useRef<FichaPageId>(page)
  const [announcement, setAnnouncement] = useState('')
  const currentPageLabel = (FICHA_PAGES.find((item) => item.id === page) ?? FICHA_PAGES[0]).label

  useEffect(() => {
    if (prevPageRef.current === page) return
    prevPageRef.current = page
    const { n, total } = fichaPagerState(FICHA_PAGE_IDS, page)
    const label = (FICHA_PAGES.find((item) => item.id === page) ?? FICHA_PAGES[0]).label
    setAnnouncement(fichaPageAnnouncement(n, total, label))

    if (readOnly || (navRef.current?.getClientRects().length ?? 0) === 0) return

    const reduzido =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const frame = requestAnimationFrame(() => {
      scrollToElement(navRef.current, 16, reduzido ? 'auto' : 'smooth')
      headingRef.current?.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(frame)
  }, [page, readOnly])

  return (
    <FichaCollapseProvider>
    <div className="space-y-4">
      <nav
        ref={navRef}
        className={[
          'flex min-w-0 gap-2 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:auto] [scrollbar-width:thin]',
          hideChipsOnDesktop ? 'xl:hidden' : '',
        ].join(' ')}
        aria-label="Páginas da ficha"
        role="tablist"
      >
        {FICHA_PAGES.map((item) => {
          const active = page === item.id
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-current={active ? 'step' : undefined}
              onClick={() => setPage(item.id)}
              className={[
                'inline-flex min-h-11 shrink-0 items-center rounded-xl border px-3 text-sm transition',
                active
                  ? 'border-forest bg-accent-soft font-medium text-forest'
                  : 'border-line bg-canvas text-muted hover:border-forest/25 hover:text-ink',
              ].join(' ')}
            >
              {item.label}
            </button>
          )
        })}
      </nav>
      <h2 ref={headingRef} tabIndex={-1} className="sr-only">
        {fichaPageName(currentPageLabel)}
      </h2>
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {page === '01' ? (
        <EvaluationPage01 register={register} watch={watch} setValue={setValue} readOnly={readOnly} />
      ) : null}
      {page === '02' ? (
        <EvaluationPage02
          register={register}
          watch={watch}
          setValue={setValue}
          readOnly={readOnly}
        />
      ) : null}
      {page === '03' ? (
        <EvaluationPage03
          register={register}
          watch={watch}
          setValue={setValue}
          readOnly={readOnly}
        />
      ) : null}
      {page === '04' ? (
        <EvaluationPage04
          register={register}
          watch={watch}
          setValue={setValue}
          control={control}
          readOnly={readOnly}
        />
      ) : null}
    </div>
    </FichaCollapseProvider>
  )
}
