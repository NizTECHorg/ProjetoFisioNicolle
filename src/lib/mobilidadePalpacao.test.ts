import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { deepEqual, equal, ok } from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { emptyEvaluationFicha, evaluationFichaSchema } from '../schemas/evaluationFicha.schema.ts'
import {
  CATALOGO_MOBILIDADE,
  CATALOGO_PALPACAO,
  CATALOGO_TESTES,
  formatAchado,
  formatCabecalhoRegiao,
  formatDor,
  formatFraseAdm,
  formatLinhaMovimento,
  formatMovimentoCompacto,
  formatTeste,
  formatTestesParaColuna,
  normalizeMobilidade,
  normalizePalpacaoTestes,
} from './mobilidadePalpacao.ts'

const MOBILIDADE_ESPERADA: Array<[string, string[]]> = [
  [
    'Cervical',
    [
      'Flexão cervical',
      'Extensão cervical',
      'Inclinação lateral direita',
      'Inclinação lateral esquerda',
      'Rotação direita',
      'Rotação esquerda',
    ],
  ],
  [
    'Tronco / coluna',
    [
      'Flexão de tronco',
      'Extensão de tronco / extensão lombar',
      'Inclinação lateral direita',
      'Inclinação lateral esquerda',
      'Rotação direita',
      'Rotação esquerda',
    ],
  ],
  [
    'Escápula',
    ['Elevação', 'Depressão', 'Protração', 'Retração', 'Rotação superior', 'Rotação inferior'],
  ],
  [
    'Ombro',
    [
      'Flexão',
      'Extensão',
      'Abdução',
      'Adução',
      'Rotação interna',
      'Rotação externa',
      'Abdução horizontal',
      'Adução horizontal',
    ],
  ],
  ['Cotovelo', ['Flexão', 'Extensão']],
  ['Antebraço', ['Pronação', 'Supinação']],
  ['Punho', ['Flexão', 'Extensão', 'Desvio radial', 'Desvio ulnar']],
  [
    'Mão / dedos',
    [
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
    ],
  ],
  ['Quadril', ['Flexão', 'Extensão', 'Abdução', 'Adução', 'Rotação interna', 'Rotação externa']],
  ['Joelho', ['Flexão', 'Extensão']],
  ['Tornozelo', ['Dorsiflexão', 'Flexão plantar', 'Inversão', 'Eversão']],
  [
    'Pé / dedos',
    [
      'Flexão do hálux',
      'Extensão do hálux',
      'Flexão dos dedos',
      'Extensão dos dedos',
      'Abdução dos dedos',
      'Adução dos dedos',
    ],
  ],
  [
    'ATM / mandíbula',
    [
      'Elevação mandibular',
      'Depressão mandibular',
      'Protrusão',
      'Retrusão',
      'Desvio lateral direito',
      'Desvio lateral esquerdo',
    ],
  ],
]

const PALPACAO_ESPERADA: Array<[string, string[]]> = [
  [
    'ATM / face',
    [
      'ATM',
      'masseter',
      'temporal',
      'pterigoideo medial',
      'pterigoideo lateral',
      'arco zigomático',
      'mandíbula',
      'região pré-auricular',
      'outro',
    ],
  ],
  [
    'Cervical',
    [
      'processos espinhosos',
      'processos transversos',
      'musculatura paravertebral',
      'suboccipitais',
      'trapézio superior',
      'levantador da escápula',
      'esternocleidomastoideo',
      'escalenos',
      'outro',
    ],
  ],
  [
    'Ombro / cintura escapular',
    [
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
    ],
  ],
  ['Braço', ['bíceps braquial', 'tríceps braquial', 'braquial', 'deltoide distal', 'úmero', 'outro']],
  [
    'Cotovelo',
    [
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
    ],
  ],
  [
    'Antebraço',
    [
      'grupo flexor-pronador',
      'grupo extensor-supinador',
      'braquiorradial',
      'pronador redondo',
      'supinador',
      'rádio',
      'ulna',
      'outro',
    ],
  ],
  [
    'Punho',
    [
      'estiloide radial',
      'estiloide ulnar',
      'TFCC',
      'túnel do carpo',
      'tendões flexores',
      'tendões extensores',
      'escafoide',
      'semilunar',
      'outro',
    ],
  ],
  [
    'Mão',
    [
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
    ],
  ],
  [
    'Torácica',
    [
      'processos espinhosos',
      'processos transversos',
      'musculatura paravertebral',
      'articulações costovertebrais',
      'costotransversas',
      'trapézio médio',
      'trapézio inferior',
      'romboides',
      'outro',
    ],
  ],
  [
    'Tórax / costelas',
    [
      'costelas',
      'junções costocondrais',
      'esterno',
      'musculatura intercostal',
      'peitoral maior',
      'peitoral menor',
      'outro',
    ],
  ],
  [
    'Lombar',
    [
      'processos espinhosos',
      'processos transversos',
      'musculatura paravertebral',
      'quadrado lombar',
      'multífidos',
      'crista ilíaca',
      'outro',
    ],
  ],
  [
    'Sacro / região sacroilíaca',
    [
      'sacro',
      'articulação sacroilíaca',
      'EIPS',
      'ligamentos sacroilíacos posteriores',
      'região sacrotuberosa',
      'outro',
    ],
  ],
  [
    'Pelve',
    [
      'EIAS',
      'EIPS',
      'crista ilíaca',
      'sínfise púbica',
      'tuberosidade isquiática',
      'adutores proximais',
      'parede abdominal inferior',
      'outro',
    ],
  ],
  [
    'Quadril',
    [
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
    ],
  ],
  [
    'Coxa',
    [
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
    ],
  ],
  [
    'Joelho',
    [
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
    ],
  ],
  [
    'Perna',
    [
      'tibial anterior',
      'fibulares',
      'gastrocnêmio medial',
      'gastrocnêmio lateral',
      'sóleo',
      'tibial posterior',
      'tíbia',
      'fíbula',
      'outro',
    ],
  ],
  [
    'Tornozelo',
    [
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
    ],
  ],
  [
    'Pé',
    [
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
    ],
  ],
  ['Outra', ['outro']],
]

const TESTES_ESPERADOS: Array<[string, string[]]> = [
  [
    'ATM / face',
    [
      'Abertura ativa com observação',
      'Desvio mandibular',
      'Deflexão mandibular',
      'Teste de carga da ATM',
      'Teste de compressão',
      'Teste de distração',
      'Teste de protrusão',
      'Teste de lateralidade',
      'Outro',
    ],
  ],
  [
    'Cervical',
    [
      'Spurling',
      'Distração cervical',
      'ULTT / neurodinâmico',
      'Flexion-Rotation Test',
      'Sharp-Purser',
      'Alar Ligament Test',
      'Cervical Rotation Lateral Flexion Test',
      'Outro',
    ],
  ],
  [
    'Torácica',
    ['Spring test', 'PA central', 'PA unilateral', 'Rotação torácica', 'Rib spring test', 'Outro'],
  ],
  [
    'Lombar',
    [
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
    ],
  ],
  [
    'Ombro / cintura escapular',
    [
      'Hawkins-Kennedy',
      'Neer',
      'Jobe / Empty Can',
      'Full Can',
      'External Rotation Lag Sign',
      'Lift-off',
      'Belly Press',
      'Speed',
      'Yergason',
      'O\u2019Brien',
      'Apprehension',
      'Relocation',
      'Sulcus Sign',
      'Cross-body Adduction',
      'Outro',
    ],
  ],
  [
    'Cotovelo',
    [
      'Cozen',
      'Mill',
      'Maudsley',
      'Valgo stress test',
      'Varo stress test',
      'Moving Valgus Stress Test',
      'Tinel cubital',
      'Hook Test',
      'Outro',
    ],
  ],
  [
    'Punho / mão',
    [
      'Phalen',
      'Tinel',
      'Finkelstein',
      'Eichhoff',
      'Watson / Scaphoid Shift',
      'Grind Test do polegar',
      'TFCC Load Test',
      'Piano Key Test',
      'Outro',
    ],
  ],
  [
    'Quadril',
    [
      'FADIR',
      'FABER',
      'Scour',
      'Log Roll',
      'Thomas',
      'Ober',
      'Trendelenburg',
      'Resisted External Derotation Test',
      'Outro',
    ],
  ],
  [
    'Pelve / sacroilíaca',
    ['Distraction', 'Compression', 'Thigh Thrust', 'Sacral Thrust', 'Gaenslen', 'Active Straight Leg Raise', 'Outro'],
  ],
  [
    'Joelho',
    [
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
    ],
  ],
  [
    'Tornozelo / pé',
    [
      'Gaveta anterior',
      'Talar Tilt',
      'Thompson',
      'Squeeze Test',
      'External Rotation Test',
      'Windlass',
      'Navicular Drop',
      'Matles Test',
      'Outro',
    ],
  ],
  [
    'Neurológico',
    [
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
    ],
  ],
]

function chavesUnicas(chaves: string[], regiao: string) {
  equal(new Set(chaves).size, chaves.length, regiao)
}

test('REQ-36: catálogo não encolhe', () => {
  equal(CATALOGO_MOBILIDADE.length, 13)
  const contagemMovimentos = CATALOGO_MOBILIDADE.map((regiao) => regiao.movimentos.length)
  deepEqual(contagemMovimentos, [6, 6, 6, 8, 2, 2, 4, 13, 6, 2, 4, 6, 6])
  equal(
    contagemMovimentos.reduce((soma, n) => soma + n, 0),
    71,
  )
  CATALOGO_MOBILIDADE.forEach((regiao, indice) => {
    const [rotulo, movimentos] = MOBILIDADE_ESPERADA[indice]!
    equal(regiao.label, rotulo)
    deepEqual(
      regiao.movimentos.map((item) => item.label),
      movimentos,
    )
    chavesUnicas(
      regiao.movimentos.map((item) => item.key),
      rotulo,
    )
    equal(regiao.movimentos[0]?.key.length > 0, true)
  })
  const flexaoOmbro = CATALOGO_MOBILIDADE.find((regiao) => regiao.label === 'Ombro')?.movimentos.find(
    (item) => item.label === 'Flexão',
  )
  const flexaoQuadril = CATALOGO_MOBILIDADE.find((regiao) => regiao.label === 'Quadril')?.movimentos.find(
    (item) => item.label === 'Flexão',
  )
  equal(flexaoOmbro?.key, 'flexao')
  equal(flexaoQuadril?.key, 'flexao')

  equal(CATALOGO_PALPACAO.length, 20)
  const contagemLocais = CATALOGO_PALPACAO.map((regiao) => regiao.locais.length)
  equal(
    contagemLocais.reduce((soma, n) => soma + n, 0),
    192,
  )
  CATALOGO_PALPACAO.forEach((regiao, indice) => {
    const [rotulo, locais] = PALPACAO_ESPERADA[indice]!
    equal(regiao.label, rotulo)
    deepEqual(
      regiao.locais.map((item) => item.label),
      locais,
    )
    equal(regiao.locais.at(-1)?.label, 'outro')
    equal(regiao.locais.at(-1)?.key, 'outro')
    chavesUnicas(
      regiao.locais.map((item) => item.key),
      rotulo,
    )
  })
  const mao = CATALOGO_PALPACAO.find((regiao) => regiao.label === 'Mão')
  equal(mao?.locais.some((item) => item.label === 'PIP' && item.key === 'pip'), true)
  equal(mao?.locais.some((item) => item.label === 'DIP' && item.key === 'dip'), true)
  equal(
    mao?.locais.some((item) => item.label.includes('PIP') && item.label.includes('DIP')),
    false,
  )
  const outra = CATALOGO_PALPACAO.find((regiao) => regiao.label === 'Outra')
  equal(outra?.locais.length, 1)
  equal(outra?.locais[0]?.label, 'outro')

  equal(CATALOGO_TESTES.length, 12)
  const contagemTestes = CATALOGO_TESTES.map((regiao) => regiao.testes.length)
  equal(
    contagemTestes.reduce((soma, n) => soma + n, 0),
    120,
  )
  CATALOGO_TESTES.forEach((regiao, indice) => {
    const [rotulo, testes] = TESTES_ESPERADOS[indice]!
    equal(regiao.label, rotulo)
    deepEqual(
      regiao.testes.map((item) => item.label),
      testes,
    )
    chavesUnicas(
      regiao.testes.map((item) => item.key),
      rotulo,
    )
  })
  const lombar = CATALOGO_TESTES.find((regiao) => regiao.label === 'Lombar')
  for (const nome of [
    'Lasègue cruzado (contralateral)',
    'Valsalva',
    'Schober',
    'Compressão axial',
    'Distração (sinais não orgânicos / Waddell)',
  ]) {
    equal(
      lombar?.testes.some((item) => item.label === nome),
      true,
      nome,
    )
  }
  const catalogos = [CATALOGO_MOBILIDADE, CATALOGO_PALPACAO, CATALOGO_TESTES]
  for (const catalogo of catalogos) {
    equal(
      catalogo.some((regiao) => regiao.label.toLowerCase() === 'fraturas'),
      false,
    )
  }
  const obrien = CATALOGO_TESTES.find((regiao) => regiao.label === 'Ombro / cintura escapular')?.testes.find(
    (item) => item.key === 'obrien',
  )
  equal(obrien?.label, 'O\u2019Brien')
  equal(obrien?.label.includes('\u2019'), true)
  equal(obrien?.label.includes('\u0027'), false)

  const fonte = readFileSync(fileURLToPath(new URL('./mobilidadePalpacao.ts', import.meta.url)), 'utf8')
  equal(fonte.includes('react'), false)
  equal(fonte.includes('@/'), false)
})

test('REQ-36: formatadores da frase travada', () => {
  equal(formatMovimentoCompacto('Flexão', '110°', '115°'), 'Flexão  D 110°  E 115°')
  equal(formatMovimentoCompacto('Flexão', '110°', ''), 'Flexão  D 110°')
  equal(formatMovimentoCompacto('Flexão', undefined, '115°'), 'Flexão  E 115°')
  equal(formatMovimentoCompacto('Flexão', undefined, undefined), 'Flexão')
  equal(formatMovimentoCompacto('Flexão', 'Completo', 'Limitado'), 'Flexão  D Completo  E Limitado')

  equal(formatDor('E', '90'), 'Dor E 90°')
  equal(formatDor('E', '90°'), 'Dor E 90°')
  equal(formatDor('D', 'no início'), 'Dor D no início')
  equal(formatDor('E', ''), '')

  const quadril = formatFraseAdm('Quadril', 'Flexão', '115°', '90')
  equal(quadril, 'Flexão de quadril: ADM 115° → dor inicia aos 90°')
  equal(quadril.includes('\u2192'), true)
  equal(quadril.includes('->'), false)

  const cervical = formatFraseAdm('Cervical', 'Flexão cervical', '30°', '10')
  equal(cervical, 'Flexão cervical: ADM 30° → dor inicia aos 10°')
  equal(cervical.includes('de cervical'), false)

  equal(
    formatFraseAdm('Quadril', 'Flexão', 'Completo', '90'),
    'Flexão de quadril: ADM Completo → dor inicia aos 90°',
  )
  equal(
    formatFraseAdm('Quadril', 'Flexão', 'Limitado', '90°'),
    'Flexão de quadril: ADM Limitado → dor inicia aos 90°',
  )
  equal(
    formatFraseAdm('Quadril', 'Flexão', 'Não avaliado', 'no fim'),
    'Flexão de quadril: ADM Não avaliado → dor inicia aos no fim',
  )

  equal(
    formatCabecalhoRegiao(
      { regiao: 'quadril', tipo: 'ativo', comparacao: 'bilateral' },
      { incluirNome: true },
    ),
    'Quadril · Ativo · Bilateral',
  )
  equal(
    formatCabecalhoRegiao(
      { regiao: 'quadril', tipo: 'ativo', comparacao: 'bilateral' },
      { incluirNome: false },
    ),
    'Ativo · Bilateral',
  )
  equal(formatCabecalhoRegiao({ regiao: 'quadril', tipo: 'passivo' }, { incluirNome: true }), 'Quadril · Passivo')
  equal(formatCabecalhoRegiao({ regiao: 'quadril' }, { incluirNome: false }), '')

  const linha = formatLinhaMovimento(
    {
      movimento: 'flexao',
      valorDireito: '110°',
      valorEsquerdo: '115°',
      dorEsquerdo: { inicio: '90', maxima: 7, observacao: 'fim do arco' },
      observacao: 'sem compensação',
    },
    'Quadril',
  )
  equal(
    linha,
    'Flexão  D 110°  E 115° · Flexão de quadril: ADM 115° → dor inicia aos 90° · Dor E 90° · dor máxima E 7/10 · sem compensação · fim do arco',
  )
  equal(linha.includes('dor máxima D'), false)

  const semMaxima = formatLinhaMovimento(
    { movimento: 'flexao', valorEsquerdo: '115°', dorEsquerdo: { inicio: '90' } },
    'Quadril',
  )
  equal(semMaxima.includes('dor máxima'), false)

  const cervicalLinha = formatLinhaMovimento(
    { movimento: 'flexaocervical', valorDireito: '30°', dorDireito: { inicio: '10', maxima: 7 } },
    'Cervical',
  )
  equal(cervicalLinha.includes('Flexão cervical de cervical'), false)
  equal(cervicalLinha.includes('dor máxima D 7/10'), true)

  equal(
    formatAchado({
      regiao: 'joelho',
      local: 'patela',
      lado: 'direito',
      achado: 'doloroso',
      dor: 6,
      observacao: 'calor local',
    }),
    'Joelho · patela · Direito · Doloroso · dor 6/10 · calor local',
  )
  equal(
    formatAchado({
      regiao: 'joelho',
      local: 'outro',
      localOutro: 'fáscia',
      achado: 'outro',
      achadoOutro: 'nódulo',
    }),
    'Joelho · fáscia · Outro: nódulo',
  )
  equal(formatAchado({ regiao: 'joelho', local: 'patela', dor: 0 }), 'Joelho · patela · dor 0/10')
  equal(
    formatAchado({
      regiao: 'ombrocinturaescapular',
      local: 'deltoide',
      lado: 'naoSeAplica',
      achado: 'tensao',
    }),
    'Ombro / cintura escapular · deltoide · Não se aplica · Tensão aumentada',
  )

  equal(formatTeste({ regiao: 'lombar', teste: 'schober' }), 'Schober')
  equal(formatTeste({ regiao: 'lombar', teste: 'schober', resultado: '5 cm' }), 'Schober: 5 cm')
  equal(formatTeste({ regiao: 'lombar', teste: 'outro', outroTexto: 'teste livre' }), 'Outro: teste livre')

  const coluna = formatTestesParaColuna({
    testes: [
      { regiao: 'lombar', teste: 'schober' },
      { regiao: 'lombar', teste: 'valsalva', resultado: 'positivo' },
    ],
    testesRegistroAnterior: 'notas antigas',
  })
  equal(typeof coluna, 'string')
  equal(Array.isArray(coluna), false)
  equal(coluna, 'Schober\nValsalva: positivo\nnotas antigas')
  equal(formatTestesParaColuna(undefined), '')
})

test('REQ-36: Flexão sem região vai para registro anterior', () => {
  for (const valor of [null, [], 'Flexão 110']) {
    deepEqual(normalizeMobilidade(valor), { regioes: [] })
  }

  const flexao = normalizeMobilidade({
    linhas: [{ movimento: 'Flexão', direito: '110°' }],
  })
  equal(flexao.regioes.length, 0)
  equal(flexao.registroAnterior, 'Flexão · D 110°')
  equal(
    flexao.regioes.some((regiao) => regiao.movimentos.some((movimento) => movimento.dorDireito || movimento.dorEsquerdo)),
    false,
  )

  const extensao = normalizeMobilidade({
    linhas: [{ movimento: 'Extensão', direito: '40°' }],
  })
  equal(extensao.regioes.length, 0)
  equal(extensao.registroAnterior, 'Extensão · D 40°')

  const dedos = normalizeMobilidade({
    linhas: [{ movimento: 'Flexão dos dedos', direito: '10°', esquerdo: '12°', dor: 'final', observacao: 'lento' }],
  })
  equal(dedos.regioes.length, 0)
  equal(dedos.registroAnterior, 'Flexão dos dedos · D 10° · E 12° · Dor final · lento')

  const varias = normalizeMobilidade({
    ativo: true,
    linhas: [
      { movimento: 'Flexão', direito: '110°' },
      { movimento: 'Algo solto', esquerdo: '5' },
    ],
  })
  equal(varias.regioes.length, 0)
  equal(varias.registroAnterior, 'Flexão · D 110°\nAlgo solto · E 5\nMovimento ativo')

  const enorme = normalizeMobilidade({
    linhas: [{ movimento: 'Flexão', observacao: 'x'.repeat(5000) }],
  })
  equal(enorme.registroAnterior?.length, 4000)
  equal(enorme.registroAnterior?.startsWith('Flexão · '), true)

  deepEqual(normalizeMobilidade(flexao), flexao)
})

test('REQ-36: Flexão de quadril marca só quadril e não copia para os outros movimentos', () => {
  const out = normalizeMobilidade({
    linhas: [{ movimento: 'Flexão de quadril', direito: '110°' }],
  })
  equal(out.regioes.length, 1)
  equal(out.regioes[0]?.regiao, 'quadril')
  equal(out.regioes[0]?.movimentos.length, 1)
  equal(out.regioes[0]?.movimentos[0]?.movimento, 'flexao')
  equal(out.regioes[0]?.movimentos[0]?.valorDireito, '110°')
  equal(out.regioes[0]?.movimentos.some((movimento) => movimento.movimento === 'extensao'), false)
  equal(out.registroAnterior, undefined)

  const invertido = normalizeMobilidade({
    linhas: [{ movimento: 'quadril Flexão', direito: '20°' }],
  })
  equal(invertido.regioes.length, 1)
  equal(invertido.regioes[0]?.regiao, 'quadril')
  equal(invertido.regioes[0]?.movimentos.length, 1)
  equal(invertido.regioes[0]?.movimentos[0]?.movimento, 'flexao')

  const sane = normalizeMobilidade({
    regioes: [
      {
        regiao: 'quadril',
        tipo: 'ativo',
        comparacao: 'bilateral',
        movimentos: [
          { movimento: 'flexao', valorDireito: '110°', dorDireito: { inicio: '9'.repeat(50), maxima: 11, observacao: 'o'.repeat(500) } },
          { movimento: 'dorsiflexao', valorDireito: '5°' },
        ],
      },
    ],
    registroAnterior: 'mantém',
    linhas: [{ movimento: 'Extensão', direito: '1' }],
    ativo: true,
    passivo: true,
  })
  equal(sane.regioes.length, 1)
  equal(sane.regioes[0]?.movimentos.length, 1)
  equal(sane.regioes[0]?.movimentos[0]?.movimento, 'flexao')
  equal(sane.regioes[0]?.movimentos[0]?.dorDireito?.inicio?.length, 40)
  equal(sane.regioes[0]?.movimentos[0]?.dorDireito?.maxima, undefined)
  equal(sane.regioes[0]?.movimentos[0]?.dorDireito?.observacao?.length, 400)
  equal(sane.regioes[0]?.tipo, 'ativo')
  equal(sane.registroAnterior, 'mantém')
  deepEqual(normalizeMobilidade(sane), sane)
  deepEqual(normalizeMobilidade(out), out)
})

test('REQ-36: Dorsiflexão único marca tornozelo', () => {
  const out = normalizeMobilidade({
    linhas: [{ movimento: 'Dorsiflexão', direito: '1'.repeat(100) }],
  })
  equal(out.regioes.length, 1)
  equal(out.regioes[0]?.regiao, 'tornozelo')
  equal(out.regioes[0]?.movimentos.length, 1)
  equal(out.regioes[0]?.movimentos[0]?.movimento, 'dorsiflexao')
  equal(out.regioes[0]?.movimentos[0]?.valorDireito?.length, 80)
  equal(out.registroAnterior, undefined)

  const tronco = CATALOGO_MOBILIDADE.find((regiao) => regiao.label === 'Tronco / coluna')
  const extensaoLombar = tronco?.movimentos.find((item) => item.label === 'Extensão de tronco / extensão lombar')
  const lombar = normalizeMobilidade({
    linhas: [{ movimento: 'Extensão lombar', esquerdo: '15°' }],
  })
  equal(lombar.regioes.length, 1)
  equal(lombar.regioes[0]?.regiao, tronco?.key)
  equal(lombar.regioes[0]?.movimentos.length, 1)
  equal(lombar.regioes[0]?.movimentos[0]?.movimento, extensaoLombar?.key)
  equal(lombar.regioes[0]?.movimentos[0]?.valorEsquerdo, '15°')
})

test('REQ-36: dor antiga não preenche painel D nem E', () => {
  const out = normalizeMobilidade({
    linhas: [{ movimento: 'Dorsiflexão', direito: '10°', dor: 'd'.repeat(300), observacao: 'o'.repeat(300) }],
  })
  const movimento = out.regioes[0]?.movimentos[0]
  equal(movimento?.dorDireito, undefined)
  equal(movimento?.dorEsquerdo, undefined)
  equal(movimento?.observacao?.length, 400)
  equal(movimento?.observacao?.startsWith('d'.repeat(20)), true)
  equal(movimento?.valorDireito, '10°')
})

test('REQ-36: checkbox global não abre região vazia', () => {
  const vazio = normalizeMobilidade({ ativo: true, passivo: true, bilateral: true })
  equal(vazio.regioes.length, 0)
  equal(vazio.registroAnterior, 'Movimento ativo\nMovimento passivo\nComparação bilateral')

  const soAtivo = normalizeMobilidade({ ativo: true })
  equal(soAtivo.regioes.length, 0)
  equal(soAtivo.registroAnterior, 'Movimento ativo')

  const marcado = normalizeMobilidade({
    ativo: true,
    passivo: true,
    bilateral: true,
    linhas: [{ movimento: 'Dorsiflexão', direito: '10°' }],
  })
  equal(marcado.regioes.length, 1)
  equal(marcado.regioes[0]?.regiao, 'tornozelo')
  equal(marcado.regioes[0]?.tipo, 'ambos')
  equal(marcado.regioes[0]?.comparacao, 'bilateral')
  equal(marcado.registroAnterior, undefined)

  const ativo = normalizeMobilidade({
    ativo: true,
    linhas: [{ movimento: 'Dorsiflexão' }],
  })
  equal(ativo.regioes[0]?.tipo, 'ativo')
  equal(ativo.regioes[0]?.comparacao, undefined)

  const passivo = normalizeMobilidade({
    passivo: true,
    linhas: [{ movimento: 'Dorsiflexão' }],
  })
  equal(passivo.regioes[0]?.tipo, 'passivo')

  const bilateralFalso = normalizeMobilidade({
    bilateral: false,
    linhas: [{ movimento: 'Dorsiflexão', direito: '10' }],
  })
  equal(bilateralFalso.regioes[0]?.comparacao, undefined)
  equal(bilateralFalso.registroAnterior, undefined)

  const dois = normalizeMobilidade({
    ativo: true,
    linhas: [
      { movimento: 'Dorsiflexão', direito: '10°' },
      { movimento: 'Flexão de quadril', direito: '110°' },
    ],
  })
  equal(dois.regioes.length, 2)
  equal(dois.regioes.every((regiao) => regiao.tipo === 'ativo' && regiao.comparacao === undefined), true)
  equal(dois.regioes.some((regiao) => regiao.regiao === 'ombro'), false)
})

test('REQ-36: linha Schober exata marca; Schober com texto fica no registro', () => {
  const out = normalizePalpacaoTestes({
    testesClinicos: 'Schober\nSchober: 5 cm',
  })
  deepEqual(out.testes, [{ regiao: 'lombar', teste: 'schober' }])
  equal(out.testes[0]?.resultado, undefined)
  equal(out.testesRegistroAnterior, 'Schober: 5 cm')
  equal(out.achados.length, 0)

  const ponto = normalizePalpacaoTestes({ testesClinicos: 'Schober; Schober: 5 cm' })
  deepEqual(ponto.testes, [{ regiao: 'lombar', teste: 'schober' }])
  equal(ponto.testesRegistroAnterior, 'Schober: 5 cm')

  const texto = normalizePalpacaoTestes('dor no masseter')
  equal(texto.achados.length, 0)
  equal(texto.testes.length, 0)
  equal(texto.palpacaoRegistroAnterior, 'dor no masseter')

  const legado = normalizePalpacaoTestes({
    palpacao: 'dor no masseter',
    testesClinicos: 'Schober: 5 cm',
    resultados: 'melhora',
    testeFuncional: 'caminhada',
    resultadoInicial: 'eva 6',
  })
  equal(legado.achados.length, 0)
  equal(legado.testes.length, 0)
  equal(legado.palpacaoRegistroAnterior, 'dor no masseter')
  equal(legado.testesRegistroAnterior, 'Schober: 5 cm')
  equal(legado.resultados, 'melhora')
  equal(legado.testeFuncional, 'caminhada')
  equal(legado.resultadoInicial, 'eva 6')

  const obrien = normalizePalpacaoTestes({ testesClinicos: "O'Brien" })
  equal(obrien.testes.length, 1)
  equal(obrien.testes[0]?.regiao, 'ombrocinturaescapular')
  equal(obrien.testes[0]?.teste, 'obrien')

  const slr = normalizePalpacaoTestes({ testesClinicos: 'SLR' })
  equal(slr.testes.length, 1)
  equal(slr.testes[0]?.regiao, 'neurologico')
  equal(slr.testes[0]?.teste, 'slr')

  const lasegue = CATALOGO_TESTES.find((regiao) => regiao.label === 'Lombar')?.testes.find(
    (item) => item.label === 'SLR / Lasègue',
  )
  const cruzado = normalizePalpacaoTestes({ testesClinicos: 'SLR / Lasègue' })
  equal(cruzado.testes.length, 1)
  equal(cruzado.testes[0]?.regiao, 'lombar')
  equal(cruzado.testes[0]?.teste, lasegue?.key)
  equal(cruzado.testes[0]?.teste === 'slr', false)

  deepEqual(normalizePalpacaoTestes(null), { achados: [], testes: [] })
  deepEqual(normalizePalpacaoTestes([]), { achados: [], testes: [] })
  deepEqual(normalizePalpacaoTestes(out), out)
})

test('REQ-36: PA central ambíguo não escolhe torácica nem lombar', () => {
  const out = normalizePalpacaoTestes({ testesClinicos: 'PA central' })
  equal(out.testes.length, 0)
  equal(out.testesRegistroAnterior, 'PA central')
  equal(out.achados.length, 0)
})

test('REQ-36: distração solta não marca cervical nem Waddell', () => {
  const out = normalizePalpacaoTestes({ testesClinicos: 'distração' })
  equal(out.testes.length, 0)
  equal(out.testesRegistroAnterior, 'distração')

  const sane = normalizePalpacaoTestes({
    achados: [
      { regiao: 'joelho', local: 'masseter', achado: 'doloroso' },
      { regiao: 'joelho', local: 'patela', lado: 'direito', achado: 'doloroso', dor: 4, observacao: 'calor' },
    ],
    testes: [
      {
        regiao: 'lombar',
        teste: 'outro',
        outroTexto: 'o'.repeat(250),
        resultado: 'r'.repeat(250),
      },
      { regiao: 'lombar', teste: 'gavetaanterior' },
    ],
    palpacaoRegistroAnterior: 'mantém palpação',
    testesRegistroAnterior: 'mantém testes',
    resultados: 'r'.repeat(2500),
    testeFuncional: 'caminhada',
    resultadoInicial: 'eva 6',
    palpacao: 'não copiar de novo',
    testesClinicos: 'Schober',
  })
  equal(sane.achados.length, 1)
  equal(sane.achados[0]?.local, 'patela')
  equal(sane.achados[0]?.dor, 4)
  equal(sane.testes.length, 1)
  equal(sane.testes[0]?.teste, 'outro')
  equal(sane.testes[0]?.outroTexto?.length, 200)
  equal(sane.testes[0]?.resultado?.length, 200)
  equal(sane.palpacaoRegistroAnterior, 'mantém palpação')
  equal(sane.testesRegistroAnterior, 'mantém testes')
  equal(sane.resultados?.length, 2000)
  equal(sane.testeFuncional, 'caminhada')
  equal(sane.resultadoInicial, 'eva 6')
  deepEqual(normalizePalpacaoTestes(sane), sane)
})

test('REQ-36: Outro é o último item de cada região de teste', () => {
  equal(CATALOGO_TESTES.length, 12)
  for (const regiao of CATALOGO_TESTES) {
    equal(regiao.testes.at(-1)?.label, 'Outro', regiao.label)
    equal(regiao.testes.at(-1)?.key, 'outro', regiao.label)
    ok(regiao.testes.length > 1, regiao.label)
  }
})

const FICHA_LEGADA = {
  anamnese: { queixa: { oQueTrouxe: 'dor no joelho ao correr' } },
  avaliacaoPlano: {
    mobilidade: {
      linhas: [{ movimento: 'Flexão de quadril', direito: '110°', esquerdo: '115°', dor: 'no fim', observacao: 'sem dor irradiada' }],
      ativo: true,
      passivo: true,
      bilateral: true,
    },
    forca: { linhas: [{ grupo: 'quadríceps', direito: '4' }] },
    palpacaoTestes: {
      palpacao: 'tensão no trapézio',
      testesClinicos: 'Schober: 5 cm',
      resultados: 'medida 12 cm',
      testeFuncional: 'agachar',
      resultadoInicial: 'eva 6',
    },
  },
}

function semChave(valor: object, chave: string) {
  equal(Object.prototype.hasOwnProperty.call(valor, chave), false, chave)
}

test('REQ-36: string de testesClinicos não derruba a ficha', () => {
  const parsed = evaluationFichaSchema.parse({
    avaliacaoPlano: {
      palpacaoTestes: {
        palpacao: 'tensão no trapézio',
        testesClinicos: 'Schober: 5 cm',
        resultados: 'medida 12 cm',
        testeFuncional: 'agachar',
        resultadoInicial: 'eva 6',
      },
    },
  })
  const bloco = parsed.avaliacaoPlano?.palpacaoTestes
  ok(bloco)
  equal(Array.isArray(bloco.testes), true)
  equal(bloco.testes?.length, 0)
  equal(bloco.testesRegistroAnterior, 'Schober: 5 cm')
  equal(bloco.palpacaoRegistroAnterior, 'tensão no trapézio')
  equal(bloco.resultados, 'medida 12 cm')
  equal(bloco.testeFuncional, 'agachar')
  equal(bloco.resultadoInicial, 'eva 6')
  semChave(bloco, 'palpacao')
  semChave(bloco, 'testesClinicos')
})

test('REQ-36: anamnese e força sobrevivem', () => {
  const parsed = evaluationFichaSchema.parse(FICHA_LEGADA)
  equal(parsed.anamnese?.queixa?.oQueTrouxe, 'dor no joelho ao correr')
  equal(parsed.avaliacaoPlano?.forca?.linhas?.[0]?.grupo, 'quadríceps')
  equal(parsed.avaliacaoPlano?.forca?.linhas?.[0]?.direito, '4')

  const mobilidade = parsed.avaliacaoPlano?.mobilidade
  ok(mobilidade)
  semChave(mobilidade, 'linhas')
  semChave(mobilidade, 'ativo')
  semChave(mobilidade, 'passivo')
  semChave(mobilidade, 'bilateral')
  equal(mobilidade.regioes?.[0]?.regiao, 'quadril')
  equal(mobilidade.regioes?.[0]?.tipo, 'ambos')
  equal(mobilidade.regioes?.[0]?.comparacao, 'bilateral')
  equal(mobilidade.regioes?.[0]?.movimentos?.[0]?.movimento, 'flexao')
  equal(mobilidade.regioes?.[0]?.movimentos?.[0]?.valorDireito, '110°')
  equal(mobilidade.regioes?.[0]?.movimentos?.[0]?.valorEsquerdo, '115°')
  equal('dorDireito' in (mobilidade.regioes?.[0]?.movimentos?.[0] ?? {}), false)
  equal('dorEsquerdo' in (mobilidade.regioes?.[0]?.movimentos?.[0] ?? {}), false)

  const bloco = parsed.avaliacaoPlano?.palpacaoTestes
  ok(bloco)
  semChave(bloco, 'palpacao')
  semChave(bloco, 'testesClinicos')
  equal(Array.isArray(bloco.testes), true)
})

test('REQ-36: segundo parse é idêntico', () => {
  const once = evaluationFichaSchema.parse(FICHA_LEGADA)
  const twice = evaluationFichaSchema.parse(once)
  deepEqual(twice, once)
  const mobilidade = once.avaliacaoPlano?.mobilidade
  const bloco = once.avaliacaoPlano?.palpacaoTestes
  ok(mobilidade)
  ok(bloco)
  semChave(mobilidade, 'linhas')
  semChave(mobilidade, 'ativo')
  semChave(mobilidade, 'passivo')
  semChave(mobilidade, 'bilateral')
  semChave(bloco, 'palpacao')
  semChave(bloco, 'testesClinicos')
  equal(Array.isArray(bloco.testes), true)
  equal(Array.isArray(mobilidade.regioes), true)
})

test('REQ-36: parse({}) continua válido', () => {
  const parsed = evaluationFichaSchema.parse({})
  deepEqual(parsed, emptyEvaluationFicha())
  deepEqual(parsed.avaliacaoPlano?.mobilidade, { regioes: [] })
  deepEqual(parsed.avaliacaoPlano?.palpacaoTestes, { achados: [], testes: [] })
  equal(parsed.avaliacaoPlano?.forca?.linhas?.length, 0)
})

test('REQ-36: leitores 04.B e 04.E usam o formatador', () => {
  const catalogPath = fileURLToPath(new URL('./pdfFieldCatalog.ts', import.meta.url))
  const servicePath = fileURLToPath(new URL('../services/patientAiPdf.service.ts', import.meta.url))
  equal(catalogPath.includes('patient-ai-summary'), false)
  equal(servicePath.includes('patient-ai-summary'), false)

  const catalog = readFileSync(catalogPath, 'utf8')
  const aposInspecao = catalog.indexOf("id: '04.A'")
  const antesForca = catalog.indexOf("id: '04.C'", aposInspecao)
  equal(aposInspecao >= 0 && antesForca > aposInspecao, true)
  const catalogB = catalog.slice(aposInspecao, antesForca)
  equal(catalogB.includes('formatCabecalhoRegiao'), true)
  equal(catalogB.includes('formatLinhaMovimento'), true)
  equal(catalogB.includes('mobilidade?.linhas'), false)

  const aposNeuro = catalog.indexOf("id: '04.D'")
  const antesSintese = catalog.indexOf("id: '04.F'", aposNeuro)
  equal(aposNeuro >= 0 && antesSintese > aposNeuro, true)
  const catalogE = catalog.slice(aposNeuro, antesSintese)
  equal(catalogE.includes('formatAchado'), true)
  equal(catalogE.includes('formatTeste'), true)
  equal(catalogE.includes('palpacaoTestes?.palpacao'), false)
  equal(catalogE.includes('palpacaoTestes?.testesClinicos'), false)
  equal(catalog.includes('forca?.linhas'), true)

  const service = readFileSync(servicePath, 'utf8')
  const winStart = service.indexOf('function toWinAnsiSafe')
  const winEnd = service.indexOf('\nfunction ', winStart + 1)
  equal(winStart >= 0 && winEnd > winStart, true)
  const winAnsi = service.slice(winStart, winEnd)
  equal(winAnsi.includes('→'), false)
  equal(winAnsi.includes('\\u2192'), false)
  equal(winAnsi.includes('2192'), false)

  const secao04 = service.indexOf('04 Avaliação e plano')
  const show04B = service.indexOf('if (show04B)')
  equal(secao04 >= 0 && show04B > secao04, true)
  const antesDraw = service.slice(secao04, show04B)
  equal(antesDraw.includes('mobilidade?.linhas'), false)
  equal(antesDraw.includes('palpacaoTestes?.palpacao'), false)
  equal(antesDraw.includes('palpacaoTestes?.testesClinicos'), false)
  equal(service.includes('forca?.linhas'), true)

  const frameC = service.indexOf("drawFichaBlockFrame(ctx, 'C'", show04B)
  equal(frameC > show04B, true)
  const frameB = service.slice(show04B, frameC)
  equal(frameB.includes('formatLinhaMovimento'), true)
  equal(frameB.includes('formatCabecalhoRegiao'), true)
  equal(frameB.includes(".replaceAll('→', '->')"), true)
  equal(frameB.includes('mobilidade?.linhas'), false)
  equal(frameB.includes('drawDataTable'), false)
  equal(frameB.includes('Dor/Sintoma'), false)

  const show04E = service.indexOf('if (show04E)')
  const frameF = service.indexOf('if (show04F', show04E)
  equal(show04E >= 0 && frameF > show04E, true)
  const frameE = service.slice(show04E, frameF)
  equal(frameE.includes('formatAchado'), true)
  equal(frameE.includes('formatTeste'), true)
  equal(frameE.includes(".replaceAll('→', '->')"), true)
  equal(frameE.includes('palpacaoTestes?.palpacao'), false)
  equal(frameE.includes('palpacaoTestes?.testesClinicos'), false)

  const show04C = service.indexOf('if (show04C)')
  const frameD = service.indexOf("drawFichaBlockFrame(ctx, 'D'", show04C)
  equal(show04C >= 0 && frameD > show04C, true)
  equal(service.slice(show04C, frameD).includes('drawDataTable'), true)
})
