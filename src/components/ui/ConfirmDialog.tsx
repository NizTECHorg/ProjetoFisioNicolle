import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'default'
  isLoading?: boolean
  /** When true, the cancel button receives initial focus. Default keeps existing callers unchanged. */
  autoFocusCancel?: boolean
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'default',
  isLoading = false,
  autoFocusCancel = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} title={title} description={description} onClose={onClose}>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          variant="secondary"
          fullWidth
          className="sm:w-auto"
          onClick={onClose}
          disabled={isLoading}
          autoFocus={autoFocusCancel}
        >
          {cancelLabel}
        </Button>
        <Button
          fullWidth
          className={[
            'sm:w-auto',
            tone === 'danger' ? '!bg-error !text-white hover:!bg-error/90' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onClick={onConfirm}
          isLoading={isLoading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
