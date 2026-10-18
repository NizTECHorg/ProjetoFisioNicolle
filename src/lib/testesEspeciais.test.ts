import { test } from 'node:test'
import { deepEqual, equal } from 'node:assert/strict'
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

test('REQ-49: Coluna tem os 6 testes na ordem, e as outras regiões estão vazias', () => {
  deepEqual(coluna.tests.map((t) => t.name), EXPECTED.map((t) => t.name))
  deepEqual(coluna.tests.map((t) => t.id), EXPECTED.map((t) => t.id))
  for (const region of SPECIAL_TEST_REGIONS.slice(1)) equal(region.tests.length, 0)
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
  deepEqual(searchSpecialTests('ciatico').map((h) => h.test.id), ['lasegue'])
  deepEqual(searchSpecialTests('cervical').map((h) => h.test.id), ['spurling'])
  equal(searchSpecialTests('  slump  ').length, 1)
  for (const q of ['', '   ', 'xyz123']) deepEqual(searchSpecialTests(q), [])
  for (const hit of searchSpecialTests('lasegue')) equal(hit.region.label, 'Coluna')
})
