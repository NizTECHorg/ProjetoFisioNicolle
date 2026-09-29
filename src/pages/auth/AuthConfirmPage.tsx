import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { confirmFromInitialUrl } from '@/lib/auth/confirmCallback'
import {
  recoveryPasswordSchema,
  type RecoveryPasswordFormData,
} from '@/schemas/auth.schema'
import { setPasswordFromRecovery } from '@/services/auth.service'
import { toast } from '@/stores/toast.store'

function isRecoveryTypeInUrl(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const url = new URL(window.location.href)
    const search = url.searchParams
    const hash = new URLSearchParams(url.hash.replace(/^#/, ''))
    return (
      search.get('type') === 'recovery' ||
      hash.get('type') === 'recovery' ||
      search.get('amp;type') === 'recovery' ||
      hash.get('amp;type') === 'recovery'
    )
  } catch {
    return false
  }
}

/**
 * Confirma e-mail / recovery.
 * Link do template: /auth/confirm?token_hash={{ .TokenHash }}&type=signup
 * O redirect do Supabase (flujo implícito) também cai aqui com o hash da sessão.
 */
export function AuthConfirmPage() {
  const navigate = useNavigate()
  const recoveryFromUrl = isRecoveryTypeInUrl()
  const [status, setStatus] = useState<'working' | 'recovery' | 'ok' | 'error'>('working')
  const [isRecoveryContext, setIsRecoveryContext] = useState(recoveryFromUrl)
  const [message, setMessage] = useState(
    recoveryFromUrl ? 'Validando o link…' : 'Confirmando seu e-mail…',
  )
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RecoveryPasswordFormData>({
    resolver: zodResolver(recoveryPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    let cancelled = false
    const urlLooksRecovery = isRecoveryTypeInUrl()

    void confirmFromInitialUrl().then((result) => {
      if (cancelled) return
      if (result.ok) {
        if (result.mode === 'recovery') {
          setIsRecoveryContext(true)
          setStatus('recovery')
          setMessage('')
          return
        }
        setStatus('ok')
        setMessage('E-mail confirmado. Você já pode entrar na Fluxo.')
        toast('E-mail confirmado com sucesso.', 'success')
        window.setTimeout(() => {
          if (!cancelled) navigate('/', { replace: true })
        }, 900)
        return
      }

      const recoveryError = urlLooksRecovery

      if ('ignored' in result) {
        setStatus('error')
        setMessage(
          recoveryError
            ? 'Link inválido ou incompleto. Peça um novo link em Esqueci minha senha.'
            : 'Link inválido ou incompleto. Cadastre-se de novo para receber outro e-mail.',
        )
        return
      }
      if (result.consumed) {
        setStatus('error')
        setMessage(
          recoveryError
            ? 'Este link já foi usado ou expirou. Peça um novo link em Esqueci minha senha.'
            : 'Este link já foi usado ou expirou. A conta pode já estar confirmada. Tente entrar com e-mail e senha. Se o login for recusado, faça um novo cadastro.',
        )
        return
      }
      setStatus('error')
      setMessage(result.message)
      toast(result.message, 'error')
    })

    return () => {
      cancelled = true
    }
  }, [navigate])

  async function onRecoverySubmit(data: RecoveryPasswordFormData) {
    try {
      await setPasswordFromRecovery(data)
      toast('Senha atualizada.', 'success')
      navigate('/', { replace: true })
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar a nova senha. Tente de novo.',
        'error',
      )
    }
  }

  const showRecoveryChrome =
    status === 'recovery' || (isRecoveryContext && status !== 'ok')

  return (
    <AuthLayout
      title={showRecoveryChrome ? 'Nova senha' : 'Confirmar e-mail'}
      subtitle={
        showRecoveryChrome
          ? 'Escolha uma senha nova para entrar na Fluxo.'
          : 'Validando o link enviado para sua caixa de entrada'
      }
    >
      {status === 'recovery' ? (
        <form className="space-y-5" onSubmit={handleSubmit(onRecoverySubmit)} noValidate>
          <Input
            label="Nova senha"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••••••"
            hint="Mínimo 8 caracteres, com maiúscula, minúscula, número e caractere especial"
            error={errors.password?.message}
            {...register('password')}
          />

          <Input
            label="Confirmar nova senha"
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

          <Button type="submit" fullWidth isLoading={isSubmitting}>
            Salvar nova senha
          </Button>
        </form>
      ) : (
        <div className="space-y-5 text-center">
          {status === 'working' ? (
            <div className="flex justify-center py-6">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest border-t-transparent" />
            </div>
          ) : null}
          {message ? (
            <p className={status === 'error' ? 'text-sm text-error' : 'text-sm text-muted'}>
              {message}
            </p>
          ) : null}
          {status === 'error' ? (
            <Button type="button" fullWidth onClick={() => navigate('/', { replace: true })}>
              Ir para o login
            </Button>
          ) : null}
          {status === 'ok' ? (
            <p className="text-xs text-muted">
              Redirecionando… ou{' '}
              <Link to="/" className="font-medium text-forest hover:text-forest-mid">
                entre agora
              </Link>
              .
            </p>
          ) : null}
        </div>
      )}
    </AuthLayout>
  )
}
