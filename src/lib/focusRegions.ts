/**
 * Catálogo fixo de regiões da silhueta (REQ-18, REQ-30).
 * Labels em português; não é texto livre.
 * UI-SPEC 42 keys.
 */

export const FOCUS_REGION_KEYS = [
  'front.head',
  'front.neck',
  'front.shoulder_l',
  'front.shoulder_r',
  'front.chest',
  'front.abdomen',
  'front.upper_arm_l',
  'front.upper_arm_r',
  'front.forearm_l',
  'front.forearm_r',
  'front.palm_l',
  'front.palm_r',
  'front.hip',
  'front.thigh_l',
  'front.thigh_r',
  'front.knee_l',
  'front.knee_r',
  'front.shin_l',
  'front.shin_r',
  'front.foot_l',
  'front.foot_r',
  'back.neck',
  'back.shoulder_l',
  'back.shoulder_r',
  'back.upper',
  'back.lumbar',
  'back.glute_l',
  'back.glute_r',
  'back.upper_arm_l',
  'back.upper_arm_r',
  'back.forearm_l',
  'back.forearm_r',
  'back.hand_l',
  'back.hand_r',
  'back.thigh_l',
  'back.thigh_r',
  'back.knee_l',
  'back.knee_r',
  'back.calf_l',
  'back.calf_r',
  'back.ankle_l',
  'back.ankle_r',
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
    key: 'front.upper_arm_l',
    label: 'Braço esquerdo',
    view: 'front',
    sortOrder: 30,
    path: 'M91 71H100.5L101.5 112H92Z',
  },
  {
    key: 'front.upper_arm_r',
    label: 'Braço direito',
    view: 'front',
    sortOrder: 31,
    path: 'M49 71H39.5L38.5 112H48Z',
  },
  {
    key: 'front.forearm_l',
    label: 'Antebraço esquerdo',
    view: 'front',
    sortOrder: 32,
    path: 'M92 112H101.5L100.5 150H93Z',
  },
  {
    key: 'front.forearm_r',
    label: 'Antebraço direito',
    view: 'front',
    sortOrder: 33,
    path: 'M48 112H38.5L39.5 150H47Z',
  },
  {
    key: 'front.palm_l',
    label: 'Palma da mão esquerda',
    view: 'front',
    sortOrder: 34,
    path: 'M93 150H100.5V178H93Z',
  },
  {
    key: 'front.palm_r',
    label: 'Palma da mão direita',
    view: 'front',
    sortOrder: 35,
    path: 'M47 150H39.5V178H47Z',
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
    key: 'front.shin_l',
    label: 'Canela esquerda',
    view: 'front',
    sortOrder: 36,
    path: 'M74 206H85V212H74Z',
  },
  {
    key: 'front.shin_r',
    label: 'Canela direita',
    view: 'front',
    sortOrder: 37,
    path: 'M66 206H55V212H66Z',
  },
  {
    key: 'front.foot_l',
    label: 'Pé esquerdo',
    view: 'front',
    sortOrder: 38,
    path: 'M74 212H85L95 228L93.5 240H76Z',
  },
  {
    key: 'front.foot_r',
    label: 'Pé direito',
    view: 'front',
    sortOrder: 39,
    path: 'M66 212H55L45 228L46.5 240H64Z',
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
    key: 'back.upper_arm_l',
    label: 'Braço esquerdo',
    view: 'back',
    sortOrder: 40,
    path: 'M49 71H39.5L38.5 112H48Z',
  },
  {
    key: 'back.upper_arm_r',
    label: 'Braço direito',
    view: 'back',
    sortOrder: 41,
    path: 'M91 71H100.5L101.5 112H92Z',
  },
  {
    key: 'back.forearm_l',
    label: 'Antebraço esquerdo',
    view: 'back',
    sortOrder: 42,
    path: 'M48 112H38.5L39.5 150H47Z',
  },
  {
    key: 'back.forearm_r',
    label: 'Antebraço direito',
    view: 'back',
    sortOrder: 43,
    path: 'M92 112H101.5L100.5 150H93Z',
  },
  {
    key: 'back.hand_l',
    label: 'Mão esquerda',
    view: 'back',
    sortOrder: 44,
    path: 'M47 150H39.5V178H47Z',
  },
  {
    key: 'back.hand_r',
    label: 'Mão direita',
    view: 'back',
    sortOrder: 45,
    path: 'M93 150H100.5V178H93Z',
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
    key: 'back.calf_l',
    label: 'Panturrilha esquerda',
    view: 'back',
    sortOrder: 46,
    path: 'M66 206H55V212H66Z',
  },
  {
    key: 'back.calf_r',
    label: 'Panturrilha direita',
    view: 'back',
    sortOrder: 47,
    path: 'M74 206H85V212H74Z',
  },
  {
    key: 'back.ankle_l',
    label: 'Tornozelo esquerdo',
    view: 'back',
    sortOrder: 48,
    path: 'M66 212H55L45 228L46.5 240H64Z',
  },
  {
    key: 'back.ankle_r',
    label: 'Tornozelo direito',
    view: 'back',
    sortOrder: 49,
    path: 'M74 212H85L95 228L93.5 240H76Z',
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
