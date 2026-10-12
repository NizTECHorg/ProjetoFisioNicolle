import { useEffect, useState } from 'react'
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
import { clearAuthRateLimits } from '@/lib/security'
import { requestPasswordReset } from '@/services/auth.service'
import { toast } from '@/stores/toast.store'

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (import.meta.env.DEV) {
      clearAuthRateLimits()
    }
  }, [])

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
      title={sent ? 'Confira seu e-mail' : 'Esqueci minha senha'}
      subtitle={
        sent
          ? 'O link só abre a Fluxo. A senha nova você escolhe no app.'
          : 'Informe o e-mail da conta. Enviamos um link para você abrir o app e escolher uma senha nova.'
      }
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
        <div className="space-y-6">
          <div className="rounded-2xl border border-forest/15 bg-forest/5 px-5 py-5 text-left">
            <p className="text-sm leading-6 text-ink">
              Se existir uma conta com este e-mail, enviamos um link.
            </p>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-muted">
              <li>Abra o e-mail da Fluxo (e a pasta de spam, se precisar).</li>
              <li>Toque no botão do e-mail para entrar no app.</li>
              <li>No app, escolha a senha nova e salve.</li>
            </ol>
            <p className="mt-4 text-xs leading-5 text-muted">
              O e-mail não troca a senha sozinho — ele só te leva até a tela onde você define a
              nova.
            </p>
          </div>

          <Link
            to="/"
            className="inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-2xl bg-forest px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-forest/20 transition-all duration-200 hover:bg-forest-mid active:scale-[0.98]"
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
