// Lógica pura do rodapé da avaliação no celular/tablet (Phase 40): posição na ficha,
// anúncio de página para leitor de tela e bloqueio do envio implícito por Enter.
// Sem imports com alias para rodar em node --test.

export const EVALUATION_SAVED_MESSAGE = 'Avaliação salva.'
export const EVALUATION_SAVE_ERROR =
  'Não foi possível salvar a avaliação. Confira a conexão e tente de novo.'

export function fichaPagerState<T extends string>(ids: readonly T[], current: T) {
  const found = ids.indexOf(current)
  const index = found < 0 ? 0 : found
  const total = ids.length
  const n = index + 1
  return {
    index,
    n,
    total,
    percent: Math.round((n / total) * 10000) / 100,
    next: (ids[index + 1] ?? null) as T | null,
    prev: (index > 0 ? (ids[index - 1] ?? null) : null) as T | null,
    isFirst: index === 0,
    isLast: index === total - 1,
  }
}

export function fichaPageName(label: string): string {
  return label.replace(/^\d+\s*·\s*/, '')
}

export function fichaPageAnnouncement(n: number, total: number, label: string): string {
  return `Página ${n} de ${total}: ${fichaPageName(label)}`
}

// Enter num campo dispararia o submit implícito (Concluir/lateral) e fecharia o editor;
// só clique explícito em Concluir/Salvar grava.
export function shouldBlockImplicitSubmit(key: string, tagName: string, inputType?: string): boolean {
  if (key !== 'Enter') return false
  const tag = tagName.toUpperCase()
  if (tag === 'SELECT') return true
  if (tag !== 'INPUT') return false
  return !['submit', 'button', 'reset', 'image'].includes((inputType ?? '').toLowerCase())
}
