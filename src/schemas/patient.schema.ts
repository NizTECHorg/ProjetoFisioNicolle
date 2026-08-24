import { z } from 'zod'
import type { AlertTone, PatientStatus } from '@/types/patient'

const optionalText = (max: number, minWhenFilled = 0) =>
  z
    .string()
    .trim()
    .max(max, `Máximo de ${max} caracteres`)
    .superRefine((value, ctx) => {
      if (value !== '' && value.length < minWhenFilled) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Mínimo de ${minWhenFilled} caracteres`,
        })
      }
    })

const optionalEmail = z
  .string()
  .trim()
  .max(254)
  .refine((value) => value === '' || z.string().email().safeParse(value).success, {
    message: 'E-mail inválido',
  })

const optionalDate = z
  .string()
  .trim()
  .refine((value) => value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: 'Data inválida',
  })

const patientStatusSchema = z.enum(['em_tratamento', 'avaliacao', 'alta', 'inativo'])

export const createPatientSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(120, 'Nome muito longo'),
  phone: optionalText(30),
  email: optionalEmail,
  birthDate: optionalDate,
  profession: optionalText(80),
  emergencyName: optionalText(120, 2),
  emergencyPhone: optionalText(30),
  emergencyRelation: optionalText(60),
  adminNotes: optionalText(2000),
  referralSource: optionalText(120),
  therapistName: optionalText(120),
})

export const updatePatientSchema = createPatientSchema.extend({
  status: patientStatusSchema,
  code: z
    .string()
    .trim()
    .min(3, 'Código muito curto')
    .max(20, 'Código muito longo'),
})

export const identityPatientSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(120, 'Nome muito longo'),
  phone: optionalText(30),
  email: optionalEmail,
  birthDate: optionalDate,
  code: z
    .string()
    .trim()
    .min(3, 'Código muito curto')
    .max(20, 'Código muito longo'),
  status: patientStatusSchema,
})

export const personalSectionSchema = z.object({
  profession: optionalText(80),
  email: optionalEmail,
})

export const emergencySectionSchema = z.object({
  emergencyName: optionalText(120, 2),
  emergencyPhone: optionalText(30),
  emergencyRelation: optionalText(60),
})

export const adminSectionSchema = z.object({
  therapistName: optionalText(120),
  referralSource: optionalText(120),
  adminNotes: optionalText(2000),
})

export const treatmentSectionSchema = z.object({
  treatmentStartedOn: optionalDate,
  sessionsDone: z.coerce.number().int().min(0).max(9999),
  sessionsTotal: z.coerce.number().int().min(0).max(9999),
  frequency: optionalText(80),
})

export const caseUnderstandingSchema = z.object({
  complaint: optionalText(2000),
  diagnosis: optionalText(2000),
  treatmentStartedOn: optionalDate,
  sessionsDone: z.coerce.number().int().min(0).max(9999),
  sessionsTotal: z.coerce.number().int().min(0).max(9999),
})

export type CreatePatientFormData = z.infer<typeof createPatientSchema>
export type UpdatePatientFormData = z.infer<typeof updatePatientSchema>
export type IdentityPatientFormData = z.infer<typeof identityPatientSchema>
export type PersonalSectionFormData = z.infer<typeof personalSectionSchema>
export type EmergencySectionFormData = z.infer<typeof emergencySectionSchema>
export type AdminSectionFormData = z.infer<typeof adminSectionSchema>
export type TreatmentSectionFormData = z.infer<typeof treatmentSectionSchema>
export type CaseUnderstandingFormData = z.infer<typeof caseUnderstandingSchema>

export const patientStatusOptions: Array<{ value: PatientStatus; label: string }> = [
  { value: 'avaliacao', label: 'Avaliação' },
  { value: 'em_tratamento', label: 'Em tratamento' },
  { value: 'alta', label: 'Alta' },
  { value: 'inativo', label: 'Inativo' },
]

const alertToneSchema = z.enum(['info', 'warning', 'success'])

export const patientAlertSchema = z.object({
  message: z
    .string()
    .trim()
    .min(2, 'Mensagem deve ter pelo menos 2 caracteres')
    .max(500, 'Máximo de 500 caracteres'),
  tone: alertToneSchema,
})

export type PatientAlertFormData = z.infer<typeof patientAlertSchema>

export const alertToneOptions: Array<{ value: AlertTone; label: string }> = [
  { value: 'warning', label: 'Atenção' },
  { value: 'info', label: 'Informativo' },
  { value: 'success', label: 'Positivo' },
]

export const sessionFormSchema = z
  .object({
    mode: z.enum(['agendar', 'realizada']),
    scheduledAt: z.string().trim().min(1, 'Informe data e horário'),
    sessionType: optionalText(80),
    place: optionalText(80),
    therapistId: z.string().uuid('Selecione o profissional'),
    patientState: optionalText(4000),
    changesSinceLast: optionalText(4000),
    conducts: optionalText(4000),
    treatmentResponse: optionalText(4000),
    incidents: optionalText(4000),
    nextPlan: optionalText(4000),
  })
  .superRefine((data, ctx) => {
    if (data.mode !== 'realizada') return
    if (!data.patientState.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe o estado do paciente',
        path: ['patientState'],
      })
    }
    if (!data.conducts.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe as condutas realizadas',
        path: ['conducts'],
      })
    }
  })

export type SessionFormData = z.infer<typeof sessionFormSchema>
