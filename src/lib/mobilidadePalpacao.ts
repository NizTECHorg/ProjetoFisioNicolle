/**
 * Bloco B e bloco E da avaliação: catálogos fechados e a frase de leitura.
 * Quem exibe chama o formatador. A frase não se monta no caller.
 */

export type ItemCatalogo = {
  key: string
  label: string
}

export type RegiaoMobilidade = {
  key: string
  label: string
  movimentos: ItemCatalogo[]
}

export type RegiaoPalpacao = {
  key: string
  label: string
  locais: ItemCatalogo[]
}

export type RegiaoTestes = {
  key: string
  label: string
  testes: ItemCatalogo[]
}

export type TipoAvaliacao = 'ativo' | 'passivo' | 'ambos'

export type ComparacaoMobilidade = 'bilateral' | 'unilateral'

export type LadoAchado = 'direito' | 'esquerdo' | 'bilateral' | 'central' | 'naoSeAplica'

export type AchadoPalpacao =
  | 'semAlteracao'
  | 'doloroso'
  | 'edema'
  | 'tensao'
  | 'crepitacao'
  | 'temperatura'
  | 'outro'

export type DorLado = {
  inicio?: string
  maxima?: number
  observacao?: string
}

export type MovimentoMedido = {
  movimento: string
  valorDireito?: string
  valorEsquerdo?: string
  dorDireito?: DorLado
  dorEsquerdo?: DorLado
  observacao?: string
}

export type AchadoRegistrado = {
  regiao: string
  local: string
  localOutro?: string
  lado?: LadoAchado
  achado?: AchadoPalpacao
  achadoOutro?: string
  dor?: number
  observacao?: string
}

export type TesteMarcado = {
  regiao: string
  teste: string
  resultado?: string
  outroTexto?: string
}

export type RegiaoMobilidadeLida = {
  regiao: string
  tipo?: TipoAvaliacao
  comparacao?: ComparacaoMobilidade
}

const CHIPS_SEM_GRAU = new Set(['Completo', 'Limitado', 'Não avaliado'])

const TIPO_ROTULO: Record<TipoAvaliacao, string> = {
  ativo: 'Ativo',
  passivo: 'Passivo',
  ambos: 'Ambos',
}

const COMPARACAO_ROTULO: Record<ComparacaoMobilidade, string> = {
  bilateral: 'Bilateral',
  unilateral: 'Unilateral',
}

const LADO_ROTULO: Record<LadoAchado, string> = {
  direito: 'Direito',
  esquerdo: 'Esquerdo',
  bilateral: 'Bilateral',
  central: 'Central',
  naoSeAplica: 'Não se aplica',
}

const ACHADO_ROTULO: Record<AchadoPalpacao, string> = {
  semAlteracao: 'Sem alteração',
  doloroso: 'Doloroso',
  edema: 'Edema',
  tensao: 'Tensão aumentada',
  crepitacao: 'Crepitação',
  temperatura: 'Alteração de temperatura',
  outro: 'Outro',
}

export function fold(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

function keyFromLabel(label: string): string {
  return fold(label).replace(/[^a-z0-9]/g, '')
}

function item(label: string): ItemCatalogo {
  return { key: keyFromLabel(label), label }
}

function itens(rotulos: readonly string[]): ItemCatalogo[] {
  return rotulos.map(item)
}

function regiaoMobilidade(label: string, movimentos: readonly string[]): RegiaoMobilidade {
  return { key: keyFromLabel(label), label, movimentos: itens(movimentos) }
}

function regiaoPalpacao(label: string, locais: readonly string[]): RegiaoPalpacao {
  return { key: keyFromLabel(label), label, locais: itens(locais) }
}

function regiaoTestes(label: string, testes: readonly string[]): RegiaoTestes {
  return { key: keyFromLabel(label), label, testes: itens(testes) }
}

export const CATALOGO_MOBILIDADE: RegiaoMobilidade[] = [
  regiaoMobilidade('Cervical', [
    'Flexão cervical',
    'Extensão cervical',
    'Inclinação lateral direita',
    'Inclinação lateral esquerda',
    'Rotação direita',
    'Rotação esquerda',
  ]),
  regiaoMobilidade('Tronco / coluna', [
    'Flexão de tronco',
    'Extensão de tronco / extensão lombar',
    'Inclinação lateral direita',
    'Inclinação lateral esquerda',
    'Rotação direita',
    'Rotação esquerda',
  ]),
  regiaoMobilidade('Escápula', [
    'Elevação',
    'Depressão',
    'Protração',
    'Retração',
    'Rotação superior',
    'Rotação inferior',
  ]),
  regiaoMobilidade('Ombro', [
    'Flexão',
    'Extensão',
    'Abdução',
    'Adução',
    'Rotação interna',
    'Rotação externa',
    'Abdução horizontal',
    'Adução horizontal',
  ]),
  regiaoMobilidade('Cotovelo', ['Flexão', 'Extensão']),
  regiaoMobilidade('Antebraço', ['Pronação', 'Supinação']),
  regiaoMobilidade('Punho', ['Flexão', 'Extensão', 'Desvio radial', 'Desvio ulnar']),
  regiaoMobilidade('Mão / dedos', [
    'Flexão dos dedos',
    'Extensão dos dedos',
    'Abdução dos dedos',
    'Adução dos dedos',
    'Preensão palmar',
    'Pinça lateral',
    'Pinça polpa-polpa',
    'Pinça trípode',
    'Oposição do polegar',
    'Abdução do polegar',
    'Adução do polegar',
    'Flexão do polegar',
    'Extensão do polegar',
  ]),
  regiaoMobilidade('Quadril', [
    'Flexão',
    'Extensão',
    'Abdução',
    'Adução',
    'Rotação interna',
    'Rotação externa',
  ]),
  regiaoMobilidade('Joelho', ['Flexão', 'Extensão']),
  regiaoMobilidade('Tornozelo', ['Dorsiflexão', 'Flexão plantar', 'Inversão', 'Eversão']),
  regiaoMobilidade('Pé / dedos', [
    'Flexão do hálux',
    'Extensão do hálux',
    'Flexão dos dedos',
    'Extensão dos dedos',
    'Abdução dos dedos',
    'Adução dos dedos',
  ]),
  regiaoMobilidade('ATM / mandíbula', [
    'Elevação mandibular',
    'Depressão mandibular',
    'Protrusão',
    'Retrusão',
    'Desvio lateral direito',
    'Desvio lateral esquerdo',
  ]),
]

export const CATALOGO_PALPACAO: RegiaoPalpacao[] = [
  regiaoPalpacao('ATM / face', [
    'ATM',
    'masseter',
    'temporal',
    'pterigoideo medial',
    'pterigoideo lateral',
    'arco zigomático',
    'mandíbula',
    'região pré-auricular',
    'outro',
  ]),
  regiaoPalpacao('Cervical', [
    'processos espinhosos',
    'processos transversos',
    'musculatura paravertebral',
    'suboccipitais',
    'trapézio superior',
    'levantador da escápula',
    'esternocleidomastoideo',
    'escalenos',
    'outro',
  ]),
  regiaoPalpacao('Ombro / cintura escapular', [
    'articulação acromioclavicular',
    'articulação esternoclavicular',
    'acrômio',
    'processo coracoide',
    'tubérculo maior',
    'sulco bicipital',
    'tendão da cabeça longa do bíceps',
    'supraespinal',
    'infraespinal',
    'redondo menor',
    'subescapular',
    'deltoide',
    'trapézio',
    'romboides',
    'borda medial da escápula',
    'outro',
  ]),
  regiaoPalpacao('Braço', ['bíceps braquial', 'tríceps braquial', 'braquial', 'deltoide distal', 'úmero', 'outro']),
  regiaoPalpacao('Cotovelo', [
    'epicôndilo lateral',
    'epicôndilo medial',
    'olécrano',
    'cabeça do rádio',
    'tendão extensor comum',
    'tendão flexor comum',
    'tendão distal do bíceps',
    'tendão do tríceps',
    'nervo ulnar',
    'outro',
  ]),
  regiaoPalpacao('Antebraço', [
    'grupo flexor-pronador',
    'grupo extensor-supinador',
    'braquiorradial',
    'pronador redondo',
    'supinador',
    'rádio',
    'ulna',
    'outro',
  ]),
  regiaoPalpacao('Punho', [
    'estiloide radial',
    'estiloide ulnar',
    'TFCC',
    'túnel do carpo',
    'tendões flexores',
    'tendões extensores',
    'escafoide',
    'semilunar',
    'outro',
  ]),
  regiaoPalpacao('Mão', [
    'metacarpos',
    'articulações MCP',
    'PIP',
    'DIP',
    'eminência tenar',
    'eminência hipotênar',
    'tendões flexores',
    'tendões extensores',
    'polias digitais',
    'polegar',
    'articulação trapézio-metacarpal',
    'outro',
  ]),
  regiaoPalpacao('Torácica', [
    'processos espinhosos',
    'processos transversos',
    'musculatura paravertebral',
    'articulações costovertebrais',
    'costotransversas',
    'trapézio médio',
    'trapézio inferior',
    'romboides',
    'outro',
  ]),
  regiaoPalpacao('Tórax / costelas', [
    'costelas',
    'junções costocondrais',
    'esterno',
    'musculatura intercostal',
    'peitoral maior',
    'peitoral menor',
    'outro',
  ]),
  regiaoPalpacao('Lombar', [
    'processos espinhosos',
    'processos transversos',
    'musculatura paravertebral',
    'quadrado lombar',
    'multífidos',
    'crista ilíaca',
    'outro',
  ]),
  regiaoPalpacao('Sacro / região sacroilíaca', [
    'sacro',
    'articulação sacroilíaca',
    'EIPS',
    'ligamentos sacroilíacos posteriores',
    'região sacrotuberosa',
    'outro',
  ]),
  regiaoPalpacao('Pelve', [
    'EIAS',
    'EIPS',
    'crista ilíaca',
    'sínfise púbica',
    'tuberosidade isquiática',
    'adutores proximais',
    'parede abdominal inferior',
    'outro',
  ]),
  regiaoPalpacao('Quadril', [
    'trocânter maior',
    'trocânter menor',
    'região anterior do quadril',
    'região glútea',
    'glúteo médio',
    'glúteo mínimo',
    'glúteo máximo',
    'TFL',
    'trato iliotibial proximal',
    'tendão do iliopsoas',
    'tendões glúteos',
    'região piriforme',
    'outro',
  ]),
  regiaoPalpacao('Coxa', [
    'quadríceps',
    'reto femoral',
    'vasto medial',
    'vasto lateral',
    'vasto intermédio',
    'isquiotibiais',
    'bíceps femoral',
    'semitendíneo',
    'semimembranáceo',
    'adutores',
    'sartório',
    'trato iliotibial',
    'outro',
  ]),
  regiaoPalpacao('Joelho', [
    'patela',
    'tendão patelar',
    'tendão do quadríceps',
    'polo inferior da patela',
    'interlinha medial',
    'interlinha lateral',
    'LCM',
    'LCL',
    'tuberosidade da tíbia',
    'pata de ganso',
    'cabeça da fíbula',
    'trato iliotibial distal',
    'região poplítea',
    'outro',
  ]),
  regiaoPalpacao('Perna', [
    'tibial anterior',
    'fibulares',
    'gastrocnêmio medial',
    'gastrocnêmio lateral',
    'sóleo',
    'tibial posterior',
    'tíbia',
    'fíbula',
    'outro',
  ]),
  regiaoPalpacao('Tornozelo', [
    'maléolo medial',
    'maléolo lateral',
    'ligamento talofibular anterior',
    'ligamento calcaneofibular',
    'ligamento talofibular posterior',
    'ligamento deltoide',
    'sindesmose',
    'tendão de Aquiles',
    'tendões fibulares',
    'tibial posterior',
    'tibial anterior',
    'outro',
  ]),
  regiaoPalpacao('Pé', [
    'calcâneo',
    'fáscia plantar',
    'tuberosidade do navicular',
    'base do 5º metatarso',
    'metatarsos',
    'cabeças dos metatarsos',
    'articulações metatarsofalângicas',
    'hálux',
    'tendões extensores',
    'tendões flexores',
    'região dos sesamoides',
    'arco medial',
    'arco lateral',
    'outro',
  ]),
  regiaoPalpacao('Outra', ['outro']),
]

export const CATALOGO_TESTES: RegiaoTestes[] = [
  regiaoTestes('ATM / face', [
    'Abertura ativa com observação',
    'Desvio mandibular',
    'Deflexão mandibular',
    'Teste de carga da ATM',
    'Teste de compressão',
    'Teste de distração',
    'Teste de protrusão',
    'Teste de lateralidade',
    'Outro',
  ]),
  regiaoTestes('Cervical', [
    'Spurling',
    'Distração cervical',
    'ULTT / neurodinâmico',
    'Flexion-Rotation Test',
    'Sharp-Purser',
    'Alar Ligament Test',
    'Cervical Rotation Lateral Flexion Test',
    'Outro',
  ]),
  regiaoTestes('Torácica', [
    'Spring test',
    'PA central',
    'PA unilateral',
    'Rotação torácica',
    'Rib spring test',
    'Outro',
  ]),
  regiaoTestes('Lombar', [
    'SLR / Lasègue',
    'Lasègue cruzado (contralateral)',
    'Slump',
    'Valsalva',
    'Schober',
    'Compressão axial',
    'Distração (sinais não orgânicos / Waddell)',
    'Femoral Nerve Stretch',
    'Quadrante lombar',
    'Prone Instability Test',
    'PA central',
    'PA unilateral',
    'Outro',
  ]),
  regiaoTestes('Ombro / cintura escapular', [
    'Hawkins-Kennedy',
    'Neer',
    'Jobe / Empty Can',
    'Full Can',
    'External Rotation Lag Sign',
    'Lift-off',
    'Belly Press',
    'Speed',
    'Yergason',
    'O’Brien',
    'Apprehension',
    'Relocation',
    'Sulcus Sign',
    'Cross-body Adduction',
    'Outro',
  ]),
  regiaoTestes('Cotovelo', [
    'Cozen',
    'Mill',
    'Maudsley',
    'Valgo stress test',
    'Varo stress test',
    'Moving Valgus Stress Test',
    'Tinel cubital',
    'Hook Test',
    'Outro',
  ]),
  regiaoTestes('Punho / mão', [
    'Phalen',
    'Tinel',
    'Finkelstein',
    'Eichhoff',
    'Watson / Scaphoid Shift',
    'Grind Test do polegar',
    'TFCC Load Test',
    'Piano Key Test',
    'Outro',
  ]),
  regiaoTestes('Quadril', [
    'FADIR',
    'FABER',
    'Scour',
    'Log Roll',
    'Thomas',
    'Ober',
    'Trendelenburg',
    'Resisted External Derotation Test',
    'Outro',
  ]),
  regiaoTestes('Pelve / sacroilíaca', [
    'Distraction',
    'Compression',
    'Thigh Thrust',
    'Sacral Thrust',
    'Gaenslen',
    'Active Straight Leg Raise',
    'Outro',
  ]),
  regiaoTestes('Joelho', [
    'Lachman',
    'Gaveta anterior',
    'Gaveta posterior',
    'Pivot Shift',
    'Valgo stress test',
    'Varo stress test',
    'McMurray',
    'Thessaly',
    'Apley',
    'Patellar Apprehension',
    'Patellar Grind',
    'Outro',
  ]),
  regiaoTestes('Tornozelo / pé', [
    'Gaveta anterior',
    'Talar Tilt',
    'Thompson',
    'Squeeze Test',
    'External Rotation Test',
    'Windlass',
    'Navicular Drop',
    'Matles Test',
    'Outro',
  ]),
  regiaoTestes('Neurológico', [
    'SLR',
    'Slump',
    'ULTT mediano',
    'ULTT radial',
    'ULTT ulnar',
    'Femoral Nerve Stretch',
    'Hoffmann',
    'Babinski',
    'Clônus',
    'Reflexos',
    'Sensibilidade',
    'Miotomos',
    'Dermátomos',
    'Outro',
  ]),
]

function texto(value: string | undefined): string {
  return typeof value === 'string' ? value.trim() : ''
}

function tokens(value: string): Set<string> {
  return new Set(fold(value).split(/[^a-z0-9]+/).filter((token) => token.length > 0))
}

function movimentoCitaRegiao(movimento: string, regiao: string): boolean {
  const daRegiao = tokens(regiao)
  for (const token of tokens(movimento)) {
    if (daRegiao.has(token)) return true
  }
  return false
}

function comGrau(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (CHIPS_SEM_GRAU.has(trimmed)) return trimmed
  if (trimmed.endsWith('°')) return trimmed
  if (/^\d+$/.test(trimmed)) return `${trimmed}°`
  return trimmed
}

function numeroTexto(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value)
}

function acharRegiaoMobilidade(chaveOuRotulo: string): RegiaoMobilidade | undefined {
  return CATALOGO_MOBILIDADE.find((regiao) => regiao.key === chaveOuRotulo || regiao.label === chaveOuRotulo)
}

function acharRegiaoPalpacao(chaveOuRotulo: string): RegiaoPalpacao | undefined {
  return CATALOGO_PALPACAO.find((regiao) => regiao.key === chaveOuRotulo || regiao.label === chaveOuRotulo)
}

function acharRegiaoTestes(chaveOuRotulo: string): RegiaoTestes | undefined {
  return CATALOGO_TESTES.find((regiao) => regiao.key === chaveOuRotulo || regiao.label === chaveOuRotulo)
}

function rotuloMovimento(regiao: string, movimento: string): string {
  const catalogo = acharRegiaoMobilidade(regiao)
  const itemMovimento = catalogo?.movimentos.find((entrada) => entrada.key === movimento || entrada.label === movimento)
  return itemMovimento?.label ?? movimento
}

function rotuloLocal(regiao: string, local: string): string {
  const catalogo = acharRegiaoPalpacao(regiao)
  const itemLocal = catalogo?.locais.find((entrada) => entrada.key === local || entrada.label === local)
  return itemLocal?.label ?? local
}

function rotuloTesteCatalogo(regiao: string, teste: string): string {
  const catalogo = acharRegiaoTestes(regiao)
  const itemTeste = catalogo?.testes.find((entrada) => entrada.key === teste || entrada.label === teste)
  return itemTeste?.label ?? teste
}

function rotuloRegiaoMobilidade(chaveOuRotulo: string): string {
  return acharRegiaoMobilidade(chaveOuRotulo)?.label ?? chaveOuRotulo
}

function rotuloRegiaoPalpacao(chaveOuRotulo: string): string {
  return acharRegiaoPalpacao(chaveOuRotulo)?.label ?? chaveOuRotulo
}

/** `Flexão  D 110°  E 115°`. Lado vazio sai. Sem valor, só o rótulo. */
export function formatMovimentoCompacto(movimento: string, direito?: string, esquerdo?: string): string {
  const partes = [movimento]
  const valorDireito = texto(direito)
  const valorEsquerdo = texto(esquerdo)
  if (valorDireito) partes.push(`D ${valorDireito}`)
  if (valorEsquerdo) partes.push(`E ${valorEsquerdo}`)
  if (partes.length === 1) return movimento
  return partes.join('  ')
}

/** `Dor E 90°`. Número puro ganha `°`. Texto ou grau já presente fica como está. */
export function formatDor(lado: 'D' | 'E', inicio?: string): string {
  const valor = texto(inicio)
  if (!valor) return ''
  return `Dor ${lado} ${comGrau(valor)}`
}

/** `Flexão de quadril: ADM 115° → dor inicia aos 90°`. O rótulo que já cita a região não repete. */
export function formatFraseAdm(regiao: string, movimento: string, valor: string, inicio: string): string {
  const valorFmt = comGrau(valor)
  const inicioFmt = comGrau(inicio)
  if (!valorFmt || !inicioFmt) return ''
  const nome = movimentoCitaRegiao(movimento, regiao)
    ? movimento
    : `${movimento} de ${regiao.toLocaleLowerCase('pt-BR')}`
  return `${nome}: ADM ${valorFmt} → dor inicia aos ${inicioFmt}`
}

/** `{Região} · Ativo · Bilateral`, ou só tipo e comparação quando o nome já está no rótulo da folha. */
export function formatCabecalhoRegiao(
  regiao: RegiaoMobilidadeLida,
  opcoes?: { incluirNome?: boolean },
): string {
  const partes: string[] = []
  if (opcoes?.incluirNome) partes.push(rotuloRegiaoMobilidade(regiao.regiao))
  if (regiao.tipo && regiao.tipo in TIPO_ROTULO) partes.push(TIPO_ROTULO[regiao.tipo])
  if (regiao.comparacao && regiao.comparacao in COMPARACAO_ROTULO) {
    partes.push(COMPARACAO_ROTULO[regiao.comparacao])
  }
  return partes.join(' · ')
}

/** Compacta, frase de ADM do lado que tem valor e início, dor, dor máxima e observações. */
export function formatLinhaMovimento(movimento: MovimentoMedido, regiao: string): string {
  const rotulo = rotuloMovimento(regiao, movimento.movimento)
  const partes = [formatMovimentoCompacto(rotulo, movimento.valorDireito, movimento.valorEsquerdo)]
  const lados: Array<['D' | 'E', string | undefined, DorLado | undefined]> = [
    ['D', movimento.valorDireito, movimento.dorDireito],
    ['E', movimento.valorEsquerdo, movimento.dorEsquerdo],
  ]

  for (const [lado, valor, dor] of lados) {
    if (!texto(valor) || !texto(dor?.inicio)) continue
    const frase = formatFraseAdm(regiao, rotulo, valor ?? '', dor?.inicio ?? '')
    if (frase) partes.push(frase)
  }

  for (const [lado, , dor] of lados) {
    const dorTexto = formatDor(lado, dor?.inicio)
    if (dorTexto) partes.push(dorTexto)
  }

  for (const [lado, , dor] of lados) {
    if (typeof dor?.maxima !== 'number' || !Number.isFinite(dor.maxima)) continue
    partes.push(`dor máxima ${lado} ${numeroTexto(dor.maxima)}/10`)
  }

  const observacao = texto(movimento.observacao)
  if (observacao) partes.push(observacao)
  for (const [, , dor] of lados) {
    const nota = texto(dor?.observacao)
    if (nota) partes.push(nota)
  }

  return partes.filter((parte) => parte.length > 0).join(' · ')
}

/** `{Região} · local · lado · achado · dor n/10 · observação`, pulando pedaço vazio. */
export function formatAchado(achado: AchadoRegistrado): string {
  const partes: string[] = []
  const regiao = rotuloRegiaoPalpacao(achado.regiao)
  if (regiao) partes.push(regiao)

  const localOutro = texto(achado.localOutro)
  const local = achado.local === 'outro' && localOutro ? localOutro : rotuloLocal(achado.regiao, achado.local)
  if (local) partes.push(local)

  if (achado.lado && achado.lado in LADO_ROTULO) partes.push(LADO_ROTULO[achado.lado])

  if (achado.achado && achado.achado in ACHADO_ROTULO) {
    const achadoOutro = texto(achado.achadoOutro)
    if (achado.achado === 'outro' && achadoOutro) partes.push(`Outro: ${achadoOutro}`)
    else partes.push(ACHADO_ROTULO[achado.achado])
  }

  if (typeof achado.dor === 'number' && Number.isFinite(achado.dor)) {
    partes.push(`dor ${numeroTexto(achado.dor)}/10`)
  }

  const observacao = texto(achado.observacao)
  if (observacao) partes.push(observacao)
  return partes.join(' · ')
}

/** Rótulo, `{rótulo}: {resultado}`, ou `Outro: {outroTexto}`. */
export function formatTeste(teste: TesteMarcado): string {
  const outroTexto = texto(teste.outroTexto)
  const rotulo =
    teste.teste === 'outro' && outroTexto ? `Outro: ${outroTexto}` : rotuloTesteCatalogo(teste.regiao, teste.teste)
  const resultado = texto(teste.resultado)
  if (!resultado) return rotulo
  return `${rotulo}: ${resultado}`
}

/** Uma linha por teste marcado e, se houver, o registro anterior. Sempre string. */
export function formatTestesParaColuna(
  bloco?: { testes?: TesteMarcado[]; testesRegistroAnterior?: string } | null,
): string {
  if (!bloco || typeof bloco !== 'object') return ''
  const linhas = (bloco.testes ?? []).map((teste) => formatTeste(teste)).filter((linha) => linha.length > 0)
  const registro = texto(bloco.testesRegistroAnterior)
  if (registro) linhas.push(registro)
  return linhas.join('\n')
}

const VALOR_MAX = 80
const INICIO_MAX = 40
const OBSERVACAO_MAX = 400
const OUTRO_MAX = 200
const REGISTRO_MAX = 4000
const TEXTO_LIVRE_MAX = 2000

const LADOS_ACHADO = new Set<LadoAchado>(['direito', 'esquerdo', 'bilateral', 'central', 'naoSeAplica'])
const ACHADOS = new Set<AchadoPalpacao>([
  'semAlteracao',
  'doloroso',
  'edema',
  'tensao',
  'crepitacao',
  'temperatura',
  'outro',
])

export type RegiaoMobilidadeNormalizada = {
  regiao: string
  tipo?: TipoAvaliacao
  comparacao?: ComparacaoMobilidade
  movimentos: MovimentoMedido[]
}

export type MobilidadeNormalizada = {
  regioes: RegiaoMobilidadeNormalizada[]
  registroAnterior?: string
}

export type PalpacaoTestesNormalizada = {
  achados: AchadoRegistrado[]
  testes: TesteMarcado[]
  palpacaoRegistroAnterior?: string
  testesRegistroAnterior?: string
  resultados?: string
  testeFuncional?: string
  resultadoInicial?: string
}

type Alvo = { regiao: string; movimento: string }
type AlvoTeste = { regiao: string; teste: string }

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
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

function coerceBool(value: unknown): boolean | undefined {
  if (value === '' || value === null || value === undefined) return undefined
  if (value === true || value === 'true' || value === 'on' || value === 1 || value === '1') return true
  if (value === false || value === 'false' || value === 0 || value === '0') return false
  return undefined
}

function foldMatch(value: string): string {
  const reto = value.replaceAll('\u2019', "'").replaceAll('\u2018', "'")
  return fold(reto).replace(/\s+/g, ' ').trim()
}

function notaDor(value: unknown): number | undefined {
  const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value.trim()) : Number.NaN
  if (!Number.isFinite(n) || n < 0 || n > 10) return undefined
  return n
}

function lerDor(value: unknown): DorLado | undefined {
  if (!isJsonObject(value)) return undefined
  const dor: DorLado = {}
  const inicio = clampTrimmed(trimString(value.inicio), INICIO_MAX)
  const maxima = notaDor(value.maxima)
  const observacao = clampTrimmed(trimString(value.observacao), OBSERVACAO_MAX)
  if (inicio) dor.inicio = inicio
  if (maxima !== undefined) dor.maxima = maxima
  if (observacao) dor.observacao = observacao
  if (!dor.inicio && dor.maxima === undefined && !dor.observacao) return undefined
  return dor
}

function lerMovimento(value: Record<string, unknown>, movimento: string): MovimentoMedido {
  const item: MovimentoMedido = { movimento }
  const direito = clampTrimmed(trimString(value.valorDireito), VALOR_MAX)
  const esquerdo = clampTrimmed(trimString(value.valorEsquerdo), VALOR_MAX)
  const observacao = clampTrimmed(trimString(value.observacao), OBSERVACAO_MAX)
  const dorDireito = lerDor(value.dorDireito)
  const dorEsquerdo = lerDor(value.dorEsquerdo)
  if (direito) item.valorDireito = direito
  if (esquerdo) item.valorEsquerdo = esquerdo
  if (dorDireito) item.dorDireito = dorDireito
  if (dorEsquerdo) item.dorEsquerdo = dorEsquerdo
  if (observacao) item.observacao = observacao
  return item
}

function tipoValido(value: unknown): TipoAvaliacao | undefined {
  const tipo = trimString(value)
  if (tipo === 'ativo' || tipo === 'passivo' || tipo === 'ambos') return tipo
  return undefined
}

function comparacaoValida(value: unknown): ComparacaoMobilidade | undefined {
  const comparacao = trimString(value)
  if (comparacao === 'bilateral' || comparacao === 'unilateral') return comparacao
  return undefined
}

function ladoValido(value: unknown): LadoAchado | undefined {
  const lado = trimString(value)
  if (lado && LADOS_ACHADO.has(lado as LadoAchado)) return lado as LadoAchado
  return undefined
}

function achadoValido(value: unknown): AchadoPalpacao | undefined {
  const achado = trimString(value)
  if (achado && ACHADOS.has(achado as AchadoPalpacao)) return achado as AchadoPalpacao
  return undefined
}

function agrupar<T>(itens: readonly T[], chave: (item: T) => string | undefined): Map<string, T[]> {
  const mapa = new Map<string, T[]>()
  for (const item of itens) {
    const key = chave(item)
    if (!key) continue
    const lista = mapa.get(key)
    if (lista) lista.push(item)
    else mapa.set(key, [item])
  }
  return mapa
}

function movimentoCurto(label: string, regiaoLabel: string): boolean {
  const daRegiao = tokens(regiaoLabel)
  for (const token of tokens(label)) {
    if (daRegiao.has(token)) return false
  }
  return true
}

const MOVIMENTOS = CATALOGO_MOBILIDADE.flatMap((regiao) =>
  regiao.movimentos.map((movimento) => {
    const corte = movimento.label.indexOf(' / ')
    return {
      regiao: regiao.key,
      regiaoLabel: regiao.label,
      movimento: movimento.key,
      label: movimento.label,
      folded: foldMatch(movimento.label),
      segmento: corte >= 0 ? foldMatch(movimento.label.slice(corte + ' / '.length)) : undefined,
    }
  }),
)

const EXATOS_MOVIMENTO = agrupar(MOVIMENTOS, (item) => item.folded)
const SEGMENTOS_MOVIMENTO = agrupar(MOVIMENTOS, (item) => item.segmento)

const ALIASES_REGIAO = new Map<string, string[]>()
const CONTAGEM_ALIAS = new Map<string, number>()
for (const regiao of CATALOGO_MOBILIDADE) {
  const aliases = new Set<string>([foldMatch(regiao.label)])
  const partes = regiao.label.split(' / ')
  if (partes.length > 1) {
    for (const parte of partes) aliases.add(foldMatch(parte))
  }
  ALIASES_REGIAO.set(regiao.key, [...aliases])
  for (const alias of aliases) CONTAGEM_ALIAS.set(alias, (CONTAGEM_ALIAS.get(alias) ?? 0) + 1)
}

const COMPOSTOS_MOVIMENTO = agrupar(
  MOVIMENTOS.filter((item) => movimentoCurto(item.label, item.regiaoLabel)).flatMap((item) => {
    const aliases = (ALIASES_REGIAO.get(item.regiao) ?? []).filter((alias) => CONTAGEM_ALIAS.get(alias) === 1)
    const movimento = foldMatch(item.label)
    return aliases.flatMap((alias) => [
      { regiao: item.regiao, movimento: item.movimento, folded: `${movimento} de ${alias}` },
      { regiao: item.regiao, movimento: item.movimento, folded: `${alias} ${movimento}` },
    ])
  }),
  (item) => item.folded,
)

const EXATOS_TESTE = agrupar(
  CATALOGO_TESTES.flatMap((regiao) =>
    regiao.testes.map((teste) => ({
      regiao: regiao.key,
      teste: teste.key,
      folded: foldMatch(teste.label),
    })),
  ),
  (item) => item.folded,
)

function unico<T>(lista: T[] | undefined): T | undefined {
  if (!lista || lista.length !== 1) return undefined
  return lista[0]
}

function matchMovimento(value: string): Alvo | undefined {
  const folded = foldMatch(value)
  if (!folded) return undefined
  const exato = EXATOS_MOVIMENTO.get(folded)
  if (exato && exato.length > 1) return undefined
  if (exato?.length === 1) return exato[0]
  const segmento = SEGMENTOS_MOVIMENTO.get(folded)
  if (segmento && segmento.length > 1) return undefined
  if (segmento?.length === 1) return segmento[0]
  return unico(COMPOSTOS_MOVIMENTO.get(folded))
}

function matchTeste(value: string): AlvoTeste | undefined {
  return unico(EXATOS_TESTE.get(foldMatch(value)))
}

function quebrarLegado(value: string): string[] {
  const linhas: string[] = []
  let atual = ''
  for (const char of value) {
    if (char === '\n' || char === ';') {
      const trimmed = atual.trim()
      if (trimmed) linhas.push(trimmed)
      atual = ''
      continue
    }
    if (char === '\r') continue
    atual += char
  }
  const trimmed = atual.trim()
  if (trimmed) linhas.push(trimmed)
  return linhas
}

function fraseLinhaLegada(linha: Record<string, unknown>): string | undefined {
  const partes: string[] = []
  const movimento = trimString(linha.movimento)
  const direito = clampTrimmed(trimString(linha.direito), VALOR_MAX)
  const esquerdo = clampTrimmed(trimString(linha.esquerdo), VALOR_MAX)
  const dor = trimString(linha.dor)
  const observacao = trimString(linha.observacao)
  if (movimento) partes.push(movimento)
  if (direito) partes.push(`D ${direito}`)
  if (esquerdo) partes.push(`E ${esquerdo}`)
  if (dor) partes.push(`Dor ${dor}`)
  if (observacao) partes.push(observacao)
  if (partes.length === 0) return undefined
  return partes.join(' · ')
}

function movimentoCasado(linha: Record<string, unknown>, movimento: string): MovimentoMedido {
  const item: MovimentoMedido = { movimento }
  const direito = clampTrimmed(trimString(linha.direito), VALOR_MAX)
  const esquerdo = clampTrimmed(trimString(linha.esquerdo), VALOR_MAX)
  const observacao = clampTrimmed(
    [trimString(linha.dor), trimString(linha.observacao)].filter((parte): parte is string => Boolean(parte)).join(' · '),
    OBSERVACAO_MAX,
  )
  if (direito) item.valorDireito = direito
  if (esquerdo) item.valorEsquerdo = esquerdo
  if (observacao) item.observacao = observacao
  return item
}

function tipoGlobal(value: Record<string, unknown>): TipoAvaliacao | undefined {
  const ativo = coerceBool(value.ativo) === true
  const passivo = coerceBool(value.passivo) === true
  if (ativo && passivo) return 'ambos'
  if (ativo) return 'ativo'
  if (passivo) return 'passivo'
  return undefined
}

function comparacaoGlobal(value: Record<string, unknown>): ComparacaoMobilidade | undefined {
  if (coerceBool(value.bilateral) === true) return 'bilateral'
  return undefined
}

function garantirRegiao(
  regioes: RegiaoMobilidadeNormalizada[],
  key: string,
  tipo: TipoAvaliacao | undefined,
  comparacao: ComparacaoMobilidade | undefined,
): RegiaoMobilidadeNormalizada {
  const existente = regioes.find((regiao) => regiao.regiao === key)
  if (existente) return existente
  const nova: RegiaoMobilidadeNormalizada = { regiao: key, movimentos: [] }
  if (tipo) nova.tipo = tipo
  if (comparacao) nova.comparacao = comparacao
  regioes.push(nova)
  return nova
}

function sanitizarMobilidade(value: Record<string, unknown>): MobilidadeNormalizada {
  const regioes: RegiaoMobilidadeNormalizada[] = []
  if (Array.isArray(value.regioes)) {
    for (const bruto of value.regioes) {
      if (!isJsonObject(bruto)) continue
      const regiaoKey = trimString(bruto.regiao)
      const catalogo = CATALOGO_MOBILIDADE.find((regiao) => regiao.key === regiaoKey)
      if (!catalogo || !regiaoKey) continue
      const movimentos: MovimentoMedido[] = []
      if (Array.isArray(bruto.movimentos)) {
        for (const movimento of bruto.movimentos) {
          if (!isJsonObject(movimento)) continue
          const movimentoKey = trimString(movimento.movimento)
          if (!movimentoKey || !catalogo.movimentos.some((item) => item.key === movimentoKey)) continue
          movimentos.push(lerMovimento(movimento, movimentoKey))
        }
      }
      if (movimentos.length === 0) continue
      const regiao: RegiaoMobilidadeNormalizada = { regiao: regiaoKey, movimentos }
      const tipo = tipoValido(bruto.tipo)
      const comparacao = comparacaoValida(bruto.comparacao)
      if (tipo) regiao.tipo = tipo
      if (comparacao) regiao.comparacao = comparacao
      regioes.push(regiao)
    }
  }
  const result: MobilidadeNormalizada = { regioes }
  const registro = clampTrimmed(trimString(value.registroAnterior), REGISTRO_MAX)
  if (registro) result.registroAnterior = registro
  return result
}

function migrarMobilidade(value: Record<string, unknown>): MobilidadeNormalizada {
  const tipo = tipoGlobal(value)
  const comparacao = comparacaoGlobal(value)
  const regioes: RegiaoMobilidadeNormalizada[] = []
  const soltos: string[] = []
  const linhas = Array.isArray(value.linhas) ? value.linhas : []

  for (const bruto of linhas) {
    if (!isJsonObject(bruto)) continue
    const movimentoTexto = trimString(bruto.movimento)
    const alvo = movimentoTexto ? matchMovimento(movimentoTexto) : undefined
    if (alvo) {
      garantirRegiao(regioes, alvo.regiao, tipo, comparacao).movimentos.push(movimentoCasado(bruto, alvo.movimento))
      continue
    }
    const frase = fraseLinhaLegada(bruto)
    if (frase) soltos.push(frase)
  }

  if (regioes.length === 0) {
    if (coerceBool(value.ativo) === true) soltos.push('Movimento ativo')
    if (coerceBool(value.passivo) === true) soltos.push('Movimento passivo')
    if (coerceBool(value.bilateral) === true) soltos.push('Comparação bilateral')
  }

  const result: MobilidadeNormalizada = { regioes }
  const registro = clampTrimmed(soltos.join('\n'), REGISTRO_MAX)
  if (registro) result.registroAnterior = registro
  return result
}

function lerAchado(value: Record<string, unknown>): AchadoRegistrado | undefined {
  const regiaoKey = trimString(value.regiao)
  const catalogo = CATALOGO_PALPACAO.find((regiao) => regiao.key === regiaoKey)
  const localKey = trimString(value.local)
  if (!catalogo || !regiaoKey || !localKey || !catalogo.locais.some((item) => item.key === localKey)) return undefined
  const achado: AchadoRegistrado = { regiao: regiaoKey, local: localKey }
  const localOutro = localKey === 'outro' ? clampTrimmed(trimString(value.localOutro), OUTRO_MAX) : undefined
  const lado = ladoValido(value.lado)
  const tipo = achadoValido(value.achado)
  const achadoOutro = tipo === 'outro' ? clampTrimmed(trimString(value.achadoOutro), OUTRO_MAX) : undefined
  const dor = notaDor(value.dor)
  const observacao = clampTrimmed(trimString(value.observacao), OBSERVACAO_MAX)
  if (localOutro) achado.localOutro = localOutro
  if (lado) achado.lado = lado
  if (tipo) achado.achado = tipo
  if (achadoOutro) achado.achadoOutro = achadoOutro
  if (dor !== undefined) achado.dor = dor
  if (observacao) achado.observacao = observacao
  return achado
}

function lerTeste(value: Record<string, unknown>): TesteMarcado | undefined {
  const regiaoKey = trimString(value.regiao)
  const catalogo = CATALOGO_TESTES.find((regiao) => regiao.key === regiaoKey)
  const testeKey = trimString(value.teste)
  if (!catalogo || !regiaoKey || !testeKey || !catalogo.testes.some((item) => item.key === testeKey)) return undefined
  const teste: TesteMarcado = { regiao: regiaoKey, teste: testeKey }
  const resultado = clampTrimmed(trimString(value.resultado), OUTRO_MAX)
  const outroTexto = testeKey === 'outro' ? clampTrimmed(trimString(value.outroTexto), OUTRO_MAX) : undefined
  if (resultado) teste.resultado = resultado
  if (outroTexto) teste.outroTexto = outroTexto
  return teste
}

function copiarTextoLivre(value: Record<string, unknown>, result: PalpacaoTestesNormalizada) {
  const resultados = clampTrimmed(trimString(value.resultados), TEXTO_LIVRE_MAX)
  const testeFuncional = clampTrimmed(trimString(value.testeFuncional), TEXTO_LIVRE_MAX)
  const resultadoInicial = clampTrimmed(trimString(value.resultadoInicial), TEXTO_LIVRE_MAX)
  if (resultados) result.resultados = resultados
  if (testeFuncional) result.testeFuncional = testeFuncional
  if (resultadoInicial) result.resultadoInicial = resultadoInicial
}

function sanitizarPalpacao(value: Record<string, unknown>): PalpacaoTestesNormalizada {
  const achados: AchadoRegistrado[] = []
  const testes: TesteMarcado[] = []
  if (Array.isArray(value.achados)) {
    for (const bruto of value.achados) {
      if (!isJsonObject(bruto)) continue
      const achado = lerAchado(bruto)
      if (achado) achados.push(achado)
    }
  }
  if (Array.isArray(value.testes)) {
    for (const bruto of value.testes) {
      if (!isJsonObject(bruto)) continue
      const teste = lerTeste(bruto)
      if (teste) testes.push(teste)
    }
  }
  const result: PalpacaoTestesNormalizada = { achados, testes }
  const palpacaoRegistroAnterior = clampTrimmed(trimString(value.palpacaoRegistroAnterior), REGISTRO_MAX)
  const testesRegistroAnterior = clampTrimmed(trimString(value.testesRegistroAnterior), REGISTRO_MAX)
  if (palpacaoRegistroAnterior) result.palpacaoRegistroAnterior = palpacaoRegistroAnterior
  if (testesRegistroAnterior) result.testesRegistroAnterior = testesRegistroAnterior
  copiarTextoLivre(value, result)
  return result
}

function migrarPalpacao(value: Record<string, unknown>): PalpacaoTestesNormalizada {
  const testes: TesteMarcado[] = []
  const soltos: string[] = []
  const testesClinicos = trimString(value.testesClinicos)
  if (testesClinicos) {
    for (const linha of quebrarLegado(testesClinicos)) {
      const alvo = matchTeste(linha)
      if (alvo) testes.push({ regiao: alvo.regiao, teste: alvo.teste })
      else soltos.push(linha)
    }
  }
  const result: PalpacaoTestesNormalizada = { achados: [], testes }
  const palpacaoRegistroAnterior = clampTrimmed(trimString(value.palpacao), REGISTRO_MAX)
  const testesRegistroAnterior = clampTrimmed(soltos.join('\n'), REGISTRO_MAX)
  if (palpacaoRegistroAnterior) result.palpacaoRegistroAnterior = palpacaoRegistroAnterior
  if (testesRegistroAnterior) result.testesRegistroAnterior = testesRegistroAnterior
  copiarTextoLivre(value, result)
  return result
}

export function normalizeMobilidade(value: unknown): MobilidadeNormalizada {
  if (!isJsonObject(value)) return { regioes: [] }
  if (Array.isArray(value.regioes)) return sanitizarMobilidade(value)
  return migrarMobilidade(value)
}

export function normalizePalpacaoTestes(value: unknown): PalpacaoTestesNormalizada {
  if (typeof value === 'string') {
    const result: PalpacaoTestesNormalizada = { achados: [], testes: [] }
    const registro = clampTrimmed(value.trim(), REGISTRO_MAX)
    if (registro) result.palpacaoRegistroAnterior = registro
    return result
  }
  if (!isJsonObject(value)) return { achados: [], testes: [] }
  if (Array.isArray(value.achados) || Array.isArray(value.testes)) return sanitizarPalpacao(value)
  return migrarPalpacao(value)
}
