import { useMemo, useState, useEffect } from 'react'
import { Mic, Square, Loader2, CalendarClock, ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react'
import { SignedPhoto } from '@/components/patients/SignedPhoto'
import { PatientSessionEditorForm } from '@/components/patients/PatientSessionEditorForm'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { InfoHint } from '@/components/ui/InfoHint'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { useAuth } from '@/hooks/useAuth'
import { useSessionCharges } from '@/hooks/useFinance'
import { usePatientImages } from '@/hooks/usePatientImages'
import { MAX_RECORDING_LABEL, MAX_RECORDING_SECONDS, useVoiceCopilot } from '@/hooks/useVoiceCopilot'
import { useToastStore } from '@/stores/toast.store'
import { generateEvolutionFromAudio } from '@/services/ai.service'
import { useDeletePatientSession, usePatientSessions } from '@/hooks/usePatients'
import { canSeeFinance } from '@/lib/accountAccess'
import { EVOLUCAO_SITUACAO_LABEL, contarEvolucoesPendentes, situacaoEvolucao } from '@/lib/evolucaoStatus'
import { formatCurrency } from '@/lib/security'
import type { PatientImage, PatientSessionRecord, SessionStatus } from '@/types/patient'
import type { SessionCharge } from '@/types/finance'

const statusLabel: Record<SessionStatus, string> = {
  agendada: 'Agendada',
  confirmada: 'Confirmada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
  faltou: 'Faltou',
}

type PatientEvolutionsPanelProps = {
  patientId: string
  canWrite?: boolean
}


function photoCountLabel(count: number) {
  if (count === 1) return '1 foto'
  return `${count} fotos`
}

function SessionFinanceBadges({ charge }: { charge: SessionCharge | null | undefined }) {
  if (!charge) {
    return (
      <>
        <Badge>Não pago</Badge>
        <span className="text-xs text-muted">Sem valor</span>
      </>
    )
  }

  return (
    <>
      <Badge tone={charge.isPaid ? 'success' : 'muted'}>{charge.isPaid ? 'Pago' : 'Não pago'}</Badge>
      <span className="text-xs font-medium text-ink">{formatCurrency(charge.amountBrl)}</span>
      {charge.priceName ? <span className="text-xs text-muted">{charge.priceName}</span> : null}
    </>
  )
}

function EvolutionField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value?.trim()) return null
  return (
    <p>
      <span className="text-xs text-muted">{label} · </span>
      {value}
    </p>
  )
}

function SessionPhotosFold({
  photos,
  onOpenPhoto,
}: {
  photos: PatientImage[]
  onOpenPhoto: (imageId: string) => void
}) {
  const [open, setOpen] = useState(false)
  const panelId = photos[0] ? `session-photos-${photos[0].id}` : undefined

  if (photos.length === 0) {
    return <p className="mt-2 text-xs text-muted">Sem fotos</p>
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex min-h-11 items-center gap-1 text-xs text-muted transition-colors hover:text-forest"
      >
        <span>{photoCountLabel(photos.length)}</span>
        <ChevronDown
          size={16}
          className={['shrink-0 transition-transform duration-500 ease-in-out', open ? 'rotate-180' : ''].join(' ')}
        />
      </button>
      <div
        id={panelId}
        className={[
          'grid transition-[grid-template-rows] duration-500 ease-in-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        ].join(' ')}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-wrap gap-2 pt-2">
            {photos.map((image) => (
              <button
                key={image.id}
                type="button"
                className="size-36 shrink-0 overflow-hidden rounded-xl border border-line bg-canvas"
                onClick={() => onOpenPhoto(image.id)}
              >
                <SignedPhoto
                  src={image.thumbUrl ?? image.signedUrl}
                  fallbackSrc={image.signedUrl}
                  alt={image.description.trim() || 'Foto da sessão'}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function PatientEvolutionsPanel({ patientId, canWrite = true }: PatientEvolutionsPanelProps) {
  const { profile } = useAuth()
  const showFinance = canSeeFinance(profile?.accountType)
  const { data: sessions = [], isLoading } = usePatientSessions(patientId)
  const { data: images = [] } = usePatientImages(patientId)
  const sessionIds = useMemo(() => sessions.map((session) => session.id), [sessions])
  const { data: charges = [] } = useSessionCharges(patientId, sessionIds, showFinance)
  const deleteSession = useDeletePatientSession(patientId)
  const pendentes = contarEvolucoesPendentes(sessions)

  const chargeBySession = useMemo(() => {
    const map = new Map<string, SessionCharge>()
    for (const charge of charges) map.set(charge.sessionId, charge)
    return map
  }, [charges])

  const photosBySession = useMemo(() => {
    const map = new Map<string, PatientImage[]>()
    for (const image of images) {
      if (!image.sessionId) continue
      const list = map.get(image.sessionId) || []
      list.push(image)
      map.set(image.sessionId, list)
    }
    return map
  }, [images])

  const [editorOpen, setEditorOpen] = useState(false)
  const [draftConducts, setDraftConducts] = useState<string | null>(null)
  const [isProcessingAudio, setIsProcessingAudio] = useState(false)
  const { isRecording, duration, startRecording, stopRecording, audioBlob } = useVoiceCopilot()

  // Handle auto-processing when audio stops
  useEffect(() => {
    if (audioBlob && !isRecording && !isProcessingAudio) {
      const processAudio = async () => {
        try {
          setIsProcessingAudio(true)
          const text = await generateEvolutionFromAudio(audioBlob, patientId)
          setEditing(null)
          setDraftConducts(text)
          setEditorOpen(true)
        } catch (error: unknown) {
          console.error(error)
          const message = error instanceof Error && error.message ? error.message : 'Chave da API ausente ou inválida'
          useToastStore.getState().push('Erro ao processar áudio: ' + message, 'error')
        } finally {
          setIsProcessingAudio(false)
        }
      }
      processAudio()
    }
  }, [audioBlob, isRecording])
  const [editing, setEditing] = useState<PatientSessionRecord | null>(null)
  const [viewing, setViewing] = useState<PatientSessionRecord | null>(null)
  const [openPhotoId, setOpenPhotoId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PatientSessionRecord | null>(null)

  const viewingPhotos = viewing ? photosBySession.get(viewing.id) || [] : []
  const openPhoto = viewingPhotos.find((image) => image.id === openPhotoId) ?? viewingPhotos[0] ?? null

  function closeEditor() {
    setEditorOpen(false)
    setEditing(null)
    setDraftConducts(null)
  }

  function closeViewer() {
    setViewing(null)
    setOpenPhotoId(null)
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Sessões / Evoluções</p>
            <p className="mt-1 text-sm text-muted">Sessões e registros clínicos deste paciente.</p>
            {pendentes > 0 ? (
              <p className="mt-1 text-sm font-medium text-amber-700">
                {pendentes === 1 ? '1 evolução pendente' : `${pendentes} evoluções pendentes`} de finalizar
              </p>
            ) : null}
          </div>
          {canWrite ? (
            <div className="flex flex-wrap items-center gap-2">
              {isRecording ? (
                <Button type="button" variant="secondary" onClick={stopRecording} className="animate-pulse bg-error/10 text-error hover:bg-error/20">
                  <Square size={16} className="fill-current" />
                  {Math.floor(duration / 60).toString().padStart(2, "0")}:{(duration % 60).toString().padStart(2, "0")}
                  <span className="font-normal opacity-70">/ {Math.floor(MAX_RECORDING_SECONDS / 60).toString().padStart(2, "0")}:00</span>
                </Button>
              ) : isProcessingAudio ? (
                <Button type="button" variant="secondary" disabled>
                  <Loader2 size={16} className="animate-spin" />
                  Analisando...
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={startRecording}
                  title={`Gravar evolução por voz (até ${MAX_RECORDING_LABEL})`}
                  aria-label={`Gravar evolução por voz, até ${MAX_RECORDING_LABEL}`}
                >
                  <Mic size={16} />
                  Gravar sessão
                </Button>
              )}
              <InfoHint
                label="Sobre gravar a sessão"
                text={`Grave o atendimento (até ${MAX_RECORDING_LABEL}) e a IA preenche a evolução da sessão. Você revisa o texto antes de salvar.`}
              />
              <Button type="button" onClick={() => { setEditing(null); setDraftConducts(null); setEditorOpen(true) }}>
                <Plus size={16} />
                Nova sessão / evolução
              </Button>
            </div>
          ) : null}
        </div>

        {isLoading ? (
          <div className="flex min-h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-forest border-t-transparent" />
          </div>
        ) : sessions.length === 0 ? (
          <article className="rounded-2xl border border-dashed border-line bg-surface px-5 py-10 text-center">
            <CalendarClock className="mx-auto text-muted" size={22} />
            <p className="mt-3 text-sm text-muted">Nenhuma sessão registrada.</p>
          </article>
        ) : (
          <ul className="space-y-3">
            {sessions.map((session) => {
              const photos = photosBySession.get(session.id) || []
              const charge = chargeBySession.get(session.id) ?? null
              const situacao = situacaoEvolucao(session)
              return (
                <li key={session.id} className="group rounded-2xl border border-line bg-surface p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-ink">
                          {session.dateLabel} · {session.timeLabel}
                        </p>
                        <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-forest">
                          {statusLabel[session.status]}
                        </span>
                        {situacao ? (
                          <span
                            className={[
                              'rounded-full px-2 py-0.5 text-[11px] font-medium',
                              situacao === 'finalizada' ? 'bg-success/10 text-success' : 'bg-amber-500/15 text-amber-800',
                            ].join(' ')}
                          >
                            {EVOLUCAO_SITUACAO_LABEL[situacao]}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {session.type} · {session.place}
                        {session.therapistName ? ` · ${session.therapistName}` : ''}
                      </p>
                      {showFinance ? (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <SessionFinanceBadges charge={charge} />
                        </div>
                      ) : null}
                    </div>
                    {canWrite ? (
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          aria-label="Editar sessão / evolução"
                          onClick={() => {
                            setEditing(session)
                            setDraftConducts(null)
                            setEditorOpen(true)
                          }}
                          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted transition hover:bg-accent-soft hover:text-forest"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          aria-label="Excluir sessão"
                          onClick={() => setPendingDelete(session)}
                          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted transition hover:bg-accent-soft hover:text-error"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <SessionPhotosFold
                    photos={photos}
                    onOpenPhoto={(imageId) => {
                      setViewing(session)
                      setOpenPhotoId(imageId)
                    }}
                  />

                  {session.evolution ? (
                    <div className="mt-3 space-y-2 border-t border-line pt-3 text-sm text-ink">
                      <EvolutionField label="Estado" value={session.evolution.patientState} />
                      <EvolutionField label="Condutas" value={session.evolution.conducts} />
                      <EvolutionField label="Plano" value={session.evolution.nextPlan} />
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <Modal
        open={Boolean(viewing)}
        title={viewing ? `${viewing.dateLabel} · ${viewing.timeLabel}` : 'Sessão'}
        description={viewing ? `${statusLabel[viewing.status]} · ${viewing.type} · ${viewing.place}` : undefined}
        onClose={closeViewer}
        wide
      >
        {viewing ? (
          <div className="space-y-4">
            {viewing.therapistName ? (
              <p className="text-sm text-muted">Profissional · {viewing.therapistName}</p>
            ) : null}

            {showFinance ? (
              <div className="flex flex-wrap items-center gap-2">
                <SessionFinanceBadges charge={chargeBySession.get(viewing.id) ?? null} />
              </div>
            ) : null}

            {viewing.evolution ? (
              <div className="space-y-2 text-sm text-ink">
                <EvolutionField label="Estado" value={viewing.evolution.patientState} />
                <EvolutionField label="Condutas" value={viewing.evolution.conducts} />
                <EvolutionField label="Mudanças" value={viewing.evolution.changesSinceLast} />
                <EvolutionField label="Resposta" value={viewing.evolution.treatmentResponse} />
                <EvolutionField label="Intercorrências" value={viewing.evolution.incidents} />
                <EvolutionField label="Plano" value={viewing.evolution.nextPlan} />
              </div>
            ) : (
              <p className="text-sm text-muted">Sem evolução registrada nesta sessão.</p>
            )}

            <div>
              <p className="text-sm font-semibold text-ink">Fotos da sessão</p>
              {viewingPhotos.length === 0 ? (
                <p className="mt-2 text-sm text-muted">Nenhuma foto anexada a esta sessão.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {openPhoto ? (
                    <div className="overflow-hidden rounded-2xl border border-line bg-canvas">
                      <SignedPhoto
                        src={openPhoto.signedUrl}
                        alt={openPhoto.description.trim() || 'Foto da sessão'}
                        contain
                      />
                      <p className="px-3 py-2 text-sm text-ink">
                        {openPhoto.description.trim() || 'Sem descrição.'}
                      </p>
                    </div>
                  ) : null}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {viewingPhotos.map((image) => (
                      <button
                        key={image.id}
                        type="button"
                        className={[
                          'aspect-square overflow-hidden rounded-xl border bg-canvas',
                          image.id === openPhoto?.id ? 'border-accent ring-2 ring-accent/40' : 'border-line',
                        ].join(' ')}
                        onClick={() => setOpenPhotoId(image.id)}
                      >
                        <SignedPhoto
                          src={image.thumbUrl ?? image.signedUrl}
                          fallbackSrc={image.signedUrl}
                          alt={image.description.trim() || 'Foto da sessão'}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      {canWrite ? (
        <Modal
          open={editorOpen}
          title={editing ? 'Editar sessão / evolução' : 'Nova sessão / evolução'}
          description="Toggle Agendar / Realizada. Agendadas aparecem na Agenda."
          onClose={closeEditor}
          wide
        >
          <PatientSessionEditorForm
            patientId={patientId}
            editing={editing}
            draftConducts={draftConducts}
            cancelLabel="Cancelar"
            submitLabel="Salvar"
            onCancel={closeEditor}
            onSuccess={closeEditor}
          />
        </Modal>
      ) : null}

      {canWrite ? (
        <ConfirmDialog
          open={Boolean(pendingDelete)}
          title="Excluir sessão"
          description="A sessão e a evolução vinculada serão removidas. Essa ação não pode ser desfeita. As fotos dessa sessão ficam na ficha como avulsas."
          confirmLabel="Excluir"
          tone="danger"
          isLoading={deleteSession.isPending}
          onClose={() => setPendingDelete(null)}
          onConfirm={() => {
            if (!pendingDelete) return
            deleteSession.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) })
          }}
        />
      ) : null}
    </>
  )
}








