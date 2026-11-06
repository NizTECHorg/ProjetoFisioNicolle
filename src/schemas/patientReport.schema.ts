import { z } from 'zod'
import { RELATORIO_CONTEUDO_MAX_CHARS, RELATORIO_MAX_SESSOES } from '@/lib/relatorio'

const sessionIdsSchema = z.array(z.string().uuid()).min(1).max(RELATORIO_MAX_SESSOES)

/** Body da IA no modo relatorio. Sem userHint. */
export const patientReportInvokeSchema = z.object({
  patientId: z.string().uuid(),
  sessionIds: sessionIdsSchema,
})

export const patientReportTextSchema = z.object({
  texto: z.string().trim().min(1),
})

const contentSchema = z.string().trim().min(1).max(RELATORIO_CONTEUDO_MAX_CHARS)
const placeSchema = z.string().trim().max(120).nullable()

export const patientReportCreateSchema = z.object({
  patientId: z.string().uuid(),
  sessionIds: sessionIdsSchema,
  content: contentSchema,
  place: placeSchema,
  sessionLabel: z.string().trim().max(120),
  therapistName: z.string().trim().max(120).nullable(),
  therapistCrefito: z.string().trim().max(40).nullable(),
})

export const patientReportUpdateSchema = z.object({
  content: contentSchema,
  place: placeSchema,
})

export type PatientReportInvokeInput = z.infer<typeof patientReportInvokeSchema>
export type PatientReportCreateInput = z.infer<typeof patientReportCreateSchema>
export type PatientReportUpdateInput = z.infer<typeof patientReportUpdateSchema>

export const PATIENT_REPORT_COPY = {
  tabHelp: 'Marque as sessões, gere o resumo com IA, revise e salve.',
  newReport: 'Novo relatório',
  empty: 'Nenhum relatório salvo ainda.',
  listError: 'Não foi possível carregar os relatórios.',
  noSessions:
    'Nenhuma sessão com evolução escrita. Registre a evolução na aba Sessões / Evoluções.',
  selectHint: 'Selecione de 1 a 12 sessões.',
  maxSessions: 'Selecione no máximo 12 sessões.',
  noEvolution: 'Sem evolução escrita',
  draftBadge: 'Rascunho',
  draftHint: 'Evolução ainda não finalizada',
  generate: 'Gerar relatório',
  reviewNotice: 'Revise o texto antes de salvar. A IA usa só as sessões marcadas.',
  overLimit: 'O relatório passa de 15 linhas. Reduza o texto.',
  reduced: 'Texto reduzido para caber em 15 linhas.',
  confirmNumbers: 'Confira estes números no texto:',
  placeLabel: 'Local',
  save: 'Salvar relatório',
  saved: 'Relatório salvo.',
  updated: 'Relatório atualizado.',
  deleted: 'Relatório excluído.',
  deleteTitle: 'Excluir relatório?',
  deleteDescription: 'O relatório e o PDF dele serão apagados.',
  discardTitle: 'Descartar o texto?',
  discardDescription: 'O que você escreveu aqui será perdido.',
  outdatedFunction:
    'A função de IA está desatualizada. Publique de novo a função patient-ai-summary no Supabase.',
  noContent: 'Uma das sessões marcadas não tem evolução escrita.',
  saveError: 'Não foi possível salvar o relatório.',
  whatsappMessage: 'Segue o relatório.',
} as const
