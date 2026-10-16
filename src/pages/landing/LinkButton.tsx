import type { CSSProperties, MouseEventHandler, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { buildWhatsAppLink } from '@/lib/landingWhatsapp'
import { WHATSAPP_MESSAGE, WHATSAPP_NUMBER } from './landing.config'

// Estilos copiados de components/ui/Button.tsx (que não os exporta)
const BASE =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2'

export type LinkVariant = 'primary' | 'secondary' | 'ghost' | 'light' | 'outlineLight'

const VARIANTS: Record<LinkVariant, string> = {
  primary: 'bg-forest text-white hover:bg-forest-mid active:scale-[0.98] shadow-lg shadow-forest/20',
  secondary: 'border border-line bg-surface text-ink hover:border-forest/20 hover:bg-accent-soft',
  ghost: 'text-muted hover:text-forest hover:bg-accent-soft',
  light: 'bg-white text-forest hover:bg-accent-soft active:scale-[0.98]',
  outlineLight: 'border border-white/30 text-white hover:bg-white/10',
}

const TEXT_LINK =
  'inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink underline-offset-4 hover:underline'

function buttonClass(variant: LinkVariant, fullWidth?: boolean, className?: string) {
  return [BASE, VARIANTS[variant], fullWidth ? 'w-full' : '', className ?? '']
    .filter(Boolean)
    .join(' ')
}

type LinkButtonProps = {
  to: string
  variant?: LinkVariant
  fullWidth?: boolean
  className?: string
  children: ReactNode
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

export function LinkButton({
  to,
  variant = 'primary',
  fullWidth,
  className,
  children,
  onClick,
}: LinkButtonProps) {
  return (
    <Link to={to} className={buttonClass(variant, fullWidth, className)} onClick={onClick}>
      {children}
    </Link>
  )
}

type WhatsAppLinkProps = {
  variant?: LinkVariant
  fullWidth?: boolean
  className?: string
  style?: CSSProperties
  children?: ReactNode
  ariaLabel?: string
  asText?: boolean
}

// Único ponto da LP que monta href externo (T-36-02)
export function WhatsAppLink({
  variant = 'secondary',
  fullWidth,
  className,
  style,
  children,
  ariaLabel,
  asText,
}: WhatsAppLinkProps) {
  const cls = asText
    ? [TEXT_LINK, className ?? ''].filter(Boolean).join(' ')
    : buttonClass(variant, fullWidth, className)
  return (
    <a
      href={buildWhatsAppLink(WHATSAPP_NUMBER, WHATSAPP_MESSAGE)}
      target="_blank"
      rel="noopener noreferrer"
      className={cls}
      style={style}
      aria-label={ariaLabel}
    >
      {children ?? (
        <>
          <MessageCircle size={18} aria-hidden="true" />
          Falar no WhatsApp
        </>
      )}
    </a>
  )
}
