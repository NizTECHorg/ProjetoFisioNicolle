import { supabase } from '@/lib/supabase/client'
import { mapPatientAiError } from '@/lib/security'

export function stripMarkdown(text: string): string {
  if (!text) return ''
  return text
    // Remove blocos de código markdown
    .replace(/```[a-z]*\n?/gi, '')
    .replace(/```/g, '')
    // Remove cabeçalhos (# Título, ## Subtítulo)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove negrito e itálico: **texto**, *texto*, __texto__, _texto_
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove tachado ~~texto~~
    .replace(/~~([^~]+)~~/g, '$1')
    // Links: [texto](url) -> texto
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Código inline: `código` -> código
    .replace(/`([^`]+)`/g, '$1')
    // Citações: > citação -> citação
    .replace(/^>\s+/gm, '')
    // Padroniza marcadores de lista (* ou - para •)
    .replace(/^[\*\-]\s+/gm, '• ')
    // Limita quebras de linha excessivas
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const base64 = reader.result.split(',')[1]
        if (base64) resolve(base64)
        else reject(new Error('Falha ao converter áudio para base64'))
      } else {
        reject(new Error('Falha ao ler arquivo de áudio'))
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function generateEvolutionFromAudio(
  audioBlob: Blob,
  patientId?: string,
): Promise<string> {
  const base64Data = await blobToBase64(audioBlob)

  const { data, error } = await supabase.functions.invoke('patient-ai-summary', {
    body: {
      patientId: patientId || undefined,
      mode: 'audio-evolucao',
      audioBase64: base64Data,
      mimeType: audioBlob.type || 'audio/webm',
    },
  })

  if (error) {
    let errorPayload: { status?: number; code?: string; message?: string } = {
      message: error.message,
    }
    if (data && typeof data === 'object') {
      errorPayload = data as { status?: number; code?: string; message?: string }
    }
    throw new Error(mapPatientAiError(errorPayload))
  }

  const parsed = data as { text?: string } | null
  const rawText = parsed?.text || ''
  return stripMarkdown(rawText)
}
