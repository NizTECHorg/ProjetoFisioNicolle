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
    path: 'M70 10C57 10 52 17 52 26C52 35 59 40 70 40C81 40 88 35 88 26C88 17 83 10 70 10Z',
  },
  {
    key: 'front.neck',
    label: 'Pescoço',
    view: 'front',
    sortOrder: 1,
    path: 'M63 44H77L80 56H60Z',
  },
  {
    key: 'front.shoulder_l',
    label: 'Ombro esquerdo',
    view: 'front',
    sortOrder: 2,
    path: 'M90 60H104C110 60 114 61 116 66C116 72 114 80 108 80H90V60Z',
  },
  {
    key: 'front.shoulder_r',
    label: 'Ombro direito',
    view: 'front',
    sortOrder: 3,
    path: 'M50 60H36C30 60 26 61 24 66C24 72 26 80 32 80H50V60Z',
  },
  {
    key: 'front.chest',
    label: 'Tórax',
    view: 'front',
    sortOrder: 4,
    path: 'M54 60H86V110H54Z',
  },
  {
    key: 'front.abdomen',
    label: 'Abdômen',
    view: 'front',
    sortOrder: 5,
    path: 'M56 114H84L82 142H58Z',
  },
  {
    key: 'front.arm_l',
    label: 'Braço esquerdo',
    view: 'front',
    sortOrder: 6,
    path: 'M116 84H90L94 136L90 154C90 164 102 170 112 166C122 162 124 152 118 148L112 136L116 84Z',
  },
  {
    key: 'front.arm_r',
    label: 'Braço direito',
    view: 'front',
    sortOrder: 7,
    path: 'M24 84H50L46 136L50 154C50 164 38 170 28 166C18 162 16 152 22 148L28 136L24 84Z',
  },
  {
    key: 'front.hip',
    label: 'Quadril',
    view: 'front',
    sortOrder: 8,
    path: 'M54 146H86L84 166H56Z',
  },
  {
    key: 'front.thigh_l',
    label: 'Coxa esquerda',
    view: 'front',
    sortOrder: 9,
    path: 'M74 170H88L90 198H76Z',
  },
  {
    key: 'front.thigh_r',
    label: 'Coxa direita',
    view: 'front',
    sortOrder: 10,
    path: 'M66 170H52L50 198H64Z',
  },
  {
    key: 'front.knee_l',
    label: 'Joelho esquerdo',
    view: 'front',
    sortOrder: 11,
    path: 'M76 202H90L91 214H77Z',
  },
  {
    key: 'front.knee_r',
    label: 'Joelho direito',
    view: 'front',
    sortOrder: 12,
    path: 'M64 202H50L49 214H63Z',
  },
  {
    key: 'front.leg_l',
    label: 'Perna esquerda',
    view: 'front',
    sortOrder: 13,
    path: 'M76 218H89L92 226C108 226 112 228 112 230L110 234H92C82 234 80 232 79 228L76 218Z',
  },
  {
    key: 'front.leg_r',
    label: 'Perna direita',
    view: 'front',
    sortOrder: 14,
    path: 'M64 218H51L48 226C32 226 28 228 28 230L30 234H48C58 234 60 232 61 228L64 218Z',
  },
  {
    key: 'back.neck',
    label: 'Cervical',
    view: 'back',
    sortOrder: 15,
    path: 'M70 10C58 10 53 17 53 26C53 34 58 40 64 44L62 56H78L76 44C82 40 87 34 87 26C87 17 82 10 70 10Z',
  },
  {
    key: 'back.shoulder_l',
    label: 'Ombro esquerdo',
    view: 'back',
    sortOrder: 16,
    path: 'M50 60H36C30 60 26 61 24 66C24 72 26 80 32 80H50V60Z',
  },
  {
    key: 'back.shoulder_r',
    label: 'Ombro direito',
    view: 'back',
    sortOrder: 17,
    path: 'M90 60H104C110 60 114 61 116 66C116 72 114 80 108 80H90V60Z',
  },
  {
    key: 'back.upper',
    label: 'Dorsal',
    view: 'back',
    sortOrder: 18,
    path: 'M54 60H86V110H54Z',
  },
  {
    key: 'back.lumbar',
    label: 'Lombar',
    view: 'back',
    sortOrder: 19,
    path: 'M56 114H84L82 140H58Z',
  },
  {
    key: 'back.glute_l',
    label: 'Glúteo esquerdo',
    view: 'back',
    sortOrder: 20,
    path: 'M52 144H66V164C66 168 62 168 58 168H52C50 168 50 164 50 160L52 144Z',
  },
  {
    key: 'back.glute_r',
    label: 'Glúteo direito',
    view: 'back',
    sortOrder: 21,
    path: 'M74 144H88L90 160C90 164 90 168 88 168H82C78 168 74 168 74 164V144Z',
  },
  {
    key: 'back.arm_l',
    label: 'Braço esquerdo',
    view: 'back',
    sortOrder: 22,
    path: 'M24 84H50L46 136L50 154C50 164 38 170 28 166C18 162 16 152 22 148L28 136L24 84Z',
  },
  {
    key: 'back.arm_r',
    label: 'Braço direito',
    view: 'back',
    sortOrder: 23,
    path: 'M116 84H90L94 136L90 154C90 164 102 170 112 166C122 162 124 152 118 148L112 136L116 84Z',
  },
  {
    key: 'back.thigh_l',
    label: 'Coxa esquerda',
    view: 'back',
    sortOrder: 24,
    path: 'M66 172H52L50 198H64Z',
  },
  {
    key: 'back.thigh_r',
    label: 'Coxa direita',
    view: 'back',
    sortOrder: 25,
    path: 'M74 172H88L90 198H76Z',
  },
  {
    key: 'back.knee_l',
    label: 'Joelho esquerdo',
    view: 'back',
    sortOrder: 26,
    path: 'M64 202H50L49 214H63Z',
  },
  {
    key: 'back.knee_r',
    label: 'Joelho direito',
    view: 'back',
    sortOrder: 27,
    path: 'M76 202H90L91 214H77Z',
  },
  {
    key: 'back.leg_l',
    label: 'Perna esquerda',
    view: 'back',
    sortOrder: 28,
    path: 'M64 218H51L48 226C32 226 28 228 28 230L30 234H48C58 234 60 232 61 228L64 218Z',
  },
  {
    key: 'back.leg_r',
    label: 'Perna direita',
    view: 'back',
    sortOrder: 29,
    path: 'M76 218H89L92 226C108 226 112 228 112 230L110 234H92C82 234 80 232 79 228L76 218Z',
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
