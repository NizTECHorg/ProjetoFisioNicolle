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
