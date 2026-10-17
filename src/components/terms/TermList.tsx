import { useState, type ReactNode } from 'react'
import { Download, ExternalLink, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useDeletePatientTerm } from '@/hooks/usePatientTerms'
import { buildTermFileName } from '@/lib/consentTerms'
import { getPatientTermDownloadUrl } from '@/services/patientTerms.service'
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
  const del = useDeletePatientTerm()

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
            <div className="flex shrink-0 items-center gap-1">
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
