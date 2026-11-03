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

async function invokeAudioRaw(
  mode: 'audio-transcricao' | 'audio-evolucao-campos',
  audioBlob: Blob,
  patientId?: string,
): Promise<unknown> {
  const base64Data = await blobToBase64(audioBlob)

  const { data, error } = await supabase.functions.invoke('patient-ai-summary', {
    body: {
      patientId: patientId || undefined,
      mode,
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
    } else {
      // Erro HTTP da função: o corpo (com o código, ex. invalid_body) vem em error.context.
      const contexto = (error as { context?: unknown }).context
      if (contexto instanceof Response) {
        const corpo = (await contexto.clone().json().catch(() => null)) as { code?: string; error?: string } | null
        errorPayload = { status: contexto.status, code: corpo?.code ?? corpo?.error, message: error.message }
        console.warn('[IA áudio] a função respondeu', contexto.status, corpo)
      }
    }
    // invalid_body num modo novo = a função publicada ainda é a versão antiga.
    if (mode === 'audio-evolucao-campos' && errorPayload.code === 'invalid_body') {
      throw new Error('A função de IA está desatualizada. Publique de novo a função patient-ai-summary no Supabase.')
    }
    throw new Error(mapPatientAiError(errorPayload))
  }

  return data
}

async function invokeAudio(
  mode: 'audio-transcricao',
  audioBlob: Blob,
  patientId?: string,
): Promise<string> {
  const parsed = (await invokeAudioRaw(mode, audioBlob, patientId)) as { text?: string } | null
  return parsed?.text || ''
}

/** Campos da evolução que o ditado dentro da sessão pode preencher. */
export type CamposEvolucaoDitados = {
  patientState: string
  changesSinceLast: string
  conducts: string
  treatmentResponse: string
  sideEffects: string
  incidents: string
  nextPlan: string
}

const CAMPOS_DITADO: ReadonlyArray<keyof CamposEvolucaoDitados> = [
  'patientState',
  'changesSinceLast',
  'conducts',
  'treatmentResponse',
  'sideEffects',
  'incidents',
  'nextPlan',
]

/** Ditado da sessão: a IA separa o relato e devolve o texto de cada campo (vazio = nada dito). */
export async function dictateEvolutionFields(audioBlob: Blob, patientId?: string): Promise<CamposEvolucaoDitados> {
  const parsed = (await invokeAudioRaw('audio-evolucao-campos', audioBlob, patientId)) as {
    campos?: Record<string, unknown>
  } | null
  const campos = parsed?.campos ?? {}
  const out = {} as CamposEvolucaoDitados
  for (const chave of CAMPOS_DITADO) {
    const valor = campos[chave]
    out[chave] = typeof valor === 'string' ? stripMarkdown(valor).slice(0, 4000) : ''
  }
  return out
}

/** Checklist 7.3: transcrição literal do ditado, para revisar antes de entrar no resumo. */
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const rawText = await invokeAudio('audio-transcricao', audioBlob)
  return stripMarkdown(rawText).slice(0, 2000)
}
