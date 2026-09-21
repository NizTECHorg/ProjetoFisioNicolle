import type { EvaluationFicha } from '@/schemas/evaluationFicha.schema'

export type PdfFieldId = string

export type PdfFieldItem = {
  id: PdfFieldId
  label: string
  groupLabel: string
  preview?: string
  sensitive?: boolean
}

/** Session evolution shape used by the evolução catalog (SOAP leaves). */
export type SessionEvolutionLike = {
  patientState?: string | null
  changesSinceLast?: string | null
  conducts?: string | null
  treatmentResponse?: string | null
  incidents?: string | null
  nextPlan?: string | null
}

const PREVIEW_MAX = 40

export function textFilled(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/** Number is filled when defined (EVA 0 counts). */
export function numberFilled(value: number | null | undefined): boolean {
  return value !== null && value !== undefined
}

function checkedLabels(
  flags: Record<string, unknown> | undefined,
  labels: Record<string, string>,
): string[] {
  if (!flags) return []
  const parts: string[] = []
  for (const [key, label] of Object.entries(labels)) {
    if (flags[key] === true) parts.push(label)
  }
  for (const detailKey of [
    'outroDetalhe',
    'outraDetalhe',
    'outrosDetalhe',
    'outroAchadoDetalhe',
  ] as const) {
    const detail = flags[detailKey]
    if (typeof detail === 'string' && detail.trim()) parts.push(detail.trim())
  }
  return parts
}

function previewFrom(...candidates: Array<string | number | null | undefined>): string | undefined {
  for (const c of candidates) {
    if (c === null || c === undefined) continue
    const s = String(c).trim()
    if (!s) continue
    return s.length <= PREVIEW_MAX ? s : `${s.slice(0, PREVIEW_MAX - 1)}…`
  }
  return undefined
}

function pushBlock(
  items: PdfFieldItem[],
  opts: {
    id: PdfFieldId
    label: string
    groupLabel: string
    filled: boolean
    sensitive?: boolean
    preview?: string
  },
): void {
  if (!opts.filled) return
  items.push({
    id: opts.id,
    label: opts.label,
    groupLabel: opts.groupLabel,
    ...(opts.sensitive ? { sensitive: true } : {}),
    ...(opts.preview ? { preview: opts.preview } : {}),
  })
}

/**
 * Pure filled-block catalog for EvaluationFicha (D-02).
 * One entry per lettered block that drawAvaliacao would render — not leaf checkboxes.
 */
export function buildEvaluationFilledCatalog(ficha: EvaluationFicha): PdfFieldItem[] {
  const items: PdfFieldItem[] = []

  // —— 01 Anamnese ——
  const id = ficha.anamnese?.identificacao
  const queixa = ficha.anamnese?.queixa
  const historia = ficha.anamnese?.historiaAtual
  const tratamentos = ficha.anamnese?.tratamentos
  const pregresso = ficha.anamnese?.historicoPregresso

  const idFields: Array<string | undefined> = [
    id?.nomeCompleto,
    id?.dataNascimento,
    id?.naturalidade,
    id?.genero,
    id?.estadoCivil,
    id?.profissao,
    id?.enderecoResidencial,
    id?.enderecoProfissional,
    id?.contato,
    id?.dataAvaliacao,
  ]
  const hasId = idFields.some((v) => textFilled(v))
  pushBlock(items, {
    id: '01.A',
    label: 'Identificação',
    groupLabel: '01 · Anamnese · Bloco A',
    filled: hasId,
    sensitive: true,
    preview: previewFrom(...idFields),
  })

  const ladoItems = checkedLabels(queixa?.lado as Record<string, unknown> | undefined, {
    direito: 'Direito',
    esquerdo: 'Esquerdo',
    bilateral: 'Bilateral',
    central: 'Central',
    naoSeAplica: 'Não se aplica',
  })
  const hasQueixa =
    textFilled(queixa?.oQueTrouxe) ||
    textFilled(queixa?.regiao) ||
    textFilled(queixa?.haQuantoTempo) ||
    ladoItems.length > 0
  pushBlock(items, {
    id: '01.B',
    label: 'Queixa principal',
    groupLabel: '01 · Anamnese · Bloco B',
    filled: hasQueixa,
    preview: previewFrom(queixa?.oQueTrouxe, queixa?.regiao, ladoItems[0], queixa?.haQuantoTempo),
  })

  const inicioItems = checkedLabels(historia?.inicio as Record<string, unknown> | undefined, {
    subito: 'Súbito',
    gradual: 'Gradual',
    aposTrauma: 'Após trauma',
    aposCirurgia: 'Após cirurgia',
    aposMudancaCarga: 'Após mudança de carga',
    semMecanismoClaro: 'Sem mecanismo claro',
  })
  const evolucaoItems = checkedLabels(historia?.evolucao as Record<string, unknown> | undefined, {
    melhorando: 'Melhorando',
    piorando: 'Piorando',
    estavel: 'Estável',
    oscilando: 'Oscilando',
  })
  const hasHistoria =
    inicioItems.length > 0 ||
    textFilled(historia?.dataAproxInicio) ||
    textFilled(historia?.comoComecou) ||
    evolucaoItems.length > 0 ||
    Boolean(historia?.jaAconteceuAntes) ||
    textFilled(historia?.jaAconteceuDetalhe)
  pushBlock(items, {
    id: '01.C',
    label: 'História atual',
    groupLabel: '01 · Anamnese · Bloco C',
    filled: hasHistoria,
    preview: previewFrom(
      inicioItems[0],
      historia?.comoComecou,
      evolucaoItems[0],
      historia?.dataAproxInicio,
    ),
  })

  const tratamentoItems = checkedLabels(tratamentos as Record<string, unknown> | undefined, {
    fisio: 'Fisioterapia',
    medicamentos: 'Medicamentos',
    infiltracao: 'Infiltração',
    cirurgia: 'Cirurgia',
    imobilizacao: 'Imobilização',
    outro: 'Outro',
  })
  const exameItems = checkedLabels(
    tratamentos?.exames as Record<string, unknown> | undefined,
    {
      rx: 'RX',
      us: 'US',
      rm: 'RM',
      tc: 'TC',
      enmg: 'ENMG',
      outros: 'Outros',
    },
  )
  const hasTratamentos =
    tratamentoItems.length > 0 || exameItems.length > 0 || textFilled(tratamentos?.achados)
  pushBlock(items, {
    id: '01.D',
    label: 'Tratamentos e investigações',
    groupLabel: '01 · Anamnese · Bloco D',
    filled: hasTratamentos,
    preview: previewFrom(tratamentoItems[0], exameItems[0], tratamentos?.achados),
  })

  const pregressoItems = checkedLabels(pregresso as Record<string, unknown> | undefined, {
    cirurgias: 'Cirurgias',
    fraturas: 'Fraturas',
    lesoesMsk: 'Lesões musculoesqueléticas',
    neuro: 'Neuro',
    cardio: 'Cardio',
    diabetes: 'Diabetes',
    cancer: 'Câncer',
    inflamatorioReuma: 'Inflamatório / reuma',
    outros: 'Outros',
  })
  const hasPregresso = pregressoItems.length > 0 || textFilled(pregresso?.observacoes)
  pushBlock(items, {
    id: '01.E',
    label: 'Histórico pregresso',
    groupLabel: '01 · Anamnese · Bloco E',
    filled: hasPregresso,
    preview: previewFrom(pregressoItems[0], pregresso?.observacoes),
  })

  // —— 02 Sintomas ——
  const sintomas = ficha.sintomas
  const marks = sintomas?.mapa?.marks ?? []
  const hasMapa = marks.length > 0
  pushBlock(items, {
    id: '02.A',
    label: 'Mapa corporal',
    groupLabel: '02 · Sintomas · Bloco A',
    filled: hasMapa,
    preview: previewFrom(marks[0]?.regionKey),
  })

  const caracteristicaItems = checkedLabels(
    sintomas?.caracteristica as Record<string, unknown> | undefined,
    {
      dor: 'Dor',
      rigidez: 'Rigidez',
      fraqueza: 'Fraqueza',
      parestesia: 'Parestesia',
      dormencia: 'Dormência',
      instabilidade: 'Instabilidade',
      travamento: 'Travamento',
      estalo: 'Estalo',
      edema: 'Edema',
      outro: 'Outro',
    },
  )
  pushBlock(items, {
    id: '02.B',
    label: 'Característica predominante',
    groupLabel: '02 · Sintomas · Bloco B',
    filled: caracteristicaItems.length > 0,
    preview: previewFrom(caracteristicaItems[0]),
  })

  const hasIntensidade =
    numberFilled(sintomas?.intensidade?.agora) ||
    numberFilled(sintomas?.intensidade?.melhor) ||
    numberFilled(sintomas?.intensidade?.pior)
  pushBlock(items, {
    id: '02.C',
    label: 'Intensidade (0–10)',
    groupLabel: '02 · Sintomas · Bloco C',
    filled: hasIntensidade,
    preview: previewFrom(
      sintomas?.intensidade?.agora,
      sintomas?.intensidade?.melhor,
      sintomas?.intensidade?.pior,
    ),
  })

  const has24h =
    Boolean(sintomas?.comportamento24h?.manha) ||
    Boolean(sintomas?.comportamento24h?.dia) ||
    Boolean(sintomas?.comportamento24h?.noite) ||
    Boolean(sintomas?.comportamento24h?.interfereSono) ||
    Boolean(sintomas?.comportamento24h?.acordaPorSintomas)
  pushBlock(items, {
    id: '02.D',
    label: 'Comportamento em 24 horas',
    groupLabel: '02 · Sintomas · Bloco D',
    filled: has24h,
    preview: previewFrom(
      sintomas?.comportamento24h?.manha,
      sintomas?.comportamento24h?.dia,
      sintomas?.comportamento24h?.noite,
    ),
  })

  const pioraItems = checkedLabels(sintomas?.piora as Record<string, unknown> | undefined, {
    caminhar: 'Caminhar',
    agachar: 'Agachar',
    deitar: 'Deitar',
    carregarPeso: 'Carregar peso',
    correr: 'Correr',
    sentar: 'Sentar',
    movimentoEspecifico: 'Movimento específico',
    trabalho: 'Trabalho',
    escadas: 'Escadas',
    permanecerEmPe: 'Permanecer em pé',
    esporte: 'Esporte',
    outro: 'Outro',
  })
  const hasPiora = pioraItems.length > 0 || textFilled(sintomas?.piora?.detalhe)
  pushBlock(items, {
    id: '02.E',
    label: 'O que piora',
    groupLabel: '02 · Sintomas · Bloco E',
    filled: hasPiora,
    preview: previewFrom(pioraItems[0], sintomas?.piora?.detalhe),
  })

  const melhoraItems = checkedLabels(sintomas?.melhora as Record<string, unknown> | undefined, {
    repouso: 'Repouso',
    calor: 'Calor',
    exercicio: 'Exercício',
    movimento: 'Movimento',
    frio: 'Frio',
    mudancaPosicao: 'Mudança de posição',
    medicamento: 'Medicamento',
    outro: 'Outro',
  })
  const hasMelhora = melhoraItems.length > 0 || textFilled(sintomas?.melhora?.detalhe)
  pushBlock(items, {
    id: '02.F',
    label: 'O que melhora',
    groupLabel: '02 · Sintomas · Bloco F',
    filled: hasMelhora,
    preview: previewFrom(melhoraItems[0], sintomas?.melhora?.detalhe),
  })

  const hasIrrit =
    Boolean(sintomas?.irritabilidade?.esforcoProvocar) ||
    Boolean(sintomas?.irritabilidade?.tempoVoltar)
  pushBlock(items, {
    id: '02.G',
    label: 'Irritabilidade / resposta',
    groupLabel: '02 · Sintomas · Bloco G',
    filled: hasIrrit,
    preview: previewFrom(
      sintomas?.irritabilidade?.esforcoProvocar,
      sintomas?.irritabilidade?.tempoVoltar,
    ),
  })

  // —— 03 Função ——
  const funcao = ficha.funcao
  const hasLimit =
    textFilled(funcao?.limitacaoFuncional?.item1) ||
    textFilled(funcao?.limitacaoFuncional?.item2) ||
    textFilled(funcao?.limitacaoFuncional?.item3)
  pushBlock(items, {
    id: '03.A',
    label: 'Principal limitação funcional',
    groupLabel: '03 · Função · Bloco A',
    filled: hasLimit,
    preview: previewFrom(
      funcao?.limitacaoFuncional?.item1,
      funcao?.limitacaoFuncional?.item2,
      funcao?.limitacaoFuncional?.item3,
    ),
  })

  const atividadeItems = checkedLabels(
    funcao?.atividadesAfetadas as Record<string, unknown> | undefined,
    {
      caminhar: 'Caminhar',
      correr: 'Correr',
      escadas: 'Escadas',
      agachar: 'Agachar',
      sentar: 'Sentar',
      levantar: 'Levantar',
      dormir: 'Dormir',
      dirigir: 'Dirigir',
      trabalhar: 'Trabalhar',
      estudar: 'Estudar',
      cuidarCasa: 'Cuidar da casa',
      vestirSe: 'Vestir-se',
      esporte: 'Esporte',
      lazer: 'Lazer',
      autocuidado: 'Autocuidado',
      outra: 'Outra',
    },
  )
  const hasAtividades =
    atividadeItems.length > 0 ||
    textFilled(funcao?.atividadesAfetadas?.capacidadeAtual) ||
    textFilled(funcao?.atividadesAfetadas?.atividade) ||
    textFilled(funcao?.atividadesAfetadas?.consigoPor) ||
    textFilled(funcao?.atividadesAfetadas?.antesConseguiaPor)
  pushBlock(items, {
    id: '03.B',
    label: 'Atividades afetadas',
    groupLabel: '03 · Função · Bloco B',
    filled: hasAtividades,
    preview: previewFrom(
      atividadeItems[0],
      funcao?.atividadesAfetadas?.capacidadeAtual,
      funcao?.atividadesAfetadas?.atividade,
    ),
  })

  const trabalhoItems = checkedLabels(
    funcao?.rotina?.trabalho as Record<string, unknown> | undefined,
    {
      sentado: 'Sentado',
      emPe: 'Em pé',
      manual: 'Manual',
      repetitivo: 'Repetitivo',
      cargaElevada: 'Carga elevada',
      variavel: 'Variável',
    },
  )
  const hasRotina =
    trabalhoItems.length > 0 ||
    textFilled(funcao?.rotina?.horasDia) ||
    Boolean(funcao?.rotina?.praticaAtividadeFisica) ||
    textFilled(funcao?.rotina?.atividadeQualFreq)
  pushBlock(items, {
    id: '03.C',
    label: 'Rotina e demanda',
    groupLabel: '03 · Função · Bloco C',
    filled: hasRotina,
    preview: previewFrom(trabalhoItems[0], funcao?.rotina?.horasDia, funcao?.rotina?.atividadeQualFreq),
  })

  const objetivoItems = checkedLabels(
    funcao?.expectativas?.objetivos as Record<string, unknown> | undefined,
    {
      reduzirSintomas: 'Reduzir sintomas',
      recuperarMovimento: 'Recuperar movimento',
      recuperarForca: 'Recuperar força',
      voltarTrabalho: 'Voltar ao trabalho',
      voltarEsporte: 'Voltar ao esporte',
      recuperarIndependencia: 'Recuperar independência',
      dormirMelhor: 'Dormir melhor',
      outro: 'Outro',
    },
  )
  const hasExpect = textFilled(funcao?.expectativas?.boaMelhora) || objetivoItems.length > 0
  pushBlock(items, {
    id: '03.D',
    label: 'Expectativas e objetivos',
    groupLabel: '03 · Função · Bloco D',
    filled: hasExpect,
    preview: previewFrom(funcao?.expectativas?.boaMelhora, objetivoItems[0]),
  })

  const redFlagItems = checkedLabels(
    funcao?.triagemSeguranca as Record<string, unknown> | undefined,
    {
      traumaRecente: 'Trauma recente',
      febreMalEstar: 'Febre / mal-estar',
      perdaPeso: 'Perda de peso',
      historicoCancer: 'Histórico de câncer',
      deficitNeuro: 'Déficit neurológico',
      alteracaoBexigaIntestino: 'Alteração bexiga/intestino',
      alteracaoSensitivaPerineal: 'Alteração sensitiva perineal',
      dorToracica: 'Dor torácica',
      dispneia: 'Dispneia',
      sinaisPosOp: 'Sinais pós-operatórios',
      outroAchado: 'Outro achado',
    },
  )
  const condutaItems = checkedLabels(
    funcao?.triagemSeguranca?.conduta as Record<string, unknown> | undefined,
    {
      avalieiDocumentei: 'Avaliei e documentei',
      precisoInvestigar: 'Preciso investigar',
      encaminhamento: 'Encaminhamento',
      urgencia: 'Urgência',
      naoSeAplica: 'Não se aplica',
    },
  )
  const hasTriagem =
    redFlagItems.length > 0 ||
    condutaItems.length > 0 ||
    textFilled(funcao?.triagemSeguranca?.observacoes)
  pushBlock(items, {
    id: '03.E',
    label: 'Triagem de segurança',
    groupLabel: '03 · Função · Bloco E',
    filled: hasTriagem,
    sensitive: true,
    preview: previewFrom(redFlagItems[0], condutaItems[0], funcao?.triagemSeguranca?.observacoes),
  })

  const hasMeds =
    textFilled(funcao?.medicacoes?.medicamentos) ||
    textFilled(funcao?.medicacoes?.alergias) ||
    textFilled(funcao?.medicacoes?.outrasInfo)
  pushBlock(items, {
    id: '03.F',
    label: 'Medicações / outras informações',
    groupLabel: '03 · Função · Bloco F',
    filled: hasMeds,
    sensitive: true,
    preview: previewFrom(
      funcao?.medicacoes?.medicamentos,
      funcao?.medicacoes?.alergias,
      funcao?.medicacoes?.outrasInfo,
    ),
  })

  // —— 04 Avaliação e plano ——
  const plano = ficha.avaliacaoPlano
  const inspecaoItems = checkedLabels(plano?.inspecao as Record<string, unknown> | undefined, {
    marcha: 'Marcha',
    postura: 'Postura',
    edema: 'Edema',
    equimose: 'Equimose',
    atrofia: 'Atrofia',
    assimetria: 'Assimetria',
    compensacoes: 'Compensações',
    outro: 'Outro',
  })
  const hasInspecao = inspecaoItems.length > 0 || textFilled(plano?.inspecao?.achados)
  pushBlock(items, {
    id: '04.A',
    label: 'Inspeção / observação',
    groupLabel: '04 · Avaliação e plano · Bloco A',
    filled: hasInspecao,
    preview: previewFrom(inspecaoItems[0], plano?.inspecao?.achados),
  })

  const mobFlags = checkedLabels(plano?.mobilidade as Record<string, unknown> | undefined, {
    ativo: 'Ativo',
    passivo: 'Passivo',
    bilateral: 'Bilateral',
  })
  const mobRows = (plano?.mobilidade?.linhas ?? []).filter(
    (row) =>
      textFilled(row.movimento) ||
      textFilled(row.direito) ||
      textFilled(row.esquerdo) ||
      textFilled(row.dor) ||
      textFilled(row.observacao),
  )
  const hasMob = mobFlags.length > 0 || mobRows.length > 0
  pushBlock(items, {
    id: '04.B',
    label: 'Mobilidade',
    groupLabel: '04 · Avaliação e plano · Bloco B',
    filled: hasMob,
    preview: previewFrom(mobFlags[0], mobRows[0]?.movimento),
  })

  const forcaRows = (plano?.forca?.linhas ?? []).filter(
    (row) =>
      textFilled(row.grupo) ||
      textFilled(row.direito) ||
      textFilled(row.esquerdo) ||
      textFilled(row.dor) ||
      textFilled(row.observacao),
  )
  pushBlock(items, {
    id: '04.C',
    label: 'Força',
    groupLabel: '04 · Avaliação e plano · Bloco C',
    filled: forcaRows.length > 0,
    preview: previewFrom(forcaRows[0]?.grupo),
  })

  const neuroItems = checkedLabels(plano?.neurologico as Record<string, unknown> | undefined, {
    sensibilidade: 'Sensibilidade',
    miotomos: 'Miotomos',
    reflexos: 'Reflexos',
    neurodinamica: 'Neurodinâmica',
    coordenacao: 'Coordenação',
    outro: 'Outro',
  })
  const hasNeuro = neuroItems.length > 0 || textFilled(plano?.neurologico?.achados)
  pushBlock(items, {
    id: '04.D',
    label: 'Avaliação neurológica',
    groupLabel: '04 · Avaliação e plano · Bloco D',
    filled: hasNeuro,
    preview: previewFrom(neuroItems[0], plano?.neurologico?.achados),
  })

  const hasPalp =
    textFilled(plano?.palpacaoTestes?.palpacao) ||
    textFilled(plano?.palpacaoTestes?.testesClinicos) ||
    textFilled(plano?.palpacaoTestes?.resultados) ||
    textFilled(plano?.palpacaoTestes?.testeFuncional) ||
    textFilled(plano?.palpacaoTestes?.resultadoInicial)
  pushBlock(items, {
    id: '04.E',
    label: 'Palpação / testes / função',
    groupLabel: '04 · Avaliação e plano · Bloco E',
    filled: hasPalp,
    preview: previewFrom(
      plano?.palpacaoTestes?.palpacao,
      plano?.palpacaoTestes?.testesClinicos,
      plano?.palpacaoTestes?.resultados,
    ),
  })

  const hasSintese =
    textFilled(plano?.sintese?.problema1) ||
    textFilled(plano?.sintese?.problema2) ||
    textFilled(plano?.sintese?.problema3) ||
    textFilled(plano?.sintese?.diagnosticoFisio) ||
    textFilled(plano?.sintese?.prognostico)
  pushBlock(items, {
    id: '04.F',
    label: 'Síntese dos principais achados',
    groupLabel: '04 · Avaliação e plano · Bloco F',
    filled: hasSintese,
    preview: previewFrom(
      plano?.sintese?.problema1,
      plano?.sintese?.diagnosticoFisio,
      plano?.sintese?.prognostico,
    ),
  })

  const hasObj =
    textFilled(plano?.objetivos?.curto1) ||
    textFilled(plano?.objetivos?.curto2) ||
    textFilled(plano?.objetivos?.medioLongo1) ||
    textFilled(plano?.objetivos?.medioLongo2)
  pushBlock(items, {
    id: '04.G',
    label: 'Objetivos',
    groupLabel: '04 · Avaliação e plano · Bloco G',
    filled: hasObj,
    preview: previewFrom(plano?.objetivos?.curto1, plano?.objetivos?.medioLongo1),
  })

  const planItems = checkedLabels(plano?.planejamento as Record<string, unknown> | undefined, {
    educacao: 'Educação',
    exercicioTerapeutico: 'Exercício terapêutico',
    treinoFuncional: 'Treino funcional',
    terapiaManual: 'Terapia manual',
    exposicaoCarga: 'Exposição à carga',
    autocuidado: 'Autocuidado',
    outro: 'Outro',
  })
  const hasPlan =
    planItems.length > 0 ||
    textFilled(plano?.planejamento?.frequencia) ||
    textFilled(plano?.planejamento?.qtdAtendimentos) ||
    textFilled(plano?.planejamento?.criteriosProgressao) ||
    textFilled(plano?.planejamento?.criteriosReavaliacao) ||
    Boolean(plano?.planejamento?.encaminhamento) ||
    textFilled(plano?.planejamento?.encaminhamentoDetalhe)
  pushBlock(items, {
    id: '04.H',
    label: 'Planejamento',
    groupLabel: '04 · Avaliação e plano · Bloco H',
    filled: hasPlan,
    preview: previewFrom(planItems[0], plano?.planejamento?.frequencia),
  })

  const hasProf =
    textFilled(plano?.profissional?.fisioterapeuta) ||
    textFilled(plano?.profissional?.crefito) ||
    textFilled(plano?.profissional?.data) ||
    textFilled(plano?.profissional?.assinatura)
  pushBlock(items, {
    id: '04.ID',
    label: 'Identificação profissional',
    groupLabel: '04 · Avaliação e plano · Bloco ID',
    filled: hasProf,
    preview: previewFrom(
      plano?.profissional?.fisioterapeuta,
      plano?.profissional?.crefito,
      plano?.profissional?.data,
    ),
  })

  return items
}
