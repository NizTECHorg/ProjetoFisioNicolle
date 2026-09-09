import { z } from 'zod'
import { normalizeJoinCode } from '@/lib/accountAccess'

const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter no mínimo 8 caracteres')
  .max(128, 'A senha deve ter no máximo 128 caracteres')
  .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula')
  .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
  .regex(/[0-9]/, 'A senha deve conter pelo menos um número')
  .regex(/[^a-zA-Z0-9]/, 'A senha deve conter pelo menos um caractere especial')

const emailSchema = z
  .string()
  .trim()
  .min(1, 'E-mail é obrigatório')
  .max(254)
  .email('E-mail inválido')
  .transform((value) => value.toLowerCase())

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha é obrigatória').max(128, 'Senha inválida'),
})

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Nome deve ter pelo menos 2 caracteres')
      .max(100, 'Nome muito longo')
      .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Nome contém caracteres inválidos'),
    email: emailSchema,
    accountType: z.enum(['autonomo', 'empresa', 'fisioterapeuta'], {
      required_error: 'Escolha o tipo de conta',
      message: 'Escolha o tipo de conta',
    }),
    joinCode: z.string().optional(),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirme sua senha'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })
  .refine(
    (data) => {
      const local = (data.email.split('@')[0] ?? '').toLowerCase()
      return local.length < 4 || !data.password.toLowerCase().includes(local)
    },
    {
      message: 'A senha não deve conter seu e-mail',
      path: ['password'],
    },
  )
  .superRefine((data, ctx) => {
    if (data.accountType !== 'fisioterapeuta') return
    const joinCode = normalizeJoinCode(data.joinCode ?? '')
    if (joinCode.length !== 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe o código da empresa',
        path: ['joinCode'],
      })
    }
  })

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>

export const employeeRoles = [
  'administrador',
  'gerente',
  'atendente',
  'confeiteiro',
  'entregador',
] as const

export type EmployeeRole = (typeof employeeRoles)[number]
