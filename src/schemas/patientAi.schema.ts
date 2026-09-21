import { z } from 'zod'

/** Copy UI-SPEC / REQ-23.6 — Resumo IA, nunca toasts em inglês. */
export const PATIENT_AI_COPY = {
  generateSuccess: 'Resumo atualizado',
  generateError: 'Não foi possível gerar o resumo. Tente de novo em instantes.',
  unavailable: 'IA indisponível no momento.',
  forbidden: 'Você não tem permissão para esta ação.',
  notDeployed:
    'A função patient-ai-summary ainda não está no projeto. Faça o deploy no Dashboard e defina GEMINI_API_KEY.',
  misconfigured:
    'A IA no servidor está incompleta. Confira o deploy de patient-ai-summary e o secret GEMINI_API_KEY.',
  exportSuccess: 'PDF exportado',
  exportError: 'Não foi possível exportar o PDF. Tente de novo.',
  deleteSuccess: 'Avaliação excluída',
  deleteConfirmTitle: 'Excluir avaliação?',
  deleteConfirmBody: 'O PDF será removido da ficha. Esta ação não pode ser desfeita.',
  listEmptyHeading: 'Nenhuma avaliação salva.',
  listEmptyBodyCanWrite: 'Exporte uma Avaliação ou Evolução para ver aqui.',
  listEmptyBodyReadOnly: 'Nenhuma avaliação salva nesta ficha.',
  modeResumo: 'Escrever resumo (IA)',
  modePdf: 'Exportar avaliação (PDF)',
  ctaGenerate: 'Gerar resumo',
  ctaExport: 'Exportar PDF',
  kindGeral: 'Geral',
  kindSessao: 'Sessão',
  kindAvaliacao: 'Avaliação',
  kindEvolucao: 'Evolução',
  pdfScopeAvaliacao: 'Avaliação',
  pdfScopeEvolucao: 'Evolução',
  /** @deprecated Prefer pdfScopeEvolucao — kept for legacy sessao UI until removed. */
  pdfScopeSessao: 'Por sessão',
  pdfEvalPlaceholder: 'Selecione a avaliação',
  pdfEvalLatest: 'Mais recente',
  pdfEvalEmpty:
    'Nenhuma avaliação salva. Crie uma na aba Avaliações antes de exportar o PDF.',
  sessionsLabel: 'Sessões',
  sessionsHint: 'Selecione uma ou mais sessões',
  pickerTitle: 'Campos no PDF',
  pickerHelper: 'Só campos preenchidos. Desmarque o que o cliente não deve ver.',
  pickerSelectAll: 'Marcar todos',
  pickerClearSensitive: 'Desmarcar sensíveis',
  pickerConfirm: 'Continuar / Exportar PDF',
  pickerBack: 'Voltar',
  needFields: 'Selecione ao menos um campo.',
  needSessions: 'Selecione ao menos uma sessão.',
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

/** Evolução multi-sessão invoke (D-04) — cap 12 sessions. */
export const patientAiEvolucaoInvokeSchema = z.object({
  patientId: z.string().uuid(),
  sessionIds: z.array(z.string().uuid()).min(1).max(12),
  userHint: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
})

export type PatientAiEvolucaoInvokeInput = z.infer<typeof patientAiEvolucaoInvokeSchema>

/** Structured Evolução synthesis from EF mode evolucao — sintese required. */
export const evolucaoSynthesisSchema = z.object({
  sintese: z.string().trim().min(1),
  tendencias: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  condutasAgregadas: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  alertas: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
})

export type EvolucaoSynthesis = z.infer<typeof evolucaoSynthesisSchema>

export const patientAiReportKindSchema = z.enum([
  'geral',
  'sessao',
  'avaliacao',
  'evolucao',
])

export type PatientAiReportKindInput = z.infer<typeof patientAiReportKindSchema>

const SESSIONLESS_KINDS = new Set(['geral', 'avaliacao', 'evolucao'])

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
    if (SESSIONLESS_KINDS.has(data.kind) && data.sessionId !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Este tipo de avaliação não deve ter sessão.',
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
