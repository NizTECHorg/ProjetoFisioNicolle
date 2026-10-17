export type TextMeasurer = { widthOfTextAtSize(text: string, size: number): number }

/**
 * WinAnsi (Helvetica) cobre áéíóúãõç. Substitui caracteres fora de WinAnsi
 * para evitar throw do pdf-lib.
 */
export function toWinAnsiSafe(text: string): string {
  return text
    .normalize('NFC')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/–|—/g, '-')
    .replace(/…/g, '...')
    .replace(/[^\t\n\r\x20-\x7E\xA0-\xFF]/g, '?')
}

export function wrapLines(font: TextMeasurer, text: string, size: number, maxWidth: number): string[] {
  const safe = toWinAnsiSafe(text.trim() || '—')
  const paragraphs = safe.split(/\r?\n/)
  const lines: string[] = []

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push('')
      continue
    }
    const words = paragraph.split(/\s+/)
    let current = ''
    for (const word of words) {
      const next = current ? `${current} ${word}` : word
      if (font.widthOfTextAtSize(next, size) <= maxWidth) {
        current = next
      } else {
        if (current) lines.push(current)
        // Long token without spaces — hard-break by width
        if (font.widthOfTextAtSize(word, size) > maxWidth) {
          let chunk = ''
          for (const ch of word) {
            const tryChunk = chunk + ch
            if (font.widthOfTextAtSize(tryChunk, size) <= maxWidth) {
              chunk = tryChunk
            } else {
              if (chunk) lines.push(chunk)
              chunk = ch
            }
          }
          current = chunk
        } else {
          current = word
        }
      }
    }
    if (current) lines.push(current)
  }

  return lines.length > 0 ? lines : ['—']
}
