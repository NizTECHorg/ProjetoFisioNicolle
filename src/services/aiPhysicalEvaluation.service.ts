import { supabase } from '@/lib/supabase/client'
import { mapPatientAiError } from '@/lib/security'
import type { PhysicalEvaluationResult } from '@/types/evaluation'

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      // Remove prefix "data:application/pdf;base64,"
      const base64 = result.split(',')[1] ?? ''
      resolve(base64)
    }
    reader.onerror = (error) => reject(error)
  })
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Analisa o PDF da Avaliação Física de forma segura através da Edge Function server-side.
 * A API key do Gemini nunca é exposta no navegador do cliente.
 */
export async function analyzePhysicalEvaluationPdf(
  patientId: string,
  file: File,
): Promise<PhysicalEvaluationResult> {
  const base64Data = await fileToBase64(file)

  const { data, error } = await supabase.functions.invoke('patient-ai-summary', {
    body: {
      patientId,
      mode: 'avaliacao-fisica',
      pdfBase64: base64Data,
      mimeType: file.type || 'application/pdf',
    },
  })

  if (error) {
    let errorPayload: { status?: number; code?: string; message?: string } = {
      message: error.message,
    }
    if (data && typeof data === 'object') {
      errorPayload = data as { status?: number; code?: string; message?: string }
    }
    throw new Error(mapPatientAiError(errorPayload))
  }

  const parsed = data as Record<string, unknown> | null
  if (!parsed || (parsed.error && !parsed.summary)) {
    throw new Error(
      mapPatientAiError(parsed as { status?: number; code?: string; message?: string }),
    )
  }

  return {
    id: `eval_${Date.now()}`,
    patientId,
    fileName: file.name,
    fileSize: formatBytes(file.size),
    uploadedAt: new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    summary: typeof parsed.summary === 'string' ? parsed.summary : 'Avaliação física processada.',
    mainComplaint:
      typeof parsed.mainComplaint === 'string' ? parsed.mainComplaint : 'Não especificada no PDF.',
    postureAndMovement:
      typeof parsed.postureAndMovement === 'string'
        ? parsed.postureAndMovement
        : 'Sem observações.',
    muscleForceAndTests:
      typeof parsed.muscleForceAndTests === 'string'
        ? parsed.muscleForceAndTests
        : 'Testes padrão realizados.',
    cinesiologicDiagnosis:
      typeof parsed.cinesiologicDiagnosis === 'string'
        ? parsed.cinesiologicDiagnosis
        : 'Avaliação fisioterapêutica completa.',
    suggestedTreatmentPlan:
      typeof parsed.suggestedTreatmentPlan === 'string'
        ? parsed.suggestedTreatmentPlan
        : 'Seguir plano recomendado.',
    suggestedGoals: Array.isArray(parsed.suggestedGoals)
      ? (parsed.suggestedGoals.filter((g): g is string => typeof g === 'string'))
      : [],
  }
}
