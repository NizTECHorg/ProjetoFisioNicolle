import { Asterisk } from 'lucide-react'

/** Ícone discreto ao lado do rótulo; o aviso aparece ao passar o mouse ou focar com o teclado. */
export function RequiredMark() {
  return (
    <span className="group/obrigatorio relative inline-flex align-middle">
      <span
        tabIndex={0}
        role="img"
        aria-label="Campo obrigatório"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-error/10 text-error outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <Asterisk size={11} strokeWidth={2.5} aria-hidden />
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity group-hover/obrigatorio:opacity-100 group-focus-within/obrigatorio:opacity-100"
      >
        Campo obrigatório
      </span>
    </span>
  )
}
