import { useEffect, useState } from 'react'

/**
 * O painel dividido do desktop começa em xl (1280px) porque o AppShell
 * ocupa 288px a partir de lg (UI-SPEC Breakpoints). A navegação lateral usa md (768px).
 */
export const DESKTOP_MEDIA = '(min-width: 1280px)'
export const TABLET_UP_MEDIA = '(min-width: 768px)'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )
  useEffect(() => {
    const media = window.matchMedia(query)
    const sync = () => setMatches(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [query])
  return matches
}

export function useIsDesktop(): boolean {
  return useMediaQuery(DESKTOP_MEDIA)
}

export function useIsTabletUp(): boolean {
  return useMediaQuery(TABLET_UP_MEDIA)
}
