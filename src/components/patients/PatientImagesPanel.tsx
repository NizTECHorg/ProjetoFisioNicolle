import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Image, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { usePatientImages, useUploadPatientImages } from '@/hooks/usePatientImages'
import { usePatientSessions } from '@/hooks/usePatients'
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

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp'
const NARROW_MEDIA = '(max-width: 767px)'
const emptyMeta: ImageMetadataFormData = { description: '', sessionId: '' }

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
  return description || 'Imagem do paciente'
}

function filterImages(images: PatientImage[], filter: GalleryFilter) {
  if (filter === 'todas') return images
  if (filter === 'avulsas') return images.filter((image) => image.sessionId === null)
  return images.filter((image) => image.sessionId === filter)
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

function SignedPhoto({
  src,
  alt,
  contain,
}: {
  src: string | null
  alt: string
  contain?: boolean
}) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setFailed(false)
    setLoaded(false)
  }, [src])

  if (!src || failed) {
    return (
      <div className="flex h-full min-h-24 w-full items-center justify-center bg-canvas px-3">
        <p className="text-center text-xs text-muted">Não foi possível mostrar a imagem.</p>
      </div>
    )
  }

  return (
    <>
      {loaded ? null : <div className="h-full w-full bg-canvas" />}
      <img
        src={src}
        alt={alt}
        className={[
          contain ? 'max-h-[70vh] w-full object-contain' : 'h-full w-full object-cover',
          loaded ? '' : 'hidden',
        ].join(' ')}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </>
  )
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

function LoteThumbs({ files, onRemove }: { files: File[]; onRemove: (index: number) => void }) {
  const urls = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files])

  useEffect(() => {
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [urls])

  if (files.length === 0) return null

  return (
    <ul className="grid grid-cols-4 gap-2">
      {files.map((file, index) => (
        <li key={`${file.name}-${file.size}-${file.lastModified}-${index}`} className="relative">
          <div className="aspect-square overflow-hidden rounded-xl border border-line bg-canvas">
            <img src={urls[index]} alt="" className="h-full w-full object-cover" />
          </div>
          <button
            type="button"
            aria-label="Remover do envio"
            onClick={() => onRemove(index)}
            className="absolute -right-1 -top-1 flex min-h-11 min-w-11 items-center justify-center rounded-full bg-surface text-muted shadow-sm hover:text-error"
          >
            <X size={14} />
          </button>
        </li>
      ))}
    </ul>
  )
}

export function PatientImagesPanel({ patientId, canWrite = false }: PatientImagesPanelProps) {
  const { data: images = [], isLoading, isError } = usePatientImages(patientId)
  const { data: sessions = [] } = usePatientSessions(patientId)
  const uploadImages = useUploadPatientImages(patientId)
  const narrowViewport = useNarrowViewport()

  const [filter, setFilter] = useState<GalleryFilter>('todas')
  const [openId, setOpenId] = useState<string | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [lote, setLote] = useState<File[]>([])
  const [fileError, setFileError] = useState<string | null>(null)

  const galleryInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const chooseFilesRef = useRef<HTMLButtonElement>(null)

  const uploadForm = useForm<ImageMetadataFormData>({
    resolver: zodResolver(imageMetadataFormSchema),
    defaultValues: emptyMeta,
  })

  useEffect(() => {
    if (filter === 'todas' || filter === 'avulsas') return
    if (!sessions.some((session) => session.id === filter)) setFilter('todas')
  }, [filter, sessions])

  useEffect(() => {
    if (!uploadOpen) return
    uploadForm.reset(emptyMeta)
    setFileError(null)
    chooseFilesRef.current?.focus()
  }, [uploadOpen, uploadForm])

  const filtered = filterImages(images, filter)
  const openImage = images.find((image) => image.id === openId) ?? null
  const unfilteredEmpty = images.length === 0
  const emptyHeading = unfilteredEmpty
    ? 'Nenhuma imagem nesta ficha.'
    : filter === 'avulsas'
      ? 'Nenhuma imagem avulsa.'
      : 'Nenhuma imagem nesta sessão.'
  const emptyBody = canWrite
    ? unfilteredEmpty
      ? 'Toque em Adicionar imagem para enviar uma foto avulsa ou ligada a uma sessão.'
      : 'Altere o filtro ou toque em Adicionar imagem.'
    : undefined

  const sessionOptions = [
    { value: '', label: 'Avulsa (sem sessão)' },
    ...sessions.map((session) => ({
      value: session.id,
      label: `${session.dateLabel} · ${session.timeLabel}`,
    })),
  ]

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
      toast('Envie no máximo 10 fotos por vez.', 'error')
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
        mimeType: file.type,
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

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Imagens</p>
            <p className="mt-1 text-sm text-muted">Fotos avulsas ou ligadas a uma sessão.</p>
          </div>
          {canWrite ? (
            <Button type="button" onClick={() => setUploadOpen(true)}>
              <Plus size={16} />
              Adicionar imagem
            </Button>
          ) : null}
        </div>

        <div className="flex gap-2 overflow-x-auto">
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
            Não foi possível carregar as imagens. Tente de novo em instantes.
          </article>
        ) : filtered.length === 0 ? (
          <EmptyWell heading={emptyHeading} body={emptyBody} />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((image) => {
              const description = image.description.trim()
              const open = openId === image.id
              return (
                <button
                  key={image.id}
                  type="button"
                  className="text-left"
                  onClick={() => setOpenId(image.id)}
                >
                  <div
                    className={[
                      'aspect-square overflow-hidden rounded-2xl border border-line bg-canvas',
                      open ? 'ring-2 ring-accent ring-offset-2' : '',
                    ].join(' ')}
                  >
                    <SignedPhoto src={image.signedUrl} alt={imageAlt(image)} />
                  </div>
                  <p
                    className={[
                      'mt-2 line-clamp-2 text-sm',
                      description ? 'text-ink' : 'text-muted',
                    ].join(' ')}
                  >
                    {description || 'Sem descrição.'}
                  </p>
                  <p className="mt-1 text-xs text-muted">{tileAllocation(image, sessions)}</p>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <Modal
        open={Boolean(openImage)}
        title="Imagem"
        onClose={() => setOpenId(null)}
        wide
      >
        {openImage ? (
          <div>
            <SignedPhoto src={openImage.signedUrl} alt={imageAlt(openImage)} contain />
            <p className="mt-4 text-sm text-ink">
              {openImage.description.trim() || 'Sem descrição.'}
            </p>
            <p className="mt-1 text-xs text-muted">{lightboxAllocation(openImage, sessions)}</p>
          </div>
        ) : null}
      </Modal>

      {canWrite ? (
        <Modal
          open={uploadOpen}
          title="Adicionar imagem"
          description="JPEG, PNG ou WebP. Avulsa ou de uma sessão."
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
                accept={IMAGE_ACCEPT}
                multiple
                className="hidden"
                onChange={onGalleryChange}
              />
              {narrowViewport ? (
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept={IMAGE_ACCEPT}
                  capture="environment"
                  className="hidden"
                  onChange={onCameraChange}
                />
              ) : null}
              <p className="text-xs text-muted">JPEG, PNG ou WebP · até 8 MB</p>
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
                Adicionar imagem
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </>
  )
}
