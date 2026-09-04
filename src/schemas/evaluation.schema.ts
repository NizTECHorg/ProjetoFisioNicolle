import { z } from 'zod'

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo de ${max} caracteres`)

export const evaluationFormSchema = z.object({
  performedOn: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data da avaliação'),
  therapistId: z.string().optional(),
  mainComplaint: z
    .string()
    .trim()
    .min(2, 'Informe a queixa principal')
    .max(4000, 'Máximo de 4000 caracteres'),
  anamnesis: optionalText(8000),
  history: optionalText(8000),
  pain: optionalText(4000),
  limitations: optionalText(4000),
  goals: optionalText(4000),
  physicalExam: optionalText(8000),
  tests: optionalText(8000),
  measurements: optionalText(4000),
  physioDiagnosis: optionalText(4000),
  plan: optionalText(8000),
})

export type EvaluationFormData = z.infer<typeof evaluationFormSchema>

export const emptyEvaluationForm = (): EvaluationFormData => ({
  performedOn: new Date().toISOString().slice(0, 10),
  therapistId: '',
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
