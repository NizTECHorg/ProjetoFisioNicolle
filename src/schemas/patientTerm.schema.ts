import { z } from 'zod'
import { TERM_KEYS, type TermKey } from '../lib/consentTerms.ts'
import { isValidCpf, normalizeCpf } from '../lib/cpf.ts'

export const createPatientTermSchema = z
  .object({
    termType: z.enum(TERM_KEYS as [TermKey, ...TermKey[]], { message: 'Tipo de termo inválido.' }),
    title: z.string().trim().min(1, 'Informe o título do termo.').max(200, 'Título muito longo.'),
    bodyText: z
      .string()
      .trim()
      .min(1, 'O texto do termo não pode ficar vazio.')
      .max(6000, 'O texto do termo é longo demais.'),
    patientName: z.string().trim().min(1, 'Informe o nome do paciente.').max(200, 'Nome muito longo.'),
    therapistName: z.string().trim().min(1, 'Informe o nome do fisioterapeuta.').max(120, 'Nome muito longo.'),
    therapistCrefito: z.string().trim().min(1, 'Informe o CREFITO.').max(40, 'CREFITO muito longo.'),
    guardianName: z.string().trim().max(120, 'Nome muito longo.').nullable(),
    guardianCpf: z.string().nullable(),
    createdByName: z.string().trim().max(120, 'Nome muito longo.').nullable(),
    signedAt: z.date(),
  })
  .superRefine((value, ctx) => {
    if (value.guardianName && !isValidCpf(value.guardianCpf)) {
      ctx.addIssue({
        code: 'custom',
        path: ['guardianCpf'],
        message: 'CPF inválido. Confira os números.',
      })
    }
  })
  .transform((value) => {
    const hasGuardian = Boolean(value.guardianName)
    return {
      ...value,
      guardianName: hasGuardian ? value.guardianName : null,
      guardianCpf: hasGuardian ? normalizeCpf(value.guardianCpf) : null,
    }
  })

export type CreatePatientTermParsed = z.output<typeof createPatientTermSchema>
