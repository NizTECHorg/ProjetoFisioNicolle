import { useEffect, useRef, useState } from 'react'
import { Loader2, Mic, Square } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { InfoHint } from '@/components/ui/InfoHint'
import { useVoiceCopilot } from '@/hooks/useVoiceCopilot'
import { dictateEvolutionFields, type CamposEvolucaoDitados } from '@/services/ai.service'
import { useToastStore } from '@/stores/toast.store'

/** Ditado dentro da sessão: até 3 minutos. */
const LIMITE_MS = 180_000
const LIMITE_SEGUNDOS = LIMITE_MS / 1000

const ROTULOS: Record<keyof CamposEvolucaoDitados, string> = {
  patientState: 'Estado do paciente',
  changesSinceLast: 'Mudanças',
  conducts: 'Condutas',
  treatmentResponse: 'Resposta ao tratamento',
  sideEffects: 'Efeitos colaterais',
  incidents: 'Intercorrências',
  nextPlan: 'Planejamento',
}

function mmss(segundos: number) {
  return `${Math.floor(segundos / 60).toString().padStart(2, '0')}:${(segundos % 60).toString().padStart(2, '0')}`
}

type Props = {
  patientId: string
  disabled?: boolean
  /** Recebe só os campos com texto; quem chama junta ao que já estava escrito. */
  onCampos: (campos: Partial<CamposEvolucaoDitados>) => void
}

/**
 * Microfone da evolução: grava o relato, a IA entende o assunto de cada trecho e preenche
 * o campo que mais combina (estado, condutas, efeitos colaterais, plano...).
 */
export function EvolucaoDitado({ patientId, disabled = false, onCampos }: Props) {
  const { isRecording, duration, startRecording, stopRecording, audioBlob } = useVoiceCopilot(LIMITE_MS)
  const [processando, setProcessando] = useState(false)
  const [preenchidos, setPreenchidos] = useState<string[]>([])
  const processado = useRef<Blob | null>(null)
  const onCamposRef = useRef(onCampos)
  onCamposRef.current = onCampos

  useEffect(() => {
    if (!audioBlob || isRecording || processado.current === audioBlob) return
    processado.current = audioBlob
    setProcessando(true)
    dictateEvolutionFields(audioBlob, patientId)
      .then((campos) => {
        const comTexto = Object.fromEntries(
          Object.entries(campos).filter(([, valor]) => valor.trim().length > 0),
        ) as Partial<CamposEvolucaoDitados>
        const chaves = Object.keys(comTexto) as Array<keyof CamposEvolucaoDitados>
        if (chaves.length === 0) {
          useToastStore.getState().push('Não deu para entender o áudio. Tente gravar de novo.', 'error')
          return
        }
        onCamposRef.current(comTexto)
        setPreenchidos(chaves.map((chave) => ROTULOS[chave]))
      })
      .catch((error: unknown) => {
        const message = error instanceof Error && error.message ? error.message : 'Tente de novo em instantes.'
        useToastStore.getState().push('Não foi possível processar o áudio. ' + message, 'error')
      })
      .finally(() => setProcessando(false))
  }, [audioBlob, isRecording, patientId])

  return (
    <div className="space-y-2 rounded-xl border border-line bg-canvas p-3">
      <div className="flex flex-wrap items-center gap-2">
        {isRecording ? (
          <Button
            type="button"
            variant="secondary"
            onClick={stopRecording}
            className="!px-4 !py-2.5 animate-pulse bg-error/10 text-error hover:bg-error/20"
          >
            <Square size={15} className="fill-current" aria-hidden />
            Parar · {mmss(duration)} / {mmss(LIMITE_SEGUNDOS)}
          </Button>
        ) : processando ? (
          <Button type="button" variant="secondary" disabled className="!px-4 !py-2.5">
            <Loader2 size={15} className="animate-spin" aria-hidden />
            Organizando nos campos...
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setPreenchidos([])
              void startRecording()
            }}
            disabled={disabled}
            className="!px-4 !py-2.5"
          >
            <Mic size={15} aria-hidden />
            Falar a evolução
          </Button>
        )}
        <InfoHint
          label="Sobre falar a evolução"
          text="Fale como foi a sessão (até 3 min). A IA entende cada parte e coloca no campo certo: estado do paciente, condutas, efeitos colaterais, plano… O que já estava escrito continua; o novo entra embaixo. Revise antes de salvar."
        />
      </div>
      {preenchidos.length > 0 ? (
        <p role="status" className="text-xs text-forest">
          Preenchido: {preenchidos.join(', ')}. Revise os campos abaixo.
        </p>
      ) : null}
    </div>
  )
}
