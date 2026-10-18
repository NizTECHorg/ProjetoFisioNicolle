import { z } from 'zod'
import { parseBrlInput } from '@/schemas/finance.schema'
import { FOCUS_REGION_KEYS } from '@/lib/focusRegions'
import { isValidCpf } from '@/lib/cpf'
import { PATIENT_GENDER_VALUES } from '@/lib/patientGender'
import type { AlertTone, PatientStatus } from '@/types/patient'

const optionalCpf = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || isValidCpf(v), 'CPF inválido. Confira os números.')

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

export const focusRegionKeySchema = z.enum(FOCUS_REGION_KEYS)

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
  cpf: optionalCpf,
  status: patientStatusSchema,
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
  status: patientStatusSchema,
})

export const personalSectionSchema = z.object({
  birthDate: optionalDate,
  phone: optionalText(30),
  profession: optionalText(80),
  cpf: optionalCpf,
  gender: z.union([z.literal(''), z.enum(PATIENT_GENDER_VALUES)]),
  email: optionalEmail,
  naturalidade: optionalText(120),
  estadoCivil: optionalText(80),
  peso: optionalText(40),
  altura: optionalText(40),
  enderecoResidencial: optionalText(500),
  enderecoProfissional: optionalText(500),
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

const optionalSessionCount = z.union([z.literal(''), z.coerce.number().int().min(0).max(9999)])

export const treatmentSectionSchema = z.object({
  treatmentStartedOn: optionalDate,
  sessionsTotal: optionalSessionCount,
  frequency: optionalText(80),
})

export const caseUnderstandingSchema = z.object({
  complaint: optionalText(2000),
  diagnosis: optionalText(2000),
  treatmentStartedOn: optionalDate,
  sessionsTotal: optionalSessionCount,
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

export const patientGoalSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Descreva o objetivo com pelo menos 2 caracteres')
    .max(240, 'Máximo de 240 caracteres'),
  createdOn: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data de criação'),
  achievedOn: optionalDate,
})

export type PatientGoalFormData = z.infer<typeof patientGoalSchema>

export const sessionFormSchema = z
  .object({
    mode: z.enum(['agendar', 'realizada']),
    scheduledAt: z.string().trim().min(1, 'Campo obrigatório: informe a data e o horário'),
    sessionType: z
      .string()
      .trim()
      .min(1, 'Campo obrigatório: informe o tipo da sessão')
      .max(80, 'Máximo de 80 caracteres'),
    place: optionalText(80),
    therapistId: z.string().trim().min(1, 'Campo obrigatório: selecione o profissional'),
    patientState: optionalText(4000),
    changesSinceLast: optionalText(4000),
    conducts: optionalText(4000),
    treatmentResponse: optionalText(4000),
    incidents: optionalText(4000),
    nextPlan: optionalText(4000),
    priceId: z.string(),
    adHocAmount: z.string(),
    isPaid: z.boolean(),
  })
  .superRefine((data, ctx) => {
    const hasCatalog = Boolean(data.priceId)
    const hasAdHoc = data.adHocAmount.trim() !== ''
    if (hasCatalog && hasAdHoc) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Escolha um preço do catálogo ou um valor avulso, não os dois.',
        path: ['adHocAmount'],
      })
    }
    if (data.isPaid && !hasCatalog && parseBrlInput(data.adHocAmount) === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe um valor para marcar como pago.',
        path: ['isPaid'],
      })
    }
  })

export type SessionFormData = z.infer<typeof sessionFormSchema>

export const PATIENT_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024
export const MAX_BATCH_FILES = 10

export const imageUploadSchema = z.object({
  mimeType: z.enum(PATIENT_IMAGE_MIMES, {
    errorMap: () => ({
      message: 'Envie JPEG, PNG, WebP ou PDF. Fotos do iPhone: escolha a opção mais compatível.',
    }),
  }),
  byteSize: z.number().int().positive().max(MAX_IMAGE_BYTES, 'O arquivo deve ter no máximo 8 MB.'),
  sessionId: z.string().uuid().nullable(),
  description: optionalText(500),
})

export type ImageUploadInput = z.infer<typeof imageUploadSchema>

export const PATIENT_PHOTO_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const MAX_PATIENT_PHOTO_BYTES = 8 * 1024 * 1024

export const patientPhotoSchema = z.object({
  mimeType: z.enum(PATIENT_PHOTO_MIMES, {
    errorMap: () => ({
      message: 'Envie PNG, JPEG ou WebP.',
    }),
  }),
  byteSize: z
    .number()
    .int()
    .positive()
    .max(MAX_PATIENT_PHOTO_BYTES, 'A foto deve ter no máximo 8 MB.'),
})

export type PatientPhotoInput = z.infer<typeof patientPhotoSchema>

export const imageMetadataFormSchema = z.object({
  description: optionalText(500),
  sessionId: z.string(),
})

export type ImageMetadataFormData = z.infer<typeof imageMetadataFormSchema>
