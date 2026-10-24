// Testes funcionais / desempenho (bloco E · 3 da avaliação). Catálogo fechado por categoria,
// leitura tolerante (dado estragado é descartado) e a frase de leitura para detalhe e PDF.
// Sem imports com alias: roda direto em node --test.

export type UnidadeFuncional = 'rep' | 's' | 'cm' | 'm' | 'pontos'
export const UNIDADES_FUNCIONAIS: readonly UnidadeFuncional[] = ['rep', 's', 'cm', 'm', 'pontos']

export type LadoFuncional = 'D' | 'E' | 'bilateral'
export const LADOS_FUNCIONAIS: ReadonlyArray<{ value: LadoFuncional; label: string }> = [
  { value: 'D', label: 'D' },
  { value: 'E', label: 'E' },
  { value: 'bilateral', label: 'Bilateral' },
]

export type QualidadeFuncional = 'adequada' | 'alterada'
export const QUALIDADES_FUNCIONAIS: ReadonlyArray<{ value: QualidadeFuncional; label: string }> = [
  { value: 'adequada', label: 'Adequada' },
  { value: 'alterada', label: 'Alterada' },
]

export const ACHADOS_FUNCIONAIS = [
  { key: 'valgo', label: 'Valgo' },
  { key: 'quedaPelvica', label: 'Queda pélvica' },
  { key: 'perdaEquilibrio', label: 'Perda de equilíbrio' },
  { key: 'assimetria', label: 'Assimetria' },
  { key: 'amplitudeReduzida', label: 'Amplitude reduzida' },
  { key: 'compensacao', label: 'Compensação' },
  { key: 'outro', label: 'Outro' },
] as const
export type AchadoFuncional = (typeof ACHADOS_FUNCIONAIS)[number]['key']

export type TesteFuncionalCatalogo = {
  key: string
  label: string
  /** Teste feito em cada lado e comparável: mostra Direito / Esquerdo e calcula a assimetria. */
  comparavel?: boolean
  /** Unidade sugerida ao marcar (pode trocar). */
  unidade?: UnidadeFuncional
}

export type CategoriaFuncional = {
  key: string
  label: string
  testes: readonly TesteFuncionalCatalogo[]
}

const t = (
  key: string,
  label: string,
  unidade?: UnidadeFuncional,
  comparavel?: boolean,
): TesteFuncionalCatalogo => ({ key, label, ...(unidade ? { unidade } : {}), ...(comparavel ? { comparavel } : {}) })

const OUTRO = t('outro', 'Outro')

export const CATALOGO_FUNCIONAIS: readonly CategoriaFuncional[] = [
  {
    key: 'mmii',
    label: 'MMII',
    testes: [
      t('agachamentoBilateral', 'Agachamento bilateral', 'rep'),
      t('agachamentoUnipodal', 'Agachamento unipodal (single-leg squat)', 'rep', true),
      t('stepUp', 'Step-up', 'rep', true),
      t('stepDown', 'Step-down', 'rep', true),
      t('lateralStepDown', 'Lateral step-down', 'pontos', true),
      t('lungeAnterior', 'Lunge anterior', 'rep', true),
      t('lungeLateral', 'Lunge lateral', 'rep', true),
      t('sitToStand', 'Sit-to-stand', 'rep'),
      t('sitToStand5x', '5x sit-to-stand', 's'),
      t('sitToStand30s', '30s sit-to-stand', 'rep'),
      t('heelRaiseBilateral', 'Heel raise bilateral', 'rep'),
      t('heelRaiseUnipodal', 'Heel raise unipodal', 'rep', true),
      OUTRO,
    ],
  },
  {
    key: 'mmss',
    label: 'MMSS',
    testes: [
      t('pushUp', 'Push-up', 'rep'),
      t('pushUpModificado', 'Push-up modificado', 'rep'),
      t('pushUpPlus', 'Push-up plus', 'rep'),
      t('sustentacaoMmss', 'Sustentação de peso em MMSS', 's'),
      t('ckcuest', 'CKCUEST', 'rep'),
      t('upperQuarterYBalance', 'Upper Quarter Y-Balance', 'cm', true),
      t('alcanceAcimaCabeca', 'Alcance acima da cabeça', 'cm', true),
      t('arremesso', 'Arremesso', 'm', true),
      t('carry', 'Carry', 'm'),
      OUTRO,
    ],
  },
  {
    key: 'equilibrio',
    label: 'Equilíbrio',
    testes: [
      t('apoioUnipodal', 'Apoio unipodal', 's', true),
      t('apoioUnipodalOlhosFechados', 'Apoio unipodal olhos fechados', 's', true),
      t('tandem', 'Tandem', 's'),
      t('romberg', 'Romberg', 's'),
      t('yBalance', 'Y-Balance', 'cm', true),
      t('starExcursion', 'Star Excursion', 'cm', true),
      t('functionalReach', 'Functional Reach', 'cm'),
      OUTRO,
    ],
  },
  {
    key: 'marcha',
    label: 'Marcha',
    testes: [
      t('velocidadeMarcha', 'Velocidade de marcha', 's'),
      t('caminhada10m', '10-Meter Walk Test', 's'),
      t('tug', 'Timed Up and Go', 's'),
      t('caminhada6min', '6-Minute Walk Test', 'm'),
      t('caminhada2min', '2-Minute Walk Test', 'm'),
      t('subirEscadas', 'Subir escadas', 's'),
      t('descerEscadas', 'Descer escadas', 's'),
      OUTRO,
    ],
  },
  {
    key: 'saltos',
    label: 'Saltos',
    testes: [
      t('saltoVertical', 'Salto vertical', 'cm'),
      t('saltoHorizontal', 'Salto horizontal', 'cm'),
      t('singleLegHop', 'Single-leg hop', 'cm', true),
      t('tripleHop', 'Triple hop', 'cm', true),
      t('crossoverHop', 'Crossover hop', 'cm', true),
      t('timedHop6m', '6m timed hop', 's', true),
      t('saltoLateral', 'Salto lateral', 'rep', true),
      OUTRO,
    ],
  },
  {
    key: 'corrida',
    label: 'Corrida',
    testes: [
      t('corridaLinhaReta', 'Corrida em linha reta', 's'),
      t('aceleracao', 'Aceleração', 's'),
      t('desaceleracao', 'Desaceleração', 's'),
      t('sprint', 'Sprint', 's'),
      t('mudancaDirecao', 'Mudança de direção', 's'),
      t('shuttleRun', 'Shuttle run', 's'),
      t('tTest', 'T-test', 's'),
      OUTRO,
    ],
  },
  {
    key: 'tronco',
    label: 'Tronco',
    testes: [
      t('pranchaAnterior', 'Prancha anterior', 's'),
      t('pranchaLateral', 'Prancha lateral', 's', true),
      t('bieringSorensen', 'Biering-Sørensen', 's'),
      t('flexorEndurance', 'Flexor endurance', 's'),
      t('birdDog', 'Bird-dog', 'rep', true),
      t('deadBug', 'Dead bug', 'rep'),
      t('levantarChaoTronco', 'Levantar do chão', 's'),
      t('carregarPeso', 'Carregar peso', 'm'),
      OUTRO,
    ],
  },
  {
    key: 'capacidade',
    label: 'Capacidade geral',
    testes: [
      t('sentarLevantar', 'Sentar e levantar', 'rep'),
      t('agachar', 'Agachar', 'rep'),
      t('ajoelhar', 'Ajoelhar', 'rep'),
      t('caminhar', 'Caminhar', 'm'),
      t('subirDescerEscadas', 'Subir/descer escadas', 's'),
      t('levantarChao', 'Levantar do chão', 's'),
      t('empurrar', 'Empurrar', 'rep'),
      t('puxar', 'Puxar', 'rep'),
      t('carregar', 'Carregar', 'm'),
      OUTRO,
    ],
  },
  {
    key: 'esporte',
    label: 'Esporte',
    // Tarefas comuns do gesto esportivo; a busca filtra e "Outro" cobre o que faltar.
    testes: [
      t('esporteCorte', 'Corte / mudança de direção'),
      t('esporteSaltoAterrissagem', 'Salto e aterrissagem'),
      t('esporteArremesso', 'Arremesso'),
      t('esporteSaque', 'Saque / gesto acima da cabeça'),
      t('esporteChute', 'Chute'),
      t('esporteSprint', 'Arrancada / sprint'),
      t('esporteFrenagem', 'Frenagem'),
      t('esporteGiro', 'Giro / pivô'),
      t('esporteRotacao', 'Rotação de tronco (golpe, raquete)'),
      t('esporteRemada', 'Remada / braçada'),
      t('esporteAgarre', 'Agarre / pegada'),
      t('esporteQueda', 'Queda / rolamento'),
      OUTRO,
    ],
  },
  { key: 'outro', label: 'Outro', testes: [OUTRO] },
]

export type TesteFuncionalMarcado = {
  categoria: string
  teste: string
  outroTexto?: string
  lado?: LadoFuncional
  resultado?: string
  unidade?: UnidadeFuncional
  direito?: string
  esquerdo?: string
  dor?: number
  qualidade?: QualidadeFuncional
  achados?: AchadoFuncional[]
  achadoOutro?: string
  observacao?: string
}

export const FUNCIONAIS_MAX = 60
const TEXTO_CURTO = 200
const OBSERVACAO_MAX = 1000

export function categoriaFuncional(key: string | undefined): CategoriaFuncional | undefined {
  return CATALOGO_FUNCIONAIS.find((item) => item.key === key)
}

export function testeFuncional(categoria: string | undefined, teste: string | undefined) {
  return categoriaFuncional(categoria)?.testes.find((item) => item.key === teste)
}

function texto(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined
  const limpo = value.trim().slice(0, max)
  return limpo || undefined
}

/** Lê um item salvo; descarta o que não está no catálogo e campos inválidos. */
export function lerTesteFuncional(value: unknown): TesteFuncionalMarcado | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const v = value as Record<string, unknown>
  const categoria = typeof v.categoria === 'string' ? v.categoria : ''
  const teste = typeof v.teste === 'string' ? v.teste : ''
  if (!testeFuncional(categoria, teste)) return undefined
  const item: TesteFuncionalMarcado = { categoria, teste }
  const outroTexto = teste === 'outro' ? texto(v.outroTexto, TEXTO_CURTO) : undefined
  if (outroTexto) item.outroTexto = outroTexto
  if (v.lado === 'D' || v.lado === 'E' || v.lado === 'bilateral') item.lado = v.lado
  const resultado = texto(v.resultado, TEXTO_CURTO)
  if (resultado) item.resultado = resultado
  if (UNIDADES_FUNCIONAIS.includes(v.unidade as UnidadeFuncional)) item.unidade = v.unidade as UnidadeFuncional
  const direito = texto(v.direito, 40)
  const esquerdo = texto(v.esquerdo, 40)
  if (direito) item.direito = direito
  if (esquerdo) item.esquerdo = esquerdo
  const dor = typeof v.dor === 'string' && v.dor.trim() !== '' ? Number(v.dor) : v.dor
  if (typeof dor === 'number' && Number.isInteger(dor) && dor >= 0 && dor <= 10) item.dor = dor
  if (v.qualidade === 'adequada' || v.qualidade === 'alterada') item.qualidade = v.qualidade
  if (Array.isArray(v.achados)) {
    const validos = new Set<string>(ACHADOS_FUNCIONAIS.map((a) => a.key))
    const achados = [...new Set(v.achados.filter((a): a is AchadoFuncional => typeof a === 'string' && validos.has(a)))]
    if (achados.length > 0) item.achados = achados
  }
  const achadoOutro = item.achados?.includes('outro') ? texto(v.achadoOutro, TEXTO_CURTO) : undefined
  if (achadoOutro) item.achadoOutro = achadoOutro
  const observacao = texto(v.observacao, OBSERVACAO_MAX)
  if (observacao) item.observacao = observacao
  return item
}

export function lerTestesFuncionais(value: unknown): TesteFuncionalMarcado[] {
  if (!Array.isArray(value)) return []
  const out: TesteFuncionalMarcado[] = []
  for (const bruto of value) {
    const item = lerTesteFuncional(bruto)
    if (item) out.push(item)
    if (out.length >= FUNCIONAIS_MAX) break
  }
  return out
}

function numero(valor: string | undefined): number | undefined {
  if (!valor) return undefined
  const n = Number(valor.replace(',', '.'))
  return Number.isFinite(n) ? n : undefined
}

/**
 * Assimetria entre os lados, em % do maior valor (independe de o teste ser "maior é melhor"
 * ou "menor é melhor"). `menor` diz qual lado teve o valor menor.
 */
export function assimetriaFuncional(
  direito: string | undefined,
  esquerdo: string | undefined,
): { percentual: number; menor: 'D' | 'E' | null } | null {
  const d = numero(direito)
  const e = numero(esquerdo)
  if (d === undefined || e === undefined) return null
  const maior = Math.max(Math.abs(d), Math.abs(e))
  if (maior === 0) return { percentual: 0, menor: null }
  const percentual = Math.round((Math.abs(d - e) / maior) * 1000) / 10
  return { percentual, menor: d === e ? null : d < e ? 'D' : 'E' }
}

export function rotuloTesteFuncional(item: Pick<TesteFuncionalMarcado, 'categoria' | 'teste' | 'outroTexto'>): string {
  const teste = testeFuncional(item.categoria, item.teste)
  if (item.teste === 'outro') return item.outroTexto?.trim() || 'Outro teste funcional'
  return teste?.label ?? item.teste
}

/** Uma linha por teste, para a visualização e o PDF. */
export function formatTesteFuncional(item: TesteFuncionalMarcado): string {
  const categoria = categoriaFuncional(item.categoria)?.label
  const unidade = item.unidade ? ` ${item.unidade}` : ''
  const partes: string[] = []
  const comparavel = testeFuncional(item.categoria, item.teste)?.comparavel
  if (comparavel && (item.direito || item.esquerdo)) {
    if (item.direito) partes.push(`D ${item.direito}${unidade}`)
    if (item.esquerdo) partes.push(`E ${item.esquerdo}${unidade}`)
    const assim = assimetriaFuncional(item.direito, item.esquerdo)
    if (assim) partes.push(`assimetria ${String(assim.percentual).replace('.', ',')}%`)
  } else {
    if (item.lado) partes.push(item.lado === 'bilateral' ? 'Bilateral' : item.lado)
    if (item.resultado) partes.push(`${item.resultado}${unidade}`)
  }
  if (item.dor !== undefined) partes.push(`dor ${item.dor}/10`)
  if (item.qualidade) partes.push(item.qualidade === 'adequada' ? 'qualidade adequada' : 'qualidade alterada')
  const achados = (item.achados ?? [])
    .map((key) =>
      key === 'outro'
        ? item.achadoOutro?.trim() || 'outro'
        : ACHADOS_FUNCIONAIS.find((a) => a.key === key)?.label.toLowerCase(),
    )
    .filter(Boolean)
  if (achados.length > 0) partes.push(achados.join(', '))
  const cabeca = `${rotuloTesteFuncional(item)}${categoria && item.categoria !== 'outro' ? ` (${categoria})` : ''}`
  const linha = partes.length > 0 ? `${cabeca}: ${partes.join(' · ')}` : cabeca
  return item.observacao ? `${linha}. ${item.observacao}` : linha
}
