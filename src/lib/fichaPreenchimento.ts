// "Esse bloco tem alguma informação?" — usado pelos bullets da navegação lateral da avaliação.
// Sem imports com alias: roda em node --test.

/** Chaves que vêm com valor padrão e não significam que o profissional preencheu algo. */
const IGNORAR = new Set(['figura', 'grupo', 'espessura'])

/** true quando há texto, número, true, ou lista/objeto com algo preenchido dentro. */
export function temConteudo(value: unknown): boolean {
  if (value === null || value === undefined || value === false) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'number') return Number.isFinite(value)
  if (value === true) return true
  if (Array.isArray(value)) return value.some((item) => temConteudo(item))
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).some(
      ([key, item]) => !IGNORAR.has(key) && temConteudo(item),
    )
  }
  return false
}

/** Lê ficha[path[0]][path[1]]… e diz se tem conteúdo. */
export function blocoPreenchido(ficha: unknown, path: readonly string[]): boolean {
  let atual: unknown = ficha
  for (const parte of path) {
    if (!atual || typeof atual !== 'object') return false
    atual = (atual as Record<string, unknown>)[parte]
  }
  return temConteudo(atual)
}
