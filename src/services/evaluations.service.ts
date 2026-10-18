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

/** Colunas de texto legadas não aceitam null. Campo clínico vazio grava ''. */
function blankText(value: string | null | undefined) {
  return value?.trim() ?? ''
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
 * physical_exam→inspecao.achados; tests→palpacaoTestes.testesRegistroAnterior;
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
        testesRegistroAnterior: emptyToNull(row.tests ?? undefined) ?? undefined,
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
  const title = ficha.titulo?.trim() || ''

  return {
    id: row.id,
    patientId: row.patient_id,
    performedOn: row.performed_on,
    performedOnLabel: formatDateLabel(row.performed_on),
    title,
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

export const DEFAULT_EVALUATION_TITLE = 'Avaliação'

function toRow(input: UpsertPatientEvaluationInput) {
  const parsed = evaluationFichaSchema.safeParse(input.ficha ?? {})
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const path = issue?.path?.length ? issue.path.join('.') : 'ficha'
    throw new Error(issue?.message ? `${path}: ${issue.message}` : 'Ficha de avaliação inválida.')
  }
  // Nome é opcional: sem nome, a avaliação salva como "Avaliação" (dá para renomear depois).
  const ficha = parsed.data.titulo?.trim()
    ? parsed.data
    : { ...parsed.data, titulo: DEFAULT_EVALUATION_TITLE }

  const mirroredComplaint =
    blankText(input.mainComplaint) || blankText(ficha.anamnese?.queixa?.oQueTrouxe)
  const mirroredAnamnesis =
    blankText(input.anamnesis) || blankText(ficha.anamnese?.historiaAtual?.comoComecou)
  const mirroredHistory =
    blankText(input.history) || blankText(ficha.anamnese?.historicoPregresso?.observacoes)

  const evaParts = [
    ficha.sintomas?.intensidade?.agora !== undefined ? `EVA agora: ${ficha.sintomas.intensidade.agora}/10` : '',
    ficha.sintomas?.intensidade?.melhor !== undefined ? `EVA melhor: ${ficha.sintomas.intensidade.melhor}/10` : '',
    ficha.sintomas?.intensidade?.pior !== undefined ? `EVA pior: ${ficha.sintomas.intensidade.pior}/10` : '',
    ficha.sintomas?.piora?.detalhe?.trim() ? `Piora: ${ficha.sintomas.piora.detalhe.trim()}` : '',
    ficha.sintomas?.melhora?.detalhe?.trim() ? `Melhora: ${ficha.sintomas.melhora.detalhe.trim()}` : '',
  ].filter(Boolean)
  const mirroredPain = blankText(input.pain) || evaParts.join(' · ')

  const limParts = [
    ficha.funcao?.limitacaoFuncional?.item1?.trim(),
    ficha.funcao?.limitacaoFuncional?.item2?.trim(),
    ficha.funcao?.limitacaoFuncional?.item3?.trim(),
  ].filter(Boolean)
  const mirroredLimitations = blankText(input.limitations) || limParts.join('; ')

  const goalParts = [
    ficha.funcao?.expectativas?.boaMelhora?.trim(),
    ficha.avaliacaoPlano?.objetivos?.curto1?.trim(),
    ficha.avaliacaoPlano?.objetivos?.curto2?.trim(),
    ficha.avaliacaoPlano?.objetivos?.medioLongo1?.trim(),
    ficha.avaliacaoPlano?.objetivos?.medioLongo2?.trim(),
  ].filter(Boolean)
  const mirroredGoals = blankText(input.goals) || goalParts.join(' · ')

  const mirroredPhysicalExam =
    blankText(input.physicalExam) || blankText(ficha.avaliacaoPlano?.inspecao?.achados)
  const mirroredTests =
    blankText(input.tests) || blankText(ficha.avaliacaoPlano?.palpacaoTestes?.testesRegistroAnterior)
  const mirroredMeasurements =
    blankText(input.measurements) || blankText(ficha.avaliacaoPlano?.palpacaoTestes?.resultados)
  const mirroredDiagnosis =
    blankText(input.physioDiagnosis) || blankText(ficha.avaliacaoPlano?.sintese?.diagnosticoFisio)
  const mirroredPlan =
    blankText(input.plan) ||
    [
      ficha.avaliacaoPlano?.planejamento?.frequencia?.trim()
        ? `Frequência: ${ficha.avaliacaoPlano.planejamento.frequencia.trim()}`
        : '',
      ficha.avaliacaoPlano?.planejamento?.criteriosProgressao?.trim(),
    ]
      .filter(Boolean)
      .join(' · ')

  return {
    performed_on: input.performedOn,
    ficha: ficha as unknown as Record<string, unknown>,
    anamnesis: mirroredAnamnesis,
    main_complaint: mirroredComplaint,
    history: mirroredHistory,
    pain: mirroredPain,
    limitations: mirroredLimitations,
    goals: mirroredGoals,
    physical_exam: mirroredPhysicalExam,
    tests: mirroredTests,
    measurements: mirroredMeasurements,
    physio_diagnosis: mirroredDiagnosis,
    plan: mirroredPlan,
    therapist_id: input.therapistId || null,
    therapist_name: blankText(input.therapistName),
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

function parseIsoBirthDate(raw: string | undefined): string | null {
  const trimmed = raw?.trim() ?? ''
  if (!trimmed) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  const brMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (brMatch) {
    return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`
  }
  return null
}

function parseGenderFromFicha(raw: string | undefined): string | null {
  const normalized = (raw?.trim() ?? '').toLowerCase()
  if (!normalized) return null
  if (['masculino', 'homem', 'm', 'masc'].includes(normalized)) return 'masculino'
  if (['feminino', 'mulher', 'f', 'fem'].includes(normalized)) return 'feminino'
  if (['outro', 'outros'].includes(normalized)) return 'outro'
  if (['nao_informado', 'não informado', 'prefere não informar'].includes(normalized)) {
    return 'nao_informado'
  }
  return null
}

async function syncPatientFromEvaluation(
  patientId: string,
  input: UpsertPatientEvaluationInput,
): Promise<void> {
  const parsed = evaluationFichaSchema.safeParse(input.ficha ?? {})
  if (!parsed.success) return
  const ficha = parsed.data
  const id = ficha.anamnese?.identificacao

  const payload: Record<string, string | number | null> = {}

  const nomeCompleto = id?.nomeCompleto?.trim() ?? ''
  if (nomeCompleto.length >= 2 && nomeCompleto.length <= 120) {
    payload.full_name = nomeCompleto
  }

  const birthDate = parseIsoBirthDate(id?.dataNascimento)
  if (birthDate) {
    payload.birth_date = birthDate
  }

  const naturalidade = id?.naturalidade?.trim()
  if (naturalidade) payload.naturalidade = naturalidade.slice(0, 120)

  const gender = parseGenderFromFicha(id?.genero)
  if (gender) payload.gender = gender

  const estadoCivil = id?.estadoCivil?.trim()
  if (estadoCivil) payload.estado_civil = estadoCivil.slice(0, 80)

  const profissao = id?.profissao?.trim()
  if (profissao) payload.profession = profissao.slice(0, 80)

  const peso = id?.peso?.trim()
  if (peso) payload.peso = peso.slice(0, 40)

  const altura = id?.altura?.trim()
  if (altura) payload.altura = altura.slice(0, 40)

  const enderecoResidencial = id?.enderecoResidencial?.trim()
  if (enderecoResidencial) payload.endereco_residencial = enderecoResidencial.slice(0, 500)

  const enderecoProfissional = id?.enderecoProfissional?.trim()
  if (enderecoProfissional) payload.endereco_profissional = enderecoProfissional.slice(0, 500)

  const contato = id?.contato?.trim() ?? ''
  if (contato) {
    const emailMatch = contato.match(/[^\s·|/,;]+@[^\s·|/,;]+\.[^\s·|/,;]+/)
    if (emailMatch) {
      payload.email = emailMatch[0].toLowerCase()
    }
    const remainingPhone = contato
      .replace(emailMatch?.[0] ?? '', '')
      .replace(/^[·|/,;\-\s]+|[·|/,;\-\s]+$/g, '')
      .trim()
    if (remainingPhone) {
      payload.phone = remainingPhone.slice(0, 30)
    }
  }

  const therapistName =
    input.therapistName?.trim() || ficha.avaliacaoPlano?.profissional?.fisioterapeuta?.trim()
  if (therapistName) {
    payload.therapist_name = therapistName.slice(0, 120)
  }

  const complaint = ficha.anamnese?.queixa?.oQueTrouxe?.trim() || input.mainComplaint?.trim()
  if (complaint) {
    payload.complaint = complaint.slice(0, 2000)
  }

  const diagnosis =
    ficha.avaliacaoPlano?.sintese?.diagnosticoFisio?.trim() || input.physioDiagnosis?.trim()
  if (diagnosis) {
    payload.diagnosis = diagnosis.slice(0, 2000)
  }

  const frequency = ficha.avaliacaoPlano?.planejamento?.frequencia?.trim()
  if (frequency) {
    payload.frequency = frequency.slice(0, 80)
  }

  const qtdRaw = ficha.avaliacaoPlano?.planejamento?.qtdAtendimentos?.trim()
  const qtdMatch = qtdRaw?.match(/\d+/)
  if (qtdMatch) {
    const qtd = Number(qtdMatch[0])
    if (Number.isInteger(qtd) && qtd > 0 && qtd <= 9999) {
      payload.sessions_planned = qtd
    }
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(input.performedOn)) {
    const { data: currentPatient } = await supabase
      .from('patients')
      .select('treatment_started_on')
      .eq('id', patientId)
      .maybeSingle()
    if (currentPatient && !(currentPatient as { treatment_started_on?: string | null }).treatment_started_on) {
      payload.treatment_started_on = input.performedOn
    }
  }

  if (Object.keys(payload).length === 0) return

  await supabase.from('patients').update(payload).eq('id', patientId)
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
  await syncPatientFromEvaluation(patientId, input)
}

export async function updatePatientEvaluation(
  evaluationId: string,
  input: UpsertPatientEvaluationInput,
): Promise<void> {
  const { data, error } = await supabase
    .from('patient_evaluations')
    .update({
      ...toRow(input),
      updated_at: new Date().toISOString(),
    })
    .eq('id', evaluationId)
    .select('patient_id')
    .maybeSingle()

  throwIfError(error)
  const patientId = (data as { patient_id?: string } | null)?.patient_id
  if (patientId) {
    await syncPatientFromEvaluation(patientId, input)
  }
}

export async function deletePatientEvaluation(evaluationId: string): Promise<void> {
  const { error } = await supabase.from('patient_evaluations').delete().eq('id', evaluationId)
  throwIfError(error)
}
