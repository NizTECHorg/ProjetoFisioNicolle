import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { loginSchema, type LoginFormData } from '@/schemas/auth.schema'
import { safeRedirectPath } from '@/lib/security'
import { signInWithEmail } from '@/services/auth.service'
import { toast } from '@/stores/toast.store'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)

  const from = safeRedirectPath(
    (location.state as { from?: { pathname: string } } | null)?.from?.pathname,
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: LoginFormData) {
    try {
      await signInWithEmail(data)
      navigate(from, { replace: true })
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Erro ao entrar.', 'error')
    }
  }

  return (
    <AuthLayout
      title="Entrar"
      subtitle="Acesse sua conta para gerenciar a clínica"
      footer={
        <p>
          Não tem conta?{' '}
          <Link to="/cadastro" className="font-medium text-forest hover:text-forest-mid">
            Criar conta
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate autoComplete="off">
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

        <div className="space-y-2">
          <Input
            label="Senha"
            type={showPassword ? 'text' : 'password'}
            autoComplete="off"
            placeholder="••••••••••••"
            error={errors.password?.message}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="text-xs text-muted transition-colors hover:text-forest"
          >
            {showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          </button>
        </div>

        <Button type="submit" fullWidth isLoading={isSubmitting}>
          Entrar
        </Button>
      </form>
    </AuthLayout>
  )
}
