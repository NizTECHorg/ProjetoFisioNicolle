import { supabase } from '@/lib/supabase/client'
import type { SessionStatus } from '@/types/patient'

export interface CalendarSession {
  id: string
  patientId: string
  patientName: string
  patientCode: string
  photoTone: string
  scheduledAt: string
  type: string
  place: string
  status: SessionStatus
}

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

export async function listSessionsInRange(fromIso: string, toIso: string): Promise<CalendarSession[]> {
  const { data, error } = await supabase
    .from('patient_sessions')
    .select('id, patient_id, scheduled_at, session_type, place, status, patients(full_name, code, photo_tone)')
    .gte('scheduled_at', fromIso)
    .lt('scheduled_at', toIso)
    .order('scheduled_at', { ascending: true })

  throwIfError(error)

  return ((data ?? []) as Array<{
    id: string
    patient_id: string
    scheduled_at: string | null
    session_type: string | null
    place: string | null
    status: SessionStatus
    patients:
      | { full_name: string; code: string; photo_tone: string }
      | { full_name: string; code: string; photo_tone: string }[]
      | null
  }>)
    .filter((row) => row.scheduled_at)
    .map((row) => {
      const patient = Array.isArray(row.patients) ? row.patients[0] : row.patients
      return {
        id: row.id,
        patientId: row.patient_id,
        patientName: patient?.full_name ?? 'Paciente',
        patientCode: patient?.code ?? '',
        photoTone: patient?.photo_tone ?? 'bg-forest',
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
  type: string
  place: string
  therapistId?: string
  therapistName?: string
}) {
  const { error } = await supabase.from('patient_sessions').insert({
    patient_id: input.patientId,
    scheduled_at: input.scheduledAt,
    session_type: input.type,
    place: input.place,
    status: 'agendada',
    therapist_id: input.therapistId ?? null,
    therapist_name: input.therapistName ?? null,
  })
  throwIfError(error)
}

export async function updateSessionStatus(id: string, status: SessionStatus) {
  const { error } = await supabase.from('patient_sessions').update({ status }).eq('id', id)
  throwIfError(error)
}
