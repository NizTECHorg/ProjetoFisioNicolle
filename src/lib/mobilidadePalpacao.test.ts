import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { deepEqual, equal, ok } from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
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

test('REQ-36: Outro é o último item de cada região de teste', () => {
  equal(CATALOGO_TESTES.length, 12)
  for (const regiao of CATALOGO_TESTES) {
    equal(regiao.testes.at(-1)?.label, 'Outro', regiao.label)
    equal(regiao.testes.at(-1)?.key, 'outro', regiao.label)
    ok(regiao.testes.length > 1, regiao.label)
  }
})
