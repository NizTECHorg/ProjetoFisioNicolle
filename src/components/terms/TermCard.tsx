import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown, CloudUpload, Copy, FileDown, Pencil, RotateCcw } from 'lucide-react'
import { SignaturePad } from '@/components/patients/evaluation/SignaturePad'
import { AiGeneratingButton } from '@/components/ui/AiGeneratingButton'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { useCreatePatientTerm } from '@/hooks/usePatientTerms'
import {
  buildTermFileName,
  fillTerm,
  formatMissing,
  termMissingForSave,
  type ConsentTerm,
  type TermValues,
} from '@/lib/consentTerms'
import { downloadBlob } from '@/lib/downloadBlob'
import { isSafeSignaturePath } from '@/lib/signaturePath'
import { buildPrintableTermPdf, buildSignedTermPdf } from '@/services/termsPdf.service'
import { toast } from '@/stores/toast.store'

type TermCardProps = {
  term: ConsentTerm
  values: TermValues
  patientId: string | null
  resetKey: string
  createdByName: string | null
  /** Âncora usada pela navegação lateral (tablet/desktop). */
  domId?: string
  /** Só no tablet/desktop: no celular o cartão fica sempre aberto. */
  collapsible?: boolean
  collapsed?: boolean
  onToggleCollapsed?: () => void
}

const PDF_ERROR = 'Não foi possível gerar o PDF. Tente de novo em instantes.'

export function TermCard({
  term,
  values,
  patientId,
  resetKey,
  createdByName,
  domId,
  collapsible = false,
  collapsed = false,
  onToggleCollapsed,
}: TermCardProps) {
  const captionId = useId()
  const bodyId = useId()
  const closed = collapsible && collapsed
  const create = useCreatePatientTerm()
  const [signature, setSignature] = useState('')
  const [override, setOverride] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState<'save' | 'export' | null>(null)
  const editButtonRef = useRef<HTMLButtonElement>(null)
  const signatureRef = useRef(signature)
  const lastKey = useRef(resetKey)

  useEffect(() => {
    signatureRef.current = signature
  }, [signature])

  useEffect(() => {
    if (lastKey.current === resetKey) return
    lastKey.current = resetKey
    if (signatureRef.current) {
      toast('A assinatura foi apagada porque os dados mudaram.', 'info')
    }
    setSignature('')
    setOverride(null)
    setEditing(false)
  }, [resetKey])

  const text = override ?? fillTerm(term.template, values)
  const missing = termMissingForSave({
    hasPatient: Boolean(patientId),
    signatureOk: isSafeSignaturePath(signature),
    values,
    text,
  })
  const locked = busy !== null

  const pdfInput = (generatedAt: Date) => ({
    termKey: term.key,
    category: term.category,
    title: term.title,
    bodyText: text,
    patientName: values.patientName,
    patientCpf: values.patientCpf,
    therapistName: values.therapistName,
    crefito: values.crefito,
    guardian: values.guardian,
    generatedAt,
  })

  const startEdit = () => {
    setDraft(text)
    setEditing(true)
  }

  const finishEdit = () => {
    setOverride(draft.trim() || null)
    setEditing(false)
    setSignature('')
    requestAnimationFrame(() => editButtonRef.current?.focus())
  }

  const restore = () => {
    setOverride(null)
    setEditing(false)
    setSignature('')
    requestAnimationFrame(() => editButtonRef.current?.focus())
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      toast('Texto copiado.', 'success')
    } catch {
      toast('Não foi possível copiar. Selecione o texto e copie manualmente.', 'error')
    }
  }

  const exportPdf = async () => {
    setBusy('export')
    try {
      const now = new Date()
      const blob = await buildPrintableTermPdf(pdfInput(now))
      downloadBlob(blob, buildTermFileName(term.key, values.patientName || 'paciente', now))
    } catch {
      toast(PDF_ERROR, 'error')
    } finally {
      setBusy(null)
    }
  }

  const save = async () => {
    if (!patientId || missing.length > 0) return
    setBusy('save')
    try {
      const signedAt = new Date()
      let pdf: Blob
      try {
        pdf = await buildSignedTermPdf({ ...pdfInput(signedAt), signaturePath: signature })
      } catch {
        toast(PDF_ERROR, 'error')
        return
      }
      await create.mutateAsync({
        patientId,
        input: {
          termType: term.key,
          title: term.title,
          bodyText: text,
          patientName: values.patientName,
          therapistName: values.therapistName,
          therapistCrefito: values.crefito,
          guardianName: values.guardian?.name ?? null,
          guardianCpf: values.guardian?.cpf ?? null,
          createdByName,
          signedAt,
        },
        pdf,
      })
      setSignature('')
      setOverride(null)
    } catch {
      // o hook já mostra o erro do envio
    } finally {
      setBusy(null)
    }
  }

  return (
    <section id={domId} className="scroll-mt-4 rounded-2xl border border-line bg-surface p-4 md:p-6">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 space-y-4">
          <span className="inline-block rounded-full border border-line bg-canvas px-4 py-1 text-sm font-semibold text-forest">
            {term.category}
          </span>
          <div>
            <h2 className="text-[20px] font-semibold text-ink">{term.title}</h2>
            <p className="mt-2 text-sm text-muted">{term.subtitle}</p>
          </div>
        </div>
        {collapsible ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-expanded={!closed}
            aria-controls={bodyId}
            aria-label={closed ? `Mostrar ${term.title}` : `Recolher ${term.title}`}
            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-canvas hover:text-ink"
          >
            <ChevronDown
              size={20}
              aria-hidden
              className={[
                'transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                closed ? '-rotate-90' : 'rotate-0',
              ].join(' ')}
            />
          </button>
        ) : null}
      </div>

      {/* Abre/fecha deslizando a altura (grid 1fr/0fr) com fade; fechado fica inert. */}
      <div
        id={bodyId}
        inert={closed ? true : undefined}
        className={[
          'grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
          closed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100',
        ].join(' ')}
      >
      <div className="min-h-0 overflow-hidden">
      <div className="-mx-1 space-y-4 px-1 pb-1 pt-4">

      {!editing ? (
        <Button
          ref={editButtonRef}
          type="button"
          variant="secondary"
          className="min-h-11"
          disabled={locked}
          onClick={startEdit}
        >
          <Pencil size={16} aria-hidden />
          Editar
        </Button>
      ) : null}

      {editing ? (
        <div className="space-y-3">
          <Textarea
            label="Texto do termo"
            autoFocus
            autoResize={false}
            className="min-h-48"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" className="min-h-11" onClick={finishEdit}>
              Concluir edição
            </Button>
            <Button type="button" variant="ghost" className="min-h-11" onClick={restore}>
              <RotateCcw size={16} aria-hidden />
              Restaurar modelo
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="whitespace-pre-wrap rounded-2xl border border-line bg-canvas p-4 text-base leading-[1.5] text-ink">
            {text}
          </div>
          {override !== null ? (
            <>
              <p className="text-sm text-muted">Texto editado só para este termo. O modelo padrão não muda.</p>
              <Button type="button" variant="ghost" className="min-h-11" disabled={locked} onClick={restore}>
                <RotateCcw size={16} aria-hidden />
                Restaurar modelo
              </Button>
            </>
          ) : null}
        </div>
      )}

      <div className="space-y-2 border-t border-line pt-4">
        <SignaturePad
          label={values.guardian ? 'Assinatura do responsável legal' : 'Assinatura do Paciente'}
          labelClassName="block text-sm font-semibold text-ink"
          placeholder="Assine aqui com o dedo ou mouse"
          clearLabel="Limpar"
          heightClass="h-56 md:h-64"
          describedBy={captionId}
          value={signature}
          onChange={setSignature}
          disabled={!patientId || editing || locked}
        />
        {!patientId ? <p className="text-sm text-muted">Escolha o paciente acima para assinar.</p> : null}
      </div>

      <div className="border-t border-line pt-4">
        <p id={captionId} className="text-center text-sm text-muted">
          Assinatura do paciente ou responsável legal
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          className="min-h-11 flex-1"
          disabled={locked || editing}
          onClick={copy}
        >
          <Copy size={16} aria-hidden />
          Copiar Texto
        </Button>
        {busy === 'export' ? (
          <AiGeneratingButton generating className="flex-1" />
        ) : (
          <Button
            type="button"
            variant="secondary"
            className="min-h-11 flex-1"
            disabled={locked || editing}
            onClick={exportPdf}
          >
            <FileDown size={16} aria-hidden />
            Exportar PDF
          </Button>
        )}
        {busy === 'save' ? (
          <AiGeneratingButton generating className="w-full" />
        ) : (
          <Button
            type="button"
            className="min-h-11 w-full"
            disabled={missing.length > 0 || locked || editing}
            onClick={save}
          >
            <CloudUpload size={16} aria-hidden />
            Salvar na Nuvem
          </Button>
        )}
      </div>
      {missing.length > 0 && patientId ? (
        <p className="text-sm text-muted">{formatMissing(missing)}</p>
      ) : null}
      </div>
      </div>
      </div>
    </section>
  )
}
