import { z } from 'zod'

/** Treat null / '' as absent so partial saves never fail on empty radios. */
function emptyToUndefined(value: unknown) {
  if (value === null || value === undefined || value === '') return undefined
  return value
}

const optionalText = (max: number) =>
  z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .max(max, `Máximo de ${max} caracteres`)
      .optional(),
  )

const optionalBool = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) return undefined
  if (value === true || value === 'true' || value === 'on' || value === 1 || value === '1') return true
  if (value === false || value === 'false' || value === 0 || value === '0') return false
  return value
}, z.boolean().optional())

const evaScore = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) return undefined
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : value
}, z.number().min(0).max(10).optional())

function optionalEnum<T extends [string, ...string[]]>(values: T) {
  return z.preprocess(emptyToUndefined, z.enum(values).optional())
}

const bodyMapSymbolSchema = z.enum(['X', 'hatch', 'O', 'arrow', 'star'])

const bodyMapMarkSchema = z.object({
  regionKey: z.string().trim().min(1),
  symbol: z.preprocess(emptyToUndefined, bodyMapSymbolSchema.optional()),
})

const mobilityRowSchema = z.object({
  movimento: optionalText(200),
  direito: optionalText(80),
  esquerdo: optionalText(80),
  dor: optionalText(200),
  observacao: optionalText(400),
})

const forcaRowSchema = z.object({
  grupo: optionalText(200),
  direito: optionalText(80),
  esquerdo: optionalText(80),
  dor: optionalText(200),
  observacao: optionalText(400),
})

const periodo24hSchema = optionalEnum(['melhor', 'igual', 'pior'])

/** Pages 01–04 musculoskeletal ficha — every leaf optional so `{}` parses (D-04). */
export const evaluationFichaSchema = z.object({
  /** Nome livre da avaliação (lista / PDF). Opcional — save parcial ok. */
  titulo: optionalText(160),
  anamnese: z
    .object({
      identificacao: z
        .object({
          nomeCompleto: optionalText(120),
          dataNascimento: optionalText(20),
          naturalidade: optionalText(120),
          genero: optionalText(80),
          estadoCivil: optionalText(80),
          profissao: optionalText(120),
          enderecoResidencial: optionalText(500),
          enderecoProfissional: optionalText(500),
          contato: optionalText(500),
          dataAvaliacao: optionalText(20),
        })
        .default({}),
      queixa: z
        .object({
          oQueTrouxe: optionalText(4000),
          regiao: optionalText(200),
          lado: z
            .object({
              direito: optionalBool,
              esquerdo: optionalBool,
              bilateral: optionalBool,
              central: optionalBool,
              naoSeAplica: optionalBool,
            })
            .default({}),
          haQuantoTempo: optionalText(200),
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
          dataAproxInicio: optionalText(80),
          comoComecou: optionalText(4000),
          evolucao: z
            .object({
              melhorando: optionalBool,
              piorando: optionalBool,
              estavel: optionalBool,
              oscilando: optionalBool,
            })
            .default({}),
          jaAconteceuAntes: optionalEnum(['nao', 'sim']),
          jaAconteceuDetalhe: optionalText(2000),
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
          outroDetalhe: optionalText(400),
          exames: z
            .object({
              rx: optionalBool,
              us: optionalBool,
              rm: optionalBool,
              tc: optionalBool,
              enmg: optionalBool,
              outros: optionalBool,
              outrosDetalhe: optionalText(400),
            })
            .default({}),
          achados: optionalText(4000),
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
          outrosDetalhe: optionalText(400),
          observacoes: optionalText(4000),
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
          outroDetalhe: optionalText(400),
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
          interfereSono: optionalEnum(['nao', 'sim']),
          acordaPorSintomas: optionalEnum(['nao', 'sim']),
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
          outroDetalhe: optionalText(400),
          detalhe: optionalText(2000),
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
          outroDetalhe: optionalText(400),
          detalhe: optionalText(2000),
        })
        .default({}),
      irritabilidade: z
        .object({
          esforcoProvocar: optionalEnum(['pouco', 'moderado', 'muito', 'variavel']),
          tempoVoltar: optionalEnum(['minutos', 'horas', 'ateDiaSeguinte', 'maisDe24h', 'variavel']),
        })
        .default({}),
    })
    .default({}),

  funcao: z
    .object({
      limitacaoFuncional: z
        .object({
          item1: optionalText(1000),
          item2: optionalText(1000),
          item3: optionalText(1000),
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
          outraDetalhe: optionalText(400),
          capacidadeAtual: optionalText(200),
          atividade: optionalText(200),
          consigoPor: optionalText(200),
          antesConseguiaPor: optionalText(200),
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
          horasDia: optionalText(80),
          praticaAtividadeFisica: optionalEnum(['nao', 'sim']),
          atividadeQualFreq: optionalText(400),
        })
        .default({}),
      expectativas: z
        .object({
          boaMelhora: optionalText(4000),
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
              outroDetalhe: optionalText(400),
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
          outroAchadoDetalhe: optionalText(400),
          conduta: z
            .object({
              avalieiDocumentei: optionalBool,
              precisoInvestigar: optionalBool,
              encaminhamento: optionalBool,
              urgencia: optionalBool,
              naoSeAplica: optionalBool,
            })
            .default({}),
          observacoes: optionalText(4000),
        })
        .default({}),
      medicacoes: z
        .object({
          medicamentos: optionalText(4000),
          alergias: optionalText(2000),
          outrasInfo: optionalText(4000),
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
          outroDetalhe: optionalText(400),
          achados: optionalText(4000),
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
          outroDetalhe: optionalText(400),
          achados: optionalText(4000),
        })
        .default({}),
      palpacaoTestes: z
        .object({
          palpacao: optionalText(2000),
          testesClinicos: optionalText(2000),
          resultados: optionalText(2000),
          testeFuncional: optionalText(2000),
          resultadoInicial: optionalText(2000),
        })
        .default({}),
      sintese: z
        .object({
          problema1: optionalText(1000),
          problema2: optionalText(1000),
          problema3: optionalText(1000),
          diagnosticoFisio: optionalText(4000),
          prognostico: optionalText(4000),
        })
        .default({}),
      objetivos: z
        .object({
          curto1: optionalText(1000),
          curto2: optionalText(1000),
          medioLongo1: optionalText(1000),
          medioLongo2: optionalText(1000),
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
          outroDetalhe: optionalText(400),
          frequencia: optionalText(200),
          qtdAtendimentos: optionalText(80),
          criteriosProgressao: optionalText(2000),
          criteriosReavaliacao: optionalText(2000),
          encaminhamento: optionalEnum(['nao', 'sim']),
          encaminhamentoDetalhe: optionalText(1000),
        })
        .default({}),
      profissional: z
        .object({
          fisioterapeuta: optionalText(120),
          crefito: optionalText(80),
          data: optionalText(20),
          assinatura: optionalText(200),
        })
        .default({}),
    })
    .default({}),
})

export type EvaluationFicha = z.infer<typeof evaluationFichaSchema>

export function emptyEvaluationFicha(): EvaluationFicha {
  return evaluationFichaSchema.parse({})
}
