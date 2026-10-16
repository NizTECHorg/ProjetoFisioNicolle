import { useRef, useState } from 'react'
import { AudienceSection } from './AudienceSection'
import { CreatorSection } from './CreatorSection'
import { FaqSection } from './FaqSection'
import { HeroSection } from './HeroSection'
import { LandingFooter } from './LandingFooter'
import { LandingHeader } from './LandingHeader'
import { PlansSection } from './PlansSection'
import { ProductSection } from './ProductSection'
import { WhatsAppFab } from './WhatsAppFab'

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const scrollerRef = useRef<HTMLDivElement>(null)

  return (
    // Scroller próprio: html/body têm overflow hidden em >=1024px (regra global do app).
    <div
      ref={scrollerRef}
      onScroll={(event) => {
        const next = event.currentTarget.scrollTop > 8
        setScrolled((prev) => (prev === next ? prev : next))
      }}
      className="lp-scroll fixed inset-0 overflow-y-auto overflow-x-hidden bg-canvas font-sans text-ink"
    >
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-surface focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-ink"
      >
        Pular para o conteúdo
      </a>
      <LandingHeader scrolled={scrolled} menuOpen={menuOpen} onMenuOpenChange={setMenuOpen} />
      <main id="conteudo" tabIndex={-1} className="focus:outline-none">
        <HeroSection />
        <ProductSection />
        <CreatorSection />
        <AudienceSection />
        <PlansSection />
        <FaqSection />
      </main>
      <LandingFooter />
      <WhatsAppFab hidden={menuOpen} />
    </div>
  )
}
