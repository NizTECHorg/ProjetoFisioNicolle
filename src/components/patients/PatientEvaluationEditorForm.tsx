import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { EvaluationFichaFooter } from '@/components/patients/evaluation/EvaluationFichaFooter'
import {
  EvaluationFichaForm,
  FICHA_PAGES,
  type FichaPageId,
} from '@/components/patients/evaluation/EvaluationFichaForm'
import { EvaluationFichaSidebar } from '@/components/patients/evaluation/EvaluationFichaSidebar'
import {
  useActiveTherapists,
  useCreatePatientEvaluation,
  useUpdatePatientEvaluation,
} from '@/hooks/usePatients'
import {
  emptyEvaluationForm,
  evaluationFormSchema,
  type EvaluationFormData,
} from '@/schemas/evaluation.schema'
import {
  EVALUATION_SAVED_MESSAGE,
  EVALUATION_SAVE_ERROR,
  fichaPagerState,
  shouldBlockImplicitSubmit,
} from '@/lib/evaluationFooter'
import { formatTestesParaColuna } from '@/lib/mobilidadePalpacao'
import { emptyEvaluationFicha } from '@/schemas/evaluationFicha.schema'
import { genderLabel } from '@/lib/patientGender'
import { toast } from '@/stores/toast.store'
import type { ToastAction } from '@/stores/toast.store'
import type { PatientEvaluation } from '@/types/evaluation'

export type EvaluationPatientSnapshot = {
  name?: string
  birthDateRaw?: string | null
  birthDate?: string
  profession?: string
  phone?: string
  email?: string
  gender?: string | null
  naturalidade?: string
  estadoCivil?: string
  peso?: string
  altura?: string
  enderecoResidencial?: string
  enderecoProfissional?: string
}

function dash(value: string | null | undefined) {
  if (!value || value === '—') return ''
  return value
}

function contactFromSnapshot(snapshot?: EvaluationPatientSnapshot) {
  if (!snapshot) return ''
  return [dash(snapshot.phone), dash(snapshot.email)].filter(Boolean).join(' · ')
}

function prefillIdentification(
  base: EvaluationFormData,
  snapshot: EvaluationPatientSnapshot | undefined,
): EvaluationFormData {
  if (!snapshot) return base
  const id = base.ficha.anamnese?.identificacao ?? {}
  return {
    ...base,
    ficha: {
      ...base.ficha,
      anamnese: {
        ...base.ficha.anamnese,
        identificacao: {
          ...id,
          nomeCompleto: id.nomeCompleto || dash(snapshot.name),
          dataNascimento: id.dataNascimento || dash(snapshot.birthDateRaw) || dash(snapshot.birthDate),
          naturalidade: id.naturalidade || dash(snapshot.naturalidade),
          genero: id.genero || genderLabel(snapshot.gender),
          estadoCivil: id.estadoCivil || dash(snapshot.estadoCivil),
          profissao: id.profissao || dash(snapshot.profession),
          peso: id.peso || dash(snapshot.peso),
          altura: id.altura || dash(snapshot.altura),
          enderecoResidencial: id.enderecoResidencial || dash(snapshot.enderecoResidencial),
          enderecoProfissional: id.enderecoProfissional || dash(snapshot.enderecoProfissional),
          contato: id.contato || contactFromSnapshot(snapshot),
          dataAvaliacao: id.dataAvaliacao || base.performedOn,
        },
      },
    },
  }
}

function valuesFromEvaluation(item: PatientEvaluation): EvaluationFormData {
  return {
    performedOn: item.performedOn,
    therapistId: item.therapistId ?? '',
    ficha: item.ficha ?? emptyEvaluationFicha(),
    mainComplaint: item.mainComplaint,
    anamnesis: item.anamnesis,
    history: item.history,
    pain: item.pain,
    limitations: item.limitations,
    goals: item.goals,
    physicalExam: item.physicalExam,
    tests: item.tests,
    measurements: item.measurements,
    physioDiagnosis: item.physioDiagnosis,
    plan: item.plan,
  }
}

type PatientEvaluationEditorFormProps = {
  patientId: string
  cancelLabel: string
  submitLabel: string
  successAction?: ToastAction
  errorMessage?: string
  editing?: PatientEvaluation | null
  draft?: EvaluationFormData
  patientSnapshot?: EvaluationPatientSnapshot
  showInnerHeading?: boolean
  /** Onde desenhar a navegação lateral (desktop). Sem ele, a ficha usa os chips de sempre. */
  sidebarContainer?: HTMLElement | null
  onCancel: () => void
  onSuccess: () => void
}

export function PatientEvaluationEditorForm({
  patientId,
  cancelLabel,
  submitLabel,
  successAction,
  errorMessage,
  editing,
  draft,
  patientSnapshot,
  showInnerHeading = true,
  sidebarContainer,
  onCancel,
  onSuccess,
}: PatientEvaluationEditorFormProps) {
  const { data: therapists = [] } = useActiveTherapists()
  const [fichaPage, setFichaPage] = useState<FichaPageId>('01')
  const [savedId, setSavedId] = useState<string | null>(null)
  const targetId = editing?.id ?? savedId
  const formId = `avaliacao-${useId()}`
  const comLateral = Boolean(sidebarContainer)
  const createEvaluation = useCreatePatientEvaluation(patientId, {
    action: successAction,
    errorMessage,
  })
  const updateEvaluation = useUpdatePatientEvaluation(patientId)
  const createStay = useCreatePatientEvaluation(patientId, {
    errorMessage: errorMessage ?? EVALUATION_SAVE_ERROR,
    successMessage: EVALUATION_SAVED_MESSAGE,
  })
  const updateStay = useUpdatePatientEvaluation(patientId, {
    successMessage: EVALUATION_SAVED_MESSAGE,
    errorMessage: errorMessage ?? EVALUATION_SAVE_ERROR,
  })

  const therapistOptions = useMemo(
    () => [
      { value: '', label: 'Selecione…' },
      ...therapists.map((item) => ({ value: item.id, label: item.fullName })),
    ],
    [therapists],
  )

  const form = useForm<EvaluationFormData>({
    resolver: zodResolver(evaluationFormSchema) as Resolver<EvaluationFormData>,
    defaultValues: emptyEvaluationForm(),
    shouldUnregister: false,
  })

  const editingId = editing?.id ?? null
  const initializedForKey = useRef<string | null>(null)
  const editorKey = editingId ?? `create:${draft ? 'draft' : 'blank'}`

  // Reset only when switching create/edit/draft — NOT when patientSnapshot object identity changes
  // (parent rebuilds snapshot every render and was wiping typed fields before save).
  useEffect(() => {
    if (initializedForKey.current === editorKey) return
    initializedForKey.current = editorKey

    if (editing) {
      form.reset(valuesFromEvaluation(editing))
      return
    }
    const base = draft ?? emptyEvaluationForm()
    form.reset(prefillIdentification(base, patientSnapshot))
  }, [draft, editing, editorKey, form, patientSnapshot])

  // Late-arriving patient snapshot: prefill identity only while form still pristine.
  useEffect(() => {
    if (editing || !patientSnapshot) return
    if (form.formState.isDirty) return
    const current = form.getValues()
    const id = current.ficha?.anamnese?.identificacao
    const alreadyNamed = Boolean(id?.nomeCompleto?.trim())
    if (alreadyNamed) return
    form.reset(prefillIdentification(current, patientSnapshot))
  }, [editing, form, patientSnapshot])

  function firstErrorMessage(errors: unknown, prefix = ''): string | null {
    if (!errors || typeof errors !== 'object') return null
    const record = errors as Record<string, { message?: string } | Record<string, unknown>>
    for (const [key, value] of Object.entries(record)) {
      if (!value || typeof value !== 'object') continue
      if (typeof (value as { message?: string }).message === 'string') {
        return (value as { message: string }).message
      }
      const nested = firstErrorMessage(value, prefix ? `${prefix}.${key}` : key)
      if (nested) return nested
    }
    return null
  }

  function buildInput(values: EvaluationFormData) {
    const therapist = therapists.find((item) => item.id === values.therapistId)
    const ficha = values.ficha ?? emptyEvaluationFicha()
    return {
      performedOn: values.performedOn,
      ficha,
      mainComplaint: ficha.anamnese?.queixa?.oQueTrouxe ?? values.mainComplaint ?? '',
      anamnesis: values.anamnesis ?? '',
      history: ficha.anamnese?.historiaAtual?.comoComecou ?? values.history ?? '',
      pain: values.pain ?? '',
      limitations: ficha.funcao?.limitacaoFuncional?.item1 ?? values.limitations ?? '',
      goals: ficha.avaliacaoPlano?.objetivos?.curto1 ?? values.goals ?? '',
      physicalExam: ficha.avaliacaoPlano?.inspecao?.achados ?? values.physicalExam ?? '',
      tests: formatTestesParaColuna(ficha.avaliacaoPlano?.palpacaoTestes),
      measurements: values.measurements ?? '',
      physioDiagnosis: ficha.avaliacaoPlano?.sintese?.diagnosticoFisio ?? values.physioDiagnosis ?? '',
      plan: ficha.avaliacaoPlano?.planejamento?.criteriosProgressao ?? values.plan ?? '',
      therapistId: therapist?.id ?? null,
      therapistName: therapist?.fullName ?? null,
    }
  }

  function onSubmit(values: EvaluationFormData) {
    const input = buildInput(values)
    if (targetId) {
      updateEvaluation.mutate({ evaluationId: targetId, input }, { onSuccess })
      return
    }
    createEvaluation.mutate(input, { onSuccess })
  }

  function onSaveStay(values: EvaluationFormData) {
    const input = buildInput(values)
    if (targetId) {
      updateStay.mutate({ evaluationId: targetId, input })
      return
    }
    createStay.mutate(input, {
      onSuccess: (id) => setSavedId(id),
    })
  }

  function onInvalid() {
    const message =
      firstErrorMessage(form.formState.errors) ??
      'Revise os campos da ficha e tente salvar de novo.'
    toast(message, 'error')
  }

  function goNext() {
    const { next } = fichaPagerState(
      FICHA_PAGES.map((p) => p.id),
      fichaPage,
    )
    if (next) setFichaPage(next)
  }

  const saveAndStay = form.handleSubmit(onSaveStay, onInvalid)
  const saving =
    createEvaluation.isPending ||
    updateEvaluation.isPending ||
    createStay.isPending ||
    updateStay.isPending
  const performedOnValid = /^\d{4}-\d{2}-\d{2}$/.test(form.watch('performedOn') ?? '')

  return (
    <form
      id={formId}
      className="space-y-5"
      onSubmit={form.handleSubmit(onSubmit, onInvalid)}
      onKeyDown={(e) => {
        const t = e.target as HTMLElement
        if (shouldBlockImplicitSubmit(e.key, t.tagName, (t as HTMLInputElement).type)) {
          e.preventDefault()
        }
      }}
    >
      {showInnerHeading ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-ink">
              {editing ? 'Editar avaliação' : 'Nova avaliação'}
            </h3>
            <p className="mt-1 text-xs text-muted">
              Só o nome da avaliação é obrigatório. O restante pode ficar em branco.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Nome da avaliação"
          hint="Opcional. Sem nome, salva como “Avaliação”."
          placeholder="Ex.: Avaliação inicial, Reavaliação 30 dias…"
          error={form.formState.errors.ficha?.titulo?.message}
          {...form.register('ficha.titulo')}
        />
        <Input
          label="Data da avaliação"
          type="date"
          error={form.formState.errors.performedOn?.message}
          {...form.register('performedOn')}
        />
        <Select
          label="Profissional"
          options={therapistOptions}
          error={form.formState.errors.therapistId?.message}
          {...form.register('therapistId')}
        />
      </div>

      <EvaluationFichaForm
        register={form.register}
        watch={form.watch}
        setValue={form.setValue}
        control={form.control}
        page={fichaPage}
        onPageChange={setFichaPage}
        hideChipsOnDesktop={comLateral}
      />

      {/* No desktop os botões ficam fixos na navegação lateral. */}
      <EvaluationFichaFooter
        page={fichaPage}
        onNext={goNext}
        onSave={saveAndStay}
        onCancel={onCancel}
        cancelLabel={cancelLabel}
        saving={saving}
        saveDisabled={!performedOnValid}
        className={comLateral ? 'xl:hidden' : ''}
      />

      {sidebarContainer
        ? createPortal(
            <EvaluationFichaSidebar
              page={fichaPage}
              onPageChange={setFichaPage}
              onCancel={onCancel}
              cancelLabel={cancelLabel}
              submitLabel={submitLabel}
              saving={saving}
              submitDisabled={!performedOnValid}
              formId={formId}
              control={form.control}
            />,
            sidebarContainer,
          )
        : null}
    </form>
  )
}
