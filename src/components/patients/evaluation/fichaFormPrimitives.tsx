import type { ReactNode } from 'react'
import type { FieldPath, FieldValues, UseFormRegister } from 'react-hook-form'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'

export function FichaBlock({
  letter,
  title,
  children,
  tone = 'default',
}: {
  letter: string
  title: string
  children: ReactNode
  tone?: 'default' | 'danger'
}) {
  const border = tone === 'danger' ? 'border-error/30' : 'border-line'
  const badge =
    tone === 'danger'
      ? 'bg-error/10 text-error'
      : 'bg-accent-soft text-forest'
  const heading = tone === 'danger' ? 'text-error' : 'text-accent'

  return (
    <section className={`rounded-2xl border ${border} bg-surface p-4 sm:p-5`}>
      <div className="flex items-center gap-2.5">
        <span
          className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold ${badge}`}
        >
          {letter}
        </span>
        <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${heading}`}>
          Bloco {letter} · {title}
        </p>
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  )
}

export function CheckboxGrid({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-x-4 gap-y-2">{children}</div>
}

type BoolPathProps<T extends FieldValues> = {
  label: string
  name: FieldPath<T>
  register: UseFormRegister<T>
  disabled?: boolean
}

export function BoolCheck<T extends FieldValues>({
  label,
  name,
  register,
  disabled,
}: BoolPathProps<T>) {
  return (
    <label className="inline-flex min-h-11 items-center gap-2 text-sm text-ink">
      <input
        type="checkbox"
        className="accent-forest"
        disabled={disabled}
        {...register(name)}
      />
      <span>{label}</span>
    </label>
  )
}

type RadioOption = { value: string; label: string }

export function RadioRow<T extends FieldValues>({
  legend,
  name,
  options,
  register,
  disabled,
}: {
  legend: string
  name: FieldPath<T>
  options: RadioOption[]
  register: UseFormRegister<T>
  disabled?: boolean
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs text-muted">{legend}</legend>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {options.map((option) => (
          <label key={option.value} className="inline-flex min-h-11 items-center gap-2 text-sm text-ink">
            <input
              type="radio"
              value={option.value}
              className="accent-forest"
              disabled={disabled}
              {...register(name)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function TextField<T extends FieldValues>({
  label,
  name,
  register,
  rows = 3,
  disabled,
}: {
  label: string
  name: FieldPath<T>
  register: UseFormRegister<T>
  rows?: number
  disabled?: boolean
}) {
  return <Textarea label={label} rows={rows} disabled={disabled} {...register(name)} />
}

export function LineField<T extends FieldValues>({
  label,
  name,
  register,
  disabled,
  type = 'text',
}: {
  label: string
  name: FieldPath<T>
  register: UseFormRegister<T>
  disabled?: boolean
  type?: string
}) {
  return <Input label={label} type={type} disabled={disabled} {...register(name)} />
}

export function EvaField<T extends FieldValues>({
  label,
  name,
  register,
  disabled,
}: {
  label: string
  name: FieldPath<T>
  register: UseFormRegister<T>
  disabled?: boolean
}) {
  return (
    <Input
      label={label}
      type="number"
      min={0}
      max={10}
      step={1}
      disabled={disabled}
      {...register(name, {
        setValueAs: (value) => {
          if (value === '' || value === null || value === undefined) return undefined
          const n = Number(value)
          return Number.isFinite(n) ? n : undefined
        },
      })}
    />
  )
}

/** Show detail leaf only when non-empty. */
export function DetailLeaf({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined || value === false || value === '') return null
  if (typeof value === 'boolean') {
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{label}</p>
        <p className="mt-1 text-sm text-ink">Sim</p>
      </div>
    )
  }
  if (typeof value === 'string' && !value.trim()) return null
  if (typeof value === 'number') {
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{label}</p>
        <p className="mt-1 text-sm text-ink">{value}</p>
      </div>
    )
  }
  if (typeof value === 'string') {
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{label}</p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink">{value}</p>
      </div>
    )
  }
  return null
}
