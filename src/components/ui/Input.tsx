import { forwardRef, type InputHTMLAttributes } from 'react'
import { RequiredMark } from '@/components/ui/RequiredMark'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  /** Mostra o ícone de campo obrigatório ao lado do rótulo. */
  requiredMark?: boolean
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, requiredMark = false, hint, id, className = '', ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-2">
        <label htmlFor={inputId} className="flex items-center gap-1.5 text-sm font-medium text-ink">
          {label}
          {requiredMark ? <RequiredMark /> : null}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={[
            'w-full rounded-2xl border bg-canvas px-4 py-3.5 text-ink placeholder:text-muted/50',
            'transition-colors duration-200',
            'focus:border-accent focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25',
            error ? 'border-error' : 'border-line hover:border-forest/25',
            className,
          ].join(' ')}
          {...props}
        />
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-muted">
            {hint}
          </p>
        )}
        {error && (
          <p id={`${inputId}-error`} role="alert" className="text-xs text-error">
            {error}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
