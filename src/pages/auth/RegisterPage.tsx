import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { registerSchema, type RegisterFormData } from '@/schemas/auth.schema'
import { signUpWithEmail } from '@/services/auth.service'
import { lookupOrganizationByCode } from '@/services/team.service'

const ACCOUNT_TYPE_OPTIONS = [
  { value: '', label: 'Selecione o tipo' },
  { value: 'autonomo', label: 'Autônomo — atendo sozinho' },
  { value: 'empresa', label: 'Empresa — clínica que monta equipe' },
  { value: 'fisioterapeuta', label: 'Fisioterapeuta — trabalho em uma empresa' },
]

export function RegisterPage() {
  const [serverError, setServerError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      accountType: '' as RegisterFormData['accountType'],
      joinCode: '',
      password: '',
      confirmPassword: '',
    },
  })

  const accountType = watch('accountType')
  const accountTypeField = register('accountType')

  async function onSubmit(data: RegisterFormData) {
    setServerError(null)
    setSuccessMessage(null)

    try {
      if (data.accountType === 'fisioterapeuta') {
        const exists = await lookupOrganizationByCode(data.joinCode ?? '')
        if (!exists) {
          setServerError(
            'Código da empresa não encontrado. Confira com o responsável e tente de novo.',
          )
          return
        }
      }

      const { needsEmailConfirmation } = await signUpWithEmail(data)

      if (data.accountType === 'fisioterapeuta') {
        setSuccessMessage('Cadastro concluído. Aguarde a empresa aceitar seu pedido.')
        return
      }

      if (needsEmailConfirmation) {
        setSuccessMessage(
          'Conta criada! Verifique seu e-mail para confirmar o cadastro antes de entrar.',
        )
      } else {
        setSuccessMessage('Conta criada com sucesso! Você já pode entrar.')
      }
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Erro ao criar conta.')
    }
  }

  return (
    <AuthLayout
      title="Criar conta"
      subtitle="Cadastre-se para começar a gerenciar sua clínica"
      footer={
        <p>
          Já tem conta?{' '}
          <Link to="/" className="font-medium text-forest hover:text-forest-mid">
            Entrar
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate autoComplete="off">
        {serverError && (
          <div
            role="alert"
            className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error"
          >
            {serverError}
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
          >
            {successMessage}
          </div>
        )}

        <Input
          label="Nome completo"
          type="text"
          autoComplete="name"
          placeholder="Seu nome"
          error={errors.fullName?.message}
          {...register('fullName')}
        />

        <Input
          label="E-mail"
          type="email"
          autoComplete="email"
          inputMode="email"
          spellCheck={false}
          placeholder="seu@email.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Select
          label="Tipo de conta"
          error={errors.accountType?.message}
          options={ACCOUNT_TYPE_OPTIONS}
          {...accountTypeField}
          onChange={(event) => {
            void accountTypeField.onChange(event)
            if (event.target.value !== 'fisioterapeuta') {
              setValue('joinCode', '')
              clearErrors('joinCode')
            }
          }}
        />

        {accountType === 'fisioterapeuta' && (
          <Input
            label="Código da empresa"
            placeholder="ABCD1234"
            hint="Peça o código de 8 caracteres ao responsável da clínica."
            autoComplete="off"
            spellCheck={false}
            autoCapitalize="characters"
            error={errors.joinCode?.message}
            {...register('joinCode')}
          />
        )}

        <Input
          label="Senha"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="••••••••••••"
          hint="Mínimo 8 caracteres, com maiúscula, minúscula, número e caractere especial"
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirmar senha"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="••••••••••••"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="text-xs text-muted transition-colors hover:text-forest"
        >
          {showPassword ? 'Ocultar senhas' : 'Mostrar senhas'}
        </button>

        <Button type="submit" fullWidth isLoading={isSubmitting} disabled={!!successMessage}>
          Criar conta
        </Button>
      </form>
    </AuthLayout>
  )
}
