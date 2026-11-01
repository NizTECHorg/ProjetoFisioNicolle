import { rgb, type PDFDocument, type PDFImage, type RGB } from 'pdf-lib'
import { supabase } from '@/lib/supabase/client'
import {
  PDF_BRAND_LOGO_MAX_BYTES,
  PDF_BRAND_LOGO_TYPES,
  PDF_BRAND_NAME_MAX,
  normalizarCor,
  paletaDaCor,
} from '@/lib/pdfBrand'

const BUCKET = 'branding'

/** Identidade que a conta configurou (Minha empresa / Meu escritório). */
export interface PdfBranding {
  ownerId: string
  name: string | null
  color: string | null
  logoPath: string | null
  logoUrl: string | null
  updatedAt: string | null
}

type BrandingRow = {
  owner_id: string
  name: string | null
  color: string | null
  logo_path: string | null
  updated_at: string | null
}

function logoPublicUrl(path: string | null, updatedAt: string | null): string | null {
  if (!path) return null
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  // Versão na URL: trocar a logo não fica preso no cache do navegador.
  return `${data.publicUrl}?v=${encodeURIComponent(updatedAt ?? '')}`
}

function mapRow(row: BrandingRow): PdfBranding {
  return {
    ownerId: row.owner_id,
    name: row.name,
    color: row.color,
    logoPath: row.logo_path,
    logoUrl: logoPublicUrl(row.logo_path, row.updated_at),
    updatedAt: row.updated_at,
  }
}

async function userId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error('Sessão expirada. Entre novamente.')
  return data.user.id
}

/** A identidade da própria conta (para editar). */
export async function getOwnBranding(): Promise<PdfBranding | null> {
  const id = await userId()
  const { data, error } = await supabase
    .from('account_branding')
    .select('owner_id, name, color, logo_path, updated_at')
    .eq('owner_id', id)
    .maybeSingle()
  if (error) throw new Error('Não foi possível carregar a identidade dos PDFs.')
  return data ? mapRow(data as BrandingRow) : null
}

/**
 * A identidade que vale nos PDFs desta conta: a própria ou, para o fisioterapeuta de uma
 * empresa, a da empresa (o RLS só devolve essas duas). Falha nunca impede gerar o PDF.
 */
export async function getEffectiveBranding(): Promise<PdfBranding | null> {
  try {
    const id = await userId()
    const { data, error } = await supabase
      .from('account_branding')
      .select('owner_id, name, color, logo_path, updated_at')
    if (error || !data || data.length === 0) return null
    const rows = data as BrandingRow[]
    const propria = rows.find((row) => row.owner_id === id)
    const usada = propria && (propria.name || propria.color || propria.logo_path) ? propria : rows.find((row) => row.owner_id !== id)
    return usada ? mapRow(usada) : null
  } catch {
    return null
  }
}

export function validarLogo(file: File): string | null {
  if (!(PDF_BRAND_LOGO_TYPES as readonly string[]).includes(file.type)) return 'Envie a logo em PNG ou JPG.'
  if (file.size > PDF_BRAND_LOGO_MAX_BYTES) return 'A logo deve ter no máximo 1 MB.'
  return null
}

export async function saveBranding(input: {
  name: string
  color: string
  logoFile?: File | null
  removeLogo?: boolean
  currentLogoPath?: string | null
}): Promise<PdfBranding> {
  const id = await userId()
  let logoPath = input.removeLogo ? null : (input.currentLogoPath ?? null)

  if (input.logoFile) {
    const erro = validarLogo(input.logoFile)
    if (erro) throw new Error(erro)
    const ext = input.logoFile.type === 'image/png' ? 'png' : 'jpg'
    const novo = `${id}/logo-${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(novo, input.logoFile, { contentType: input.logoFile.type, upsert: true })
    if (error) throw new Error('Não foi possível enviar a logo. Tente de novo.')
    logoPath = novo
  }

  const name = input.name.trim().slice(0, PDF_BRAND_NAME_MAX) || null
  const color = normalizarCor(input.color)
  const { data, error } = await supabase
    .from('account_branding')
    .upsert(
      { owner_id: id, name, color, logo_path: logoPath, updated_at: new Date().toISOString() },
      { onConflict: 'owner_id' },
    )
    .select('owner_id, name, color, logo_path, updated_at')
    .single()
  if (error) throw new Error('Não foi possível salvar a identidade dos PDFs.')

  // Logo antiga sai do armazenamento depois que a nova está salva.
  const anterior = input.currentLogoPath
  if (anterior && anterior !== logoPath) {
    await supabase.storage.from(BUCKET).remove([anterior]).catch(() => undefined)
  }
  return mapRow(data as BrandingRow)
}

/** O que os geradores de PDF usam: nome, cores e a logo já embutida no documento. */
export type PdfBrandAssets = {
  name: string | null
  logo: PDFImage | null
  colors: { accent: RGB; accentSoft: RGB; navy: RGB; forest: RGB } | null
}

/**
 * Redesenha a imagem num canvas e devolve PNG simples (8 bits, sem entrelaçamento, RGB/alpha).
 * O pdf-lib recusa vários PNG/JPG válidos (entrelaçado, 16 bits, CMYK) e não lê WebP; assim
 * qualquer logo que o navegador consiga mostrar entra no PDF. Limita a 1200px de largura.
 */
async function paraPngSimples(blob: Blob): Promise<ArrayBuffer> {
  const bitmap = await createImageBitmap(blob)
  const escala = Math.min(1, 1200 / bitmap.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * escala))
  canvas.height = Math.max(1, Math.round(bitmap.height * escala))
  const contexto = canvas.getContext('2d')
  if (!contexto) throw new Error('canvas indisponível')
  contexto.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!png) throw new Error('falha ao converter a logo')
  return png.arrayBuffer()
}

export async function loadPdfBrand(doc: PDFDocument): Promise<PdfBrandAssets> {
  const marca = await getEffectiveBranding()
  if (!marca) return { name: null, logo: null, colors: null }
  let logo: PDFImage | null = null
  if (marca.logoUrl) {
    try {
      const res = await fetch(marca.logoUrl, { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status} ao baixar a logo`)
      logo = await doc.embedPng(await paraPngSimples(await res.blob()))
    } catch (error) {
      // Não bloqueia o PDF: sai com o nome no lugar da logo. O motivo fica no console.
      console.warn('[PDF] logo da conta não entrou no PDF:', error)
      logo = null
    }
  }
  const p = marca.color ? paletaDaCor(marca.color) : null
  return {
    name: marca.name,
    logo,
    colors: p
      ? {
          accent: rgb(...p.accent),
          accentSoft: rgb(...p.accentSoft),
          navy: rgb(...p.navy),
          forest: rgb(...p.forest),
        }
      : null,
  }
}
