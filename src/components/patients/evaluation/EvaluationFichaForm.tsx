import { useState } from 'react'
import type { Control, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form'
import type { EvaluationFormData } from '@/schemas/evaluation.schema'
import { EvaluationPage01 } from '@/components/patients/evaluation/EvaluationPage01'
import { EvaluationPage02 } from '@/components/patients/evaluation/EvaluationPage02'
import { EvaluationPage03 } from '@/components/patients/evaluation/EvaluationPage03'
import { EvaluationPage04 } from '@/components/patients/evaluation/EvaluationPage04'

export const FICHA_PAGES = [
  { id: '01', label: '01 · Anamnese inicial' },
  { id: '02', label: '02 · Comportamento dos sintomas' },
  { id: '03', label: '03 · Função, contexto e segurança' },
  { id: '04', label: '04 · Avaliação e plano' },
] as const

export type FichaPageId = (typeof FICHA_PAGES)[number]['id']

type EvaluationFichaFormProps = {
  register: UseFormRegister<EvaluationFormData>
  watch: UseFormWatch<EvaluationFormData>
  setValue: UseFormSetValue<EvaluationFormData>
  control: Control<EvaluationFormData>
  readOnly?: boolean
  initialPage?: FichaPageId
}

export function EvaluationFichaForm({
  register,
  watch,
  setValue,
  control,
  readOnly,
  initialPage = '01',
}: EvaluationFichaFormProps) {
  const [page, setPage] = useState<FichaPageId>(initialPage)

  return (
    <div className="space-y-4">
      <nav
        className="flex min-w-0 gap-2 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:auto] [scrollbar-width:thin]"
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
        <EvaluationPage01 register={register} watch={watch} readOnly={readOnly} />
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
        <EvaluationPage03 register={register} watch={watch} readOnly={readOnly} />
      ) : null}
      {page === '04' ? (
        <EvaluationPage04
          register={register}
          watch={watch}
          control={control}
          readOnly={readOnly}
        />
      ) : null}
    </div>
  )
}
