import { forwardRef, useEffect, useImperativeHandle, useRef, type TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  autoResize?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      id,
      className = '',
      autoResize = true,
      value,
      defaultValue,
      onChange,
      onInput,
      ...props
    },
    ref,
  ) => {
    const textareaId = id ?? label.toLowerCase().replace(/\s+/g, '-')
    const innerRef = useRef<HTMLTextAreaElement | null>(null)

    useImperativeHandle(ref, () => innerRef.current!)

    const adjustHeight = () => {
      const el = innerRef.current
      if (!el || !autoResize) return
      el.style.height = 'auto'
      const newHeight = Math.max(el.scrollHeight, 96)
      el.style.height = `${newHeight}px`
    }

    useEffect(() => {
      adjustHeight()
      const raf = requestAnimationFrame(adjustHeight)
      return () => cancelAnimationFrame(raf)
    })

    return (
      <div className="space-y-2">
        <label htmlFor={textareaId} className="block text-sm font-medium text-ink">
          {label}
        </label>
        <textarea
          ref={innerRef}
          id={textareaId}
          value={value}
          defaultValue={defaultValue}
          aria-invalid={!!error}
          onInput={(e) => {
            adjustHeight()
            onInput?.(e)
          }}
          onChange={(e) => {
            adjustHeight()
            onChange?.(e)
          }}
          className={[
            'min-h-24 w-full rounded-2xl border bg-canvas px-4 py-3 text-ink placeholder:text-muted/50',
            'transition-[border-color,background-color] duration-200',
            autoResize ? 'resize-none overflow-hidden' : '',
            'focus:border-accent focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25',
            error ? 'border-error' : 'border-line hover:border-forest/25',
            className,
          ].join(' ')}
          {...props}
        />
        {error && (
          <p role="alert" className="text-xs text-error">
            {error}
          </p>
        )}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
