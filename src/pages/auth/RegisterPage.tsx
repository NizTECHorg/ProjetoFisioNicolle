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
import { toast } from '@/stores/toast.store'

const ACCOUNT_TYPE_OPTIONS = [
  { value: '', label: 'Selecione o tipo' },
  { value: 'autonomo', label: 'Autônomo — atendo sozinho' },
  { value: 'empresa', label: 'Empresa — clínica que monta equipe' },
  { value: 'fisioterapeuta', label: 'Fisioterapeuta — trabalho em uma empresa' },
]

export function RegisterPage() {
  const [accountCreated, setAccountCreated] = useState(false)
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
    try {
      if (data.accountType === 'fisioterapeuta') {
        const exists = await lookupOrganizationByCode(data.joinCode ?? '')
        if (!exists) {
          toast(
            'Código da empresa não encontrado. Confira com o responsável e tente de novo.',
            'error',
          )
          return
        }
      }

      const { needsEmailConfirmation } = await signUpWithEmail(data)
      setAccountCreated(true)

      if (data.accountType === 'fisioterapeuta') {
        toast('Cadastro concluído. Aguarde a empresa aceitar seu pedido.', 'success')
        return
      }

      if (needsEmailConfirmation) {
        toast(
          'Conta criada! Verifique seu e-mail (e a pasta de spam) para confirmar antes de entrar.',
          'success',
        )
      } else {
        toast('Conta criada com sucesso! Você já pode entrar.', 'success')
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Erro ao criar conta.', 'error')
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

        <Button type="submit" fullWidth isLoading={isSubmitting} disabled={accountCreated}>
          Criar conta
        </Button>
      </form>
    </AuthLayout>
  )
}
