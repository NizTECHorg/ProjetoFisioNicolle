import { useEffect, useRef, type RefObject } from 'react'

const DURACAO = 700

// ease-in-out (cubic-bezier suave) para acelerar e frear as animações
function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/**
 * Muda a velocidade das animações CSS do elemento em curva (sem tranco) ao entrar/sair com o mouse.
 * Padrão: pausadas no 1º quadro, sobem de 0 a 1 no hover e voltam a 0 (pausa) ao sair.
 * Ex. carrossel: { dentro: 0.2, fora: 1 } desacelera no hover e volta ao normal ao sair.
 */
export function useEasedHover<T extends HTMLElement>(opcoes?: {
  /** Velocidade com o mouse em cima (padrão 1). */
  dentro?: number
  /** Velocidade sem o mouse (padrão 0 = pausada no quadro atual). */
  fora?: number
  duracao?: number
}): {
  ref: RefObject<T | null>
  onMouseEnter: () => void
  onMouseLeave: () => void
} {
  const dentro = opcoes?.dentro ?? 1
  const fora = opcoes?.fora ?? 0
  const duracao = opcoes?.duracao ?? DURACAO
  const ref = useRef<T | null>(null)
  const velocidade = useRef(fora)
  const quadro = useRef(0)

  useEffect(() => () => cancelAnimationFrame(quadro.current), [])

  function animacoes(): Animation[] {
    const el = ref.current
    if (!el || typeof el.getAnimations !== 'function') return []
    return el.getAnimations({ subtree: true })
  }

  function rampa(alvo: number) {
    const lista = animacoes()
    if (lista.length === 0) return
    cancelAnimationFrame(quadro.current)
    const inicio = velocidade.current
    const t0 = performance.now()
    if (alvo > 0) for (const a of lista) a.play()
    const passo = (agora: number) => {
      const t = Math.min(1, (agora - t0) / duracao)
      velocidade.current = inicio + (alvo - inicio) * easeInOut(t)
      for (const a of lista) a.playbackRate = Math.max(velocidade.current, 0.0001)
      if (t < 1) {
        quadro.current = requestAnimationFrame(passo)
      } else if (alvo === 0) {
        for (const a of lista) a.pause()
      }
    }
    quadro.current = requestAnimationFrame(passo)
  }

  return { ref, onMouseEnter: () => rampa(dentro), onMouseLeave: () => rampa(fora) }
}
