import { useEffect, useRef, useState } from 'react'
import { AudienceSection } from './AudienceSection'
import { CreatorSection } from './CreatorSection'
import { FaqSection } from './FaqSection'
import { FeatureMarquee } from './FeatureMarquee'
import { HeroSection } from './HeroSection'
import { LandingFooter } from './LandingFooter'
import { LandingHeader } from './LandingHeader'
import { PlansSection } from './PlansSection'
import { ProductSection } from './ProductSection'
import { WhatsAppFab } from './WhatsAppFab'
import { updateParallax } from './useParallax'
import { useLandingFont } from './useLandingFont'

const SECTION_IDS = ['produto', 'criadora', 'para-quem', 'planos', 'faq']

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const frame = useRef(0)

  useLandingFont()

  // Um quadro por rolagem: barra de progresso, parallax e sombra do header.
  const onScroll = () => {
    if (frame.current) return
    frame.current = window.requestAnimationFrame(() => {
      frame.current = 0
      const el = scrollerRef.current
      if (!el) return
      const max = el.scrollHeight - el.clientHeight
      const ratio = max > 0 ? el.scrollTop / max : 0
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${ratio})`
      updateParallax()
      const next = el.scrollTop > 8
      setScrolled((prev) => (prev === next ? prev : next))
    })
  }

  useEffect(() => {
    window.addEventListener('resize', updateParallax)
    return () => {
      window.removeEventListener('resize', updateParallax)
      if (frame.current) window.cancelAnimationFrame(frame.current)
    }
  }, [])

  // Seção atual para destacar o item do menu.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const sections = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    )
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id)
        }
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
    )
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  return (
    // Scroller próprio: html/body têm overflow hidden em >=1024px (regra global do app).
    <div
      ref={scrollerRef}
      onScroll={onScroll}
      className="lp-scroll fixed inset-0 overflow-y-auto overflow-x-hidden bg-canvas font-sans text-ink"
    >
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-surface focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-ink"
      >
        Pular para o conteúdo
      </a>
      <LandingHeader
        scrolled={scrolled}
        menuOpen={menuOpen}
        onMenuOpenChange={setMenuOpen}
        activeSection={activeSection}
        progressRef={progressRef}
      />
      <main id="conteudo" tabIndex={-1} className="focus:outline-none">
        <HeroSection />
        <FeatureMarquee />
        <ProductSection />
        <CreatorSection />
        <AudienceSection />
        <PlansSection />
        <FaqSection />
      </main>
      <LandingFooter />
      <WhatsAppFab hidden={false} />
    </div>
  )
}
