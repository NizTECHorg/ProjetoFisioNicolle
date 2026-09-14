import { z } from 'zod'

export function parseBrlInput(raw: string): number | null {
  const trimmed = raw.trim().replace(/\s/g, '').replace('R$', '')
  if (!trimmed) return null
  const normalized = trimmed.includes(',')
    ? trimmed.replace(/\./g, '').replace(',', '.')
    : trimmed
  const value = Number(normalized)
  if (!Number.isFinite(value) || value <= 0) return null
  return Math.round(value * 100) / 100
}

export const priceFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Informe o nome do preço')
    .max(80, 'Informe o nome do preço'),
  amount: z.string().superRefine((value, ctx) => {
    if (parseBrlInput(value) === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe um valor maior que zero',
      })
    }
  }),
})

export type PriceFormData = z.infer<typeof priceFormSchema>

export function emptyPriceForm(): PriceFormData {
  return { name: '', amount: '' }
}

export const sessionChargeFieldsSchema = z
  .object({
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

export type SessionChargeFieldsFormData = z.infer<typeof sessionChargeFieldsSchema>

export function emptySessionChargeFields(): SessionChargeFieldsFormData {
  return { priceId: '', adHocAmount: '', isPaid: false }
}
