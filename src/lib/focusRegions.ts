/**
 * Catálogo fixo de regiões da silhueta (REQ-18).
 * Labels em português; não é texto livre.
 * UI-SPEC 30 keys (não o rascunho de 38 do RESEARCH).
 */

export const FOCUS_REGION_KEYS = [
  'front.head',
  'front.neck',
  'front.shoulder_l',
  'front.shoulder_r',
  'front.chest',
  'front.abdomen',
  'front.arm_l',
  'front.arm_r',
  'front.hip',
  'front.thigh_l',
  'front.thigh_r',
  'front.knee_l',
  'front.knee_r',
  'front.leg_l',
  'front.leg_r',
  'back.neck',
  'back.shoulder_l',
  'back.shoulder_r',
  'back.upper',
  'back.lumbar',
  'back.glute_l',
  'back.glute_r',
  'back.arm_l',
  'back.arm_r',
  'back.thigh_l',
  'back.thigh_r',
  'back.knee_l',
  'back.knee_r',
  'back.leg_l',
  'back.leg_r',
] as const

export type FocusRegionKey = (typeof FOCUS_REGION_KEYS)[number]
export type FocusView = 'front' | 'back'

export interface FocusRegion {
  key: FocusRegionKey
  label: string
  view: FocusView
  sortOrder: number
  path: string
}

export const FOCUS_REGIONS: readonly FocusRegion[] = [
  {
    key: 'front.head',
    label: 'Cabeça',
    view: 'front',
    sortOrder: 0,
    path: 'M70 8C59.5 8 52.5 15.5 52.5 25C52.5 34 59.5 41 70 41C80.5 41 87.5 34 87.5 25C87.5 15.5 80.5 8 70 8Z',
  },
  {
    key: 'front.neck',
    label: 'Pescoço',
    view: 'front',
    sortOrder: 1,
    path: 'M64.5 41H75.5L77 52H63Z',
  },
  {
    key: 'front.shoulder_l',
    label: 'Ombro esquerdo',
    view: 'front',
    sortOrder: 2,
    path: 'M89 52H98.5C103.8 52 106.5 56 106.5 61.5C106.5 66 104.2 70 100.5 70H89V52Z',
  },
  {
    key: 'front.shoulder_r',
    label: 'Ombro direito',
    view: 'front',
    sortOrder: 3,
    path: 'M51 52H41.5C36.2 52 33.5 56 33.5 61.5C33.5 66 35.8 70 39.5 70H51V52Z',
  },
  {
    key: 'front.chest',
    label: 'Tórax',
    view: 'front',
    sortOrder: 4,
    path: 'M51 52H89V106H51Z',
  },
  {
    key: 'front.abdomen',
    label: 'Abdômen',
    view: 'front',
    sortOrder: 5,
    path: 'M53 108H87L85 138H55Z',
  },
  {
    key: 'front.arm_l',
    label: 'Braço esquerdo',
    view: 'front',
    sortOrder: 6,
    path: 'M91 71H100.5L101.6 116L99.2 150C99.2 155.2 94.4 155.2 94.4 150L92.4 116L91 71Z',
  },
  {
    key: 'front.arm_r',
    label: 'Braço direito',
    view: 'front',
    sortOrder: 7,
    path: 'M49 71H39.5L38.4 116L40.8 150C40.8 155.2 45.6 155.2 45.6 150L47.6 116L49 71Z',
  },
  {
    key: 'front.hip',
    label: 'Quadril',
    view: 'front',
    sortOrder: 8,
    path: 'M51 140H89L87 156H53Z',
  },
  {
    key: 'front.thigh_l',
    label: 'Coxa esquerda',
    view: 'front',
    sortOrder: 9,
    path: 'M72 158H87L85.5 190H73.5Z',
  },
  {
    key: 'front.thigh_r',
    label: 'Coxa direita',
    view: 'front',
    sortOrder: 10,
    path: 'M68 158H53L54.5 190H66.5Z',
  },
  {
    key: 'front.knee_l',
    label: 'Joelho esquerdo',
    view: 'front',
    sortOrder: 11,
    path: 'M73.5 192H85.5L85 204H74Z',
  },
  {
    key: 'front.knee_r',
    label: 'Joelho direito',
    view: 'front',
    sortOrder: 12,
    path: 'M66.5 192H54.5L55 204H66Z',
  },
  {
    key: 'front.leg_l',
    label: 'Perna esquerda',
    view: 'front',
    sortOrder: 13,
    path: 'M74 206H85L85.5 224C91 224 95 226 95 228.5L93.5 232H81C77.5 232 75.5 230 74.8 226.5L74 206Z',
  },
  {
    key: 'front.leg_r',
    label: 'Perna direita',
    view: 'front',
    sortOrder: 14,
    path: 'M66 206H55L54.5 224C49 224 45 226 45 228.5L46.5 232H59C62.5 232 64.5 230 65.2 226.5L66 206Z',
  },
  {
    key: 'back.neck',
    label: 'Cervical',
    view: 'back',
    sortOrder: 15,
    path: 'M70 8C59.5 8 52.5 15.5 52.5 25C52.5 33.5 58 40 64 44L62 52H78L76 44C82 40 87.5 33.5 87.5 25C87.5 15.5 80.5 8 70 8Z',
  },
  {
    key: 'back.shoulder_l',
    label: 'Ombro esquerdo',
    view: 'back',
    sortOrder: 16,
    path: 'M51 52H41.5C36.2 52 33.5 56 33.5 61.5C33.5 66 35.8 70 39.5 70H51V52Z',
  },
  {
    key: 'back.shoulder_r',
    label: 'Ombro direito',
    view: 'back',
    sortOrder: 17,
    path: 'M89 52H98.5C103.8 52 106.5 56 106.5 61.5C106.5 66 104.2 70 100.5 70H89V52Z',
  },
  {
    key: 'back.upper',
    label: 'Dorsal',
    view: 'back',
    sortOrder: 18,
    path: 'M51 52H89V106H51Z',
  },
  {
    key: 'back.lumbar',
    label: 'Lombar',
    view: 'back',
    sortOrder: 19,
    path: 'M53 108H87L85 138H55Z',
  },
  {
    key: 'back.glute_l',
    label: 'Glúteo esquerdo',
    view: 'back',
    sortOrder: 20,
    path: 'M51 140H68V156H51Z',
  },
  {
    key: 'back.glute_r',
    label: 'Glúteo direito',
    view: 'back',
    sortOrder: 21,
    path: 'M72 140H89V156H72Z',
  },
  {
    key: 'back.arm_l',
    label: 'Braço esquerdo',
    view: 'back',
    sortOrder: 22,
    path: 'M49 71H39.5L38.4 116L40.8 150C40.8 155.2 45.6 155.2 45.6 150L47.6 116L49 71Z',
  },
  {
    key: 'back.arm_r',
    label: 'Braço direito',
    view: 'back',
    sortOrder: 23,
    path: 'M91 71H100.5L101.6 116L99.2 150C99.2 155.2 94.4 155.2 94.4 150L92.4 116L91 71Z',
  },
  {
    key: 'back.thigh_l',
    label: 'Coxa esquerda',
    view: 'back',
    sortOrder: 24,
    path: 'M68 158H53L54.5 190H66.5Z',
  },
  {
    key: 'back.thigh_r',
    label: 'Coxa direita',
    view: 'back',
    sortOrder: 25,
    path: 'M72 158H87L85.5 190H73.5Z',
  },
  {
    key: 'back.knee_l',
    label: 'Joelho esquerdo',
    view: 'back',
    sortOrder: 26,
    path: 'M66.5 192H54.5L55 204H66Z',
  },
  {
    key: 'back.knee_r',
    label: 'Joelho direito',
    view: 'back',
    sortOrder: 27,
    path: 'M73.5 192H85.5L85 204H74Z',
  },
  {
    key: 'back.leg_l',
    label: 'Perna esquerda',
    view: 'back',
    sortOrder: 28,
    path: 'M66 206H55L54.5 224C49 224 45 226 45 228.5L46.5 232H59C62.5 232 64.5 230 65.2 226.5L66 206Z',
  },
  {
    key: 'back.leg_r',
    label: 'Perna direita',
    view: 'back',
    sortOrder: 29,
    path: 'M74 206H85L85.5 224C91 224 95 226 95 228.5L93.5 232H81C77.5 232 75.5 230 74.8 226.5L74 206Z',
  },
]

const focusRegionByKey = new Map<string, FocusRegion>(
  FOCUS_REGIONS.map((region) => [region.key, region]),
)

const sharedFocusLabels = new Set(
  FOCUS_REGIONS.filter((region) =>
    FOCUS_REGIONS.some((other) => other !== region && other.label === region.label),
  ).map((region) => region.label),
)

function viewParenthetical(view: FocusView): string {
  return view === 'front' ? '(frente)' : '(costas)'
}

export function getFocusRegion(key: string): FocusRegion | undefined {
  return focusRegionByKey.get(key)
}

export function listFocusRegionsByView(view: FocusView): FocusRegion[] {
  return FOCUS_REGIONS.filter((region) => region.view === view)
}

export function focusRegionPathAriaLabel(region: FocusRegion): string {
  if (!sharedFocusLabels.has(region.label)) return region.label
  return `${region.label} ${viewParenthetical(region.view)}`
}

export function focusRegionListLabel(region: FocusRegion): string {
  return `${region.label} ${viewParenthetical(region.view)}`
}
