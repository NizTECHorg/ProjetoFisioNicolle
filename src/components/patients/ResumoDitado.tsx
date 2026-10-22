import { useEffect, useRef, useState } from 'react'
import { Loader2, Mic, Square } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { useVoiceCopilot } from '@/hooks/useVoiceCopilot'
import { transcribeAudio } from '@/services/ai.service'
import { useToastStore } from '@/stores/toast.store'

type ResumoDitadoProps = {
  disabled?: boolean
  /** Recebe o texto revisado; quem chama decide como juntar ao resumo. */
  onIncorporar: (texto: string) => void
}

function formatarDuracao(segundos: number) {
  return `${Math.floor(segundos / 60).toString().padStart(2, '0')}:${(segundos % 60).toString().padStart(2, '0')}`
}

/**
 * Checklist 7.3: grava o ditado, transcreve e mostra o texto editável.
 * Nada entra no resumo antes de "Incorporar ao resumo".
 */
export function ResumoDitado({ disabled = false, onIncorporar }: ResumoDitadoProps) {
  const { isRecording, duration, startRecording, stopRecording, audioBlob } = useVoiceCopilot()
  const [transcrevendo, setTranscrevendo] = useState(false)
  const [transcricao, setTranscricao] = useState<string | null>(null)
  const processado = useRef<Blob | null>(null)

  useEffect(() => {
    if (!audioBlob || isRecording || processado.current === audioBlob) return
    processado.current = audioBlob
    setTranscrevendo(true)
    transcribeAudio(audioBlob)
      .then((texto) => {
        if (!texto.trim()) {
          useToastStore.getState().push('Não deu para entender o áudio. Tente gravar de novo.', 'error')
          return
        }
        setTranscricao(texto)
      })
      .catch((error: unknown) => {
        const message = error instanceof Error && error.message ? error.message : 'Tente de novo em instantes.'
        useToastStore.getState().push('Não foi possível transcrever o áudio. ' + message, 'error')
      })
      .finally(() => setTranscrevendo(false))
  }, [audioBlob, isRecording])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {isRecording ? (
          <Button
            type="button"
            variant="secondary"
            onClick={stopRecording}
            className="!px-4 !py-2.5 animate-pulse bg-error/10 text-error hover:bg-error/20"
          >
            <Square size={15} className="fill-current" aria-hidden />
            Parar · {formatarDuracao(duration)}
          </Button>
        ) : transcrevendo ? (
          <Button type="button" variant="secondary" disabled className="!px-4 !py-2.5">
            <Loader2 size={15} className="animate-spin" aria-hidden />
            Transcrevendo...
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            onClick={() => void startRecording()}
            disabled={disabled || transcricao !== null}
            className="!px-4 !py-2.5"
          >
            <Mic size={15} aria-hidden />
            Gravar áudio
          </Button>
        )}
        {!isRecording && !transcrevendo && transcricao === null ? (
          <span className="text-xs text-muted">Fale o resumo; o texto aparece aqui para você revisar.</span>
        ) : null}
      </div>

      {transcricao !== null ? (
        <div className="space-y-3 rounded-xl border border-accent/30 bg-accent-soft/40 p-3">
          <Textarea
            label="Transcrição do áudio (revise antes de usar)"
            rows={4}
            value={transcricao}
            onChange={(event) => setTranscricao(event.target.value)}
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" className="!px-4 !py-2.5" onClick={() => setTranscricao(null)}>
              Descartar
            </Button>
            <Button
              type="button"
              className="!px-4 !py-2.5"
              disabled={!transcricao.trim()}
              onClick={() => {
                onIncorporar(transcricao.trim())
                setTranscricao(null)
              }}
            >
              Incorporar ao resumo
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
