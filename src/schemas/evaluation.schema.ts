import { z } from 'zod'
import {
  emptyEvaluationFicha,
  evaluationFichaSchema,
} from '@/schemas/evaluationFicha.schema'

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo de ${max} caracteres`)

/** Form contract: only performedOn required (D-03). Clinical content lives in ficha. */
export const evaluationFormSchema = z.object({
  performedOn: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data da avaliação'),
  therapistId: z.string().optional(),
  ficha: evaluationFichaSchema,
  // Legacy flat fields — optional during transitional UI (Wave 2 maps legacy ↔ ficha)
  mainComplaint: optionalText(4000).optional(),
  anamnesis: optionalText(8000).optional(),
  history: optionalText(8000).optional(),
  pain: optionalText(4000).optional(),
  limitations: optionalText(4000).optional(),
  goals: optionalText(4000).optional(),
  physicalExam: optionalText(8000).optional(),
  tests: optionalText(8000).optional(),
  measurements: optionalText(4000).optional(),
  physioDiagnosis: optionalText(4000).optional(),
  plan: optionalText(8000).optional(),
})

export type EvaluationFormData = z.infer<typeof evaluationFormSchema>

export const emptyEvaluationForm = (): EvaluationFormData => ({
  performedOn: new Date().toISOString().slice(0, 10),
  therapistId: '',
  ficha: emptyEvaluationFicha(),
  mainComplaint: '',
  anamnesis: '',
  history: '',
  pain: '',
  limitations: '',
  goals: '',
  physicalExam: '',
  tests: '',
  measurements: '',
  physioDiagnosis: '',
  plan: '',
})
