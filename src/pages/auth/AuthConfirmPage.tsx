import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/Button'
import { confirmFromInitialUrl } from '@/lib/auth/confirmCallback'
import { toast } from '@/stores/toast.store'

/**
 * Confirma e-mail / recovery.
 * Link do template: /auth/confirm?token_hash={{ .TokenHash }}&type=signup
 * O redirect do Supabase (fluxo implícito) também cai aqui com o hash da sessão.
 */
export function AuthConfirmPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'working' | 'ok' | 'error'>('working')
  const [message, setMessage] = useState('Confirmando seu e-mail…')

  useEffect(() => {
    let cancelled = false

    void confirmFromInitialUrl().then((result) => {
      if (cancelled) return
      if (result.ok) {
        setStatus('ok')
        setMessage('E-mail confirmado. Você já pode entrar na Fluxo.')
        toast('E-mail confirmado com sucesso.', 'success')
        window.setTimeout(() => {
          if (!cancelled) navigate('/', { replace: true })
        }, 900)
        return
      }
      if ('ignored' in result) {
        setStatus('error')
        setMessage('Link inválido ou incompleto. Cadastre-se de novo para receber outro e-mail.')
        return
      }
      if (result.consumed) {
        setStatus('error')
        setMessage(
          'Este link já foi usado ou expirou. A conta pode já estar confirmada. Tente entrar com e-mail e senha. Se o login for recusado, faça um novo cadastro.',
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
