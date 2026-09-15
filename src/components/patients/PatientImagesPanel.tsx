import { useEffect, useState } from 'react'
import { Image } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { usePatientImages } from '@/hooks/usePatientImages'
import { usePatientSessions } from '@/hooks/usePatients'
import type { PatientImage, PatientSessionRecord } from '@/types/patient'

type PatientImagesPanelProps = {
  patientId: string
  canWrite?: boolean
}

type GalleryFilter = 'todas' | 'avulsas' | string

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

function EmptyWell({ heading }: { heading: string }) {
  return (
    <article className="rounded-2xl border border-dashed border-line bg-surface px-5 py-10 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Image size={22} />
      </div>
      <p className="mt-3 text-sm text-ink">{heading}</p>
    </article>
  )
}

export function PatientImagesPanel({ patientId, canWrite = false }: PatientImagesPanelProps) {
  const { data: images = [], isLoading, isError } = usePatientImages(patientId)
  const { data: sessions = [] } = usePatientSessions(patientId)

  const [filter, setFilter] = useState<GalleryFilter>('todas')
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    if (filter === 'todas' || filter === 'avulsas') return
    if (!sessions.some((session) => session.id === filter)) setFilter('todas')
  }, [filter, sessions])

  const filtered = filterImages(images, filter)
  const openImage = images.find((image) => image.id === openId) ?? null
  const emptyHeading =
    images.length === 0
      ? 'Nenhuma imagem nesta ficha.'
      : filter === 'avulsas'
        ? 'Nenhuma imagem avulsa.'
        : 'Nenhuma imagem nesta sessão.'

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Imagens</p>
            <p className="mt-1 text-sm text-muted">Fotos avulsas ou ligadas a uma sessão.</p>
          </div>
          {canWrite ? null : null}
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
          <EmptyWell heading={emptyHeading} />
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
    </>
  )
}
