import { ChevronRight } from 'lucide-react'
import type { SpecialTest } from '@/lib/testesEspeciais'
import { specialTestCardDomId } from './specialTestDom'

interface SpecialTestCardProps {
  test: SpecialTest
  regionLabel?: string
  selected: boolean
  onOpen: (testId: string, trigger: HTMLButtonElement) => void
}

/** O cartão inteiro abre os detalhes; "Ver detalhes" fica como dica visual dentro dele. */
export function SpecialTestCard({ test, regionLabel, selected, onOpen }: SpecialTestCardProps) {
  return (
    <li id={specialTestCardDomId(test.id)} aria-current={selected ? 'true' : undefined}>
      <button
        type="button"
        aria-label={`Ver detalhes de ${test.name}`}
        onClick={(e) => onOpen(test.id, e.currentTarget)}
        className={[
          'group block w-full space-y-2 rounded-2xl border p-4 text-left transition-colors motion-reduce:transition-none',
          selected
            ? 'border-accent bg-accent-soft'
            : 'border-line bg-surface hover:border-accent/50 hover:bg-canvas',
        ].join(' ')}
      >
        {regionLabel ? <span className="block text-sm text-muted">{regionLabel}</span> : null}
        <span
          className={[
            'block text-xl font-semibold leading-tight',
            selected ? 'text-forest' : 'text-ink',
          ].join(' ')}
        >
          {test.name}
        </span>
        <span className="block text-sm leading-6 text-muted">{test.summary}</span>
        <span className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-[#1e3a8a]">
          Ver detalhes
          <ChevronRight
            size={16}
            aria-hidden
            className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
          />
        </span>
      </button>
    </li>
  )
}
