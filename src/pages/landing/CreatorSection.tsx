import { UserRound } from 'lucide-react'
import { Reveal, SectionHeading, WaveDivider } from './LandingUi'
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
      className="lp-section relative overflow-hidden bg-sage-soft"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 sm:px-6 md:grid-cols-12 md:py-16 lg:px-8">
        <Reveal variant="scale" className="relative flex justify-center md:col-span-5">
          <div
            aria-hidden="true"
            className="lp-blob-shape absolute h-80 w-[280px] translate-x-4 translate-y-4 border-2 border-sage/40"
          />
          <div className="lp-blob-shape relative flex h-80 w-[280px] items-center justify-center overflow-hidden bg-[linear-gradient(160deg,#eaf2fd,#ffffff)] shadow-[0_24px_60px_rgba(11,29,54,0.12)]">
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

        <Reveal delay={120} variant="right" className="flex flex-col gap-6 md:col-span-7">
          <SectionHeading
            id="lp-criadora-title"
            align="left"
            eyebrow="Quem criou"
            title="Feito por quem vive a fisioterapia"
          />
          <p className="max-w-prose text-base leading-7 text-muted">{CREATOR_BIO}</p>
          <p className="lp-display text-2xl font-medium italic leading-[1.25] text-forest md:text-[28px]">
            {CREATOR_SIGNATURE}
          </p>
        </Reveal>
      </div>
      <WaveDivider fill="fill-sky-soft" />
    </section>
  )
}
