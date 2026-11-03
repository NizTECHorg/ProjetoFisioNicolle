import { useEffect, useState } from 'react'
import { Check, MessageCircle, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { resolveWhatsAppDigits } from '@/lib/patientContact'

const EXTRA_MAX = 3

type Props = {
  open: boolean
  /** Telefone do cadastro do paciente (cru). */
  patientPhone: string | null | undefined
  /** Abre a conversa no número (dígitos com 55) e diz se deu certo. */
  onOpenChat: (digits: string) => Promise<boolean>
  onClose: () => void
}

function formatar(digits: string) {
  const local = digits.startsWith('55') ? digits.slice(2) : digits
  const ddd = local.slice(0, 2)
  const resto = local.slice(2)
  const meio = resto.length === 9 ? `${resto.slice(0, 5)}-${resto.slice(5)}` : `${resto.slice(0, 4)}-${resto.slice(4)}`
  return `(${ddd}) ${meio}`
}

/**
 * Enviar o PDF pelo WhatsApp para o paciente e mais pessoas. Cada número abre a própria
 * conversa com um toque (o navegador bloqueia abrir várias janelas de uma vez).
 */
export function SendWhatsAppDialog({ open, patientPhone, onOpenChat, onClose }: Props) {
  const [extras, setExtras] = useState<string[]>([])
  const [abertos, setAbertos] = useState<ReadonlySet<string>>(() => new Set())
  const [abrindo, setAbrindo] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setExtras([])
    setAbertos(new Set())
    setAbrindo(null)
  }, [open])

  const paciente = resolveWhatsAppDigits(patientPhone)

  async function abrir(digits: string) {
    setAbrindo(digits)
    try {
      const ok = await onOpenChat(digits)
      if (ok) setAbertos((atual) => new Set(atual).add(digits))
    } finally {
      setAbrindo(null)
    }
  }

  function botao(digits: string | null, rotulo: string) {
    const enviado = digits ? abertos.has(digits) : false
    return (
      <Button
        type="button"
        variant={enviado ? 'secondary' : 'primary'}
        className="!shrink-0 !px-3 !py-2 !text-xs"
        disabled={!digits || abrindo !== null}
        isLoading={digits !== null && abrindo === digits}
        aria-label={`${enviado ? 'Abrir de novo' : 'Abrir conversa'} com ${rotulo}`}
        onClick={() => digits && void abrir(digits)}
      >
        {enviado ? <Check size={14} aria-hidden /> : <MessageCircle size={14} aria-hidden />}
        {enviado ? 'Aberto' : 'Abrir conversa'}
      </Button>
    )
  }

  return (
    <Modal
      open={open}
      title="Enviar PDF pelo WhatsApp"
      description="Toque em “Abrir conversa” em cada número. O link do PDF vale 7 dias."
      onClose={onClose}
    >
      <div className="space-y-4">
        <div className="flex min-h-12 items-center gap-3 rounded-xl border border-line px-3 py-2">
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-ink">Paciente</span>
            <span className="block truncate text-xs text-muted">
              {paciente.ok ? formatar(paciente.digits) : patientPhone?.trim() ? 'Telefone do cadastro inválido' : 'Sem telefone no cadastro'}
            </span>
          </span>
          {botao(paciente.ok ? paciente.digits : null, 'o paciente')}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-ink">Enviar também para</p>
          {extras.map((valor, index) => {
            const numero = resolveWhatsAppDigits(valor)
            const invalido = valor.trim() !== '' && !numero.ok
            return (
              <div key={index} className="space-y-1">
                <div className="flex items-center gap-2">
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="off"
                    autoFocus={index === extras.length - 1}
                    placeholder="Ex.: (11) 91234-5678"
                    value={valor}
                    aria-label={`Número extra ${index + 1}`}
                    onChange={(event) =>
                      setExtras((atual) => atual.map((item, i) => (i === index ? event.target.value : item)))
                    }
                    className={[
                      'min-h-11 w-full min-w-0 rounded-xl border bg-canvas px-3 text-sm text-ink',
                      invalido ? 'border-error' : 'border-line',
                    ].join(' ')}
                  />
                  {botao(numero.ok ? numero.digits : null, `o número ${index + 1}`)}
                  <button
                    type="button"
                    aria-label={`Remover número extra ${index + 1}`}
                    onClick={() => setExtras((atual) => atual.filter((_, i) => i !== index))}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted hover:text-error"
                  >
                    <X size={16} aria-hidden />
                  </button>
                </div>
                {invalido ? <p className="text-xs text-error">Use DDD + número, ex.: 11 91234-5678.</p> : null}
              </div>
            )
          })}
          {extras.length < EXTRA_MAX ? (
            <button
              type="button"
              onClick={() => setExtras((atual) => [...atual, ''])}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-forest hover:bg-accent-soft"
            >
              <Plus size={15} aria-hidden />
              Adicionar outro número
            </button>
          ) : (
            <p className="text-xs text-muted">Até {EXTRA_MAX} números além do paciente.</p>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
