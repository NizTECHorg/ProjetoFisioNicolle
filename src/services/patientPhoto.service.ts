import { supabase } from '@/lib/supabase/client'
import { mapDbError } from '@/lib/security'
import { patientPhotoSchema } from '@/schemas/patient.schema'

const AVATAR_BUCKET = 'patient-avatars'
const SIGNED_URL_SECONDS = 3600
const BUCKET_LIMIT_BYTES = 2 * 1024 * 1024
const SAVE_FAILED = 'Não foi possível salvar a foto. Tente de novo.'
const REMOVE_FAILED = 'Não foi possível remover a foto. Tente de novo.'

type PhotoMime = 'image/jpeg' | 'image/png'

function signedUrlByPath(
  entries:
    | Array<{
        path?: string | null
        signedUrl?: string | null
        signedURL?: string | null
        error?: string | null
      }>
    | null
    | undefined,
) {
  const urls = new Map<string, string>()
  for (const entry of entries ?? []) {
    if (!entry.path || entry.error) continue
    const url = entry.signedUrl || entry.signedURL
    if (url) urls.set(entry.path, url)
  }
  return urls
}

function extensionFor(mimeType: PhotoMime) {
  return mimeType === 'image/jpeg' ? 'jpg' : 'png'
}

export async function signPatientPhotoUrls(
  paths: Array<string | null | undefined>,
): Promise<Map<string, string>> {
  const unique = [
    ...new Set(paths.filter((path): path is string => typeof path === 'string' && path.length > 0)),
  ]
  if (unique.length === 0) return new Map()

  const { data, error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .createSignedUrls(unique, SIGNED_URL_SECONDS)

  if (error) throw new Error(SAVE_FAILED)
  return signedUrlByPath(data)
}

export async function uploadPatientPhoto(
  patientId: string,
  file: Blob,
  mimeType: PhotoMime,
): Promise<void> {
  const parsed = patientPhotoSchema.safeParse({
    mimeType,
    byteSize: file.size,
  })
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? SAVE_FAILED)
  }

  if (file.size > BUCKET_LIMIT_BYTES) {
    throw new Error(SAVE_FAILED)
  }

  const { data: current, error: selectError } = await supabase
    .from('patients')
    .select('photo_path')
    .eq('id', patientId)
    .maybeSingle()

  if (selectError) throw new Error(mapDbError(selectError))

  const previousPath =
    typeof current?.photo_path === 'string' && current.photo_path.length > 0
      ? current.photo_path
      : null

  const path = `${patientId}/${crypto.randomUUID()}.${extensionFor(mimeType)}`
  const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
    contentType: mimeType,
    upsert: false,
  })
  if (uploadError) throw new Error(SAVE_FAILED)

  const { error: updateError } = await supabase
    .from('patients')
    .update({ photo_path: path })
    .eq('id', patientId)

  if (updateError) {
    await supabase.storage.from(AVATAR_BUCKET).remove([path])
    throw new Error(mapDbError(updateError))
  }

  if (previousPath && previousPath !== path) {
    try {
      await supabase.storage.from(AVATAR_BUCKET).remove([previousPath])
    } catch {
      // Orphan object is acceptable. The pointer already names the new file.
    }
  }
}

export async function removePatientPhoto(patientId: string): Promise<void> {
  const { data: current, error: selectError } = await supabase
    .from('patients')
    .select('photo_path')
    .eq('id', patientId)
    .maybeSingle()

  if (selectError) throw new Error(mapDbError(selectError))

  const previousPath =
    typeof current?.photo_path === 'string' && current.photo_path.length > 0
      ? current.photo_path
      : null
  if (previousPath == null) return

  const { error: updateError } = await supabase
    .from('patients')
    .update({ photo_path: null })
    .eq('id', patientId)

  if (updateError) throw new Error(mapDbError(updateError))

  const { error: removeError } = await supabase.storage.from(AVATAR_BUCKET).remove([previousPath])
  if (removeError) throw new Error(REMOVE_FAILED)
}
