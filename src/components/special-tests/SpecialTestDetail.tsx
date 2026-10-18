import { useEffect, useRef } from 'react'
import type { Ref } from 'react'
import { ArrowLeft, X } from 'lucide-react'
import type { SpecialTest } from '@/lib/testesEspeciais'

interface DetailContentProps {
  test: SpecialTest
  regionLabel: string
  showTitle: boolean
  titleRef?: Ref<HTMLHeadingElement>
}

export function SpecialTestDetailContent({
  test,
  regionLabel,
  showTitle,
  titleRef,
}: DetailContentProps) {
  const sections: ReadonlyArray<{ label: string; text: string }> = [
    { label: 'Objetivo', text: test.summary },
    { label: 'Técnica de Execução', text: test.technique },
    { label: 'Interpretação', text: test.interpretation },
  ]
  return (
    <div>
      <span className="inline-flex rounded-full border border-line bg-canvas px-4 py-1 text-sm font-semibold text-forest">
        {regionLabel}
      </span>
      {showTitle ? (
        <h2
          ref={titleRef}
          tabIndex={-1}
          className="mt-3 text-xl font-semibold leading-tight text-ink"
        >
          {test.name}
        </h2>
      ) : null}
      <div className="mt-4 space-y-4">
        {sections.map((section, index) => (
          <section key={section.label} className={index > 0 ? 'border-t border-line pt-4' : ''}>
            <h3 className="text-sm font-semibold text-forest">{section.label}</h3>
            <p className="mt-1 text-base leading-6 text-ink">{section.text}</p>
          </section>
        ))}
      </div>
    </div>
  )
}

interface PanelProps {
  test: SpecialTest
  regionLabel: string
  onClose: () => void
}

export function SpecialTestPanel({ test, regionLabel, onClose }: PanelProps) {
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    titleRef.current?.focus()
  }, [test.id])

  return (
    <div
      role="region"
      aria-label={test.name}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
      className="sticky top-4 max-h-[calc(100dvh-8rem)] overflow-y-auto overscroll-contain rounded-2xl border border-line bg-surface p-6 shadow-sm"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onClose}
          className="-ml-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-semibold text-muted transition-all duration-200 hover:bg-accent-soft hover:text-forest"
        >
          <ArrowLeft size={16} aria-hidden />
          Voltar à navegação
        </button>
        <button
          type="button"
          aria-label="Fechar detalhes"
          onClick={onClose}
          className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-muted hover:bg-canvas hover:text-ink"
        >
          <X size={18} aria-hidden />
        </button>
      </div>
      <SpecialTestDetailContent
        test={test}
        regionLabel={regionLabel}
        showTitle
        titleRef={titleRef}
      />
    </div>
  )
}
