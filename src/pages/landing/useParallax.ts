import { useEffect, useRef, type RefObject } from 'react'

// Parallax leve: cada elemento registrado se desloca conforme a distância do seu centro
// ao centro da tela. O LandingPage chama updateParallax() a cada quadro de rolagem.
const items = new Map<HTMLElement, number>()

function reducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function updateParallax(): void {
  if (items.size === 0 || reducedMotion()) return
  const middle = window.innerHeight / 2
  for (const [el, speed] of items) {
    const rect = el.getBoundingClientRect()
    if (rect.bottom < -200 || rect.top > window.innerHeight + 200) continue
    // Usa o centro sem o deslocamento atual, para não realimentar o próprio movimento.
    const current = parseFloat(el.style.getPropertyValue('--lp-py')) || 0
    const center = rect.top - current + rect.height / 2
    el.style.setProperty('--lp-py', `${Math.round((center - middle) * speed * 10) / 10}px`)
  }
}

/** speed > 0 sobe mais devagar que a página; < 0 sobe mais rápido. Ex.: 0.08 ou -0.12. */
export function useParallax<T extends HTMLElement>(speed: number): RefObject<T | null> {
  const ref = useRef<T | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || reducedMotion()) return
    el.classList.add('lp-parallax')
    items.set(el, speed)
    updateParallax()
    return () => {
      items.delete(el)
    }
  }, [speed])
  return ref
}
