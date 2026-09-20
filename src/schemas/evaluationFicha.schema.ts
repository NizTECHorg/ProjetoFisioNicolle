import { z } from 'zod'

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo de ${max} caracteres`)

const optionalBool = z.boolean().optional()

const evaScore = z.number().min(0).max(10).optional()

const bodyMapSymbolSchema = z.enum(['X', 'hatch', 'O', 'arrow', 'star'])

const bodyMapMarkSchema = z.object({
  regionKey: z.string().trim().min(1),
  symbol: bodyMapSymbolSchema.optional(),
})

const mobilityRowSchema = z.object({
  movimento: optionalText(200).optional(),
  direito: optionalText(80).optional(),
  esquerdo: optionalText(80).optional(),
  dor: optionalText(200).optional(),
  observacao: optionalText(400).optional(),
})

const forcaRowSchema = z.object({
  grupo: optionalText(200).optional(),
  direito: optionalText(80).optional(),
  esquerdo: optionalText(80).optional(),
  dor: optionalText(200).optional(),
  observacao: optionalText(400).optional(),
})

const periodo24hSchema = z.enum(['melhor', 'igual', 'pior']).optional()

/** Pages 01–04 musculoskeletal ficha — every leaf optional so `{}` parses (D-04). */
export const evaluationFichaSchema = z.object({
  anamnese: z
    .object({
      identificacao: z
        .object({
          nomeCompleto: optionalText(120).optional(),
          dataNascimento: optionalText(20).optional(),
          naturalidade: optionalText(120).optional(),
          genero: optionalText(80).optional(),
          estadoCivil: optionalText(80).optional(),
          profissao: optionalText(120).optional(),
          enderecoResidencial: optionalText(500).optional(),
          enderecoProfissional: optionalText(500).optional(),
          contato: optionalText(500).optional(),
          dataAvaliacao: optionalText(20).optional(),
        })
        .default({}),
      queixa: z
        .object({
          oQueTrouxe: optionalText(4000).optional(),
          regiao: optionalText(200).optional(),
          lado: z
            .object({
              direito: optionalBool,
              esquerdo: optionalBool,
              bilateral: optionalBool,
              central: optionalBool,
              naoSeAplica: optionalBool,
            })
            .default({}),
          haQuantoTempo: optionalText(200).optional(),
        })
        .default({}),
      historiaAtual: z
        .object({
          inicio: z
            .object({
              subito: optionalBool,
              gradual: optionalBool,
              aposTrauma: optionalBool,
              aposCirurgia: optionalBool,
              aposMudancaCarga: optionalBool,
              semMecanismoClaro: optionalBool,
            })
            .default({}),
          dataAproxInicio: optionalText(80).optional(),
          comoComecou: optionalText(4000).optional(),
          evolucao: z
            .object({
              melhorando: optionalBool,
              piorando: optionalBool,
              estavel: optionalBool,
              oscilando: optionalBool,
            })
            .default({}),
          jaAconteceuAntes: z.enum(['nao', 'sim']).optional(),
          jaAconteceuDetalhe: optionalText(2000).optional(),
        })
        .default({}),
      tratamentos: z
        .object({
          fisio: optionalBool,
          medicamentos: optionalBool,
          infiltracao: optionalBool,
          cirurgia: optionalBool,
          imobilizacao: optionalBool,
          outro: optionalBool,
          outroDetalhe: optionalText(400).optional(),
          exames: z
            .object({
              rx: optionalBool,
              us: optionalBool,
              rm: optionalBool,
              tc: optionalBool,
              enmg: optionalBool,
              outros: optionalBool,
              outrosDetalhe: optionalText(400).optional(),
            })
            .default({}),
          achados: optionalText(4000).optional(),
        })
        .default({}),
      historicoPregresso: z
        .object({
          cirurgias: optionalBool,
          fraturas: optionalBool,
          lesoesMsk: optionalBool,
          neuro: optionalBool,
          cardio: optionalBool,
          diabetes: optionalBool,
          cancer: optionalBool,
          inflamatorioReuma: optionalBool,
          outros: optionalBool,
          outrosDetalhe: optionalText(400).optional(),
          observacoes: optionalText(4000).optional(),
        })
        .default({}),
    })
    .default({}),

  sintomas: z
    .object({
      mapa: z
        .object({
          marks: z.array(bodyMapMarkSchema).default([]),
        })
        .default({}),
      caracteristica: z
        .object({
          dor: optionalBool,
          rigidez: optionalBool,
          fraqueza: optionalBool,
          parestesia: optionalBool,
          dormencia: optionalBool,
          instabilidade: optionalBool,
          travamento: optionalBool,
          estalo: optionalBool,
          edema: optionalBool,
          outro: optionalBool,
          outroDetalhe: optionalText(400).optional(),
        })
        .default({}),
      intensidade: z
        .object({
          agora: evaScore,
          melhor: evaScore,
          pior: evaScore,
        })
        .default({}),
      comportamento24h: z
        .object({
          manha: periodo24hSchema,
          dia: periodo24hSchema,
          noite: periodo24hSchema,
          interfereSono: z.enum(['nao', 'sim']).optional(),
          acordaPorSintomas: z.enum(['nao', 'sim']).optional(),
        })
        .default({}),
      piora: z
        .object({
          caminhar: optionalBool,
          agachar: optionalBool,
          deitar: optionalBool,
          carregarPeso: optionalBool,
          correr: optionalBool,
          sentar: optionalBool,
          movimentoEspecifico: optionalBool,
          trabalho: optionalBool,
          escadas: optionalBool,
          permanecerEmPe: optionalBool,
          esporte: optionalBool,
          outro: optionalBool,
          outroDetalhe: optionalText(400).optional(),
          detalhe: optionalText(2000).optional(),
        })
        .default({}),
      melhora: z
        .object({
          repouso: optionalBool,
          calor: optionalBool,
          exercicio: optionalBool,
          movimento: optionalBool,
          frio: optionalBool,
          mudancaPosicao: optionalBool,
          medicamento: optionalBool,
          outro: optionalBool,
          outroDetalhe: optionalText(400).optional(),
          detalhe: optionalText(2000).optional(),
        })
        .default({}),
      irritabilidade: z
        .object({
          esforcoProvocar: z.enum(['pouco', 'moderado', 'muito', 'variavel']).optional(),
          tempoVoltar: z
            .enum(['minutos', 'horas', 'ateDiaSeguinte', 'maisDe24h', 'variavel'])
            .optional(),
        })
        .default({}),
    })
    .default({}),

  funcao: z
    .object({
      limitacaoFuncional: z
        .object({
          item1: optionalText(1000).optional(),
          item2: optionalText(1000).optional(),
          item3: optionalText(1000).optional(),
        })
        .default({}),
      atividadesAfetadas: z
        .object({
          caminhar: optionalBool,
          correr: optionalBool,
          escadas: optionalBool,
          agachar: optionalBool,
          sentar: optionalBool,
          levantar: optionalBool,
          dormir: optionalBool,
          dirigir: optionalBool,
          trabalhar: optionalBool,
          estudar: optionalBool,
          cuidarCasa: optionalBool,
          vestirSe: optionalBool,
          esporte: optionalBool,
          lazer: optionalBool,
          autocuidado: optionalBool,
          outra: optionalBool,
          outraDetalhe: optionalText(400).optional(),
          capacidadeAtual: optionalText(200).optional(),
          atividade: optionalText(200).optional(),
          consigoPor: optionalText(200).optional(),
          antesConseguiaPor: optionalText(200).optional(),
        })
        .default({}),
      rotina: z
        .object({
          trabalho: z
            .object({
              sentado: optionalBool,
              emPe: optionalBool,
              manual: optionalBool,
              repetitivo: optionalBool,
              cargaElevada: optionalBool,
              variavel: optionalBool,
            })
            .default({}),
          horasDia: optionalText(80).optional(),
          praticaAtividadeFisica: z.enum(['nao', 'sim']).optional(),
          atividadeQualFreq: optionalText(400).optional(),
        })
        .default({}),
      expectativas: z
        .object({
          boaMelhora: optionalText(4000).optional(),
          objetivos: z
            .object({
              reduzirSintomas: optionalBool,
              recuperarMovimento: optionalBool,
              recuperarForca: optionalBool,
              voltarTrabalho: optionalBool,
              voltarEsporte: optionalBool,
              recuperarIndependencia: optionalBool,
              dormirMelhor: optionalBool,
              outro: optionalBool,
              outroDetalhe: optionalText(400).optional(),
            })
            .default({}),
        })
        .default({}),
      triagemSeguranca: z
        .object({
          traumaRecente: optionalBool,
          febreMalEstar: optionalBool,
          perdaPeso: optionalBool,
          historicoCancer: optionalBool,
          deficitNeuro: optionalBool,
          alteracaoBexigaIntestino: optionalBool,
          alteracaoSensitivaPerineal: optionalBool,
          dorToracica: optionalBool,
          dispneia: optionalBool,
          sinaisPosOp: optionalBool,
          outroAchado: optionalBool,
          outroAchadoDetalhe: optionalText(400).optional(),
          conduta: z
            .object({
              avalieiDocumentei: optionalBool,
              precisoInvestigar: optionalBool,
              encaminhamento: optionalBool,
              urgencia: optionalBool,
              naoSeAplica: optionalBool,
            })
            .default({}),
          observacoes: optionalText(4000).optional(),
        })
        .default({}),
      medicacoes: z
        .object({
          medicamentos: optionalText(4000).optional(),
          alergias: optionalText(2000).optional(),
          outrasInfo: optionalText(4000).optional(),
        })
        .default({}),
    })
    .default({}),

  avaliacaoPlano: z
    .object({
      inspecao: z
        .object({
          marcha: optionalBool,
          postura: optionalBool,
          edema: optionalBool,
          equimose: optionalBool,
          atrofia: optionalBool,
          assimetria: optionalBool,
          compensacoes: optionalBool,
          outro: optionalBool,
          outroDetalhe: optionalText(400).optional(),
          achados: optionalText(4000).optional(),
        })
        .default({}),
      mobilidade: z
        .object({
          linhas: z.array(mobilityRowSchema).default([]),
          ativo: optionalBool,
          passivo: optionalBool,
          bilateral: optionalBool,
        })
        .default({}),
      forca: z
        .object({
          linhas: z.array(forcaRowSchema).default([]),
        })
        .default({}),
      neurologico: z
        .object({
          sensibilidade: optionalBool,
          miotomos: optionalBool,
          reflexos: optionalBool,
          neurodinamica: optionalBool,
          coordenacao: optionalBool,
          outro: optionalBool,
          outroDetalhe: optionalText(400).optional(),
          achados: optionalText(4000).optional(),
        })
        .default({}),
      palpacaoTestes: z
        .object({
          palpacao: optionalText(2000).optional(),
          testesClinicos: optionalText(2000).optional(),
          resultados: optionalText(2000).optional(),
          testeFuncional: optionalText(2000).optional(),
          resultadoInicial: optionalText(2000).optional(),
        })
        .default({}),
      sintese: z
        .object({
          problema1: optionalText(1000).optional(),
          problema2: optionalText(1000).optional(),
          problema3: optionalText(1000).optional(),
          diagnosticoFisio: optionalText(4000).optional(),
          prognostico: optionalText(4000).optional(),
        })
        .default({}),
      objetivos: z
        .object({
          curto1: optionalText(1000).optional(),
          curto2: optionalText(1000).optional(),
          medioLongo1: optionalText(1000).optional(),
          medioLongo2: optionalText(1000).optional(),
        })
        .default({}),
      planejamento: z
        .object({
          educacao: optionalBool,
          exercicioTerapeutico: optionalBool,
          treinoFuncional: optionalBool,
          terapiaManual: optionalBool,
          exposicaoCarga: optionalBool,
          autocuidado: optionalBool,
          outro: optionalBool,
          outroDetalhe: optionalText(400).optional(),
          frequencia: optionalText(200).optional(),
          qtdAtendimentos: optionalText(80).optional(),
          criteriosProgressao: optionalText(2000).optional(),
          criteriosReavaliacao: optionalText(2000).optional(),
          encaminhamento: z.enum(['nao', 'sim']).optional(),
          encaminhamentoDetalhe: optionalText(1000).optional(),
        })
        .default({}),
      profissional: z
        .object({
          fisioterapeuta: optionalText(120).optional(),
          crefito: optionalText(80).optional(),
          data: optionalText(20).optional(),
          assinatura: optionalText(200).optional(),
        })
        .default({}),
    })
    .default({}),
})

export type EvaluationFicha = z.infer<typeof evaluationFichaSchema>

export function emptyEvaluationFicha(): EvaluationFicha {
  return evaluationFichaSchema.parse({})
}
