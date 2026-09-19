/**
 * UX helpers for REQ-16 dashboard shortcuts.
 * canWritePatient is UX-only; RLS remains authority.
 * Do not import permissions.ts.
 */

import { canWritePatient } from '@/lib/accountAccess'
import type { PatientListItem } from '@/types/patient'

/** Search Input only when writable count is at least 8 (UI-SPEC). */
export const PATIENT_SEARCH_THRESHOLD = 8

/**
 * Omit colleague rows from the shortcut picker (REQ-16.3; Phase 3 D-05/D-07).
 * Fail closed when viewerId is missing. Do not JS-filter by accountType.
 */
export function writablePatients(
  patients: PatientListItem[],
  viewerId: string | undefined,
): PatientListItem[] {
  if (!viewerId) return []
  return patients.filter((patient) => canWritePatient(viewerId, patient.createdBy))
}

/**
 * Case-insensitive name filter in pt-BR. Empty needle returns the same array.
 */
export function filterPatientsByName(
  patients: PatientListItem[],
  query: string,
): PatientListItem[] {
  const needle = query.trim().toLocaleLowerCase('pt-BR')
  if (!needle) return patients
  return patients.filter((patient) =>
    patient.name.toLocaleLowerCase('pt-BR').includes(needle),
  )
}

/**
 * Deep-link to the ficha tab used by Ver ficha (D-03).
 * PatientPage reads aba=evolucoes | aba=resumo-ia | aba=avaliacao (legacy alias).
 */
export function patientFichaPath(
  patientId: string,
  aba: 'evolucoes' | 'resumo-ia' | 'avaliacao',
): string {
  return `/pacientes/${patientId}?aba=${aba}`
}
