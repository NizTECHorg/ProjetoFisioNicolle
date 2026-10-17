import type { ElementType, ReactNode } from 'react'
import { Check } from 'lucide-react'
import { useReveal } from './useReveal'

type Tone = 'light' | 'dark'

export function Eyebrow({
  children,
  icon,
  tone = 'light',
}: {
  children: ReactNode
  icon?: ReactNode
  tone?: Tone
}) {
  return (
    <span
      className={[
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold uppercase tracking-wide',
        tone === 'dark' ? 'bg-white/10 text-white' : 'bg-white/70 text-ink ring-1 ring-line',
      ].join(' ')}
    >
      {icon ?? <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />}
      {children}
    </span>
  )
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  intro,
  align = 'center',
  tone = 'light',
}: {
  id: string
  eyebrow: string
  title: string
  intro?: string
  align?: 'center' | 'left'
  tone?: Tone
}) {
  const dark = tone === 'dark'
  return (
    <div
      className={[
        'flex flex-col gap-4',
        align === 'center' ? 'items-center text-center' : 'items-start text-left',
      ].join(' ')}
    >
      <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
      <h2
        id={id}
        className={[
          'lp-display text-[32px] font-semibold leading-[1.15] md:text-[40px]',
          dark ? 'text-white' : 'text-ink',
        ].join(' ')}
      >
        {title}
      </h2>
      {intro ? (
        <p
          className={['max-w-prose text-base leading-7', dark ? 'text-white/70' : 'text-muted'].join(
            ' ',
          )}
        >
          {intro}
        </p>
      ) : null}
    </div>
  )
}

export function WaveDivider({ fill, flip }: { fill: string; flip?: boolean }) {
  if (flip) {
    // Onda de cima (rodapé): desenhada já invertida, sem rotate — evita fresta de 1px no Safari/mobile.
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 64"
        preserveAspectRatio="none"
        overflow="visible"
        className={['relative z-[1] -mt-px block h-12 w-full md:h-16', fill].join(' ')}
      >
        <path d="M1440 32 C 1200 64, 960 64, 720 32 S 240 0, 0 32 L0 -4 L1440 -4 Z" />
      </svg>
    )
  }
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 64"
      preserveAspectRatio="none"
      // -mb-px + z-[1]: a onda cobre 1px da seção seguinte, sem fresta de outra cor na emenda.
      className={['relative z-[1] -mb-px block h-12 w-full md:h-16', fill, flip ? 'rotate-180' : ''].join(' ')}
    >
      <path d="M0 32 C 240 0, 480 0, 720 32 S 1200 64, 1440 32 L1440 66 L0 66 Z" />
    </svg>
  )
}

export function Blob({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={['pointer-events-none absolute rounded-full blur-3xl', className].join(' ')}
    />
  )
}

export function CheckItem({ children, tone = 'light' }: { children: ReactNode; tone?: Tone }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage/15">
        <Check size={14} className="text-sage" aria-hidden="true" />
      </span>
      <span className={['text-base', tone === 'dark' ? 'text-white' : 'text-ink'].join(' ')}>
        {children}
      </span>
    </li>
  )
}

export type RevealVariant = 'up' | 'left' | 'right' | 'scale' | 'blur'

export function Reveal({
  as = 'div',
  delay = 0,
  variant = 'up',
  className,
  children,
}: {
  as?: ElementType
  delay?: number
  variant?: RevealVariant
  className?: string
  children: ReactNode
}) {
  const ref = useReveal<HTMLElement>()
  const Tag = as
  return (
    <Tag
      ref={ref}
      data-reveal={variant === 'up' ? undefined : variant}
      className={className}
      style={{ transitionDelay: delay ? `${delay}ms` : undefined }}
    >
      {children}
    </Tag>
  )
}
