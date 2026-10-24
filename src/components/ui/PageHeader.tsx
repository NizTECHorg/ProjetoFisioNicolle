import { InfoHint } from '@/components/ui/InfoHint'

interface PageHeaderProps {
  title: string
  description?: string
  /** Explicação curta do que a aba faz e como usar (ícone "i" ao lado do título). */
  info?: string
  action?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, info, action, className = '' }: PageHeaderProps) {
  return (
    <div className={['mb-6 shrink-0 lg:mb-4', className].join(' ')}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-sans text-3xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-[2.125rem]">
              {title}
            </h1>
            {info ? <InfoHint text={info} label={`Sobre: ${title}`} /> : null}
          </div>
          {description ? <p className="mt-1.5 text-sm leading-6 text-muted">{description}</p> : null}
        </div>
        {action ? (
          <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto sm:justify-end">{action}</div>
        ) : null}
      </div>
    </div>
  )
}
