import { supabase } from '@/lib/supabase/client'
import {
  emptyEvaluationFicha,
  evaluationFichaSchema,
  type EvaluationFicha,
} from '@/schemas/evaluationFicha.schema'
import type { PatientEvaluation, UpsertPatientEvaluationInput } from '@/types/evaluation'

type EvaluationRow = {
  id: string
  patient_id: string
  performed_on: string
  ficha: unknown
  anamnesis: string | null
  main_complaint: string | null
  history: string | null
  pain: string | null
  limitations: string | null
  goals: string | null
  physical_exam: string | null
  tests: string | null
  measurements: string | null
  physio_diagnosis: string | null
  plan: string | null
  therapist_id: string | null
  therapist_name: string | null
  created_by_name: string | null
  created_at: string
}

const EVALUATION_COLUMNS =
  'id, patient_id, performed_on, ficha, anamnesis, main_complaint, history, pain, limitations, goals, physical_exam, tests, measurements, physio_diagnosis, plan, therapist_id, therapist_name, created_by_name, created_at'

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

function emptyToNull(value: string | undefined) {
  const trimmed = value?.trim() ?? ''
  return trimmed === '' ? null : trimmed
}

function formatDateLabel(isoDate: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${isoDate}T00:00:00`))
}

function hasMeaningfulLeaf(value: unknown): boolean {
  if (value == null) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'number' || typeof value === 'boolean') return true
  if (Array.isArray(value)) return value.some(hasMeaningfulLeaf)
  if (typeof value === 'object') return Object.values(value).some(hasMeaningfulLeaf)
  return false
}

function hasLegacyText(row: EvaluationRow) {
  return Boolean(
    emptyToNull(row.anamnesis ?? undefined) ||
      emptyToNull(row.main_complaint ?? undefined) ||
      emptyToNull(row.history ?? undefined) ||
      emptyToNull(row.pain ?? undefined) ||
      emptyToNull(row.limitations ?? undefined) ||
      emptyToNull(row.goals ?? undefined) ||
      emptyToNull(row.physical_exam ?? undefined) ||
      emptyToNull(row.tests ?? undefined) ||
      emptyToNull(row.measurements ?? undefined) ||
      emptyToNull(row.physio_diagnosis ?? undefined) ||
      emptyToNull(row.plan ?? undefined),
  )
}

/**
 * Read-only compat seed when `ficha` is empty/`{}` but legacy text columns exist.
 * Mapping: main_complaint→anamnese.queixa.oQueTrouxe; anamnesis→historiaAtual.comoComecou;
 * history→historicoPregresso.observacoes; pain→sintomas.piora.detalhe;
 * limitations→funcao.limitacaoFuncional.item1; goals→funcao.expectativas.boaMelhora;
 * physical_exam→inspecao.achados; tests→palpacaoTestes.testesClinicos;
 * measurements→palpacaoTestes.resultados; physio_diagnosis→sintese.diagnosticoFisio;
 * plan→planejamento.criteriosProgressao.
 */
export function legacyToFicha(row: EvaluationRow): EvaluationFicha {
  const base = emptyEvaluationFicha()
  return {
    ...base,
    anamnese: {
      ...base.anamnese,
      queixa: {
        ...base.anamnese.queixa,
        oQueTrouxe: emptyToNull(row.main_complaint ?? undefined) ?? undefined,
      },
      historiaAtual: {
        ...base.anamnese.historiaAtual,
        comoComecou: emptyToNull(row.anamnesis ?? undefined) ?? undefined,
      },
      historicoPregresso: {
        ...base.anamnese.historicoPregresso,
        observacoes: emptyToNull(row.history ?? undefined) ?? undefined,
      },
    },
    sintomas: {
      ...base.sintomas,
      piora: {
        ...base.sintomas.piora,
        detalhe: emptyToNull(row.pain ?? undefined) ?? undefined,
      },
    },
    funcao: {
      ...base.funcao,
      limitacaoFuncional: {
        ...base.funcao.limitacaoFuncional,
        item1: emptyToNull(row.limitations ?? undefined) ?? undefined,
      },
      expectativas: {
        ...base.funcao.expectativas,
        boaMelhora: emptyToNull(row.goals ?? undefined) ?? undefined,
      },
    },
    avaliacaoPlano: {
      ...base.avaliacaoPlano,
      inspecao: {
        ...base.avaliacaoPlano.inspecao,
        achados: emptyToNull(row.physical_exam ?? undefined) ?? undefined,
      },
      palpacaoTestes: {
        ...base.avaliacaoPlano.palpacaoTestes,
        testesClinicos: emptyToNull(row.tests ?? undefined) ?? undefined,
        resultados: emptyToNull(row.measurements ?? undefined) ?? undefined,
      },
      sintese: {
        ...base.avaliacaoPlano.sintese,
        diagnosticoFisio: emptyToNull(row.physio_diagnosis ?? undefined) ?? undefined,
      },
      planejamento: {
        ...base.avaliacaoPlano.planejamento,
        criteriosProgressao: emptyToNull(row.plan ?? undefined) ?? undefined,
      },
    },
  }
}

function resolveEvaluationFicha(row: EvaluationRow): EvaluationFicha {
  const raw = row.ficha
  const isPlainObject = raw !== null && typeof raw === 'object' && !Array.isArray(raw)
  const rawKeys = isPlainObject ? Object.keys(raw as object) : []
  const parsed = evaluationFichaSchema.safeParse(raw ?? {})

  if (parsed.success && (rawKeys.length > 0 || hasMeaningfulLeaf(raw))) {
    return parsed.data
  }

  if (hasLegacyText(row)) return legacyToFicha(row)

  return emptyEvaluationFicha()
}

function mapEvaluation(row: EvaluationRow, isInitial: boolean): PatientEvaluation {
  const ficha = resolveEvaluationFicha(row)
  const seededComplaint = ficha.anamnese?.queixa?.oQueTrouxe?.trim() || ''

  return {
    id: row.id,
    patientId: row.patient_id,
    performedOn: row.performed_on,
    performedOnLabel: formatDateLabel(row.performed_on),
    isInitial,
    ficha,
    anamnesis: row.anamnesis ?? '',
    mainComplaint: row.main_complaint ?? seededComplaint,
    history: row.history ?? '',
    pain: row.pain ?? '',
    limitations: row.limitations ?? '',
    goals: row.goals ?? '',
    physicalExam: row.physical_exam ?? '',
    tests: row.tests ?? '',
    measurements: row.measurements ?? '',
    physioDiagnosis: row.physio_diagnosis ?? '',
    plan: row.plan ?? '',
    therapistId: row.therapist_id,
    therapistName: row.therapist_name,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
  }
}

async function resolveAuthor() {
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) throw new Error('Sessão expirada. Entre novamente.')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .maybeSingle()

  return {
    userId,
    name: (profile as { full_name?: string } | null)?.full_name?.trim() || 'Profissional',
  }
}

function toRow(input: UpsertPatientEvaluationInput) {
  const parsed = evaluationFichaSchema.safeParse(input.ficha ?? {})
  if (!parsed.success) throw new Error('Ficha de avaliação inválida.')
  const ficha = parsed.data

  const mirroredComplaint =
    emptyToNull(input.mainComplaint) ??
    emptyToNull(ficha.anamnese?.queixa?.oQueTrouxe) ??
    null

  return {
    performed_on: input.performedOn,
    ficha: ficha as unknown as Record<string, unknown>,
    anamnesis: emptyToNull(input.anamnesis),
    main_complaint: mirroredComplaint,
    history: emptyToNull(input.history),
    pain: emptyToNull(input.pain),
    limitations: emptyToNull(input.limitations),
    goals: emptyToNull(input.goals),
    physical_exam: emptyToNull(input.physicalExam),
    tests: emptyToNull(input.tests),
    measurements: emptyToNull(input.measurements),
    physio_diagnosis: emptyToNull(input.physioDiagnosis),
    plan: emptyToNull(input.plan),
    therapist_id: input.therapistId || null,
    therapist_name: emptyToNull(input.therapistName ?? undefined),
  }
}

export async function listPatientEvaluations(patientId: string): Promise<PatientEvaluation[]> {
  const { data, error } = await supabase
    .from('patient_evaluations')
    .select(EVALUATION_COLUMNS)
    .eq('patient_id', patientId)
    .order('performed_on', { ascending: false })
    .order('created_at', { ascending: false })

  throwIfError(error)

  const rows = (data ?? []) as EvaluationRow[]
  const oldest = [...rows].sort((a, b) => a.performed_on.localeCompare(b.performed_on))[0]
  return rows.map((row) => mapEvaluation(row, oldest?.id === row.id))
}

export async function createPatientEvaluation(
  patientId: string,
  input: UpsertPatientEvaluationInput,
): Promise<void> {
  const author = await resolveAuthor()
  const { error } = await supabase.from('patient_evaluations').insert({
    patient_id: patientId,
    ...toRow(input),
    created_by: author.userId,
    created_by_name: author.name,
  })
  throwIfError(error)
}

export async function updatePatientEvaluation(
  evaluationId: string,
  input: UpsertPatientEvaluationInput,
): Promise<void> {
  const { error } = await supabase
    .from('patient_evaluations')
    .update({
      ...toRow(input),
      updated_at: new Date().toISOString(),
    })
    .eq('id', evaluationId)

  throwIfError(error)
}

export async function deletePatientEvaluation(evaluationId: string): Promise<void> {
  const { error } = await supabase.from('patient_evaluations').delete().eq('id', evaluationId)
  throwIfError(error)
}
