import type { PhysicalEvaluationResult } from '@/types/evaluation'

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      // Remove prefix "data:application/pdf;base64,"
      const base64 = result.split(',')[1] ?? ''
      resolve(base64)
    }
    reader.onerror = (error) => reject(error)
  })
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/**
 * Analisa o PDF da Avaliação Física com o Gemini Flash.
 * Sem chave, a função lança erro e não inventa laudo.
 */
export async function analyzePhysicalEvaluationPdf(
  patientId: string,
  file: File,
): Promise<PhysicalEvaluationResult> {
  const base64Data = await fileToBase64(file)
  const apiKey = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim()

  const systemPrompt = `
    Você é um fisioterapeuta perito em avaliação física e funcional.
    Analise o documento PDF de Avaliação Física fornecido e responda estritamente em formato JSON válido com as seguintes chaves (em português):
    {
      "summary": "Resumo executivo com os dados principais do paciente e motivo da avaliação",
      "mainComplaint": "Queixa principal do paciente e histórico da lesão/dor",
      "postureAndMovement": "Análise postural, amplitudes de movimento (ADM) e desvios identificados",
      "muscleForceAndTests": "Força muscular (escala de 0 a 5), testes ortopédicos e funcionais aplicados",
      "cinesiologicDiagnosis": "Diagnóstico Cinesiológico Funcional final",
      "suggestedTreatmentPlan": "Plano de tratamento fisioterapêutico recomendado (condutas, frequência, recursos)",
      "suggestedGoals": ["Objetivo 1", "Objetivo 2", "Objetivo 3"]
    }
  `

  if (apiKey) {
    const modelsToTry = [
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-2.5-flash',
      'gemini-flash-latest',
    ]

    let lastErrorMsg = ''

    for (const modelName of modelsToTry) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: systemPrompt },
                    {
                      inline_data: {
                        mime_type: file.type || 'application/pdf',
                        data: base64Data,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                response_mime_type: 'application/json',
              },
            }),
          },
        )

        if (response.ok) {
          const data = await response.json()
          const rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text
          if (rawJsonText) {
            const parsed = JSON.parse(rawJsonText)
            return {
              id: `eval_${Date.now()}`,
              patientId,
              fileName: file.name,
              fileSize: formatBytes(file.size),
              uploadedAt: new Date().toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
              summary: parsed.summary ?? 'Avaliação física processada.',
              mainComplaint: parsed.mainComplaint ?? 'Não especificada no PDF.',
              postureAndMovement: parsed.postureAndMovement ?? 'Sem observações.',
              muscleForceAndTests: parsed.muscleForceAndTests ?? 'Testes padrão realizados.',
              cinesiologicDiagnosis: parsed.cinesiologicDiagnosis ?? 'Avaliação fisioterapêutica completa.',
              suggestedTreatmentPlan: parsed.suggestedTreatmentPlan ?? 'Seguir plano recomendado.',
              suggestedGoals: Array.isArray(parsed.suggestedGoals) ? parsed.suggestedGoals : [],
            }
          }
        } else {
          const errorJson = await response.json().catch(() => null)
          lastErrorMsg = errorJson?.error?.message ?? `Erro HTTP ${response.status} no modelo ${modelName}`
          if (response.status === 404) {
            continue
          }
          throw new Error(`Falha no Google Gemini: ${lastErrorMsg}`)
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : undefined
        if (message?.includes('Google Gemini')) {
          throw err
        }
        lastErrorMsg = message ?? 'Erro na conexão com a IA'
      }
    }

    if (lastErrorMsg) {
      throw new Error(`Falha na IA do Google Gemini: ${lastErrorMsg}`)
    }
  }

  throw new Error(
    'A análise do PDF precisa da chave da IA. Sem ela, nenhum laudo é gerado.',
  )
}
