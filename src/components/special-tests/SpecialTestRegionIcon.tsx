import type { ReactNode } from 'react'
import { BicepsFlexed, BoneFracture, Footprints, Hand, type LucideIcon } from 'lucide-react'
import type { SpecialTestRegionId } from '@/lib/testesEspeciais'

// O lucide não tem coluna, ombro, joelho nem quadril: esses são desenhados aqui no mesmo
// padrão dele (grade 24, traço 2, pontas arredondadas) para combinar com os demais.
const CUSTOM: Partial<Record<SpecialTestRegionId, ReactNode>> = {
  coluna: (
    <>
      <rect x="9" y="2" width="6" height="2.5" rx="1" />
      <rect x="8.5" y="7" width="7" height="2.5" rx="1" />
      <rect x="8" y="12" width="8" height="2.5" rx="1" />
      <path d="M9 17h6l-2 4.5h-2z" />
    </>
  ),
  ombro: (
    <>
      <path d="M3.5 4.5c3.5-1.8 8.5-1.6 12 .8" />
      <path d="M6 7.5c-1.6 1.8-1.6 4.7 0 6.5" />
      <circle cx="11" cy="10.5" r="3.2" />
      <path d="M9.4 13.4 10.6 22" />
      <path d="M13.4 12.8l2.1 9.2" />
    </>
  ),
  joelho: (
    <>
      <path d="M9.5 2v5.5c0 1-1.5 1.6-1.5 2.8A1.8 1.8 0 0 0 9.8 12h4.4a1.8 1.8 0 0 0 1.8-1.7c0-1.2-1.5-1.8-1.5-2.8V2" />
      <path d="M8 15a1.5 1.5 0 0 0 1.5 1.5h5A1.5 1.5 0 0 0 16 15" />
      <path d="M10 16.5V22" />
      <path d="M14 16.5V22" />
    </>
  ),
  quadril: (
    <>
      <path d="M10.5 9.5C9 5.5 6.5 3.6 3.6 4.6c-.9 3.8.6 8 4.4 9.6" />
      <path d="M13.5 9.5c1.5-4 4-5.9 6.9-4.9.9 3.8-.6 8-4.4 9.6" />
      <path d="M8 14.2a4 4 0 0 0 8 0" />
      <path d="M10.5 9.5h3" />
      <path d="M12 9.5v4" />
      <path d="M8.6 17.2 7.5 22" />
      <path d="M15.4 17.2l1.1 4.8" />
    </>
  ),
}

const LUCIDE: Partial<Record<SpecialTestRegionId, LucideIcon>> = {
  cotovelo: BicepsFlexed,
  tornozelo: Footprints,
  mao: Hand,
  fraturas: BoneFracture,
}

/** Ícone da área do corpo de cada região dos testes especiais. */
export function SpecialTestRegionIcon({ regionId, size = 14 }: { regionId: SpecialTestRegionId; size?: number }) {
  const Lucide = LUCIDE[regionId]
  if (Lucide) return <Lucide size={size} strokeWidth={2} aria-hidden />
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {CUSTOM[regionId]}
    </svg>
  )
}
