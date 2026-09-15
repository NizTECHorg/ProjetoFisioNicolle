const THUMB_MAX_EDGE = 320
const THUMB_QUALITY = 0.45

export function thumbStoragePath(storagePath: string) {
  const slash = storagePath.lastIndexOf('/')
  const file = slash >= 0 ? storagePath.slice(slash + 1) : storagePath
  const dir = slash >= 0 ? storagePath.slice(0, slash + 1) : ''
  const dot = file.lastIndexOf('.')
  const stem = dot > 0 ? file.slice(0, dot) : file
  return `${dir}${stem}.thumb.jpg`
}

async function bitmapFromFile(file: File) {
  try {
    return await createImageBitmap(file)
  } catch {
    const objectUrl = URL.createObjectURL(file)
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new Image()
        element.onload = () => resolve(element)
        element.onerror = () => reject(new Error('Não foi possível comprimir a miniatura.'))
        element.src = objectUrl
      })
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth || image.width
      canvas.height = image.naturalHeight || image.height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Não foi possível comprimir a miniatura.')
      ctx.drawImage(image, 0, 0)
      return await createImageBitmap(canvas)
    } finally {
      URL.revokeObjectURL(objectUrl)
    }
  }
}

export async function compressImageForThumb(file: File): Promise<Blob> {
  const bitmap = await bitmapFromFile(file)
  const scale = Math.min(1, THUMB_MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('Não foi possível comprimir a miniatura.')
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error('Não foi possível comprimir a miniatura.'))
          return
        }
        resolve(result)
      },
      'image/jpeg',
      THUMB_QUALITY,
    )
  })

  return blob
}
