import { ChevronRight } from 'lucide-react'
import type { SpecialTest } from '@/lib/testesEspeciais'
import { specialTestCardDomId } from './specialTestDom'

interface SpecialTestCardProps {
  test: SpecialTest
  regionLabel?: string
  selected: boolean
  onOpen: (testId: string, trigger: HTMLButtonElement) => void
}

export function SpecialTestCard({ test, regionLabel, selected, onOpen }: SpecialTestCardProps) {
  return (
    <li
      id={specialTestCardDomId(test.id)}
      aria-current={selected ? 'true' : undefined}
      className={[
        'space-y-2 rounded-2xl border p-4 transition-colors motion-reduce:transition-none',
        selected
          ? 'border-accent bg-accent-soft'
          : 'border-line bg-surface hover:border-accent/50',
      ].join(' ')}
    >
      {regionLabel ? <p className="text-sm text-muted">{regionLabel}</p> : null}
      <h3
        className={[
          'text-xl font-semibold leading-tight',
          selected ? 'text-forest' : 'text-ink',
        ].join(' ')}
      >
        {test.name}
      </h3>
      <p className="text-sm leading-6 text-muted">{test.summary}</p>
      <button
        type="button"
        aria-label={`Ver detalhes de ${test.name}`}
        onClick={(e) => onOpen(test.id, e.currentTarget)}
        className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-[#1e3a8a]"
      >
        Ver detalhes
        <ChevronRight size={16} aria-hidden />
      </button>
    </li>
  )
}
