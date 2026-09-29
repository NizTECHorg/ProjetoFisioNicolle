import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from '@/schemas/auth.schema'
import { requestPasswordReset } from '@/services/auth.service'
import { toast } from '@/stores/toast.store'

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  async function onSubmit(data: ForgotPasswordFormData) {
    try {
      await requestPasswordReset(data.email)
      setSent(true)
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : 'Não foi possível enviar o link. Tente de novo.',
        'error',
      )
    }
  }

  return (
    <AuthLayout
      title="Esqueci minha senha"
      subtitle="Informe o e-mail da conta. Enviamos um link para criar uma senha nova."
      footer={
        sent ? undefined : (
          <p>
            Lembrou a senha?{' '}
            <Link to="/" className="font-medium text-forest hover:text-forest-mid">
              Entrar
            </Link>
          </p>
        )
      }
    >
      {sent ? (
        <div className="space-y-5 text-center">
          <p className="text-sm text-muted">
            Se existir uma conta com este e-mail, enviamos um link para redefinir a senha.
          </p>
          <p className="text-sm text-muted">Confira também a pasta de spam.</p>
          <Link
            to="/"
            className="inline-flex min-h-11 items-center justify-center text-sm font-medium text-forest hover:text-forest-mid"
          >
            Voltar ao login
          </Link>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
          noValidate
          autoComplete="off"
        >
          <Input
            label="E-mail"
            type="email"
            autoComplete="off"
            inputMode="email"
            spellCheck={false}
            placeholder="seu@email.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Button type="submit" fullWidth isLoading={isSubmitting}>
            Enviar link
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
