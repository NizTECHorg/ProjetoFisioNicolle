import { supabase } from '@/lib/supabase/client'
import { mapPatientAiError } from '@/lib/security'
import { getFocusRegion } from '@/lib/focusRegions'
import { focusRegionKeySchema } from '@/schemas/patient.schema'
import {
  evolucaoSynthesisSchema,
  patientAiEvolucaoInvokeSchema,
  patientAiSummaryInvokeSchema,
  type EvolucaoSynthesis,
  type PatientAiEvolucaoInvokeInput,
  type PatientAiSummaryInvokeInput,
} from '@/schemas/patientAi.schema'
import { updatePatient } from '@/services/patients.service'

interface FunctionsErrorBody {
  error?: string
  code?: string
  message?: string
}

interface SummaryResponseBody {
  summary?: string
  focusRegionKeys?: string[]
  error?: string
  code?: string
  message?: string
}

function payloadFromBody(
  body: FunctionsErrorBody,
  status?: number,
  fallbackMessage?: string,
): { status?: number; code?: string; message?: string } {
  return {
    status,
    code: typeof body.code === 'string' ? body.code : undefined,
    message:
      typeof body.message === 'string'
        ? body.message
        : typeof body.error === 'string'
          ? body.error
          : fallbackMessage,
  }
}

async function readFunctionsErrorPayload(
  error: { context?: unknown; message?: string; name?: string } | null,
  data: unknown,
): Promise<{ status?: number; code?: string; message?: string }> {
  if (data && typeof data === 'object') {
    return payloadFromBody(data as FunctionsErrorBody, undefined, error?.message)
  }

  const context = error?.context
  if (context && typeof Response !== 'undefined' && context instanceof Response) {
    const status = context.status
    try {
      const body = (await context.clone().json()) as FunctionsErrorBody
      return payloadFromBody(body, status, error?.message)
    } catch {
      return { status, message: error?.message }
    }
  }

  // Older supabase-js: context is Response-like but not instanceof Response
  if (context && typeof context === 'object' && 'status' in context && 'json' in context) {
    const response = context as Response
    const status = response.status
    try {
      const body = (await response.clone().json()) as FunctionsErrorBody
      return payloadFromBody(body, status, error?.message)
    } catch {
      return { status, message: error?.message }
    }
  }

  const message = error?.message ?? ''
  if (message.toLowerCase().includes('function was not found')) {
    return { status: 404, code: 'NOT_FOUND', message }
  }

  return { message: error?.message }
}

function throwMappedFunctionsError(payload: {
  status?: number
  code?: string
  message?: string
}): never {
  throw new Error(mapPatientAiError(payload))
}

/**
 * Additive focus marks only — never deletes unmarked regions (Pitfall 7 / A3).
 */
export async function applyAiFocusRegionKeys(
  patientId: string,
  focusRegionKeys: string[] | undefined,
): Promise<void> {
  if (!focusRegionKeys?.length) return

  for (const raw of focusRegionKeys) {
    const parsed = focusRegionKeySchema.safeParse(raw)
    if (!parsed.success) continue

    const catalog = getFocusRegion(parsed.data)
    if (!catalog) continue

    const { data: existing, error: findError } = await supabase
      .from('patient_focus_areas')
      .select('id')
      .eq('patient_id', patientId)
      .eq('region_key', parsed.data)
      .maybeSingle()

    if (findError) {
      throw new Error(mapPatientAiError({ code: findError.code, message: findError.message }))
    }
    if (existing) continue

    const { error: insertError } = await supabase.from('patient_focus_areas').insert({
      patient_id: patientId,
      region_key: parsed.data,
      label: catalog.label,
      is_active: true,
      sort_order: catalog.sortOrder,
    })

    if (insertError?.code === '23505') continue
    if (insertError) {
      throw new Error(mapPatientAiError({ code: insertError.code, message: insertError.message }))
    }
  }
}

/**
 * Invokes Edge Function patient-ai-summary (GEMINI_API_KEY server-side), then
 * persists ai_summary via updatePatient and additively marks focus regions.
 */
export async function generatePatientAiSummary(
  input: PatientAiSummaryInvokeInput,
): Promise<string> {
  const parsed = patientAiSummaryInvokeSchema.parse(input)

  const { data, error } = await supabase.functions.invoke('patient-ai-summary', {
    body: {
      patientId: parsed.patientId,
      userHint: parsed.userHint,
    },
  })

  if (error) {
    const payload = await readFunctionsErrorPayload(error, data)
    throwMappedFunctionsError(payload)
  }

  const body = data as SummaryResponseBody | null
  if (!body || typeof body.summary !== 'string' || !body.summary.trim()) {
    if (body?.code || body?.error) {
      throwMappedFunctionsError({
        code: typeof body.code === 'string' ? body.code : undefined,
        message:
          typeof body.message === 'string'
            ? body.message
            : typeof body.error === 'string'
              ? body.error
              : undefined,
      })
    }
    throwMappedFunctionsError({ code: 'ai_unavailable' })
  }

  const summary = body.summary.trim()
  const focusRegionKeys = Array.isArray(body.focusRegionKeys)
    ? body.focusRegionKeys.filter((k): k is string => typeof k === 'string')
    : undefined

  await updatePatient(parsed.patientId, { aiSummary: summary })
  await applyAiFocusRegionKeys(parsed.patientId, focusRegionKeys)

  return summary
}

/**
 * Invokes patient-ai-summary with mode evolucao (multi-session synthesis).
 * Does NOT update patients.ai_summary or focus regions — PDF-only (D-04 / REQ-25.6).
 */
export async function generateEvolucaoSynthesis(
  input: PatientAiEvolucaoInvokeInput,
): Promise<EvolucaoSynthesis> {
  const parsed = patientAiEvolucaoInvokeSchema.parse(input)

  const { data, error } = await supabase.functions.invoke('patient-ai-summary', {
    body: {
      patientId: parsed.patientId,
      mode: 'evolucao',
      sessionIds: parsed.sessionIds,
      userHint: parsed.userHint,
    },
  })

  if (error) {
    const payload = await readFunctionsErrorPayload(error, data)
    throwMappedFunctionsError(payload)
  }

  const body = data as Record<string, unknown> | null
  if (body && (body.code || body.error) && typeof body.sintese !== 'string') {
    throwMappedFunctionsError({
      code: typeof body.code === 'string' ? body.code : undefined,
      message:
        typeof body.message === 'string'
          ? body.message
          : typeof body.error === 'string'
            ? body.error
            : undefined,
    })
  }

  const synthesis = evolucaoSynthesisSchema.safeParse(body)
  if (!synthesis.success) {
    throwMappedFunctionsError({ code: 'ai_unavailable' })
  }

  return synthesis.data
}
