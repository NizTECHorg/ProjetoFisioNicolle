import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FileText, Image, Pencil, Plus, Trash2, X } from 'lucide-react'
import { SignedPhoto } from '@/components/patients/SignedPhoto'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import {
  useDeletePatientImage,
  usePatientImages,
  useUpdatePatientImage,
  useUploadPatientImages,
} from '@/hooks/usePatientImages'
import { usePatientSessions } from '@/hooks/usePatients'
import { compressImageForThumb } from '@/lib/compressImage'
import {
  imageMetadataFormSchema,
  imageUploadSchema,
  MAX_BATCH_FILES,
  type ImageMetadataFormData,
} from '@/schemas/patient.schema'
import { toast } from '@/stores/toast.store'
import type { PatientImage, PatientSessionRecord } from '@/types/patient'

type PatientImagesPanelProps = {
  patientId: string
  canWrite?: boolean
}

type GalleryFilter = 'todas' | 'avulsas' | string

const GALLERY_ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf,.pdf'
const CAMERA_ACCEPT = 'image/jpeg,image/png,image/webp'
const NARROW_MEDIA = '(max-width: 767px)'
const emptyMeta: ImageMetadataFormData = { description: '', sessionId: '' }

function isPdfFile(file: File) {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

function isPdfImage(image: PatientImage) {
  return image.mimeType === 'application/pdf'
}

function resolveFileMime(file: File) {
  if (file.type) return file.type
  if (file.name.toLowerCase().endsWith('.pdf')) return 'application/pdf'
  if (file.name.toLowerCase().endsWith('.png')) return 'image/png'
  if (file.name.toLowerCase().endsWith('.webp')) return 'image/webp'
  if (file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')) {
    return 'image/jpeg'
  }
  return file.type
}

function tileAllocation(image: PatientImage, sessions: PatientSessionRecord[]) {
  if (!image.sessionId) return 'Avulsa'
  const session = sessions.find((row) => row.id === image.sessionId)
  if (!session) return 'Avulsa'
  return `${session.dateLabel} · ${session.timeLabel}`
}

function lightboxAllocation(image: PatientImage, sessions: PatientSessionRecord[]) {
  if (image.sessionRemoved) return 'Sessão removida.'
  return tileAllocation(image, sessions)
}

function imageAlt(image: PatientImage) {
  const description = image.description.trim()
  if (description) return description
  return isPdfImage(image) ? 'PDF do paciente' : 'Imagem do paciente'
}

function filterImages(images: PatientImage[], filter: GalleryFilter) {
  if (filter === 'todas') return images
  if (filter === 'avulsas') return images.filter((image) => image.sessionId === null)
  return images.filter((image) => image.sessionId === filter)
}

function canShareImageFiles() {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false
  if (typeof navigator.canShare !== 'function') return false
  try {
    const probe = new File([new Blob(['x'], { type: 'image/jpeg' })], 'x.jpg', { type: 'image/jpeg' })
    return navigator.canShare({ files: [probe] })
  } catch {
    return false
  }
}

function fileNameFromStoragePath(storagePath: string) {
  const segment = storagePath.split('/').pop()
  return segment && segment.length > 0 ? segment : 'arquivo'
}

function useNarrowViewport() {
  const [narrow, setNarrow] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(NARROW_MEDIA).matches : false,
  )

  useEffect(() => {
    const media = window.matchMedia(NARROW_MEDIA)
    function sync() {
      setNarrow(media.matches)
    }
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  return narrow
}

function sessionIdFromFilter(filter: GalleryFilter, sessions: PatientSessionRecord[]) {
  if (filter === 'todas' || filter === 'avulsas') return ''
  return sessions.some((session) => session.id === filter) ? filter : ''
}

function EmptyWell({ heading, body }: { heading: string; body?: string }) {
  return (
    <article className="rounded-2xl border border-dashed border-line bg-surface px-5 py-10 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Image size={22} />
      </div>
      <p className="mt-3 text-sm text-ink">{heading}</p>
      {body ? <p className="mt-2 text-sm text-muted">{body}</p> : null}
    </article>
  )
}

function LoteThumbItem({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [url, setUrl] = useState<string | null>(null)
  const pdf = isPdfFile(file)

  useEffect(() => {
    if (pdf) return

    const originalUrl = URL.createObjectURL(file)
    setUrl(originalUrl)
    let compressedUrl: string | null = null
    let cancelled = false

    async function prepare() {
      try {
        const thumb = await compressImageForThumb(file)
        if (cancelled) return
        compressedUrl = URL.createObjectURL(thumb)
        setUrl(compressedUrl)
      } catch {
        // A URL original já está no tile.
      }
    }

    void prepare()

    return () => {
      cancelled = true
      URL.revokeObjectURL(originalUrl)
      if (compressedUrl) URL.revokeObjectURL(compressedUrl)
    }
  }, [file, pdf])

  return (
    <li className="relative">
      <div className="aspect-square overflow-hidden rounded-xl border border-line bg-canvas">
        {pdf ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-accent-soft px-2 text-accent">
            <FileText size={22} />
            <span className="line-clamp-2 text-center text-[10px] font-medium text-forest">PDF</span>
          </div>
        ) : url ? (
          <img src={url} alt="" className="block h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-forest border-t-transparent" />
          </div>
        )}
      </div>
      <button
        type="button"
        aria-label="Remover do envio"
        onClick={onRemove}
        className="absolute -right-1 -top-1 flex min-h-11 min-w-11 items-center justify-center rounded-full bg-surface text-muted shadow-sm hover:text-error"
      >
        <X size={14} />
      </button>
    </li>
  )
}

function LoteThumbs({ files, onRemove }: { files: File[]; onRemove: (index: number) => void }) {
  if (files.length === 0) return null

  return (
    <ul className="grid grid-cols-4 gap-2">
      {files.map((file, index) => (
        <LoteThumbItem
          key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
          file={file}
          onRemove={() => onRemove(index)}
        />
      ))}
    </ul>
  )
}

export function PatientImagesPanel({ patientId, canWrite = false }: PatientImagesPanelProps) {
  const { data: images = [], isLoading, isError } = usePatientImages(patientId)
  const { data: sessions = [] } = usePatientSessions(patientId)
  const uploadImages = useUploadPatientImages(patientId)
  const updateImage = useUpdatePatientImage(patientId)
  const deleteImage = useDeletePatientImage(patientId)
  const narrowViewport = useNarrowViewport()
  const showShare = canWrite && canShareImageFiles()

  const [filter, setFilter] = useState<GalleryFilter>('todas')
  const [openId, setOpenId] = useState<string | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [lote, setLote] = useState<File[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const [editing, setEditing] = useState<PatientImage | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PatientImage | null>(null)

  const galleryInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const chooseFilesRef = useRef<HTMLButtonElement>(null)

  const uploadForm = useForm<ImageMetadataFormData>({
    resolver: zodResolver(imageMetadataFormSchema),
    defaultValues: emptyMeta,
  })
  const editForm = useForm<ImageMetadataFormData>({
    resolver: zodResolver(imageMetadataFormSchema),
    defaultValues: emptyMeta,
  })

  useEffect(() => {
    if (filter === 'todas' || filter === 'avulsas') return
    if (!sessions.some((session) => session.id === filter)) setFilter('todas')
  }, [filter, sessions])

  useEffect(() => {
    if (!uploadOpen) return
    chooseFilesRef.current?.focus()
  }, [uploadOpen])

  useEffect(() => {
    if (!editing) return
    const sessionStillExists = sessions.some((session) => session.id === editing.sessionId)
    editForm.reset({
      description: editing.description,
      sessionId: editing.sessionId && sessionStillExists ? editing.sessionId : '',
    })
  }, [editing, editForm, sessions])

  const filtered = filterImages(images, filter)
  const openImage = images.find((image) => image.id === openId) ?? null
  const unfilteredEmpty = images.length === 0
  const emptyHeading = unfilteredEmpty
    ? 'Nenhum arquivo nesta ficha.'
    : filter === 'avulsas'
      ? 'Nenhum arquivo avulso.'
      : 'Nenhum arquivo nesta sessão.'
  const emptyBody = canWrite
    ? unfilteredEmpty
      ? 'Toque em Adicionar para enviar foto ou PDF avulso ou ligado a uma sessão.'
      : 'Altere o filtro ou toque em Adicionar.'
    : undefined

  const sessionOptions = [
    { value: '', label: 'Avulsa (sem sessão)' },
    ...sessions.map((session) => ({
      value: session.id,
      label: `${session.dateLabel} · ${session.timeLabel}`,
    })),
  ]

  function openUpload() {
    uploadForm.reset({
      description: '',
      sessionId: sessionIdFromFilter(filter, sessions),
    })
    setFileError(null)
    setUploadOpen(true)
  }

  function closeUpload() {
    setUploadOpen(false)
    setLote([])
    setFileError(null)
    uploadForm.reset(emptyMeta)
  }

  function appendToLote(incoming: File[]) {
    if (incoming.length === 0) return
    setFileError(null)
    setLote((current) => {
      const merged = [...current, ...incoming]
      if (merged.length <= MAX_BATCH_FILES) return merged
      toast('Envie no máximo 10 arquivos por vez.', 'error')
      return merged.slice(0, MAX_BATCH_FILES)
    })
  }

  function onGalleryChange(event: ChangeEvent<HTMLInputElement>) {
    appendToLote(Array.from(event.target.files ?? []))
    event.target.value = ''
  }

  function onCameraChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) appendToLote([file])
    event.target.value = ''
  }

  function onUploadSubmit(values: ImageMetadataFormData) {
    if (lote.length === 0) {
      setFileError('Escolha um arquivo')
      return
    }

    const sessionId = values.sessionId === '' ? null : values.sessionId
    const valids: File[] = []
    for (const file of lote) {
      const parsed = imageUploadSchema.safeParse({
        mimeType: resolveFileMime(file),
        byteSize: file.size,
        sessionId,
        description: values.description,
      })
      if (parsed.success) {
        valids.push(file)
        continue
      }
      const message = parsed.error.issues[0]?.message
      toast(message ?? 'Não foi possível salvar. Verifique o arquivo e tente de novo.', 'error')
    }

    setLote(valids)
    if (valids.length === 0) return

    uploadImages.mutate(
      { files: valids, sessionId, description: values.description },
      { onSuccess: () => closeUpload() },
    )
  }

  function closeEdit() {
    setEditing(null)
    editForm.reset(emptyMeta)
  }

  function onEditSubmit(values: ImageMetadataFormData) {
    if (!editing) return
    updateImage.mutate(
      {
        imageId: editing.id,
        input: {
          description: values.description,
          sessionId: values.sessionId === '' ? null : values.sessionId,
        },
      },
      { onSuccess: () => closeEdit() },
    )
  }

  async function shareImage(image: PatientImage) {
    if (!image.signedUrl || typeof navigator.share !== 'function') return
    try {
      const response = await fetch(image.signedUrl)
      if (!response.ok) {
        toast('Não foi possível salvar. Verifique o arquivo e tente de novo.', 'error')
        return
      }
      const blob = await response.blob()
      const file = new File([blob], fileNameFromStoragePath(image.storagePath), {
        type: image.mimeType || blob.type,
      })
      if (typeof navigator.canShare === 'function' && !navigator.canShare({ files: [file] })) return
      await navigator.share({ files: [file] })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      if (error instanceof Error && error.name === 'AbortError') return
      toast('Não foi possível salvar. Verifique o arquivo e tente de novo.', 'error')
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Imagens</p>
            <p className="mt-1 text-sm text-muted">Fotos ou PDFs avulsos ou ligados a uma sessão.</p>
          </div>
          {canWrite ? (
            <Button type="button" onClick={openUpload}>
              <Plus size={16} />
              Adicionar
            </Button>
          ) : null}
        </div>

        <div className="flex gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain">
          <button
            type="button"
            className={[
              'shrink-0 rounded-full border px-4 text-sm min-h-11',
              filter === 'todas'
                ? 'border-accent bg-accent-soft font-semibold text-forest'
                : 'border-line bg-surface text-muted',
            ].join(' ')}
            onClick={() => setFilter('todas')}
          >
            Todas
          </button>
          <button
            type="button"
            className={[
              'shrink-0 rounded-full border px-4 text-sm min-h-11',
              filter === 'avulsas'
                ? 'border-accent bg-accent-soft font-semibold text-forest'
                : 'border-line bg-surface text-muted',
            ].join(' ')}
            onClick={() => setFilter('avulsas')}
          >
            Avulsas
          </button>
          {sessions.map((session) => {
            const selected = filter === session.id
            return (
              <button
                key={session.id}
                type="button"
                className={[
                  'shrink-0 rounded-full border px-4 text-sm min-h-11',
                  selected
                    ? 'border-accent bg-accent-soft font-semibold text-forest'
                    : 'border-line bg-surface text-muted',
                ].join(' ')}
                onClick={() => setFilter(session.id)}
              >
                {session.dateLabel} · {session.timeLabel}
              </button>
            )
          })}
        </div>

        {isLoading ? (
          <div className="flex min-h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-forest border-t-transparent" />
          </div>
        ) : isError ? (
          <article className="rounded-2xl border border-error/20 bg-error/5 px-6 py-8 text-sm text-error">
            Não foi possível carregar os arquivos. Tente de novo em instantes.
          </article>
        ) : filtered.length === 0 ? (
          <EmptyWell heading={emptyHeading} body={emptyBody} />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((image) => {
              const description = image.description.trim()
              const open = openId === image.id
              const pdf = isPdfImage(image)
              return (
                <article key={image.id} className="group relative">
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => setOpenId(image.id)}
                  >
                    <div
                      className={[
                        'aspect-square overflow-hidden rounded-2xl border border-line bg-canvas',
                        open ? 'ring-2 ring-accent ring-offset-2' : '',
                      ].join(' ')}
                    >
                      {pdf ? (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-accent-soft text-accent">
                          <FileText size={32} />
                          <span className="text-xs font-semibold uppercase tracking-wide text-forest">
                            PDF
                          </span>
                        </div>
                      ) : (
                        <SignedPhoto
                          src={image.thumbUrl ?? image.signedUrl}
                          fallbackSrc={image.signedUrl}
                          alt={imageAlt(image)}
                        />
                      )}
                    </div>
                    <p
                      className={[
                        'mt-2 line-clamp-2 text-sm',
                        description ? 'text-ink' : 'text-muted',
                      ].join(' ')}
                    >
                      {description || (pdf ? 'PDF sem descrição.' : 'Sem descrição.')}
                    </p>
                    <p className="mt-1 text-xs text-muted">{tileAllocation(image, sessions)}</p>
                  </button>
                  {canWrite ? (
                    <div className="absolute right-1 top-1 flex opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100">
                      <button
                        type="button"
                        aria-label={pdf ? 'Editar PDF' : 'Editar imagem'}
                        onClick={() => setEditing(image)}
                        className="flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-surface/90 text-muted hover:text-forest"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        aria-label={pdf ? 'Excluir PDF' : 'Excluir imagem'}
                        onClick={() => setPendingDelete(image)}
                        className="flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-surface/90 text-muted hover:text-error"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : null}
                </article>
              )
            })}
          </div>
        )}
      </div>

      <Modal
        open={Boolean(openImage)}
        title={openImage && isPdfImage(openImage) ? 'PDF' : 'Imagem'}
        onClose={() => setOpenId(null)}
        wide
      >
        {openImage ? (
          <div>
            {isPdfImage(openImage) ? (
              <div className="space-y-3">
                {openImage.signedUrl ? (
                  <iframe
                    title={imageAlt(openImage)}
                    src={openImage.signedUrl}
                    className="h-[min(70vh,32rem)] w-full rounded-xl border border-line bg-canvas"
                  />
                ) : (
                  <div className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-xl border border-line bg-accent-soft text-accent">
                    <FileText size={40} />
                    <p className="text-sm text-forest">Não foi possível carregar o PDF.</p>
                  </div>
                )}
                {openImage.signedUrl ? (
                  <a
                    href={openImage.signedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex text-sm font-medium text-accent underline-offset-2 hover:underline"
                  >
                    Abrir em nova aba
                  </a>
                ) : null}
              </div>
            ) : (
              <SignedPhoto src={openImage.signedUrl} alt={imageAlt(openImage)} contain />
            )}
            <p className="mt-4 text-sm text-ink">
              {openImage.description.trim() || 'Sem descrição.'}
            </p>
            <p className="mt-1 text-xs text-muted">{lightboxAllocation(openImage, sessions)}</p>
            {canWrite ? (
              <div className="mt-4 flex flex-wrap justify-end gap-3">
                {showShare ? (
                  <Button type="button" variant="secondary" onClick={() => void shareImage(openImage)}>
                    Compartilhar
                  </Button>
                ) : null}
                <Button type="button" variant="secondary" onClick={() => setEditing(openImage)}>
                  {isPdfImage(openImage) ? 'Editar PDF' : 'Editar imagem'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setPendingDelete(openImage)}>
                  <span className="text-error">
                    {isPdfImage(openImage) ? 'Excluir PDF' : 'Excluir imagem'}
                  </span>
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      {canWrite ? (
        <Modal
          open={uploadOpen}
          title="Adicionar arquivo"
          description="JPEG, PNG, WebP ou PDF. Avulso ou de uma sessão."
          onClose={closeUpload}
        >
          <form className="space-y-4" onSubmit={uploadForm.handleSubmit(onUploadSubmit)}>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-3">
                <Button
                  ref={chooseFilesRef}
                  type="button"
                  variant="secondary"
                  onClick={() => galleryInputRef.current?.click()}
                >
                  Escolher arquivos
                </Button>
                {narrowViewport ? (
                  <Button type="button" variant="secondary" onClick={() => cameraInputRef.current?.click()}>
                    Tirar foto
                  </Button>
                ) : null}
              </div>
              <input
                ref={galleryInputRef}
                type="file"
                accept={GALLERY_ACCEPT}
                multiple
                className="hidden"
                onChange={onGalleryChange}
              />
              {narrowViewport ? (
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept={CAMERA_ACCEPT}
                  capture="environment"
                  className="hidden"
                  onChange={onCameraChange}
                />
              ) : null}
              <p className="text-xs text-muted">JPEG, PNG, WebP ou PDF · até 8 MB</p>
              {fileError ? (
                <p role="alert" className="text-xs text-error">
                  {fileError}
                </p>
              ) : null}
            </div>

            <LoteThumbs
              files={lote}
              onRemove={(index) => setLote((current) => current.filter((_, i) => i !== index))}
            />

            <Textarea
              label="Descrição"
              placeholder="Opcional"
              rows={3}
              error={uploadForm.formState.errors.description?.message}
              {...uploadForm.register('description')}
            />
            <Select
              label="Sessão"
              options={sessionOptions}
              error={uploadForm.formState.errors.sessionId?.message}
              {...uploadForm.register('sessionId')}
            />
            <div className="flex justify-end gap-3 pt-1">
              <Button
                type="button"
                variant="secondary"
                onClick={closeUpload}
                disabled={uploadImages.isPending}
              >
                Voltar
              </Button>
              <Button type="submit" isLoading={uploadImages.isPending}>
                Adicionar
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {canWrite ? (
        <Modal
          open={Boolean(editing)}
          title={editing && isPdfImage(editing) ? 'Editar PDF' : 'Editar imagem'}
          description="Altere a descrição ou a sessão."
          onClose={closeEdit}
        >
          <form className="space-y-4" onSubmit={editForm.handleSubmit(onEditSubmit)}>
            <Textarea
              label="Descrição"
              placeholder="Opcional"
              rows={3}
              error={editForm.formState.errors.description?.message}
              {...editForm.register('description')}
            />
            <Select
              label="Sessão"
              options={sessionOptions}
              error={editForm.formState.errors.sessionId?.message}
              {...editForm.register('sessionId')}
            />
            <div className="flex justify-end gap-3 pt-1">
              <Button type="button" variant="secondary" onClick={closeEdit} disabled={updateImage.isPending}>
                Voltar
              </Button>
              <Button type="submit" isLoading={updateImage.isPending}>
                Salvar alterações
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {canWrite ? (
        <ConfirmDialog
          open={Boolean(pendingDelete)}
          title={pendingDelete && isPdfImage(pendingDelete) ? 'Excluir PDF' : 'Excluir imagem'}
          description={
            pendingDelete && isPdfImage(pendingDelete)
              ? 'O PDF será removido desta ficha.'
              : 'A imagem será removida desta ficha.'
          }
          confirmLabel={pendingDelete && isPdfImage(pendingDelete) ? 'Excluir PDF' : 'Excluir imagem'}
          cancelLabel="Voltar"
          tone="danger"
          isLoading={deleteImage.isPending}
          onClose={() => setPendingDelete(null)}
          onConfirm={() => {
            if (!pendingDelete) return
            deleteImage.mutate(
              { id: pendingDelete.id, storagePath: pendingDelete.storagePath },
              {
                onSuccess: () => {
                  if (openId === pendingDelete.id) setOpenId(null)
                  if (editing?.id === pendingDelete.id) closeEdit()
                  setPendingDelete(null)
                },
              },
            )
          }}
        />
      ) : null}
    </>
  )
}
