/**
 * Catálogo estático de testes especiais ortopédicos, agrupado por região.
 * Para dar conteúdo a uma nova região, basta acrescentar objetos em `tests`.
 */

export type SpecialTestRegionId =
  | 'coluna'
  | 'ombro'
  | 'cotovelo'
  | 'joelho'
  | 'quadril'
  | 'tornozelo'
  | 'mao'
  | 'fraturas'

export interface SpecialTest {
  readonly id: string
  readonly name: string
  /** Objetivo do teste */
  readonly summary: string
  readonly technique: string
  readonly interpretation: string
}

export interface SpecialTestRegion {
  readonly id: SpecialTestRegionId
  readonly label: string
  readonly tests: readonly SpecialTest[]
}

export interface SpecialTestHit {
  readonly region: SpecialTestRegion
  readonly test: SpecialTest
}

export const SPECIAL_TEST_REGIONS: readonly SpecialTestRegion[] = [
  {
    id: 'coluna',
    label: 'Coluna',
    tests: [
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
    ],
  },
  { id: 'ombro', label: 'Ombro', tests: [] },
  { id: 'cotovelo', label: 'Cotovelo', tests: [] },
  { id: 'joelho', label: 'Joelho', tests: [] },
  { id: 'quadril', label: 'Quadril', tests: [] },
  { id: 'tornozelo', label: 'Tornozelo', tests: [] },
  { id: 'mao', label: 'Mão', tests: [] },
  { id: 'fraturas', label: 'Fraturas', tests: [] },
]

export const DEFAULT_REGION_ID: SpecialTestRegionId = 'coluna'

export function foldText(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

export function isRegionId(value: string | null | undefined): value is SpecialTestRegionId {
  return typeof value === 'string' && SPECIAL_TEST_REGIONS.some((r) => r.id === value)
}

export function findRegion(id: SpecialTestRegionId): SpecialTestRegion {
  return (
    SPECIAL_TEST_REGIONS.find((r) => r.id === id) ??
    SPECIAL_TEST_REGIONS.find((r) => r.id === DEFAULT_REGION_ID) ?? {
      id: DEFAULT_REGION_ID,
      label: 'Coluna',
      tests: [],
    }
  )
}

export function findSpecialTest(id: string | null | undefined): SpecialTestHit | null {
  if (typeof id !== 'string' || id === '') return null
  for (const region of SPECIAL_TEST_REGIONS) {
    const test = region.tests.find((t) => t.id === id)
    if (test) return { region, test }
  }
  return null
}

export function searchSpecialTests(term: string): SpecialTestHit[] {
  const q = foldText(term.trim())
  if (q === '') return []
  const hits: SpecialTestHit[] = []
  for (const region of SPECIAL_TEST_REGIONS) {
    for (const test of region.tests) {
      if (foldText(test.name).includes(q) || foldText(test.summary).includes(q)) {
        hits.push({ region, test })
      }
    }
  }
  return hits
}
