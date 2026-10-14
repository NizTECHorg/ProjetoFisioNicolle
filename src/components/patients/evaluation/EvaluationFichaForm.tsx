import { useState } from 'react'
import type { Control, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form'
import type { EvaluationFormData } from '@/schemas/evaluation.schema'
import { EvaluationPage01 } from '@/components/patients/evaluation/EvaluationPage01'
import { EvaluationPage02 } from '@/components/patients/evaluation/EvaluationPage02'
import { EvaluationPage03 } from '@/components/patients/evaluation/EvaluationPage03'
import { EvaluationPage04 } from '@/components/patients/evaluation/EvaluationPage04'
import { EvaluationPage05 } from '@/components/patients/evaluation/EvaluationPage05'
import { FichaCollapseProvider } from '@/components/patients/evaluation/fichaFormPrimitives'

export const FICHA_PAGES = [
  { id: '01', label: '01 · Anamnese inicial' },
  { id: '02', label: '02 · Comportamento dos sintomas' },
  { id: '03', label: '03 · Função, contexto e segurança' },
  { id: '04', label: '04 · Avaliação e plano' },
  { id: '05', label: '05 · Mapa de sintomas' },
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
    { letter: 'A', title: 'Mapa corporal', path: ['sintomas', 'mapa'] },
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
  '05': [{ letter: 'A', title: 'Desenho dos sintomas', path: ['mapaSintomas'] }],
}

type EvaluationFichaFormProps = {
  register: UseFormRegister<EvaluationFormData>
  watch: UseFormWatch<EvaluationFormData>
  setValue: UseFormSetValue<EvaluationFormData>
  control: Control<EvaluationFormData>
  readOnly?: boolean
  initialPage?: FichaPageId
  /** Página controlada por fora (navegação lateral no desktop). Com isso, os chips somem no desktop. */
  page?: FichaPageId
  onPageChange?: (page: FichaPageId) => void
}

export function EvaluationFichaForm({
  register,
  watch,
  setValue,
  control,
  readOnly,
  initialPage = '01',
  page: pageControlada,
  onPageChange,
}: EvaluationFichaFormProps) {
  const [pageLocal, setPageLocal] = useState<FichaPageId>(initialPage)
  const page = pageControlada ?? pageLocal
  const setPage = (next: FichaPageId) => (onPageChange ? onPageChange(next) : setPageLocal(next))

  return (
    <FichaCollapseProvider>
    <div className="space-y-4">
      <nav
        className={[
          'flex min-w-0 gap-2 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:auto] [scrollbar-width:thin]',
          onPageChange ? 'xl:hidden' : '',
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
      {page === '05' ? (
        <EvaluationPage05
          register={register}
          watch={watch}
          setValue={setValue}
          readOnly={readOnly}
        />
      ) : null}
    </div>
    </FichaCollapseProvider>
  )
}
