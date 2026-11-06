import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

type Props = {
  /** Conteúdo do lado da aba, com o ícone: "Nova avaliação", "Nova sessão / evolução"... */
  acao: ReactNode
  exportando: boolean
  onAcao: () => void
  onExportar: () => void
}

const ladoClass =
  'relative z-10 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition-colors duration-300'

/** Alterna entre a aba e o Exportar: o fundo do botão principal desliza até o lado escolhido. */
export function ExportarToggle({ acao, exportando, onAcao, onExportar }: Props) {
  const trilho = useRef<HTMLDivElement>(null)
  const ladoAcao = useRef<HTMLButtonElement>(null)
  const ladoExportar = useRef<HTMLButtonElement>(null)
  const [fundo, setFundo] = useState<{ left: number; width: number } | null>(null)

  // Os lados têm larguras diferentes: mede o ativo, de novo se o trilho mudar de tamanho.
  useLayoutEffect(() => {
    const medir = () => {
      const lado = exportando ? ladoExportar.current : ladoAcao.current
      if (lado) setFundo({ left: lado.offsetLeft, width: lado.offsetWidth })
    }
    medir()
    const observador = new ResizeObserver(medir)
    if (trilho.current) observador.observe(trilho.current)
    return () => observador.disconnect()
  }, [exportando])

  const corDoLado = (ativo: boolean) => (ativo ? 'text-white' : 'text-muted hover:text-ink')

  return (
    <div
      ref={trilho}
      role="group"
      aria-label="Ver a aba ou exportar"
      className="relative grid w-full grid-cols-[minmax(0,1fr)_7rem] items-center gap-1 rounded-2xl border border-line bg-canvas p-1 sm:inline-grid sm:w-auto sm:grid-cols-[auto_7rem]"
    >
      {fundo ? (
        <span
          aria-hidden
          className="absolute inset-y-1 left-0 rounded-2xl bg-forest shadow-lg shadow-forest/20 transition-[transform,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{ width: fundo.width, transform: `translateX(${fundo.left}px)` }}
        />
      ) : null}
      <button
        ref={ladoAcao}
        type="button"
        aria-pressed={!exportando}
        onClick={onAcao}
        className={`${ladoClass} ${corDoLado(!exportando)}`}
      >
        {acao}
      </button>
      <button
        ref={ladoExportar}
        type="button"
        aria-pressed={exportando}
        onClick={onExportar}
        className={`${ladoClass} ${corDoLado(exportando)}`}
      >
        Exportar
      </button>
    </div>
  )
}
