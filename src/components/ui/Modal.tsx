import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: React.ReactNode
  wide?: boolean
}

export function Modal({ open, title, description, onClose, children, wide = false }: ModalProps) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center sm:pb-4">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-forest/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={[
          'relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-3xl border border-line bg-surface p-6 shadow-2xl',
          wide ? 'max-w-3xl' : 'max-w-lg',
        ].join(' ')}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="modal-title" className="text-lg font-semibold text-ink">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl p-2 text-muted hover:bg-canvas hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
