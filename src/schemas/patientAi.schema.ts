import { z } from 'zod'

/** Copy UI-SPEC / REQ-23.6 — Resumo IA, nunca toasts em inglês. */
export const PATIENT_AI_COPY = {
  generateSuccess: 'Resumo atualizado',
  generateError: 'Não foi possível gerar o resumo. Tente de novo em instantes.',
  unavailable: 'IA indisponível no momento.',
  forbidden: 'Você não tem permissão para esta ação.',
  misconfigured:
    'A IA no servidor está incompleta. Confira GEMINI_API_KEY nas Edge Functions.',
  exportSuccess: 'Avaliação exportada',
  exportError: 'Não foi possível exportar o PDF. Tente de novo.',
  deleteSuccess: 'Avaliação excluída',
  deleteConfirmTitle: 'Excluir avaliação?',
  deleteConfirmBody: 'O PDF será removido da ficha. Esta ação não pode ser desfeita.',
  listEmptyHeading: 'Nenhuma avaliação salva.',
  listEmptyBodyCanWrite: 'Exporte uma avaliação geral ou por sessão para ver aqui.',
  listEmptyBodyReadOnly: 'Nenhuma avaliação salva nesta ficha.',
  modeResumo: 'Escrever resumo (IA)',
  modePdf: 'Exportar avaliação (PDF)',
  ctaGenerate: 'Gerar resumo',
  ctaExport: 'Exportar PDF',
  kindGeral: 'Geral',
  kindSessao: 'Sessão',
} as const

export const MAX_AI_REPORT_BYTES = 8 * 1024 * 1024

export const patientAiSummaryInvokeSchema = z.object({
  patientId: z.string().uuid(),
  userHint: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
})

export type PatientAiSummaryInvokeInput = z.infer<typeof patientAiSummaryInvokeSchema>

export const patientAiReportKindSchema = z.enum(['geral', 'sessao'])

export type PatientAiReportKindInput = z.infer<typeof patientAiReportKindSchema>

export const patientAiReportUploadSchema = z
  .object({
    mimeType: z.literal('application/pdf'),
    byteSize: z
      .number()
      .int()
      .positive()
      .max(MAX_AI_REPORT_BYTES, 'O PDF deve ter no máximo 8 MB.'),
    kind: patientAiReportKindSchema,
    sessionId: z.string().uuid().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.kind === 'geral' && data.sessionId !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Avaliação geral não deve ter sessão.',
        path: ['sessionId'],
      })
    }
    if (data.kind === 'sessao' && data.sessionId === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecione a sessão.',
        path: ['sessionId'],
      })
    }
  })

export type PatientAiReportUploadInput = z.infer<typeof patientAiReportUploadSchema>
