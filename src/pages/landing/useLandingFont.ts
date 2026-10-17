import { useEffect } from 'react'

// Fraunces só nas páginas públicas (landing e 404): o app não paga por essa fonte.
const LP_FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500..700;1,9..144,500..700&display=swap'

export function useLandingFont() {
  useEffect(() => {
    if (document.querySelector(`link[href="${LP_FONT_HREF}"]`)) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = LP_FONT_HREF
    document.head.appendChild(link)
  }, [])
}
