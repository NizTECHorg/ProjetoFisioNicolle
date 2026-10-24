import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Info } from 'lucide-react'

const LARGURA = 288
const MARGEM = 16

/**
 * "i" discreto com uma explicação curta. Abre no hover e no foco (teclado);
 * no celular, o toque alterna. A caixa vai para o <body> (portal) com z-index acima
 * de modais e toasts, então nunca fica escondida atrás de outro elemento.
 */
export function InfoHint({ text, label = 'Sobre esta aba' }: { text: string; label?: string }) {
  const id = useId()
  const botaoRef = useRef<HTMLButtonElement>(null)
  const [aberto, setAberto] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  const medir = useCallback(() => {
    const rect = botaoRef.current?.getBoundingClientRect()
    if (!rect) return
    const largura = Math.min(LARGURA, window.innerWidth - MARGEM * 2)
    const centro = rect.left + rect.width / 2 - largura / 2
    const left = Math.min(Math.max(centro, MARGEM), window.innerWidth - largura - MARGEM)
    setPos({ top: rect.bottom + 8, left })
  }, [])

  useLayoutEffect(() => {
    if (aberto) medir()
  }, [aberto, medir])

  useEffect(() => {
    if (!aberto) return
    window.addEventListener('scroll', medir, { capture: true, passive: true })
    window.addEventListener('resize', medir)
    return () => {
      window.removeEventListener('scroll', medir, { capture: true })
      window.removeEventListener('resize', medir)
    }
  }, [aberto, medir])

  return (
    <span
      className="relative inline-flex translate-y-[3px] align-middle"
      onMouseEnter={() => setAberto(true)}
      onMouseLeave={() => setAberto(false)}
    >
      <button
        ref={botaoRef}
        type="button"
        aria-label={label}
        aria-describedby={aberto ? id : undefined}
        aria-expanded={aberto}
        onClick={() => setAberto((atual) => !atual)}
        onFocus={() => setAberto(true)}
        onBlur={() => setAberto(false)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setAberto(false)
        }}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted transition-colors hover:bg-accent-soft hover:text-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <Info size={16} aria-hidden />
      </button>
      {/* Sempre montado para animar a entrada e a saída; fechado fica invisível e fora da leitura. */}
      {pos
        ? createPortal(
            <span
              id={id}
              role="tooltip"
              aria-hidden={!aberto}
              style={{ top: pos.top, left: pos.left, width: Math.min(LARGURA, window.innerWidth - MARGEM * 2) }}
              className={[
                'pointer-events-none fixed z-[200] origin-top rounded-xl border border-line bg-surface p-3 text-left text-sm font-normal leading-6 tracking-normal text-ink shadow-lg',
                'transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                aberto ? 'translate-y-0 scale-100 opacity-100' : '-translate-y-1 scale-95 opacity-0',
              ].join(' ')}
            >
              {text}
            </span>,
            document.body,
          )
        : null}
    </span>
  )
}
