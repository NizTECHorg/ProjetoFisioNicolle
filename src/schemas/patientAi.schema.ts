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
  regenerateConfirmTitle: 'Gerar de novo?',
  regenerateConfirmBody:
    'Gerar de novo substitui o resumo e as suas edições. O texto editado e o resumo original anterior serão perdidos.',
  regenerateConfirmLabel: 'Substituir e gerar',
  regenerateCancelLabel: 'Manter meu resumo',
  resumoIaHelp:
    'Gere o resumo clínico ou exporte PDFs. Aqui fica o texto original da última geração. Para corrigir, abra a aba Resumo.',
  originalBlockLabel: 'Resumo original da IA',
  originalEmptyCanWrite: 'Nenhum resumo gerado ainda. Use "Gerar resumo" acima.',
  originalEmptyReadOnly: 'Nenhum resumo gerado ainda.',
  editSuccess: 'Resumo salvo',
  editError: 'Não foi possível salvar o resumo. Tente de novo.',
  editForbidden: 'Você não tem permissão para editar este paciente.',
  summaryAiCaption: 'Gerado pela IA a partir do prontuário. Revise antes de usar.',
  summaryEditedCaption: 'Texto editado. O original gerado pela IA está na aba Resumo IA.',
  editModalTitle: 'Editar resumo',
  editModalDescription:
    'Corrija os textos do Resumo do paciente. O original gerado pela IA continua na aba Resumo IA. Campo vazio aparece como —.',
  editModalCancel: 'Fechar sem salvar',
  editModalSubmit: 'Salvar edições',
  editPencilLabel: 'Editar resumo do paciente',
  pdfEmptyHeading: 'Nada preenchido para este PDF.',
  pdfEmptyBody: 'Preencha a avaliação ou a evolução e volte para exportar.',
  sendWhatsApp: 'Enviar por WhatsApp',
  sendEmail: 'Enviar por e-mail',
  sendNeedExport: 'Exporte o PDF antes de enviar ao paciente.',
  sendNeedEmail:
    'Este paciente não tem e-mail no cadastro. Inclua o e-mail na ficha e tente de novo.',
  sendNeedPhone:
    'Este paciente não tem telefone no cadastro. Inclua o telefone na ficha e tente de novo.',
  sendPhoneInvalid:
    'Este telefone não abre no WhatsApp. Corrija o número na ficha e tente de novo.',
  sendEmailError: 'Não foi possível enviar o e-mail. Tente de novo em instantes.',
  sendWhatsAppBlocked: 'O WhatsApp não abriu. Permita a janela do navegador e tente de novo.',
  sendFileUnavailable: 'O arquivo não ficou disponível. Exporte de novo e tente outra vez.',
  sendEmailSuccess: 'E-mail enviado para o paciente.',
  sendWhatsAppSuccess: 'Conversa aberta com o link do PDF.',
  whatsappMessage: 'Segue o documento da sua fisioterapia. O link vale 7 dias.',
  emailSubjectAvaliacao: 'Sua avaliação',
  emailSubjectEvolucao: 'Sua evolução',
  emailBody: 'Segue o documento da sua fisioterapia, em anexo.',
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

/** Body of send-patient-document. Destination comes from patients.email, never this object. */
export const patientDocumentSendSchema = z.object({
  patientId: z.string().uuid(),
  reportId: z.string().uuid(),
})

export type PatientDocumentSendInput = z.infer<typeof patientDocumentSendSchema>

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
