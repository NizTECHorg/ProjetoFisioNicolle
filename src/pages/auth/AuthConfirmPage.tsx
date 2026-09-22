import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import type { EmailOtpType } from '@supabase/supabase-js'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase/client'
import { mapAuthError } from '@/lib/security'
import { toast } from '@/stores/toast.store'

const OTP_TYPES = new Set<EmailOtpType>([
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
])

function parseOtpType(value: string | null): EmailOtpType | null {
  if (!value) return null
  return OTP_TYPES.has(value as EmailOtpType) ? (value as EmailOtpType) : null
}

/**
 * Confirma e-mail / recovery via token_hash (não depende do PKCE do browser do cadastro).
 * Link do template: /auth/confirm?token_hash={{ .TokenHash }}&type=email
 */
export function AuthConfirmPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'working' | 'ok' | 'error'>('working')
  const [message, setMessage] = useState('Confirmando seu e-mail…')

  useEffect(() => {
    const token_hash = params.get('token_hash')
    const type = parseOtpType(params.get('type'))

    if (!token_hash || !type) {
      setStatus('error')
      setMessage(
        'Link inválido ou incompleto. Solicite um novo e-mail de confirmação ou entre com sua senha.',
      )
      return
    }

    let cancelled = false

    void supabase.auth.verifyOtp({ token_hash, type }).then(({ error }) => {
      if (cancelled) return
      if (error) {
        setStatus('error')
        setMessage(mapAuthError(error))
        toast(mapAuthError(error), 'error')
        return
      }
      setStatus('ok')
      setMessage('E-mail confirmado. Você já pode entrar na Fluxo.')
      toast('E-mail confirmado com sucesso.', 'success')
      window.setTimeout(() => {
        navigate('/', { replace: true })
      }, 1200)
    })

    return () => {
      cancelled = true
    }
  }, [params, navigate])

  return (
    <AuthLayout title="Confirmar e-mail" subtitle="Validando o link enviado para sua caixa de entrada">
      <div className="space-y-5 text-center">
        {status === 'working' ? (
          <div className="flex justify-center py-6">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest border-t-transparent" />
          </div>
        ) : null}
        <p className={status === 'error' ? 'text-sm text-error' : 'text-sm text-muted'}>{message}</p>
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
    </AuthLayout>
  )
}
