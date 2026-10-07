import { supabase } from '@/lib/supabase/client'
import {
  PATIENT_AI_COPY,
  patientDocumentSendSchema,
  type PatientDocumentSendInput,
} from '@/schemas/patientAi.schema'

interface FunctionsErrorBody {
  error?: string
  code?: string
  message?: string
}

const KNOWN_SEND_MESSAGES = new Set<string>([
  PATIENT_AI_COPY.sendNeedEmail,
  PATIENT_AI_COPY.sendFileUnavailable,
  PATIENT_AI_COPY.sendEmailError,
])

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

  return { message: error?.message }
}

function messageFromSendPayload(payload: { message?: string }): string {
  const message = payload.message?.trim()
  if (message && KNOWN_SEND_MESSAGES.has(message)) return message
  return PATIENT_AI_COPY.sendEmailError
}

export async function sendPatientDocument(input: PatientDocumentSendInput): Promise<void> {
  const parsed = patientDocumentSendSchema.parse(input)
  const { data, error } = await supabase.functions.invoke('send-patient-document', {
    body: {
      patientId: parsed.patientId,
      reportId: parsed.reportId,
    },
  })

  if (error) {
    const payload = await readFunctionsErrorPayload(error, data)
    throw new Error(messageFromSendPayload(payload))
  }

  if (data && typeof data === 'object' && 'error' in data && (data as { error?: unknown }).error) {
    const payload = await readFunctionsErrorPayload(null, data)
    throw new Error(messageFromSendPayload(payload))
  }
}
