import { Link } from 'react-router-dom'
import logomark from '@/assets/brand/logomark.png'
import logotype from '@/assets/brand/logotype.png'
import logotypeOnDark from '@/assets/brand/logotype-on-dark.png'
import logoFull from '@/assets/brand/logo.png'
import logoFullOnDark from '@/assets/brand/logo-on-dark.png'

const sizeMap = {
  sm: {
    mark: 'h-9 w-auto',
    type: 'h-6 w-auto',
    lockup: 'h-10 w-auto max-w-[13rem]',
  },
  md: {
    mark: 'h-11 w-auto',
    type: 'h-8 w-auto',
    lockup: 'h-14 w-auto max-w-[18rem]',
  },
  lg: {
    mark: 'h-16 w-auto',
    type: 'h-11 w-auto',
    lockup: 'h-[4.5rem] w-auto max-w-[22rem]',
  },
} as const

interface BrandWordmarkProps {
  size?: keyof typeof sizeMap
  variant?: 'onDark' | 'onLight'
  asLink?: boolean
  to?: string
  className?: string
  showTagline?: boolean
  onClick?: () => void
}

export function BrandWordmark({
  size = 'md',
  variant = 'onDark',
  asLink = false,
  to = '/',
  className = '',
  showTagline = true,
  onClick,
}: BrandWordmarkProps) {
  const scale = sizeMap[size]
  const onDark = variant === 'onDark'

  const content = showTagline ? (
    <img
      src={onDark ? logoFullOnDark : logoFull}
      alt="FLUXO"
      className={['object-contain object-left', scale.lockup, className].filter(Boolean).join(' ')}
    />
  ) : (
    <span className={['inline-flex items-center gap-2.5', className].filter(Boolean).join(' ')}>
      <img src={logomark} alt="" className={`shrink-0 object-contain ${scale.mark}`} />
      <img
        src={onDark ? logotypeOnDark : logotype}
        alt="FLUXO"
        className={`object-contain object-left ${scale.type} max-w-[9.5rem]`}
      />
    </span>
  )

  if (asLink) {
    return (
      <Link
        to={to}
        onClick={onClick}
        className="inline-flex transition-opacity hover:opacity-90"
        aria-label="FLUXO"
      >
        {content}
      </Link>
    )
  }

  return content
}
