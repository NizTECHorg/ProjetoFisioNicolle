import { UserRound } from 'lucide-react'
import { Blob, Reveal, SectionHeading, WaveDivider } from './LandingUi'
import {
  CREATOR_BIO,
  CREATOR_PHOTO_ALT,
  CREATOR_PHOTO_SRC,
  CREATOR_SIGNATURE,
} from './landing.config'

export function CreatorSection() {
  return (
    <section
      id="criadora"
      aria-labelledby="lp-criadora-title"
      className="lp-section relative overflow-hidden bg-canvas"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 sm:px-6 md:grid-cols-12 md:py-16 lg:px-8">
        <Reveal className="relative flex justify-center md:col-span-5">
          <Blob className="h-64 w-64 bg-sage/20" />
          <div className="lp-blob-shape relative flex h-80 w-[280px] items-center justify-center overflow-hidden bg-accent-soft">
            {CREATOR_PHOTO_SRC ? (
              <img
                src={CREATOR_PHOTO_SRC}
                alt={CREATOR_PHOTO_ALT}
                loading="lazy"
                decoding="async"
                width={280}
                height={320}
                className="h-full w-full object-cover"
              />
            ) : (
              <>
                <UserRound size={64} className="text-[#1e3a8a]" aria-hidden="true" />
                <span className="sr-only">Foto da Nicolle (em breve)</span>
              </>
            )}
          </div>
        </Reveal>

        <Reveal delay={80} className="flex flex-col gap-6 md:col-span-7">
          <SectionHeading
            id="lp-criadora-title"
            align="left"
            eyebrow="Quem criou"
            title="Feito por quem vive a fisioterapia"
          />
          <p className="max-w-prose text-base leading-7 text-muted">{CREATOR_BIO}</p>
          <p className="font-display text-[28px] font-semibold italic leading-[1.2] text-ink">
            {CREATOR_SIGNATURE}
          </p>
        </Reveal>
      </div>
      <WaveDivider fill="fill-surface" />
    </section>
  )
}
