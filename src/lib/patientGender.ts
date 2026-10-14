export const PATIENT_GENDER_VALUES = ['feminino', 'masculino', 'outro', 'nao_informado'] as const

export type PatientGender = (typeof PATIENT_GENDER_VALUES)[number]

export const patientGenderOptions: { value: string; label: string }[] = [
  { value: '', label: 'Não informado' },
  { value: 'feminino', label: 'Feminino' },
  { value: 'masculino', label: 'Masculino' },
  { value: 'outro', label: 'Outro' },
  { value: 'nao_informado', label: 'Prefere não informar' },
]

export function narrowGender(value: unknown): PatientGender | null {
  return typeof value === 'string' && (PATIENT_GENDER_VALUES as readonly string[]).includes(value)
    ? (value as PatientGender)
    : null
}

/** Texto para a ficha (identificacao.genero). Sem informação ou "prefere não informar" vira vazio. */
export function genderLabel(value: unknown): string {
  switch (narrowGender(value)) {
    case 'feminino':
      return 'Feminino'
    case 'masculino':
      return 'Masculino'
    case 'outro':
      return 'Outro'
    default:
      return ''
  }
}
