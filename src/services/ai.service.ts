import { supabase } from '@/lib/supabase/client'
import { mapPatientAiError } from '@/lib/security'

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
  return parsed?.text || ''
}
