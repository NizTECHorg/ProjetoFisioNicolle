import { supabase } from '@/lib/supabase/client'
import { PATIENT_FILE_BUCKETS, patientFilePathsFromListing } from '@/lib/patientDeleteConfirm'

const PAGE_SIZE = 100
const CLEANUP_ATTEMPTS = 3

type BucketFiles = { bucket: string; paths: string[] }

async function listPatientFolder(bucket: string, folder: string): Promise<string[]> {
  const paths: string[] = []
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase.storage.from(bucket).list(folder, { limit: PAGE_SIZE, offset })
    if (error || !data) throw new Error('list_patient_files_failed')
    paths.push(...patientFilePathsFromListing(folder, data))
    if (data.length < PAGE_SIZE) break
  }
  return paths
}

async function listAllPatientFiles(patientId: string): Promise<BucketFiles[]> {
  const result: BucketFiles[] = []
  for (const bucket of PATIENT_FILE_BUCKETS) {
    result.push({ bucket, paths: await listPatientFolder(bucket, patientId) })
  }
  return result
}

/** RLS negada devolve data vazio sem erro, então confere o tamanho do lote. */
async function removePaths(bucket: string, paths: string[]): Promise<boolean> {
  for (let i = 0; i < paths.length; i += PAGE_SIZE) {
    const batch = paths.slice(i, i + PAGE_SIZE)
    const { data, error } = await supabase.storage.from(bucket).remove(batch)
    if (error || !data || data.length < batch.length) return false
  }
  return true
}

async function cleanupPatientFiles(patientId: string, known?: BucketFiles[]): Promise<boolean> {
  try {
    let pending = known
    for (let attempt = 0; attempt < CLEANUP_ATTEMPTS; attempt += 1) {
      const current = pending ?? (await listAllPatientFiles(patientId))
      pending = undefined
      let allRemoved = true
      for (const { bucket, paths } of current) {
        if (paths.length > 0 && !(await removePaths(bucket, paths))) allRemoved = false
      }
      const remaining = await listAllPatientFiles(patientId)
      if (remaining.every((entry) => entry.paths.length === 0)) {
        const { data, error } = await supabase.rpc('finish_patient_deletion', { p_patient_id: patientId })
        return !error && data === true
      }
      if (!allRemoved && attempt === CLEANUP_ATTEMPTS - 1) return false
    }
    return false
  } catch {
    console.warn('patient file cleanup incomplete', patientId)
    return false
  }
}

async function retryPendingCleanups(currentPatientId: string): Promise<void> {
  try {
    const { data, error } = await supabase.rpc('list_pending_patient_file_cleanups')
    if (error || !Array.isArray(data)) return
    for (const id of data as string[]) {
      if (id !== currentPatientId) await cleanupPatientFiles(id)
    }
  } catch {
    // best-effort: pendências antigas ficam para a próxima exclusão
  }
}

export async function deletePatientCompletely(patientId: string): Promise<void> {
  await retryPendingCleanups(patientId)
  const files = await listAllPatientFiles(patientId)
  const { error } = await supabase.rpc('delete_patient_full', { p_patient_id: patientId })
  if (error) throw new Error('delete_patient_failed')
  await cleanupPatientFiles(patientId, files)
}
