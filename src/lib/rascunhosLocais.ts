// Rascunhos automáticos de avaliação, sessão/evolução e relatório: guardados neste aparelho enquanto a
// pessoa preenche, para nada se perder se ela sair sem salvar. Sem imports com alias: roda em node --test.

export type RascunhoTipo = 'avaliacao' | 'sessao' | 'relatorio'

/** id do registro em edição, ou NOVO para um registro que ainda não existe. */
export const RASCUNHO_NOVO = 'novo'
export const RASCUNHO_VALIDADE_MS = 14 * 24 * 60 * 60 * 1000
export const RASCUNHO_EVENTO = 'fluxo:rascunho'

const PREFIXO = 'fluxo.rascunho.'

export type RascunhoRef = { userId: string; patientId: string; tipo: RascunhoTipo; registroId: string }
export type Rascunho<T> = { valores: T; salvoEm: number }
export type RascunhoResumo = { registroId: string; salvoEm: number }

type Armazenamento = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>

function armazenamentoPadrao(): Armazenamento | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

export function chaveRascunho(ref: RascunhoRef): string {
  return `${PREFIXO}${ref.userId}.${ref.patientId}.${ref.tipo}.${ref.registroId}`
}

function avisarMudanca() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(RASCUNHO_EVENTO))
}

function chaves(storage: Armazenamento): string[] {
  const lista: string[] = []
  for (let i = 0; i < storage.length; i += 1) {
    const chave = storage.key(i)
    if (chave?.startsWith(PREFIXO)) lista.push(chave)
  }
  return lista
}

function ler<T>(storage: Armazenamento, chave: string, agora: number): Rascunho<T> | null {
  try {
    const bruto = storage.getItem(chave)
    if (!bruto) return null
    const dados = JSON.parse(bruto) as Partial<Rascunho<T>>
    if (typeof dados.salvoEm !== 'number' || dados.valores === undefined) return null
    if (agora - dados.salvoEm > RASCUNHO_VALIDADE_MS) {
      storage.removeItem(chave)
      return null
    }
    return { valores: dados.valores, salvoEm: dados.salvoEm }
  } catch {
    return null
  }
}

export function carregarRascunho<T>(
  ref: RascunhoRef,
  storage: Armazenamento | null = armazenamentoPadrao(),
  agora = Date.now(),
): Rascunho<T> | null {
  return storage ? ler<T>(storage, chaveRascunho(ref), agora) : null
}

/** Devolve false se não deu para guardar (sem espaço, armazenamento bloqueado). Nunca lança. */
export function salvarRascunho<T>(
  ref: RascunhoRef,
  valores: T,
  storage: Armazenamento | null = armazenamentoPadrao(),
  agora = Date.now(),
): boolean {
  if (!storage) return false
  try {
    storage.setItem(chaveRascunho(ref), JSON.stringify({ valores, salvoEm: agora }))
    avisarMudanca()
    return true
  } catch {
    return false
  }
}

export function apagarRascunho(ref: RascunhoRef, storage: Armazenamento | null = armazenamentoPadrao()): void {
  if (!storage) return
  try {
    storage.removeItem(chaveRascunho(ref))
    avisarMudanca()
  } catch {
    // Armazenamento bloqueado: não há o que apagar.
  }
}

/** Rascunhos de um paciente, do mais recente para o mais antigo. */
export function rascunhosDoPaciente(
  ref: Omit<RascunhoRef, 'registroId'>,
  storage: Armazenamento | null = armazenamentoPadrao(),
  agora = Date.now(),
): RascunhoResumo[] {
  if (!storage) return []
  const prefixo = chaveRascunho({ ...ref, registroId: '' })
  try {
    return chaves(storage)
      .filter((chave) => chave.startsWith(prefixo))
      .flatMap((chave) => {
        const dados = ler<unknown>(storage, chave, agora)
        return dados ? [{ registroId: chave.slice(prefixo.length), salvoEm: dados.salvoEm }] : []
      })
      .sort((a, b) => b.salvoEm - a.salvoEm)
  } catch {
    return []
  }
}

/** Ao sair da conta: nenhum dado clínico fica no aparelho. */
export function apagarTodosRascunhos(storage: Armazenamento | null = armazenamentoPadrao()): void {
  if (!storage) return
  try {
    for (const chave of chaves(storage)) storage.removeItem(chave)
    avisarMudanca()
  } catch {
    // Armazenamento bloqueado: não há o que apagar.
  }
}

export function rotuloRascunho(salvoEm: number): string {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(salvoEm))
}
