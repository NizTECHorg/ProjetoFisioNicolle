import { supabase } from '@/lib/supabase/client'
import { mapDbError } from '@/lib/security'

const AVATAR_BUCKET = 'account-avatars'
const SIGNED_URL_SECONDS = 3600
const SAVE_FAILED = 'Não foi possível salvar a foto. Tente de novo.'
const REMOVE_FAILED = 'Não foi possível remover a foto. Tente de novo.'

type PhotoMime = 'image/jpeg' | 'image/png' | 'image/webp'

function extensionFor(mimeType: PhotoMime) {
  if (mimeType === 'image/jpeg') return 'jpg'
  if (mimeType === 'image/png') return 'png'
  return 'webp'
}

export async function signAccountAvatarUrl(path: string | null): Promise<string | null> {
  if (path == null || path.length === 0) return null

  const { data, error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .createSignedUrl(path, SIGNED_URL_SECONDS)

  if (error) throw new Error(SAVE_FAILED)

  const signedUrl = data?.signedUrl
  if (!signedUrl) throw new Error(SAVE_FAILED)
  return signedUrl
}

export async function uploadAccountPhoto(
  userId: string,
  body: Blob,
  mimeType: PhotoMime,
): Promise<string> {
  const { data: current, error: selectError } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', userId)
    .maybeSingle()

  if (selectError) throw new Error(mapDbError(selectError))

  const previousPath =
    typeof current?.avatar_url === 'string' && current.avatar_url.length > 0
      ? current.avatar_url
      : null

  const extension = extensionFor(mimeType)
  const path = `${userId.toLowerCase()}/${crypto.randomUUID()}.${extension}`
  const file = new File([body], `photo.${extension}`, { type: mimeType })
  const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
    contentType: mimeType,
    upsert: false,
  })
  if (uploadError) throw new Error(SAVE_FAILED)

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: path })
    .eq('id', userId)

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

  return path
}

export async function removeAccountPhoto(userId: string): Promise<void> {
  const { data: current, error: selectError } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', userId)
    .maybeSingle()

  if (selectError) throw new Error(mapDbError(selectError))

  const previousPath =
    typeof current?.avatar_url === 'string' && current.avatar_url.length > 0
      ? current.avatar_url
      : null
  if (previousPath == null) return

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: null })
    .eq('id', userId)

  if (updateError) throw new Error(mapDbError(updateError))

  const { error: removeError } = await supabase.storage.from(AVATAR_BUCKET).remove([previousPath])
  if (removeError) throw new Error(REMOVE_FAILED)
}
