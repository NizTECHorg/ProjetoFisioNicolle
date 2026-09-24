const CROP_EDGE = 512
const JPEG_QUALITY = 0.85
const MAX_INPUT_BYTES = 8 * 1024 * 1024
const MAX_OUTPUT_BYTES = 2 * 1024 * 1024
const TYPE_ERROR = 'Envie PNG ou JPEG.'
const SIZE_ERROR = 'A foto deve ter no máximo 8 MB.'
const SAVE_ERROR = 'Não foi possível salvar a foto. Tente de novo.'

type PatientPhotoMime = 'image/jpeg' | 'image/png'

const JPEG_MAGIC = [0xff, 0xd8, 0xff]
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47]
const RIFF_MAGIC = [0x52, 0x49, 0x46, 0x46]
const WEBP_MAGIC = [0x57, 0x45, 0x42, 0x50]

function startsWith(bytes: Uint8Array, signature: number[], offset = 0) {
  if (bytes.length < offset + signature.length) return false
  return signature.every((value, index) => bytes[offset + index] === value)
}

function headerIncludesAscii(bytes: Uint8Array, text: string) {
  const decoded = new TextDecoder('latin1').decode(bytes)
  return decoded.includes(text)
}

function sniffMime(bytes: Uint8Array): PatientPhotoMime | null {
  if (startsWith(bytes, RIFF_MAGIC) && startsWith(bytes, WEBP_MAGIC, 8)) return null
  if (headerIncludesAscii(bytes, 'ftyp')) return null
  if (startsWith(bytes, JPEG_MAGIC)) return 'image/jpeg'
  if (startsWith(bytes, PNG_MAGIC)) return 'image/png'
  return null
}

function declaredAgrees(file: File, sniffed: PatientPhotoMime) {
  if (file.type === '') {
    return /\.(png|jpe?g)$/i.test(file.name)
  }
  return (file.type === 'image/png' || file.type === 'image/jpeg') && file.type === sniffed
}

async function readHeader(file: File) {
  const buffer = await file.slice(0, 16).arrayBuffer()
  return new Uint8Array(buffer)
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
        element.onerror = () => reject(new Error(SAVE_ERROR))
        element.src = objectUrl
      })
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth || image.width
      canvas.height = image.naturalHeight || image.height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error(SAVE_ERROR)
      ctx.drawImage(image, 0, 0)
      return await createImageBitmap(canvas)
    } catch (error) {
      if (error instanceof Error && error.message === SAVE_ERROR) throw error
      throw new Error(SAVE_ERROR)
    } finally {
      URL.revokeObjectURL(objectUrl)
    }
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: PatientPhotoMime) {
  return new Promise<Blob | null>((resolve) => {
    if (mimeType === 'image/png') {
      canvas.toBlob((result) => resolve(result), 'image/png')
      return
    }
    canvas.toBlob((result) => resolve(result), 'image/jpeg', JPEG_QUALITY)
  })
}

export async function preparePatientPhoto(file: File): Promise<{
  blob: Blob
  mimeType: PatientPhotoMime
}> {
  const sniffed = sniffMime(await readHeader(file))
  if (!sniffed || !declaredAgrees(file, sniffed)) {
    throw new Error(TYPE_ERROR)
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error(SIZE_ERROR)
  }

  const bitmap = await bitmapFromFile(file)
  try {
    const side = Math.min(bitmap.width, bitmap.height)
    const sx = (bitmap.width - side) / 2
    const sy = (bitmap.height - side) / 2
    const canvas = document.createElement('canvas')
    canvas.width = CROP_EDGE
    canvas.height = CROP_EDGE
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error(SAVE_ERROR)
    ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, CROP_EDGE, CROP_EDGE)

    const blob = await canvasToBlob(canvas, sniffed)
    if (!blob || blob.size > MAX_OUTPUT_BYTES) {
      throw new Error(SAVE_ERROR)
    }
    return { blob, mimeType: sniffed }
  } finally {
    bitmap.close()
  }
}
