import type { TermKey } from '../lib/consentTerms.ts'

export interface PatientTerm {
  id: string
  patientId: string
  termType: TermKey
  title: string
  patientName: string
  therapistName: string
  therapistCrefito: string
  guardianName: string | null
  signedAt: string
  storagePath: string
  byteSize: number
  createdBy: string | null
  createdByName: string | null
  signedUrl: string | null
}

export interface CreatePatientTermInput {
  termType: TermKey
  title: string
  bodyText: string
  patientName: string
  therapistName: string
  therapistCrefito: string
  guardianName: string | null
  guardianCpf: string | null
  createdByName: string | null
  signedAt: Date
}
