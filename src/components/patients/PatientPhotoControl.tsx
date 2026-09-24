import { useState, type ChangeEvent } from 'react'
import { Camera } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PatientAvatar } from '@/components/ui/PatientAvatar'
import { useRemovePatientPhoto, useUploadPatientPhoto } from '@/hooks/usePatients'
import { preparePatientPhoto } from '@/lib/cropPatientPhoto'
import { toast } from '@/stores/toast.store'

interface PatientPhotoControlProps {
  patientId: string
  name: string
  tone?: string | null
  initials?: string
  photoUrl: string | null
  size: 'md' | 'lg'
  className?: string
  showRemove: boolean
}

export function PatientPhotoControl({
  patientId,
  name,
  tone,
  initials,
  photoUrl,
  size,
  className,
}: PatientPhotoControlProps) {
  const upload = useUploadPatientPhoto(patientId)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const shownUrl = previewUrl ?? photoUrl
  const hasPhoto = Boolean(shownUrl)
  const ariaLabel = hasPhoto ? `Trocar foto de ${name}` : `Escolher foto de ${name}`

  async function onPhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    if (upload.isPending) {
      input.value = ''
      return
    }
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    try {
      const prepared = await preparePatientPhoto(file)
      const nextPreview = URL.createObjectURL(prepared.blob)
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current)
        return nextPreview
      })
      upload.mutate(
        { file: prepared.blob, mimeType: prepared.mimeType },
        {
          onError: () => {
            setPreviewUrl((current) => {
              if (current === nextPreview) {
                URL.revokeObjectURL(nextPreview)
                return null
              }
              return current
            })
          },
        },
      )
    } catch (error) {
      if (error instanceof Error) {
        toast(error.message, 'error')
      }
    }
  }

  return (
    <label
      className="group/photo relative inline-flex h-fit w-fit shrink-0 self-start overflow-hidden rounded-full"
      aria-busy={upload.isPending}
    >
      <PatientAvatar
        name={name}
        tone={tone}
        initials={initials}
        photoUrl={shownUrl}
        size={size}
        className={className}
      />
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
        className="sr-only"
        aria-label={ariaLabel}
        onChange={(event) => {
          void onPhotoChange(event)
        }}
      />
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-forest/55 text-white opacity-0 group-hover/photo:opacity-100 group-focus-within/photo:opacity-100 [@media(hover:none)]:opacity-100 motion-reduce:transition-none">
        {upload.isPending ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <Camera aria-hidden="true" className={size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />
        )}
      </span>
    </label>
  )
}

interface PatientPhotoRemoveButtonProps {
  patientId: string
  name: string
  photoUrl: string | null
}

export function PatientPhotoRemoveButton({
  patientId,
  name,
  photoUrl,
}: PatientPhotoRemoveButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const removePhoto = useRemovePatientPhoto(patientId)

  if (!photoUrl) return null

  return (
    <>
      <button
        type="button"
        className="inline-flex min-h-11 items-center px-2 text-xs text-muted hover:text-error"
        aria-label={`Remover foto de ${name}`}
        onClick={() => setConfirmOpen(true)}
      >
        Remover foto
      </button>
      <ConfirmDialog
        open={confirmOpen}
        title="Remover foto"
        description="A foto sai da ficha e das listas. As iniciais voltam."
        confirmLabel="Remover foto"
        cancelLabel="Voltar"
        tone="danger"
        isLoading={removePhoto.isPending}
        onConfirm={() => {
          removePhoto.mutate()
        }}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  )
}
