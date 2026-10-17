import { useEffect, useRef, type RefObject } from 'react'

const DURACAO = 700

// ease-in-out (cubic-bezier suave) para acelerar e frear as animações
function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/**
 * As animações CSS do elemento ficam pausadas no 1º quadro. Ao entrar com o mouse, a velocidade
 * sobe de 0 a 1 em curva; ao sair, desce até 0 e pausa — sem começo nem parada bruscos.
 */
export function useEasedHover<T extends HTMLElement>(): {
  ref: RefObject<T | null>
  onMouseEnter: () => void
  onMouseLeave: () => void
} {
  const ref = useRef<T | null>(null)
  const velocidade = useRef(0)
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
      const t = Math.min(1, (agora - t0) / DURACAO)
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

  return { ref, onMouseEnter: () => rampa(1), onMouseLeave: () => rampa(0) }
}
