import { forwardRef, type SelectHTMLAttributes } from 'react'
import { RequiredMark } from '@/components/ui/RequiredMark'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  /** Mostra o ícone de campo obrigatório ao lado do rótulo. */
  requiredMark?: boolean
  options: Array<{ value: string; label: string }>
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, requiredMark = false, options, id, className = '', ...props }, ref) => {
    const selectId = id ?? label.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-2">
        <label htmlFor={selectId} className="flex items-center gap-1.5 text-sm font-medium text-ink">
          {label}
          {requiredMark ? <RequiredMark /> : null}
        </label>
        <select
          ref={ref}
          id={selectId}
          aria-invalid={!!error}
          className={[
            'w-full rounded-2xl border bg-canvas px-4 py-3.5 text-ink',
            'transition-colors duration-200',
            'focus:border-accent focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25',
            error ? 'border-error' : 'border-line hover:border-forest/25',
            className,
          ].join(' ')}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p role="alert" className="text-xs text-error">
            {error}
          </p>
        )}
      </div>
    )
  },
)

Select.displayName = 'Select'
