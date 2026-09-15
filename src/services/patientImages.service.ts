import { supabase } from '@/lib/supabase/client'
import { compressImageForThumb, thumbStoragePath } from '@/lib/compressImage'
import { mapDbError, mapStorageError, sanitizeText } from '@/lib/security'
import { imageUploadSchema } from '@/schemas/patient.schema'
import type { PatientImage, PatientImageMime, UpdatePatientImageInput } from '@/types/patient'

const IMAGE_BUCKET = 'patient-images'
const SIGNED_URL_SECONDS = 3600
const IMAGE_COLUMNS =
  'id, patient_id, session_id, storage_path, description, mime_type, byte_size, session_removed, created_at'
const SAVE_FAILED = 'Não foi possível salvar. Verifique o arquivo e tente de novo.'

interface ImageRow {
  id: string
  patient_id: string
  session_id: string | null
  storage_path: string
  description: string
  mime_type: PatientImageMime
  byte_size: number
  session_removed: boolean
  created_at: string
}

function throwIfDbError(error: { message?: string; code?: string } | null) {
  if (error) throw new Error(mapDbError(error))
}

function throwIfStorageError(
  error: {
    message?: string
    code?: string
    statusCode?: string | number
    error?: string
    status?: number
  } | null,
) {
  if (error) throw new Error(mapStorageError(error))
}

function mappedErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : SAVE_FAILED
}

function mimeToExt(mime: PatientImageMime) {
  if (mime === 'image/jpeg') return 'jpg'
  if (mime === 'image/png') return 'png'
  return 'webp'
}

function mapImageRow(row: ImageRow, signedUrl: string | null, thumbUrl: string | null): PatientImage {
  return {
    id: row.id,
    patientId: row.patient_id,
    sessionId: row.session_id,
    storagePath: row.storage_path,
    description: row.description,
    mimeType: row.mime_type,
    byteSize: Number(row.byte_size),
    createdAt: row.created_at,
    sessionRemoved: row.session_removed,
    signedUrl,
    thumbUrl,
  }
}

function parseUploadInput(file: File, input: { sessionId: string | null; description: string }) {
  const parsed = imageUploadSchema.safeParse({
    mimeType: file.type,
    byteSize: file.size,
    sessionId: input.sessionId,
    description: input.description,
  })
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? SAVE_FAILED)
  }
  return parsed.data
}

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

async function insertImageRow(
  patientId: string,
  imageId: string,
  path: string,
  parsed: {
    mimeType: PatientImageMime
    byteSize: number
    sessionId: string | null
    description: string
  },
): Promise<ImageRow> {
  const { data, error } = await supabase
    .from('patient_images')
    .insert({
      id: imageId,
      patient_id: patientId,
      session_id: parsed.sessionId,
      storage_path: path,
      description: sanitizeText(parsed.description, 500),
      mime_type: parsed.mimeType,
      byte_size: parsed.byteSize,
      session_removed: false,
    })
    .select(IMAGE_COLUMNS)
    .single()

  if (error) {
    await supabase.storage.from(IMAGE_BUCKET).remove([path, thumbStoragePath(path)])
    throw new Error(mapDbError(error))
  }

  return data as ImageRow
}

export async function listPatientImages(patientId: string): Promise<PatientImage[]> {
  const { data, error } = await supabase
    .from('patient_images')
    .select(IMAGE_COLUMNS)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })

  throwIfDbError(error)

  const rows = (data ?? []) as ImageRow[]
  if (rows.length === 0) return []

  const originalPaths = rows.map((row) => row.storage_path)
  const { data: signed, error: signedError } = await supabase.storage
    .from(IMAGE_BUCKET)
    .createSignedUrls(originalPaths, SIGNED_URL_SECONDS)

  throwIfStorageError(signedError)

  const { data: thumbSigned } = await supabase.storage
    .from(IMAGE_BUCKET)
    .createSignedUrls(
      rows.map((row) => thumbStoragePath(row.storage_path)),
      SIGNED_URL_SECONDS,
    )

  const urls = signedUrlByPath(signed)
  const thumbUrls = signedUrlByPath(thumbSigned)
  const transformed = await Promise.all(
    rows.map(async (row) => {
      const storedThumb = thumbUrls.get(thumbStoragePath(row.storage_path)) ?? null
      if (storedThumb) return storedThumb
      return signedTransformUrl(row.storage_path)
    }),
  )

  return rows.map((row, index) =>
    mapImageRow(
      row,
      urls.get(row.storage_path) ?? null,
      transformed[index] ?? urls.get(row.storage_path) ?? null,
    ),
  )
}

async function signedTransformUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(IMAGE_BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS, {
    transform: {
      width: 320,
      height: 320,
      resize: 'cover',
      quality: 50,
    },
  })
  if (error || !data?.signedUrl) return null
  return data.signedUrl
}

export async function uploadPatientImage(
  patientId: string,
  file: File,
  input: { sessionId: string | null; description: string },
): Promise<PatientImage> {
  const parsed = parseUploadInput(file, input)
  const imageId = crypto.randomUUID()
  const path = `${patientId}/${imageId}.${mimeToExt(parsed.mimeType)}`

  const { error: uploadError } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, {
    contentType: parsed.mimeType,
    upsert: false,
  })
  throwIfStorageError(uploadError)

  try {
    const thumb = await compressImageForThumb(file)
    await supabase.storage.from(IMAGE_BUCKET).upload(thumbStoragePath(path), thumb, {
      contentType: 'image/jpeg',
      upsert: false,
    })
  } catch {
    // Miniatura é acelerador de grid. A foto original segue.
  }

  const row = await insertImageRow(patientId, imageId, path, parsed)
  return mapImageRow(row, null, null)
}

export async function uploadPatientImages(
  patientId: string,
  files: File[],
  input: { sessionId: string | null; description: string },
): Promise<PatientImage[]> {
  const successes: PatientImage[] = []
  const failures: string[] = []

  for (const file of files) {
    const parsed = imageUploadSchema.safeParse({
      mimeType: file.type,
      byteSize: file.size,
      sessionId: input.sessionId,
      description: input.description,
    })
    if (!parsed.success) {
      failures.push(parsed.error.issues[0]?.message ?? SAVE_FAILED)
      continue
    }

    try {
      successes.push(await uploadPatientImage(patientId, file, input))
    } catch (error) {
      failures.push(mappedErrorMessage(error))
    }
  }

  if (successes.length > 0) return successes
  throw new Error(failures[0] ?? SAVE_FAILED)
}

export async function updatePatientImage(
  patientId: string,
  imageId: string,
  input: UpdatePatientImageInput,
): Promise<PatientImage> {
  const { data, error } = await supabase
    .from('patient_images')
    .update({
      description: sanitizeText(input.description, 500),
      session_id: input.sessionId,
      session_removed: false,
    })
    .eq('id', imageId)
    .eq('patient_id', patientId)
    .select(IMAGE_COLUMNS)
    .single()

  throwIfDbError(error)
  return mapImageRow(data as ImageRow, null, null)
}

export async function deletePatientImage(
  patientId: string,
  image: Pick<PatientImage, 'id' | 'storagePath'>,
): Promise<void> {
  const { error: storageError } = await supabase.storage
    .from(IMAGE_BUCKET)
    .remove([image.storagePath])
  throwIfStorageError(storageError)

  await supabase.storage.from(IMAGE_BUCKET).remove([thumbStoragePath(image.storagePath)])

  const { error } = await supabase
    .from('patient_images')
    .delete()
    .eq('id', image.id)
    .eq('patient_id', patientId)

  throwIfDbError(error)
}
