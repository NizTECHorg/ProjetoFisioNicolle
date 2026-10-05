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
