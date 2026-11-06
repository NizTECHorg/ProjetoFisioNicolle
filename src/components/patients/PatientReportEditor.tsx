import { useEffect, useMemo, useState } from 'react'
import type { TextMeasurer } from '@/lib/pdfText'
import { AiGeneratingButton } from '@/components/ui/AiGeneratingButton'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { RascunhoAviso } from '@/components/patients/RascunhoAviso'
import { SignaturePad } from '@/components/patients/evaluation/SignaturePad'
import { useAuth } from '@/hooks/useAuth'
import {
  useCreatePatientReport,
  useGenerateReportText,
  useUpdatePatientReport,
} from '@/hooks/usePatientReports'
import { usePatientSessions } from '@/hooks/usePatients'
import { useRascunhoValores } from '@/hooks/useRascunhoForm'
import {
  RELATORIO_LINHAS_MAX,
  RELATORIO_MAX_SESSOES,
  ajustarAoLimite,
  contarLinhasRelatorio,
  numerosNaoConfirmados,
  rotuloSessoesRelatorio,
  sessaoSelecionavelRelatorio,
  textosFonteRelatorio,
} from '@/lib/relatorio'
import { RASCUNHO_NOVO } from '@/lib/rascunhosLocais'
import { PATIENT_REPORT_COPY } from '@/schemas/patientReport.schema'
import { createRelatorioMeasurer } from '@/services/relatorioPdf.service'
import { toast } from '@/stores/toast.store'
import type { PatientReport } from '@/types/patient'

type RascunhoRelatorio = { content: string; place: string; assinatura?: string; sessionIds: string[] }

type PatientReportEditorProps = {
  patientId: string
  report: PatientReport | null
  open: boolean
  onClose: () => void
}

export function PatientReportEditor({ patientId, report, open, onClose }: PatientReportEditorProps) {
  const { profile } = useAuth()
  const { data: sessions = [], isLoading, isError } = usePatientSessions(patientId)
  const createReport = useCreatePatientReport(patientId)
  const updateReport = useUpdatePatientReport(patientId)
  const generate = useGenerateReportText()

  const [medidor, setMedidor] = useState<TextMeasurer | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [step, setStep] = useState<'selecao' | 'edicao'>('selecao')
  const [content, setContent] = useState('')
  const [place, setPlace] = useState('')
  const [assinatura, setAssinatura] = useState('')
  const [reduzido, setReduzido] = useState(false)
  const [restauradoEm, setRestauradoEm] = useState<number | null>(null)

  const isEdit = report !== null
  const placeValue = place.trim() === '' ? null : place.trim()
  const assinaturaValue = assinatura === '' ? null : assinatura
  const dirty = isEdit
    ? content !== report.content || placeValue !== report.place || assinaturaValue !== report.signaturePath
    : content.trim().length > 0 || placeValue !== null || assinaturaValue !== null

  // Rascunho automático: F5 ou sair sem salvar não perde o texto, nem o que a IA gerou.
  const valoresRascunho = useMemo<RascunhoRelatorio>(
    () => ({ content, place, assinatura, sessionIds: [...selectedIds] }),
    [content, place, assinatura, selectedIds],
  )
  const {
    carregar: carregarRascunho,
    guardar: guardarRascunho,
    limpar: limparRascunho,
  } = useRascunhoValores({
    patientId,
    tipo: 'relatorio',
    registroId: report?.id ?? RASCUNHO_NOVO,
    valores: valoresRascunho,
    ativo: open && dirty,
  })

  useEffect(() => {
    let cancelled = false
    void createRelatorioMeasurer()
      .then((m) => {
        if (!cancelled) setMedidor(m)
      })
      .catch((error: unknown) => {
        if (!cancelled) toast(error instanceof Error ? error.message : PATIENT_REPORT_COPY.saveError, 'error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  function iniciarSemRascunho() {
    setRestauradoEm(null)
    setSelectedIds(new Set())
    setReduzido(false)
    if (report) {
      setStep('edicao')
      setContent(report.content)
      setPlace(report.place ?? '')
      setAssinatura(report.signaturePath ?? '')
    } else {
      setStep('selecao')
      setContent('')
      setPlace('')
      setAssinatura('')
    }
  }

  // Reinicia o estado cada vez que o modal abre; o rascunho deste relatório entra por cima.
  useEffect(() => {
    if (!open) return
    const salvo = carregarRascunho()
    if (!salvo) {
      iniciarSemRascunho()
      return
    }
    setRestauradoEm(salvo.salvoEm)
    setReduzido(false)
    setSelectedIds(new Set(salvo.valores.sessionIds))
    setContent(salvo.valores.content)
    setPlace(salvo.valores.place)
    setAssinatura(salvo.valores.assinatura ?? '')
    setStep('edicao')
    // Só reinicia ao abrir ou trocar de relatório; atualizações da lista não devem apagar a edição.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, report?.id])

  const ordenadas = useMemo(() => {
    const ok: typeof sessions = []
    const no: typeof sessions = []
    for (const s of sessions) {
      if (sessaoSelecionavelRelatorio(s).selecionavel) ok.push(s)
      else no.push(s)
    }
    return [...ok, ...no]
  }, [sessions])

  const temSelecionavel = useMemo(
    () => sessions.some((s) => sessaoSelecionavelRelatorio(s).selecionavel),
    [sessions],
  )

  const marcadas = useMemo(
    () =>
      sessions
        .filter((s) => selectedIds.has(s.id))
        .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)),
    [sessions, selectedIds],
  )

  const linhas = medidor ? contarLinhasRelatorio(medidor, content) : 0
  const acimaDoLimite = linhas > RELATORIO_LINHAS_MAX

  const avisoNumeros = useMemo(
    () => (isEdit ? [] : numerosNaoConfirmados(content, textosFonteRelatorio(marcadas))),
    [isEdit, content, marcadas],
  )

  const saving = createReport.isPending || updateReport.isPending
  const saveDisabled =
    !medidor || linhas === 0 || linhas > RELATORIO_LINHAS_MAX || saving || (!isEdit && marcadas.length === 0)

  function toggleSession(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size >= RELATORIO_MAX_SESSOES) {
        toast(PATIENT_REPORT_COPY.maxSessions, 'error')
        return prev
      } else next.add(id)
      return next
    })
  }

  function handleGenerate() {
    if (!medidor || marcadas.length === 0 || generate.isPending) return
    generate.mutate(
      { patientId, sessionIds: marcadas.map((s) => s.id) },
      {
        onSuccess: (result) => {
          const ajustado = ajustarAoLimite(medidor, result.texto)
          setContent(ajustado.texto)
          setReduzido(ajustado.reduzido)
          setStep('edicao')
        },
      },
    )
  }

  function finish() {
    // Solta a geração em andamento: a resposta atrasada não pode cair no próximo relatório aberto.
    generate.reset()
    setRestauradoEm(null)
    setSelectedIds(new Set())
    setContent('')
    setPlace('')
    setAssinatura('')
    onClose()
  }

  function aoSalvar() {
    limparRascunho()
    finish()
  }

  // Fechar sem salvar guarda o rascunho; o painel oferece continuar ou descartar.
  function requestClose() {
    if (saving) return
    guardarRascunho()
    finish()
  }

  function descartarRascunho() {
    limparRascunho()
    iniciarSemRascunho()
  }

  function handleSave() {
    if (saveDisabled) return
    if (report) {
      updateReport.mutate(
        { report, input: { content, place: placeValue, signaturePath: assinaturaValue } },
        { onSuccess: aoSalvar },
      )
      return
    }
    createReport.mutate(
      {
        patientId,
        sessionIds: marcadas.map((s) => s.id),
        content,
        place: placeValue,
        sessionLabel: rotuloSessoesRelatorio(marcadas),
        therapistName: profile?.fullName || null,
        therapistCrefito: profile?.crefito || null,
        signaturePath: assinaturaValue,
      },
      { onSuccess: aoSalvar },
    )
  }

  const actionClass = 'min-h-11 w-full sm:w-auto'

  return (
    <>
      <Modal
        open={open}
        title={isEdit ? 'Editar relatório' : 'Novo relatório'}
        onClose={requestClose}
        wide
      >
        {step === 'selecao' ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-ink">Sessões do relatório</p>
              <p className="mt-0.5 text-xs text-muted">{PATIENT_REPORT_COPY.selectHint}</p>
            </div>

            {isLoading ? (
              <div className="flex min-h-24 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-forest border-t-transparent" />
              </div>
            ) : null}

            {isError ? <p className="text-sm text-error">{PATIENT_REPORT_COPY.listError}</p> : null}

            {!isLoading && !isError && !temSelecionavel ? (
              <p className="text-sm text-muted">{PATIENT_REPORT_COPY.noSessions}</p>
            ) : null}

            {!isLoading && !isError && ordenadas.length > 0 ? (
              <ul className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-line p-2">
                {ordenadas.map((session) => {
                  const { selecionavel, rascunho } = sessaoSelecionavelRelatorio(session)
                  return (
                    <li key={session.id}>
                      <label
                        className={[
                          'inline-flex min-h-11 w-full items-center gap-2 rounded-lg px-2 text-sm text-ink',
                          selecionavel ? 'cursor-pointer hover:bg-canvas' : 'cursor-not-allowed opacity-60',
                        ].join(' ')}
                      >
                        <input
                          type="checkbox"
                          className="accent-forest"
                          checked={selectedIds.has(session.id)}
                          disabled={!selecionavel}
                          onChange={() => toggleSession(session.id)}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium">{`${session.dateLabel} · ${session.timeLabel}`}</span>
                          {!selecionavel ? (
                            <span className="block text-xs text-muted">{PATIENT_REPORT_COPY.noEvolution}</span>
                          ) : null}
                          {rascunho ? (
                            <span className="mt-1 flex flex-wrap items-center gap-2">
                              <span className="inline-flex rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-medium text-forest">
                                {PATIENT_REPORT_COPY.draftBadge}
                              </span>
                              <span className="text-xs text-muted">{PATIENT_REPORT_COPY.draftHint}</span>
                            </span>
                          ) : null}
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            ) : null}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" className={actionClass} onClick={requestClose}>
                Cancelar
              </Button>
              {generate.isPending ? (
                <AiGeneratingButton type="button" generating className="w-full sm:w-auto" />
              ) : (
                <Button
                  type="button"
                  className={actionClass}
                  disabled={!medidor || marcadas.length === 0 || !temSelecionavel}
                  onClick={handleGenerate}
                >
                  {PATIENT_REPORT_COPY.generate}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {restauradoEm !== null ? (
              <RascunhoAviso
                salvoEm={restauradoEm}
                texto={PATIENT_REPORT_COPY.draftRestored}
                onDescartar={descartarRascunho}
              />
            ) : null}
            {!isEdit ? (
              <p className="rounded-xl bg-accent-soft px-4 py-3 text-sm text-forest">
                {PATIENT_REPORT_COPY.reviewNotice}
              </p>
            ) : null}
            {reduzido ? <p className="text-sm text-muted">{PATIENT_REPORT_COPY.reduced}</p> : null}

            <div className="space-y-1">
              <Textarea
                label="Relatório"
                value={content}
                onChange={(event) => setContent(event.target.value)}
              />
              <p
                aria-live="polite"
                className={['text-xs', acimaDoLimite ? 'text-error' : 'text-muted'].join(' ')}
              >
                {`${linhas}/${RELATORIO_LINHAS_MAX} linhas`}
                {acimaDoLimite ? ` · ${PATIENT_REPORT_COPY.overLimit}` : ''}
              </p>
            </div>

            <Input
              label={PATIENT_REPORT_COPY.placeLabel}
              maxLength={120}
              value={place}
              onChange={(event) => setPlace(event.target.value)}
            />

            <SignaturePad
              label={PATIENT_REPORT_COPY.signatureLabel}
              value={assinatura}
              onChange={setAssinatura}
              clearLabel="Apagar assinatura"
              heightClass="h-32"
            />

            {avisoNumeros.length > 0 ? (
              <div className="rounded-xl border border-line p-3 text-sm text-ink">
                <p className="font-medium">{PATIENT_REPORT_COPY.confirmNumbers}</p>
                <ul className="mt-1 list-disc pl-5 text-muted">
                  {avisoNumeros.map((numero) => (
                    <li key={numero}>{numero}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              {!isEdit ? (
                <Button type="button" variant="secondary" className={actionClass} onClick={() => setStep('selecao')}>
                  Voltar às sessões
                </Button>
              ) : null}
              <Button type="button" variant="secondary" className={actionClass} onClick={requestClose}>
                Cancelar
              </Button>
              <Button
                type="button"
                className={actionClass}
                isLoading={saving}
                disabled={saveDisabled}
                onClick={handleSave}
              >
                {PATIENT_REPORT_COPY.save}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
