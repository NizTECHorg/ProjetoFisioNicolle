/**
 * Bloco B da avaliação: catálogo fechado e a frase valor+unidade.
 * Não interpreta "10 min", "2km" nem "12x". A unidade só entra se for uma das três chaves.
 */

export const ATIVIDADES = [
  { key: 'caminhar', label: 'Caminhar' },
  { key: 'correr', label: 'Correr' },
  { key: 'escadas', label: 'Escadas' },
  { key: 'agachar', label: 'Agachar' },
  { key: 'sentar', label: 'Sentar' },
  { key: 'levantar', label: 'Levantar' },
  { key: 'dormir', label: 'Dormir' },
  { key: 'dirigir', label: 'Dirigir' },
  { key: 'trabalhar', label: 'Trabalhar' },
  { key: 'estudar', label: 'Estudar' },
  { key: 'cuidarCasa', label: 'Cuidar da casa' },
  { key: 'vestirSe', label: 'Vestir-se' },
  { key: 'esporte', label: 'Esporte' },
  { key: 'lazer', label: 'Lazer' },
  { key: 'autocuidado', label: 'Autocuidado' },
  { key: 'outra', label: 'Outra' },
] as const

export type AtividadeKey = (typeof ATIVIDADES)[number]['key']

export const UNIDADES = ['minutos', 'km', 'repeticoes'] as const

export type Unidade = (typeof UNIDADES)[number]

export const UNIDADE_ROTULO: Record<Unidade, string> = {
  minutos: 'minutos',
  km: 'km',
  repeticoes: 'repetições',
}

export type LadoMedida = {
  valor?: string
  unidade?: string
}

function isUnidade(value: string | undefined): value is Unidade {
  return value === 'minutos' || value === 'km' || value === 'repeticoes'
}

function textoMedida(valor: string | undefined): string {
  return typeof valor === 'string' ? valor.trim() : ''
}

/** `10 minutos`, `3 km`, `12 repetições`. Só valor, só rótulo, ou vazio. */
export function formatMedida(valor?: string, unidade?: string): string {
  const texto = textoMedida(valor)
  const rotulo = isUnidade(unidade) ? UNIDADE_ROTULO[unidade] : ''
  if (texto && rotulo) return `${texto} ${rotulo}`
  if (texto) return texto
  if (rotulo) return rotulo
  return ''
}

/** `agora 10 minutos; antes 40 minutos`, um lado só, ou string vazia. */
export function formatMiolo(atual?: LadoMedida, antes?: LadoMedida): string {
  const agora = formatMedida(atual?.valor, atual?.unidade)
  const anterior = formatMedida(antes?.valor, antes?.unidade)
  if (agora && anterior) return `agora ${agora}; antes ${anterior}`
  if (agora) return `agora ${agora}`
  if (anterior) return `antes ${anterior}`
  return ''
}

/** `{rótulo}: {miolo}` quando há medida; sem medida, só o rótulo. */
export function formatLinha(rotulo: string, atual?: LadoMedida, antes?: LadoMedida): string {
  const miolo = formatMiolo(atual, antes)
  if (!miolo) return rotulo
  return `${rotulo}: ${miolo}`
}

const VALOR_MAX = 200
const OUTRA_MAX = 400
const LEGADO_MAX = 1200

export type MedidaNormalizada = {
  valor?: string
  unidade?: Unidade
}

export type CapacidadeNormalizada = {
  atual?: MedidaNormalizada
  antes?: MedidaNormalizada
}

export type AtividadesAfetadasNormalizadas = Partial<Record<AtividadeKey, boolean>> & {
  capacidades: Partial<Record<AtividadeKey, CapacidadeNormalizada>>
  outraDetalhe?: string
  textoLegado?: string
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function fold(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

function coerceBool(value: unknown): boolean | undefined {
  if (value === '' || value === null || value === undefined) return undefined
  if (value === true || value === 'true' || value === 'on' || value === 1 || value === '1') return true
  if (value === false || value === 'false' || value === 0 || value === '0') return false
  return undefined
}

function trimString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function clampTrimmed(value: string | undefined, max: number): string | undefined {
  if (!value) return undefined
  return value.slice(0, max)
}

function readMedida(value: unknown): MedidaNormalizada | undefined {
  if (!isJsonObject(value)) return undefined
  const valor = clampTrimmed(trimString(value.valor), VALOR_MAX)
  const rawUnidade = value.unidade
  const unidade = typeof rawUnidade === 'string' && isUnidade(rawUnidade) ? rawUnidade : undefined
  if (!valor && !unidade) return undefined
  const medida: MedidaNormalizada = {}
  if (valor) medida.valor = valor
  if (unidade) medida.unidade = unidade
  return medida
}

function readCapacidade(value: unknown): CapacidadeNormalizada | undefined {
  if (!isJsonObject(value)) return undefined
  const atual = readMedida(value.atual)
  const antes = readMedida(value.antes)
  if (!atual && !antes) return undefined
  const capacidade: CapacidadeNormalizada = {}
  if (atual) capacidade.atual = atual
  if (antes) capacidade.antes = antes
  return capacidade
}

function copyFlags(input: Record<string, unknown>): Partial<Record<AtividadeKey, boolean>> {
  const flags: Partial<Record<AtividadeKey, boolean>> = {}
  for (const item of ATIVIDADES) {
    const coerced = coerceBool(input[item.key])
    if (coerced !== undefined) flags[item.key] = coerced
  }
  return flags
}

function matchAtividade(atividade: string): AtividadeKey | undefined {
  const folded = fold(atividade)
  return ATIVIDADES.find((item) => fold(item.label) === folded)?.key
}

function sanitizeCapacidades(
  raw: Record<string, unknown>,
  flags: Partial<Record<AtividadeKey, boolean>>,
): Partial<Record<AtividadeKey, CapacidadeNormalizada>> {
  const capacidades: Partial<Record<AtividadeKey, CapacidadeNormalizada>> = {}
  for (const item of ATIVIDADES) {
    if (flags[item.key] !== true) continue
    const capacidade = readCapacidade(raw[item.key])
    if (capacidade) capacidades[item.key] = capacidade
  }
  return capacidades
}

function buildResult(
  flags: Partial<Record<AtividadeKey, boolean>>,
  capacidades: Partial<Record<AtividadeKey, CapacidadeNormalizada>>,
  outraDetalhe: string | undefined,
  textoLegado: string | undefined,
): AtividadesAfetadasNormalizadas {
  const result: AtividadesAfetadasNormalizadas = { ...flags, capacidades }
  if (outraDetalhe) result.outraDetalhe = outraDetalhe
  if (textoLegado) result.textoLegado = textoLegado
  return result
}

function migrateLegacy(
  input: Record<string, unknown>,
  flags: Partial<Record<AtividadeKey, boolean>>,
  outraDetalhe: string | undefined,
): AtividadesAfetadasNormalizadas {
  const capacidadeAtual = trimString(input.capacidadeAtual)
  const consigoPor = trimString(input.consigoPor)
  const atividade = trimString(input.atividade)
  const antes = trimString(input.antesConseguiaPor)

  let atualValor: string | undefined
  let atualConflito = false
  if (capacidadeAtual && consigoPor) {
    if (capacidadeAtual === consigoPor) atualValor = capacidadeAtual
    else atualConflito = true
  } else {
    atualValor = capacidadeAtual ?? consigoPor
  }

  const matched = atividade ? matchAtividade(atividade) : undefined
  let target: AtividadeKey | undefined
  if (matched) {
    target = matched
    flags[matched] = true
  } else {
    const marked = ATIVIDADES.filter((item) => flags[item.key] === true)
    if (marked.length === 1) target = marked[0]?.key
  }

  const capacidades: Partial<Record<AtividadeKey, CapacidadeNormalizada>> = {}
  if (target) {
    const atual = clampTrimmed(atualValor, VALOR_MAX)
    const antesValor = clampTrimmed(antes, VALOR_MAX)
    const capacidade: CapacidadeNormalizada = {}
    if (atual) capacidade.atual = { valor: atual }
    if (antesValor) capacidade.antes = { valor: antesValor }
    if (capacidade.atual || capacidade.antes) capacidades[target] = capacidade
  }

  const parts: string[] = []
  const atualAssigned = Boolean(target && atualValor)
  if (!atualAssigned) {
    if (atualConflito || (capacidadeAtual && consigoPor)) {
      if (capacidadeAtual) parts.push(`Capacidade atual: ${capacidadeAtual}`)
      if (consigoPor) parts.push(`Consigo por: ${consigoPor}`)
    } else if (capacidadeAtual) {
      parts.push(`Capacidade atual: ${capacidadeAtual}`)
    } else if (consigoPor) {
      parts.push(`Consigo por: ${consigoPor}`)
    }
  }
  if (atividade && !matched) parts.push(`Atividade: ${atividade}`)
  if (antes && !(target && antes)) parts.push(`Antes conseguia por: ${antes}`)

  const textoLegado = parts.length > 0 ? parts.join(' · ').slice(0, LEGADO_MAX) : undefined
  return buildResult(flags, capacidades, outraDetalhe, textoLegado)
}

/**
 * Migra o bloco B sem lançar. Não inventa unidade e não copia um número
 * compartilhado para cada atividade marcada.
 */
export function normalizeAtividadesAfetadas(value: unknown): AtividadesAfetadasNormalizadas {
  if (!isJsonObject(value)) return { capacidades: {} }

  const flags = copyFlags(value)
  const outraDetalhe = clampTrimmed(trimString(value.outraDetalhe), OUTRA_MAX)

  if (isJsonObject(value.capacidades)) {
    const textoLegado = clampTrimmed(trimString(value.textoLegado), LEGADO_MAX)
    return buildResult(flags, sanitizeCapacidades(value.capacidades, flags), outraDetalhe, textoLegado)
  }

  return migrateLegacy(value, flags, outraDetalhe)
}
