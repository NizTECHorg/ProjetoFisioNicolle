export const PATIENT_FILE_BUCKETS = ['patient-avatars', 'patient-images', 'patient-ai-reports'] as const

function normalizeName(value: string): string {
  return value.normalize('NFC').trim().toLocaleLowerCase('pt-BR')
}

/** Confirmação por nome: só UX. A autorização real é a RPC delete_patient_full. */
export function isDeleteNameMatch(typed: string, name: string): boolean {
  const expected = normalizeName(name)
  if (!expected) return false
  return normalizeName(typed) === expected
}

export function patientFilePathsFromListing(
  patientId: string,
  entries: ReadonlyArray<{ name: string; id: string | null }>,
): string[] {
  return entries.filter((entry) => entry.id !== null).map((entry) => `${patientId}/${entry.name}`)
}
