import { useState, type ReactNode } from 'react'
import { Download, ExternalLink, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useDeletePatientTerm } from '@/hooks/usePatientTerms'
import { buildTermFileName } from '@/lib/consentTerms'
import { usePatients } from '@/hooks/usePatients'
import { resolveWhatsAppDigits } from '@/lib/patientContact'
import { PATIENT_AI_COPY } from '@/schemas/patientAi.schema'
import { openPatientDocumentWhatsApp } from '@/services/patientDocumentSend.service'
import { getPatientTermDownloadUrl, getPatientTermShareUrl } from '@/services/patientTerms.service'
import { toast } from '@/stores/toast.store'
import type { PatientTerm } from '@/types/patientTerm'

interface TermListProps {
  terms: PatientTerm[] | undefined
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  showPatient: boolean
  canDelete: (term: PatientTerm) => boolean
  emptyTitle: string
  emptyBody: string
  emptyAction?: ReactNode
}

const dateFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

const actionClass =
  'inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-forest hover:bg-canvas disabled:opacity-50'

export function TermList({
  terms,
  isLoading,
  isError,
  onRetry,
  showPatient,
  canDelete,
  emptyTitle,
  emptyBody,
  emptyAction,
}: TermListProps) {
  const [pending, setPending] = useState<PatientTerm | null>(null)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const del = useDeletePatientTerm()
  const { data: patients = [] } = usePatients()

  // Mesmo fluxo do envio da avaliação: telefone do cadastro, link de 7 dias e wa.me numa aba nova.
  async function sendWhatsApp(term: PatientTerm) {
    if (sendingId) return
    const phone = patients.find((p) => p.id === term.patientId)?.phone
    const resolved = resolveWhatsAppDigits(phone)
    if (!resolved.ok) {
      toast(
        resolved.reason === 'missing' ? PATIENT_AI_COPY.sendNeedPhone : PATIENT_AI_COPY.sendPhoneInvalid,
        'error',
      )
      return
    }
    setSendingId(term.id)
    try {
      const url = await getPatientTermShareUrl(
        term.storagePath,
        term.patientId,
        buildTermFileName(term.termType, term.patientName, new Date(term.signedAt)),
      )
      if (!url) {
        toast(PATIENT_AI_COPY.sendFileUnavailable, 'error')
        return
      }
      const popup = openPatientDocumentWhatsApp(resolved.digits, url, 'Segue o termo assinado.')
      if (popup === null) {
        toast(PATIENT_AI_COPY.sendWhatsAppBlocked, 'error')
        return
      }
      toast(PATIENT_AI_COPY.sendWhatsAppSuccess, 'success')
    } finally {
      setSendingId(null)
    }
  }

  async function download(term: PatientTerm) {
    try {
      const url = await getPatientTermDownloadUrl(
        term.storagePath,
        buildTermFileName(term.termType, term.patientName, new Date(term.signedAt)),
      )
      const a = document.createElement('a')
      a.href = url
      a.rel = 'noopener noreferrer'
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch {
      toast('Não foi possível baixar o PDF. Tente de novo.', 'error')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-canvas motion-reduce:animate-none" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-3 py-4">
        <p className="text-sm text-muted">Não foi possível carregar os termos. Tente de novo.</p>
        <Button type="button" variant="secondary" onClick={onRetry}>
          Tentar de novo
        </Button>
      </div>
    )
  }

  if (!terms || terms.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <p className="text-sm font-semibold text-ink">{emptyTitle}</p>
        <p className="text-sm text-muted">{emptyBody}</p>
        {emptyAction ? <div className="mt-2">{emptyAction}</div> : null}
      </div>
    )
  }

  return (
    <>
      <ul>
        {terms.map((term) => (
          <li
            key={term.id}
            className="flex min-h-11 flex-col gap-2 border-t border-line py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">{term.title}</p>
              <p className="text-sm text-muted">
                {(showPatient ? `${term.patientName} · ` : '') + dateFmt.format(new Date(term.signedAt))}
              </p>
              <p className="text-sm text-muted">{`Assinado por: ${term.guardianName ?? term.patientName}`}</p>
            </div>
            <div className="flex flex-wrap items-center gap-1 sm:shrink-0">
              <button
                type="button"
                className={actionClass}
                aria-label="Abrir"
                disabled={!term.signedUrl}
                onClick={() => {
                  if (term.signedUrl) window.open(term.signedUrl, '_blank', 'noopener,noreferrer')
                }}
              >
                <ExternalLink size={16} />
                <span className="hidden sm:inline">Abrir</span>
              </button>
              <button type="button" className={actionClass} aria-label="Baixar" onClick={() => void download(term)}>
                <Download size={16} />
                <span className="hidden sm:inline">Baixar</span>
              </button>
              {canDelete(term) ? (
                <button
                  type="button"
                  className={actionClass}
                  aria-label={PATIENT_AI_COPY.sendWhatsApp}
                  disabled={sendingId !== null}
                  aria-busy={sendingId === term.id}
                  onClick={() => void sendWhatsApp(term)}
                >
                  {sendingId === term.id ? (
                    <Loader2 size={16} className="animate-spin motion-reduce:animate-none" />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#25D366"
                        d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.74.46 3.44 1.34 4.94L2 22l5.39-1.41a10.1 10.1 0 0 0 4.65 1.18h.01c5.46 0 9.89-4.4 9.89-9.83C21.94 6.4 17.5 2 12.04 2zm5.76 13.89c-.24.68-1.2 1.24-1.96 1.4-.52.11-1.2.2-3.48-.75-2.92-1.21-4.8-4.17-4.95-4.36-.14-.2-1.18-1.57-1.18-3 0-1.42.75-2.12 1.02-2.41.26-.29.58-.36.77-.36h.55c.18 0 .41-.07.64.49.24.58.82 2 .89 2.15.07.14.12.32.02.51-.09.2-.14.32-.28.49-.14.17-.29.38-.42.51-.14.14-.28.29-.12.56.16.27.7 1.16 1.51 1.88 1.04.92 1.91 1.21 2.18 1.35.27.14.43.12.59-.07.16-.19.68-.79.86-1.06.18-.27.36-.22.6-.13.24.09 1.54.73 1.8.86.27.14.44.2.51.31.06.12.06.67-.18 1.35z"
                      />
                    </svg>
                  )}
                  <span className="hidden sm:inline">{PATIENT_AI_COPY.sendWhatsApp}</span>
                </button>
              ) : null}
              {canDelete(term) ? (
                <button
                  type="button"
                  className={`${actionClass} text-error`}
                  aria-label="Excluir"
                  onClick={() => setPending(term)}
                >
                  <Trash2 size={16} />
                  <span className="hidden sm:inline">Excluir</span>
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={pending !== null}
        title="Excluir termo?"
        description="O PDF assinado será removido do paciente. Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        cancelLabel="Voltar"
        tone="danger"
        isLoading={del.isPending}
        onConfirm={() => {
          if (pending) del.mutate(pending, { onSettled: () => setPending(null) })
        }}
        onClose={() => setPending(null)}
      />
    </>
  )
}
