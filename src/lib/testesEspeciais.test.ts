import { test } from 'node:test'
import { deepEqual, equal, ok } from 'node:assert/strict'
import {
  DEFAULT_REGION_ID,
  SPECIAL_TEST_REGIONS,
  findRegion,
  findSpecialTest,
  foldText,
  isRegionId,
  searchSpecialTests,
} from './testesEspeciais.ts'

const coluna = findRegion('coluna')

const EXPECTED = [
  {
    id: 'lasegue',
    name: 'Teste de Lasègue (Elevação da Perna Reta)',
    summary: 'Avaliar irritação ou compressão das raízes nervosas L4-S1 (nervo ciático).',
    technique:
      'Paciente em decúbito dorsal. O examinador eleva passivamente o membro inferior com o joelho estendido. O teste é realizado lentamente, observando o ângulo em que os sintomas aparecem.',
    interpretation:
      'Positivo: dor irradiada pelo trajeto do nervo ciático entre 30° e 70° de elevação. Dor apenas na região lombar ou posterior da coxa não é considerada positiva. A dorsiflexão do tornozelo no ponto de dor (manobra de Bragard) que intensifica os sintomas reforça o achado.',
  },
  {
    id: 'lasegue-cruzado',
    name: 'Teste de Lasègue Cruzado (Contralateral)',
    summary: 'Identificar hérnia discal extrusiva com compressão radicular significativa.',
    technique:
      'Mesmo posicionamento do Lasègue. Eleva-se o membro inferior assintomático. Observa-se se há reprodução da dor no membro contralateral (sintomático).',
    interpretation:
      'Positivo: dor irradiada para o lado contralateral (sintomático). Alta especificidade para hérnia discal com fragmento extrusivo comprimindo a raiz nervosa.',
  },
  {
    id: 'slump',
    name: 'Teste de Slump',
    summary: 'Avaliar tensão neural adversa em toda a cadeia neuromeníngea posterior.',
    technique:
      'Paciente sentado na borda da maca. Solicita-se flexão torácica e cervical (queixo no peito), extensão do joelho e dorsiflexão do tornozelo. O examinador aplica pressão sobre os ombros para manter a flexão.',
    interpretation:
      'Positivo: reprodução dos sintomas radiculares. A extensão cervical que alivia os sintomas confirma origem neural. Útil quando o Lasègue é negativo mas há suspeita de tensão neural.',
  },
  {
    id: 'spurling',
    name: 'Teste de Spurling',
    summary: 'Avaliar compressão radicular cervical (estreitamento foraminal).',
    technique:
      'Paciente sentado. O examinador posiciona a cervical em extensão, rotação e inclinação lateral para o lado sintomático e aplica compressão axial sobre o topo da cabeça.',
    interpretation:
      'Positivo: reprodução da dor irradiada para o membro superior ipsilateral. Alta especificidade para radiculopatia cervical por estreitamento foraminal.',
  },
  {
    id: 'valsalva',
    name: 'Teste de Valsalva',
    summary: 'Avaliar aumento da pressão intratecal e sua relação com dor radicular.',
    technique:
      "Solicita-se ao paciente que realize manobra de Valsalva (esforço expiratório contra glote fechada, como 'fazer força para evacuar'). Manter por alguns segundos.",
    interpretation:
      'Positivo: reprodução ou exacerbação de dor radicular. Sugere lesão que ocupa espaço no canal medular (hérnia discal, tumor, estenose).',
  },
  {
    id: 'schober',
    name: 'Teste de Schober',
    summary: 'Avaliar a mobilidade da coluna lombar em flexão.',
    technique:
      'Paciente em pé. Marca-se um ponto na linha mediana na altura de S1 e outro 10 cm acima. Solicita-se flexão máxima do tronco e mede-se a nova distância entre os pontos.',
    interpretation:
      'Normal: aumento ≥ 5 cm (distância final ≥ 15 cm). Valores < 15 cm indicam restrição da mobilidade lombar, como visto em espondilite anquilosante ou rigidez muscular importante.',
  },
]

test('REQ-49: regiões na ordem e com rótulos esperados', () => {
  deepEqual(SPECIAL_TEST_REGIONS.map((r) => r.id), [
    'coluna', 'ombro', 'cotovelo', 'joelho', 'quadril', 'tornozelo', 'mao', 'fraturas',
  ])
  deepEqual(SPECIAL_TEST_REGIONS.map((r) => r.label), [
    'Coluna', 'Ombro', 'Cotovelo', 'Joelho', 'Quadril', 'Tornozelo', 'Mão', 'Fraturas',
  ])
  equal(DEFAULT_REGION_ID, 'coluna')
  equal(findRegion('mao').label, 'Mão')
})

test('REQ-49: Coluna começa com os 6 testes da Phase 38, na ordem; os novos vêm depois', () => {
  deepEqual(coluna.tests.slice(0, EXPECTED.length).map((t) => t.id), EXPECTED.map((t) => t.id))
  deepEqual(coluna.tests.slice(EXPECTED.length).map((t) => t.id), ['compressao-axial', 'distracao'])
})

test('Ombro: 8 testes na ordem enviada', () => {
  deepEqual(findRegion('ombro').tests.map((t) => t.id), [
    'neer', 'hawkins-kennedy', 'jobe', 'gerber', 'speed', 'yergason', 'apprehension', 'obrien',
  ])
  for (const t of findRegion('ombro').tests) ok(t.summary && t.technique && t.interpretation)
})

test('Cotovelo: 11 testes na ordem enviada, todos completos', () => {
  deepEqual(findRegion('cotovelo').tests.map((t) => t.id), [
    'cozen', 'mill', 'maudsley', 'golfista', 'estresse-valgo-cotovelo', 'estresse-varo-cotovelo',
    'tinel-cotovelo', 'flexao-cotovelo', 'pivot-shift-cotovelo', 'chair-push-up', 'bursa-olecraniana',
  ])
  for (const t of findRegion('cotovelo').tests) ok(t.summary && t.technique && t.interpretation)
})

test('Joelho: 8 testes na ordem enviada, todos completos', () => {
  deepEqual(findRegion('joelho').tests.map((t) => t.id), [
    'lachman', 'gaveta-anterior', 'gaveta-posterior', 'mcmurray', 'apley',
    'estresse-valgo-joelho', 'estresse-varo-joelho', 'clarke',
  ])
  for (const t of findRegion('joelho').tests) ok(t.summary && t.technique && t.interpretation)
})

test('Quadril: 7 testes na ordem enviada, todos completos', () => {
  deepEqual(findRegion('quadril').tests.map((t) => t.id), [
    'fadir', 'faber', 'thomas', 'ober', 'trendelenburg', 'fair', 'log-roll',
  ])
  for (const t of findRegion('quadril').tests) ok(t.summary && t.technique && t.interpretation)
})

test('Tornozelo: 7 testes na ordem enviada, todos completos', () => {
  deepEqual(findRegion('tornozelo').tests.map((t) => t.id), [
    'gaveta-anterior-tornozelo', 'inclinacao-talar', 'thompson', 'squeeze', 'windlass',
    'tinel-tibial-posterior', 'estabilidade-mediope',
  ])
  for (const t of findRegion('tornozelo').tests) ok(t.summary && t.technique && t.interpretation)
})

test('Mão: 11 testes na ordem enviada, todos completos', () => {
  deepEqual(findRegion('mao').tests.map((t) => t.id), [
    'phalen', 'phalen-reverso', 'tinel-punho', 'finkelstein', 'eichhoff', 'dedo-gatilho',
    'bunnell-littler', 'allen', 'watson', 'tabaqueira-anatomica', 'grind-polegar',
  ])
  for (const t of findRegion('mao').tests) ok(t.summary && t.technique && t.interpretation)
})

test('Fraturas: 12 testes na ordem enviada, todos completos', () => {
  deepEqual(findRegion('fraturas').tests.map((t) => t.id), [
    'ottawa-tornozelo', 'ottawa-joelho', 'percussao-tap', 'diapasao', 'compressao-axial-vertebral',
    'percussao-espinhosos', 'coccix', 'galleazi', 'apoio-unipodal', 'sulcus',
    'apreensao-anterior-fratura', 'drop-arm',
  ])
  for (const t of findRegion('fraturas').tests) ok(t.summary && t.technique && t.interpretation)
})

test('Coluna: Compressão Axial e Distração com o texto enviado', () => {
  const axial = coluna.tests.find((t) => t.id === 'compressao-axial')
  equal(axial?.summary, 'Diferenciar dor lombar mecânica de dor por fratura ou lesão discal.')
  const distracao = coluna.tests.find((t) => t.id === 'distracao')
  equal(distracao?.summary, 'Avaliar sinais não orgânicos (Waddell) e componente psicogênico da dor.')
})

test('REQ-49: textos literais dos 6 testes da Coluna', () => {
  EXPECTED.forEach((expected, i) => {
    const actual = coluna.tests[i]
    if (!actual) throw new Error(`teste ausente: ${expected.id}`)
    equal(actual.summary, expected.summary)
    equal(actual.technique, expected.technique)
    equal(actual.interpretation, expected.interpretation)
  })
})

test('REQ-49: ids de teste são únicos', () => {
  const ids = SPECIAL_TEST_REGIONS.flatMap((r) => r.tests.map((t) => t.id))
  equal(new Set(ids).size, ids.length)
})

test('REQ-49: foldText remove acento e caixa', () => {
  equal(foldText('Lasègue Mão'), 'lasegue mao')
})

test('REQ-49: isRegionId valida só ids do catálogo', () => {
  equal(isRegionId('mao'), true)
  for (const bad of ['Mão', 'constructor', '__proto__', null, '']) equal(isRegionId(bad), false)
})

test('REQ-49: findSpecialTest resolve ids e nunca lança', () => {
  const hit = findSpecialTest('slump')
  equal(hit?.region.id, 'coluna')
  equal(hit?.test.name, 'Teste de Slump')
  for (const bad of ['nao-existe', '', null, '__proto__', 'toString']) {
    equal(findSpecialTest(bad), null)
  }
})

test('REQ-49: busca ignora acento e maiúscula, em nome e resumo', () => {
  deepEqual(searchSpecialTests('lasegue').map((h) => h.test.id), ['lasegue', 'lasegue-cruzado'])
  deepEqual(searchSpecialTests('LASÈGUE').map((h) => h.test.id), ['lasegue', 'lasegue-cruzado'])
  deepEqual(searchSpecialTests('ciatico').map((h) => h.test.id), ['lasegue', 'fair'])
  deepEqual(searchSpecialTests('cervical').map((h) => h.test.id), ['spurling'])
  equal(searchSpecialTests('  slump  ').length, 1)
  for (const q of ['', '   ', 'xyz123']) deepEqual(searchSpecialTests(q), [])
  for (const hit of searchSpecialTests('lasegue')) equal(hit.region.label, 'Coluna')
})
