// Identidade dos PDFs (Minha empresa / Meu escritório): cor principal e a paleta derivada dela.
// Sem imports com alias: roda direto em node --test.

export const PDF_BRAND_DEFAULT_COLOR = '#2f7dff'
export const PDF_BRAND_NAME_MAX = 80
export const PDF_BRAND_LOGO_MAX_BYTES = 1024 * 1024
export const PDF_BRAND_LOGO_TYPES = ['image/png', 'image/jpeg'] as const

/** Sugestões rápidas de cor no formulário. */
export const PDF_BRAND_PRESETS = ['#2f7dff', '#1e3a8a', '#0f766e', '#16a34a', '#9333ea', '#db2777', '#ea580c', '#475569'] as const

export type Rgb01 = readonly [number, number, number]

export function normalizarCor(valor: string | null | undefined): string | null {
  const limpo = (valor ?? '').trim().toLowerCase()
  const curto = /^#?([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(limpo)
  if (curto) return `#${curto[1]}${curto[1]}${curto[2]}${curto[2]}${curto[3]}${curto[3]}`
  const longo = /^#?([0-9a-f]{6})$/.exec(limpo)
  return longo ? `#${longo[1]}` : null
}

export function hexParaRgb01(hex: string): Rgb01 {
  const cor = normalizarCor(hex) ?? PDF_BRAND_DEFAULT_COLOR
  const n = Number.parseInt(cor.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

function misturar(cor: Rgb01, com: Rgb01, peso: number): Rgb01 {
  return [
    cor[0] + (com[0] - cor[0]) * peso,
    cor[1] + (com[1] - cor[1]) * peso,
    cor[2] + (com[2] - cor[2]) * peso,
  ]
}

/**
 * Paleta do PDF a partir de uma cor: destaque (a própria cor), fundo claro (88% branco)
 * e dois tons escuros para títulos (navy) e textos fortes (forest).
 */
export function paletaDaCor(hex: string) {
  const base = hexParaRgb01(hex)
  return {
    accent: base,
    accentSoft: misturar(base, [1, 1, 1], 0.88),
    navy: misturar(base, [0, 0, 0], 0.45),
    forest: misturar(base, [0, 0, 0], 0.7),
  }
}

/** Ajusta a logo a uma caixa sem distorcer: respeita a altura e não passa da largura máxima. */
export function tamanhoLogo(largura: number, altura: number, alturaMax: number, larguraMax: number) {
  if (largura <= 0 || altura <= 0) return { width: 0, height: 0 }
  const escala = Math.min(alturaMax / altura, larguraMax / largura)
  return { width: largura * escala, height: altura * escala }
}

/** Altura da logo no PDF, em pontos (1 pt = 1/72 pol.; a página A4 tem 595 × 842 pt). */
export const PDF_LOGO_SIZE_MIN = 24
export const PDF_LOGO_SIZE_MAX = 96
export const PDF_LOGO_SIZE_DEFAULT = 40

export type PdfLogoAlign = 'left' | 'center' | 'right'
export const PDF_LOGO_ALIGNS: readonly PdfLogoAlign[] = ['left', 'center', 'right']

export function tamanhoLogoValido(valor: unknown): number {
  const n = typeof valor === 'number' ? valor : Number(valor)
  if (!Number.isFinite(n)) return PDF_LOGO_SIZE_DEFAULT
  return Math.min(PDF_LOGO_SIZE_MAX, Math.max(PDF_LOGO_SIZE_MIN, Math.round(n)))
}

export function alinhamentoLogoValido(valor: unknown): PdfLogoAlign {
  return valor === 'center' || valor === 'right' ? valor : 'left'
}

/** Posição horizontal (x) de um item de largura `largura` dentro da área útil da página. */
export function xAlinhado(align: PdfLogoAlign, largura: number, margem: number, larguraPagina: number): number {
  if (align === 'center') return (larguraPagina - largura) / 2
  if (align === 'right') return larguraPagina - margem - largura
  return margem
}
