interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, action, className = '' }: PageHeaderProps) {
  return (
    <div className={['mb-6 shrink-0 lg:mb-4', className].join(' ')}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-sans text-3xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-[2.125rem]">
            {title}
          </h1>
          {description ? <p className="mt-1.5 text-sm leading-6 text-muted">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  )
}
