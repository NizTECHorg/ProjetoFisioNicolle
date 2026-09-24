import { supabase } from '@/lib/supabase/client'
import { signPatientPhotoUrls } from '@/services/patientPhoto.service'
import type { SessionStatus } from '@/types/patient'

export interface CalendarSession {
  id: string
  patientId: string
  patientName: string
  patientCode: string
  photoTone: string
  photoUrl: string | null
  scheduledAt: string
  type: string
  place: string
  status: SessionStatus
}

type CalendarPatient = {
  full_name: string
  code: string
  photo_tone: string
  photo_path: string | null
}

function firstPatient(patients: CalendarPatient | CalendarPatient[] | null): CalendarPatient | null {
  if (!patients) return null
  return Array.isArray(patients) ? (patients[0] ?? null) : patients
}

function photoUrlFrom(path: string | null | undefined, urls: Map<string, string>): string | null {
  if (!path) return null
  return urls.get(path) ?? null
}

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

export async function listSessionsInRange(fromIso: string, toIso: string): Promise<CalendarSession[]> {
  const { data, error } = await supabase
    .from('patient_sessions')
    .select(
      'id, patient_id, scheduled_at, session_type, place, status, patients(full_name, code, photo_tone, photo_path)',
    )
    .gte('scheduled_at', fromIso)
    .lt('scheduled_at', toIso)
    .order('scheduled_at', { ascending: true })

  throwIfError(error)

  const rows = ((data ?? []) as Array<{
    id: string
    patient_id: string
    scheduled_at: string | null
    session_type: string | null
    place: string | null
    status: SessionStatus
    patients: CalendarPatient | CalendarPatient[] | null
  }>).filter((row) => row.scheduled_at)

  const photoUrls = await signPatientPhotoUrls(rows.map((row) => firstPatient(row.patients)?.photo_path))

  return rows.map((row) => {
    const patient = firstPatient(row.patients)
    return {
      id: row.id,
      patientId: row.patient_id,
      patientName: patient?.full_name ?? 'Paciente',
      patientCode: patient?.code ?? '',
      photoTone: patient?.photo_tone ?? 'bg-forest',
      photoUrl: photoUrlFrom(patient?.photo_path, photoUrls),
      scheduledAt: row.scheduled_at as string,
      type: row.session_type ?? 'Sessão',
      place: row.place ?? '—',
      status: row.status,
    }
  })
}

export async function createSession(input: {
  patientId: string
  scheduledAt: string
  scheduledAts?: string[]
  type: string
  place: string
  therapistId?: string
  therapistName?: string
}) {
  const times = input.scheduledAts?.length ? input.scheduledAts : [input.scheduledAt]
  const { error } = await supabase.from('patient_sessions').insert(
    times.map((scheduledAt) => ({
      patient_id: input.patientId,
      scheduled_at: scheduledAt,
      session_type: input.type,
      place: input.place,
      status: 'agendada' as const,
      therapist_id: input.therapistId ?? null,
      therapist_name: input.therapistName ?? null,
    })),
  )
  throwIfError(error)
}

export async function updateSessionStatus(id: string, status: SessionStatus) {
  const { error } = await supabase.from('patient_sessions').update({ status }).eq('id', id)
  throwIfError(error)
}
