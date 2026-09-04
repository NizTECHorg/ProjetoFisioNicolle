import { useState, useEffect } from 'react'
import {
  FileText,
  Sparkles,
  UploadCloud,
  CheckCircle2,
  Activity,
  Dumbbell,
  Target,
  Stethoscope,
  ClipboardCheck,
  Trash2,
  FileCheck2,
  ArrowUpRight,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { analyzePhysicalEvaluationPdf } from '@/services/aiPhysicalEvaluation.service'
import { useUpdatePatient } from '@/hooks/usePatients'
import type { PhysicalEvaluationResult } from '@/types/evaluation'

interface PatientPhysicalEvaluationPanelProps {
  patientId: string
  patientName?: string
  onUseAsEvaluation?: (result: PhysicalEvaluationResult) => void
}

export function PatientPhysicalEvaluationPanel({
  patientId,
  patientName,
  onUseAsEvaluation,
}: PatientPhysicalEvaluationPanelProps) {
  const updatePatient = useUpdatePatient()
  const storageKey = `fisio.evaluations.${patientId}`

  const [evaluations, setEvaluations] = useState<PhysicalEvaluationResult[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? (JSON.parse(saved) as PhysicalEvaluationResult[]) : []
    } catch {
      return []
    }
  })

  const [selectedEvaluation, setSelectedEvaluation] = useState<PhysicalEvaluationResult | null>(
    null,
  )
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [appliedSuccess, setAppliedSuccess] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(evaluations))
    } catch {
      /* ignore */
    }
  }, [evaluations, storageKey])

  useEffect(() => {
    if (evaluations.length > 0 && !selectedEvaluation) {
      setSelectedEvaluation(evaluations[0] ?? null)
    }
  }, [evaluations, selectedEvaluation])

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMessage('Por favor, selecione um arquivo válido no formato PDF.')
      return
    }

    setErrorMessage(null)
    setIsAnalyzing(true)

    try {
      const result = await analyzePhysicalEvaluationPdf(patientId, file)
      setEvaluations((prev) => [result, ...prev])
      setSelectedEvaluation(result)
    } catch (err) {
      console.error(err)
      setErrorMessage('Ocorreu um erro ao processar a avaliação física. Tente novamente.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function handleApplyToProfile(evalData: PhysicalEvaluationResult) {
    updatePatient.mutate(
      {
        id: patientId,
        input: {
          complaint: evalData.mainComplaint,
          diagnosis: evalData.cinesiologicDiagnosis,
        },
      },
      {
        onSuccess: () => {
          setAppliedSuccess(true)
          setTimeout(() => setAppliedSuccess(false), 4000)
        },
      },
    )
  }

  function handleDeleteEvaluation(id: string) {
    const updated = evaluations.filter((e) => e.id !== id)
    setEvaluations(updated)
    if (selectedEvaluation?.id === id) {
      setSelectedEvaluation(updated[0] ?? null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header do Painel */}
      <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-forest">
                <FileText size={18} />
              </span>
              <h2 className="text-lg font-semibold text-ink">Avaliação Física em PDF</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-forest/10 px-2.5 py-0.5 text-xs font-semibold text-forest">
                <Sparkles size={12} /> IA Gemini Flash
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">
              Envie o laudo ou a ficha de Avaliação Física recebida para síntese e diagnóstico cinesiológico automático.
            </p>
          </div>
        </div>

        {/* Zona de Drop / Upload */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`mt-5 relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
            dragOver
              ? 'border-forest bg-accent-soft/40 scale-[1.005]'
              : 'border-line bg-canvas/40 hover:border-forest/50 hover:bg-canvas/80'
          }`}
        >
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileInputChange}
            disabled={isAnalyzing}
            className="absolute inset-0 cursor-pointer opacity-0"
            title="Selecione um arquivo PDF de avaliação física"
          />

          {isAnalyzing ? (
            <div className="flex flex-col items-center py-4">
              <div className="h-10 w-10 animate-spin rounded-full border-3 border-forest border-t-transparent" />
              <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-forest">
                <Sparkles size={16} className="animate-pulse" />
                Analisando PDF da Avaliação Física com IA...
              </div>
              <p className="mt-1 text-xs text-muted">
                Extraindo testes posturais, ADM, dor e diagnóstico cinesiológico.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-forest">
                <UploadCloud size={24} />
              </span>
              <p className="mt-3 text-sm font-semibold text-ink">
                Arraste a Avaliação Física (PDF) aqui ou <span className="text-forest underline">clique para selecionar</span>
              </p>
              <p className="mt-1 text-xs text-muted">Suporta arquivos PDF de até 20MB</p>
            </div>
          )}
        </div>

        {errorMessage ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        ) : null}
      </div>

      {/* Histórico e Visualização da Avaliação Ativa */}
      {evaluations.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
          {/* Barra Lateral com Avaliações Enviadas */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              Avaliações enviadas ({evaluations.length})
            </p>
            <div className="space-y-2">
              {evaluations.map((item) => {
                const isSelected = selectedEvaluation?.id === item.id
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedEvaluation(item)}
                    className={`group relative flex cursor-pointer items-start justify-between rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? 'border-forest bg-surface shadow-sm ring-1 ring-forest'
                        : 'border-line bg-surface/60 hover:border-line hover:bg-surface'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <FileCheck2 size={15} className={isSelected ? 'text-forest' : 'text-muted'} />
                        <p className="truncate text-xs font-semibold text-ink">{item.fileName}</p>
                      </div>
                      <p className="mt-1 text-[11px] text-muted">{item.uploadedAt}</p>
                    </div>
                    <button
                      type="button"
                      aria-label="Excluir avaliação"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteEvaluation(item.id)
                      }}
                      className="rounded p-1 text-muted opacity-0 hover:bg-error/10 hover:text-error group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Conteúdo Detalhado da Avaliação Selecionada */}
          {selectedEvaluation ? (
            <div className="space-y-5">
              {/* Header da Análise */}
              <div className="rounded-2xl border border-line bg-surface p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileCheck2 size={18} className="text-forest" />
                      <h3 className="font-semibold text-ink">{selectedEvaluation.fileName}</h3>
                      <span className="text-xs text-muted">({selectedEvaluation.fileSize})</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">Processado em {selectedEvaluation.uploadedAt}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {onUseAsEvaluation ? (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => onUseAsEvaluation(selectedEvaluation)}
                        className="!px-4 !py-2 text-xs flex items-center gap-1.5"
                      >
                        <ClipboardCheck size={15} />
                        Usar na avaliação estruturada
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="primary"
                      isLoading={updatePatient.isPending}
                      onClick={() => handleApplyToProfile(selectedEvaluation)}
                      className="!px-4 !py-2 text-xs flex items-center gap-1.5"
                    >
                      <ArrowUpRight size={15} />
                      Aplicar Diagnóstico ao Prontuário
                    </Button>
                  </div>
                </div>

                {appliedSuccess ? (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-2.5 text-xs font-medium text-forest">
                    <CheckCircle2 size={16} />
                    Diagnóstico e Queixa atualizados no prontuário de {patientName ?? 'paciente'} com sucesso!
                  </div>
                ) : null}

                {/* Resumo Executivo */}
                <div className="mt-4 rounded-xl border border-line bg-canvas/60 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                    <Sparkles size={14} /> Resumo Executivo da Avaliação
                  </div>
                  <p className="mt-2 text-sm leading-6 text-ink/90">{selectedEvaluation.summary}</p>
                </div>

                {/* Grid de Detalhes Médicos/Fisioterapêuticos */}
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-line p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                      <Activity size={14} /> Queixa Principal & Histórico
                    </div>
                    <p className="mt-2 text-sm leading-6 text-ink">{selectedEvaluation.mainComplaint}</p>
                  </div>

                  <div className="rounded-xl border border-line p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                      <Stethoscope size={14} /> Diagnóstico Cinesiológico Funcional
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-6 text-forest">
                      {selectedEvaluation.cinesiologicDiagnosis}
                    </p>
                  </div>

                  <div className="rounded-xl border border-line p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                      <Activity size={14} /> Avaliação Postural e ADM
                    </div>
                    <p className="mt-2 text-sm leading-6 text-ink">{selectedEvaluation.postureAndMovement}</p>
                  </div>

                  <div className="rounded-xl border border-line p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                      <Dumbbell size={14} /> Força Muscular & Testes Físicos
                    </div>
                    <p className="mt-2 text-sm leading-6 text-ink">{selectedEvaluation.muscleForceAndTests}</p>
                  </div>
                </div>

                {/* Plano de Tratamento e Objetivos */}
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-line p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                      <ClipboardCheck size={14} /> Plano de Tratamento Recomendado
                    </div>
                    <p className="mt-2 text-sm leading-6 text-ink">{selectedEvaluation.suggestedTreatmentPlan}</p>
                  </div>

                  <div className="rounded-xl border border-line p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                      <Target size={14} /> Objetivos Terapêuticos Sugeridos
                    </div>
                    <ul className="mt-2 space-y-1.5 text-sm text-ink">
                      {selectedEvaluation.suggestedGoals.map((goal, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-forest" />
                          <span>{goal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-surface/50 p-8 text-center">
          <FileText size={32} className="mx-auto text-muted/60" />
          <p className="mt-3 text-sm font-semibold text-ink">Nenhuma avaliação física cadastrada ainda</p>
          <p className="mt-1 text-xs text-muted">
            Faça o upload do arquivo PDF no campo acima para gerar a primeira análise com IA.
          </p>
        </div>
      )}
    </div>
  )
}
