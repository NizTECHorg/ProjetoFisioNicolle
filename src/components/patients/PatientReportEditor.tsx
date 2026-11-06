import { useEffect, useMemo, useRef, useState } from 'react'
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
  RELATORIO_CONTEUDO_MAX_CHARS,
  RELATORIO_LINHAS_MAX,
  RELATORIO_MAX_SESSOES,
  RELATORIO_MODELO_ROTULO,
  ajustarAoLimite,
  contarLinhasRelatorio,
  normalizarTextoRelatorio,
  numerosNaoConfirmados,
  rotuloSessoesRelatorio,
  sessaoSelecionavelRelatorio,
  textoModeloRelatorio,
  textosFonteRelatorio,
} from '@/lib/relatorio'
import { RASCUNHO_NOVO } from '@/lib/rascunhosLocais'
import { PATIENT_REPORT_COPY } from '@/schemas/patientReport.schema'
import { createRelatorioMeasurer } from '@/services/relatorioPdf.service'
import { toast } from '@/stores/toast.store'
import type { PatientReport } from '@/types/patient'

type ModoRelatorio = 'modelo' | 'sessoes'

type RascunhoRelatorio = {
  content: string
  place: string
  assinatura?: string
  modo?: ModoRelatorio
  sessionIds: string[]
}

type PatientReportEditorProps = {
  patientId: string
  patientName: string
  report: PatientReport | null
  open: boolean
  onClose: () => void
}

export function PatientReportEditor({ patientId, patientName, report, open, onClose }: PatientReportEditorProps) {
  const { profile } = useAuth()
  const { data: sessions = [], isLoading, isError } = usePatientSessions(patientId)
  const createReport = useCreatePatientReport(patientId)
  const updateReport = useUpdatePatientReport(patientId)
  const generate = useGenerateReportText()

  const [medidor, setMedidor] = useState<TextMeasurer | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [modo, setModo] = useState<ModoRelatorio>('sessoes')
  const [step, setStep] = useState<'selecao' | 'edicao'>('selecao')
  // Trocar de modo e voltar não perde o que foi escrito em cada um.
  const textoPorModo = useRef<Record<ModoRelatorio, string>>({ modelo: '', sessoes: '' })
  const [content, setContent] = useState('')
  const [place, setPlace] = useState('')
  const [assinatura, setAssinatura] = useState('')
  const [reduzido, setReduzido] = useState(false)
  const [restauradoEm, setRestauradoEm] = useState<number | null>(null)

  const isEdit = report !== null
  const placeValue = place.trim() === '' ? null : place.trim()
  const assinaturaValue = assinatura === '' ? null : assinatura
  const textoModelo = useMemo(() => textoModeloRelatorio(patientName), [patientName])
  // Modelo intocado não é rascunho: abrir e fechar não deixa aviso na aba.
  const textoAlterado =
    content.trim().length > 0 && !(modo === 'modelo' && normalizarTextoRelatorio(content) === textoModelo)
  const dirty = isEdit
    ? content !== report.content || placeValue !== report.place || assinaturaValue !== report.signaturePath
    : textoAlterado || placeValue !== null || assinaturaValue !== null
  // O limite de 15 linhas é do resumo das sessões; o modelo é um relatório completo.
  const semLimiteDeLinhas = isEdit ? report.sessionIds.length === 0 : modo === 'modelo'

  // Rascunho automático: F5 ou sair sem salvar não perde o texto, nem o que a IA gerou.
  const valoresRascunho = useMemo<RascunhoRelatorio>(
    () => ({ content, place, assinatura, modo, sessionIds: [...selectedIds] }),
    [content, place, assinatura, modo, selectedIds],
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
    textoPorModo.current = { modelo: '', sessoes: '' }
    if (report) {
      setStep('edicao')
      setContent(report.content)
      setPlace(report.place ?? '')
      setAssinatura(report.signaturePath ?? '')
    } else {
      setModo('sessoes')
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
    textoPorModo.current = { modelo: '', sessoes: '' }
    setModo(salvo.valores.modo ?? (salvo.valores.sessionIds.length > 0 ? 'sessoes' : 'modelo'))
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
  const acimaDoLimite = !semLimiteDeLinhas && linhas > RELATORIO_LINHAS_MAX
  const longoDemais = content.length > RELATORIO_CONTEUDO_MAX_CHARS

  const avisoNumeros = useMemo(
    () => (isEdit || modo === 'modelo' ? [] : numerosNaoConfirmados(content, textosFonteRelatorio(marcadas))),
    [isEdit, modo, content, marcadas],
  )

  const saving = createReport.isPending || updateReport.isPending
  const saveDisabled =
    !medidor ||
    linhas === 0 ||
    acimaDoLimite ||
    longoDemais ||
    saving ||
    (!isEdit && modo === 'sessoes' && marcadas.length === 0)

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

  function trocarModo(novo: ModoRelatorio) {
    if (novo === modo || generate.isPending) return
    textoPorModo.current[modo] = content
    const guardado = textoPorModo.current[novo]
    setModo(novo)
    setReduzido(false)
    if (novo === 'modelo') {
      setContent(guardado || textoModelo)
      setStep('edicao')
    } else {
      setContent(guardado)
      setStep(guardado ? 'edicao' : 'selecao')
    }
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
    setModo('sessoes')
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
        sessionIds: modo === 'modelo' ? [] : marcadas.map((s) => s.id),
        content,
        place: placeValue,
        sessionLabel: modo === 'modelo' ? RELATORIO_MODELO_ROTULO : rotuloSessoesRelatorio(marcadas),
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
        {!isEdit ? (
          <div role="group" aria-label="Como fazer o relatório" className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-canvas p-1">
            {(
              [
                ['sessoes', PATIENT_REPORT_COPY.modeSessions],
                ['modelo', PATIENT_REPORT_COPY.modeModel],
              ] as const
            ).map(([valor, rotulo]) => (
              <button
                key={valor}
                type="button"
                aria-pressed={modo === valor}
                disabled={generate.isPending}
                onClick={() => trocarModo(valor)}
                className={[
                  'min-h-11 rounded-lg px-2 text-sm font-medium transition-colors',
                  modo === valor ? 'bg-surface text-forest shadow-sm' : 'text-muted hover:text-ink',
                ].join(' ')}
              >
                {rotulo}
              </button>
            ))}
          </div>
        ) : null}

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
                {modo === 'modelo' ? PATIENT_REPORT_COPY.modelHint : PATIENT_REPORT_COPY.reviewNotice}
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
                className={['text-xs', acimaDoLimite || longoDemais ? 'text-error' : 'text-muted'].join(' ')}
              >
                {semLimiteDeLinhas ? `${linhas} linhas` : `${linhas}/${RELATORIO_LINHAS_MAX} linhas`}
                {acimaDoLimite ? ` · ${PATIENT_REPORT_COPY.overLimit}` : ''}
                {longoDemais ? ` · ${PATIENT_REPORT_COPY.tooLong}` : ''}
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
              {!isEdit && modo === 'sessoes' ? (
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
