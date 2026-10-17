import type { TermKey } from '@/lib/consentTerms'

/** Âncoras das seções da página Termos, usadas pela navegação lateral. */
export const TERMS_SECTION_IDS = {
  signer: 'termos-quem-assina',
  history: 'termos-salvos',
} as const

export function termDomId(key: TermKey): string {
  return `termo-${key}`
}
