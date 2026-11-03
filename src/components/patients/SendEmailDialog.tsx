import { useEffect, useState } from 'react'
import { Mail, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

const EXTRA_MAX = 3
const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Props = {
  open: boolean
  /** E-mail do cadastro do paciente; null quando não tem. */
  patientEmail: string | null
  sending: boolean
  onClose: () => void
  onSend: (input: { sendToPatient: boolean; extraEmails: string[] }) => void
}

/** Escolher para quem vai o PDF: o paciente (e-mail do cadastro) e/ou até 3 outras pessoas. */
export function SendEmailDialog({ open, patientEmail, sending, onClose, onSend }: Props) {
  const [paraPaciente, setParaPaciente] = useState(true)
  const [extras, setExtras] = useState<string[]>([])
  const [tentou, setTentou] = useState(false)

  useEffect(() => {
    if (!open) return
    setParaPaciente(Boolean(patientEmail))
    setExtras([])
    setTentou(false)
  }, [open, patientEmail])

  const extrasLimpos = extras.map((item) => item.trim()).filter(Boolean)
  const invalidos = extrasLimpos.filter((item) => !EMAIL_OK.test(item))
  const total = (paraPaciente && patientEmail ? 1 : 0) + extrasLimpos.length
  const erro =
    invalidos.length > 0
      ? 'Confira os e-mails: algum endereço está inválido.'
      : total === 0
        ? 'Escolha pelo menos um destinatário.'
        : null

  return (
    <Modal open={open} title="Enviar PDF por e-mail" description="Escolha quem recebe o documento." onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          setTentou(true)
          if (erro) return
          onSend({ sendToPatient: paraPaciente && Boolean(patientEmail), extraEmails: extrasLimpos })
        }}
      >
        <label
          className={[
            'flex min-h-12 items-center gap-3 rounded-xl border border-line px-3 py-2',
            patientEmail ? 'cursor-pointer' : 'opacity-60',
          ].join(' ')}
        >
          <input
            type="checkbox"
            className="accent-forest"
            checked={paraPaciente && Boolean(patientEmail)}
            disabled={!patientEmail}
            onChange={(event) => setParaPaciente(event.target.checked)}
          />
          <span className="min-w-0">
            <span className="block text-sm font-medium text-ink">Paciente</span>
            <span className="block truncate text-xs text-muted">
              {patientEmail ?? 'Sem e-mail no cadastro'}
            </span>
          </span>
        </label>

        <div className="space-y-2">
          <p className="text-sm font-medium text-ink">Enviar também para</p>
          {extras.map((valor, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="email"
                inputMode="email"
                autoComplete="off"
                autoFocus={index === extras.length - 1}
                placeholder="Ex.: medico@clinica.com"
                value={valor}
                aria-label={`E-mail extra ${index + 1}`}
                onChange={(event) =>
                  setExtras((atual) => atual.map((item, i) => (i === index ? event.target.value : item)))
                }
                className={[
                  'min-h-11 w-full rounded-xl border bg-canvas px-3 text-sm text-ink',
                  tentou && valor.trim() && !EMAIL_OK.test(valor.trim()) ? 'border-error' : 'border-line',
                ].join(' ')}
              />
              <button
                type="button"
                aria-label={`Remover e-mail extra ${index + 1}`}
                onClick={() => setExtras((atual) => atual.filter((_, i) => i !== index))}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted hover:text-error"
              >
                <X size={16} aria-hidden />
              </button>
            </div>
          ))}
          {extras.length < EXTRA_MAX ? (
            <button
              type="button"
              onClick={() => setExtras((atual) => [...atual, ''])}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-forest hover:bg-accent-soft"
            >
              <Plus size={15} aria-hidden />
              Adicionar outra pessoa
            </button>
          ) : (
            <p className="text-xs text-muted">Até {EXTRA_MAX} pessoas além do paciente.</p>
          )}
        </div>

        {tentou && erro ? (
          <p role="alert" className="text-sm text-error">
            {erro}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={sending}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={sending}>
            <Mail size={16} aria-hidden />
            {total > 1 ? `Enviar para ${total} pessoas` : 'Enviar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
