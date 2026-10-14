// Catálogo de esportes e problemas frequentes (rascunho clínico, REQ-44).
// Chaves publicadas são estáveis; nunca renomear. Para corrigir, adicionar nova key e
// remover a antiga (a saída ignora chaves fora do catálogo).
// Nomes em `testes` devem existir literalmente em CATALOGO_TESTES (mobilidadePalpacao.ts).
import { fold } from './mobilidadePalpacao.ts'

export type EsporteProblema = {
  key: string
  nome: string
  regiao: string
  testes: string[]
  achados: string[]
}

export type Esporte = {
  key: string
  nome: string
  busca: string[]
  problemas: EsporteProblema[]
}

export const ESPORTE_OUTRO = 'outro'
export const ESPORTE_PROBLEMAS_MAX = 12
export const ESPORTE_OUTRO_MAX = 80

const KEY_RE = /^[a-z][a-zA-Z0-9]{0,63}$/

function p(key: string, nome: string, regiao: string, testes: string[], achados: string[]): EsporteProblema {
  return { key, nome, regiao, testes, achados }
}

export const ESPORTES: readonly Esporte[] = [
  {
    key: 'volei',
    nome: 'Vôlei',
    busca: ['volei', 'volei de praia'],
    problemas: [
      p('entorseTornozelo', 'Entorse de tornozelo (aterrissagem/bloqueio)', 'Tornozelo', ['Gaveta anterior', 'Talar Tilt'], ['Instabilidade percebida', 'equilíbrio unipodal']),
      p('dorPatelarSalto', 'Dor anterior do joelho no salto (tendão patelar)', 'Joelho', ['Patellar Grind'], ['Dor à palpação do polo inferior da patela', 'dor no agachamento unilateral']),
      p('dorOmbroAtaque', 'Dor no ombro (ataque/saque)', 'Ombro', ['Hawkins-Kennedy', 'Jobe / Empty Can'], ['Discinesia escapular', 'déficit de rotação interna']),
      p('lesaoDedosPolegar', 'Lesão de dedos/polegar (bloqueio/recepção)', 'Punho / mão', [], ['Estabilidade ligamentar das interfalângicas', 'edema e dor articular']),
      p('dorLombar', 'Dor lombar', 'Coluna lombar', ['Quadrante lombar'], ['Dor em extensão/rotação', 'controle lombopélvico']),
      p('lesaoLigamentosJoelho', 'Instabilidade do joelho (ligamentos)', 'Joelho', ['Lachman', 'Pivot Shift'], ['Mecanismo de aterrissagem com valgo', 'força de quadril']),
    ],
  },
  {
    key: 'futebol',
    nome: 'Futebol',
    busca: ['futsal', 'society'],
    problemas: [
      p('lesaoIsquiotibiais', 'Lesão muscular de isquiotibiais', 'Coxa', [], ['Dor à palpação do ventre/inserção', 'força excêntrica e flexibilidade']),
      p('dorInguinal', 'Dor inguinal / adutores', 'Quadril / virilha', ['FADIR'], ['Dor na resistência à adução (squeeze de adutores)', 'palpação do púbis e adutores']),
      p('entorseTornozelo', 'Entorse de tornozelo', 'Tornozelo', ['Gaveta anterior', 'Talar Tilt'], ['Equilíbrio unipodal', 'dorsiflexão']),
      p('lesaoLigamentosJoelho', 'Lesão ligamentar do joelho', 'Joelho', ['Lachman', 'Valgo stress test', 'Pivot Shift'], ['Derrame articular', 'instabilidade em mudança de direção']),
      p('lesaoMeniscal', 'Dor/bloqueio meniscal', 'Joelho', ['McMurray', 'Thessaly'], ['Dor na linha articular', 'estalo ou travamento']),
      p('lesaoQuadriceps', 'Lesão muscular de quadríceps', 'Coxa', ['Thomas'], ['Dor à palpação', 'força e flexibilidade do reto femoral']),
      p('tendinopatiaAquiles', 'Dor no tendão de Aquiles', 'Tornozelo / pé', ['Thompson'], ['Dor à palpação do tendão', 'teste de elevação do calcanhar unipodal']),
    ],
  },
  {
    key: 'corrida',
    nome: 'Corrida',
    busca: ['running', 'maratona'],
    problemas: [
      p('dorPatelofemoral', 'Dor patelofemoral (anterior do joelho)', 'Joelho', ['Patellar Grind'], ['Dor no agachamento unilateral/degraus', 'controle de valgo dinâmico']),
      p('tendinopatiaAquiles', 'Dor no tendão de Aquiles', 'Tornozelo / pé', ['Thompson'], ['Dor 2–6 cm acima da inserção', 'elevação unipodal do calcanhar']),
      p('estresseTibial', 'Dor na face medial da tíbia (shin splints)', 'Perna', ['Navicular Drop'], ['Dor à palpação da borda posteromedial da tíbia', 'volume de treino recente']),
      p('fascitePlantar', 'Dor plantar no calcanhar (fascite plantar)', 'Pé', ['Windlass'], ['Dor à palpação da origem na fáscia', 'dorsiflexão do hálux']),
      p('dorBandaIliotibial', 'Dor lateral do joelho (banda iliotibial)', 'Joelho', ['Ober'], ['Dor no epicôndilo lateral do fêmur', 'força de abdutores do quadril']),
      p('entorseTornozelo', 'Entorse de tornozelo', 'Tornozelo', ['Gaveta anterior', 'Talar Tilt'], ['Equilíbrio unipodal']),
      p('fraturaEstresse', 'Dor óssea focal por sobrecarga (reação/fratura por estresse)', 'Perna / pé', [], ['Dor focal à palpação', 'dor no salto unipodal (hop test)']),
    ],
  },
  {
    key: 'basquete',
    nome: 'Basquete',
    busca: [],
    problemas: [
      p('entorseTornozelo', 'Entorse de tornozelo', 'Tornozelo', ['Gaveta anterior', 'Talar Tilt'], ['Instabilidade percebida', 'equilíbrio unipodal']),
      p('dorPatelarSalto', 'Dor anterior do joelho no salto (tendão patelar)', 'Joelho', ['Patellar Grind'], ['Dor à palpação do polo inferior da patela', 'dor em salto repetido']),
      p('lesaoLigamentosJoelho', 'Lesão ligamentar do joelho', 'Joelho', ['Lachman', 'Pivot Shift'], ['Derrame', 'instabilidade em mudança de direção/aterrissagem']),
      p('lesaoMeniscal', 'Dor/bloqueio meniscal', 'Joelho', ['McMurray', 'Thessaly'], ['Dor na linha articular', 'travamento']),
      p('lesaoDedosMao', 'Lesão de dedos/mão (bola)', 'Punho / mão', [], ['Estabilidade das interfalângicas', 'edema e dor articular']),
      p('tendinopatiaAquiles', 'Dor no tendão de Aquiles', 'Tornozelo / pé', ['Thompson'], ['Dor à palpação', 'elevação unipodal do calcanhar']),
    ],
  },
  // REVISAO CLINICA: evidência baixa (33-RESEARCH) - beach tennis extrapolado de tênis + padel
  {
    key: 'tenis',
    nome: 'Tênis / beach tennis',
    busca: ['beach tennis', 'tenis de praia', 'raquete'],
    problemas: [
      p('epicondilalgiaLateral', 'Dor lateral do cotovelo (epicondilalgia)', 'Cotovelo', ['Cozen', 'Mill', 'Maudsley'], ['Dor à palpação do epicôndilo lateral', 'força de preensão dolorosa']),
      p('dorOmbroRaquete', 'Dor no ombro (saque/smash)', 'Ombro', ['Hawkins-Kennedy', 'Jobe / Empty Can'], ['Discinesia escapular', 'déficit de rotação interna']),
      p('dorLombarRotacao', 'Dor lombar (rotação/extensão)', 'Coluna lombar', ['Quadrante lombar'], ['Dor em extensão/rotação', 'controle do tronco']),
      p('entorseTornozelo', 'Entorse de tornozelo', 'Tornozelo', ['Gaveta anterior', 'Talar Tilt'], ['Equilíbrio unipodal']),
      p('dorPunhoRaquete', 'Dor no punho (cubital/radial)', 'Punho / mão', ['TFCC Load Test', 'Finkelstein'], ['Dor à palpação ulnar ou radial', 'força de preensão']),
      p('dorJoelhoQuadra', 'Dor no joelho (patelofemoral/menisco)', 'Joelho', ['Patellar Grind', 'McMurray'], ['Dor no agachamento unilateral', 'dor na linha articular']),
    ],
  },
  {
    key: 'natacao',
    nome: 'Natação',
    busca: ['nado', 'triatlo'],
    problemas: [
      p('ombroNadador', 'Dor no ombro do nadador', 'Ombro', ['Hawkins-Kennedy', 'Neer'], ['Dor no arco de elevação', 'discinesia escapular']),
      p('tendinopatiaBiceps', 'Dor anterior do ombro (cabeça longa do bíceps)', 'Ombro', ['Speed', 'Yergason'], ['Dor à palpação do sulco bicipital']),
      p('joelhoNadadorPeito', 'Dor medial do joelho (nado peito)', 'Joelho', ['Valgo stress test'], ['Dor medial no movimento de chute', 'rotação do quadril']),
      p('dorLombarNado', 'Dor lombar (borboleta/peito)', 'Coluna lombar', ['Quadrante lombar'], ['Dor em extensão', 'mobilidade torácica']),
      p('dorCervicalNado', 'Dor cervical (respiração lateral/costas)', 'Coluna cervical', ['Spurling'], ['Amplitude de rotação cervical', 'tensão do trapézio superior']),
    ],
  },
  {
    key: 'musculacao',
    nome: 'Musculação',
    busca: ['academia', 'treino de forca', 'powerlifting'],
    problemas: [
      p('dorOmbroCarga', 'Dor no ombro (supinos/desenvolvimentos)', 'Ombro', ['Hawkins-Kennedy', 'Neer'], ['Dor no arco de elevação', 'força do manguito']),
      p('lesaoManguito', 'Dor no manguito rotador', 'Ombro', ['Jobe / Empty Can', 'Full Can'], ['Fraqueza em elevação/rotação externa']),
      p('dorLombarCarga', 'Dor lombar (agachamento/terra)', 'Coluna lombar', ['Quadrante lombar'], ['Dor em flexão/extensão sob carga', 'controle lombopélvico']),
      p('dorJoelhoCarga', 'Dor anterior do joelho', 'Joelho', ['Patellar Grind'], ['Dor no agachamento e na descida']),
      p('dorCotoveloCarga', 'Dor no cotovelo (tríceps/bíceps/epicôndilos)', 'Cotovelo', ['Cozen', 'Mill'], ['Dor à palpação dos epicôndilos', 'dor na extensão contra resistência']),
      p('dorPunhoCarga', 'Dor no punho/mão (apoio e pegada)', 'Punho / mão', ['TFCC Load Test'], ['Dor em extensão de punho com carga', 'força de preensão']),
    ],
  },
  {
    key: 'crossfit',
    nome: 'CrossFit',
    busca: ['cross', 'funcional'],
    problemas: [
      p('dorOmbroGinastica', 'Dor no ombro (barras, argolas, overhead)', 'Ombro', ['Hawkins-Kennedy', 'Jobe / Empty Can'], ['Discinesia escapular', 'mobilidade overhead']),
      p('dorLombarLevantamento', 'Dor lombar (agachamento/levantamento terra)', 'Coluna lombar', ['Quadrante lombar'], ['Dor em flexão/extensão sob carga', 'controle de tronco']),
      p('dorJoelhoCross', 'Dor no joelho', 'Joelho', ['Patellar Grind'], ['Dor no agachamento profundo e saltos (box jump)']),
      p('dorPunhoMaoCross', 'Dor no punho/mão (pegada, apoio, barra)', 'Punho / mão', ['TFCC Load Test'], ['Dor em extensão de punho com carga', 'calosidades/ruptura de pele']),
      p('dorCotoveloCross', 'Dor no cotovelo', 'Cotovelo', ['Cozen', 'Mill'], ['Dor à palpação dos epicôndilos']),
      p('dorQuadrilCross', 'Dor no quadril/virilha (agachamento profundo)', 'Quadril', ['FADIR', 'Scour'], ['Limitação de rotação interna', 'dor em flexão profunda']),
    ],
  },
  // REVISAO CLINICA: evidência baixa (33-RESEARCH) - causalidade fraca, locais de dor consistentes
  {
    key: 'ciclismo',
    nome: 'Ciclismo',
    busca: ['bike', 'bicicleta', 'mtb', 'spinning'],
    problemas: [
      p('dorJoelhoAnteriorCiclo', 'Dor anterior do joelho', 'Joelho', ['Patellar Grind'], ['Dor ao pedalar em esforço', 'altura do selim e posição do pé']),
      p('dorJoelhoLateralCiclo', 'Dor lateral do joelho (banda iliotibial)', 'Joelho', ['Ober'], ['Dor no epicôndilo lateral do fêmur']),
      p('dorLombarCiclo', 'Dor lombar', 'Coluna lombar', ['Quadrante lombar'], ['Dor em flexão sustentada', 'flexibilidade posterior de coxa']),
      p('dorCervicalOmbroCiclo', 'Dor cervical/trapézio', 'Coluna cervical', ['Spurling'], ['Tensão do trapézio superior', 'posição no guidão']),
      p('formigamentoMaoCiclo', 'Formigamento/dormência na mão (pressão no guidão)', 'Punho / mão', ['Phalen', 'Tinel'], ['Distribuição do formigamento (mediano/ulnar)', 'força de preensão']),
      p('desconfortoSela', 'Desconforto na região da sela', 'Pelve', [], ['Pontos de pressão', 'ajuste do selim e posição']),
      p('tendinopatiaAquilesCiclo', 'Dor no tendão de Aquiles', 'Tornozelo / pé', ['Thompson'], ['Dor à palpação', 'posição do pé no pedal']),
    ],
  },
  {
    key: 'lutas',
    nome: 'Lutas / artes marciais',
    busca: ['judo', 'jiu-jitsu', 'boxe', 'muay thai', 'karate', 'mma'],
    problemas: [
      p('lesaoJoelhoLuta', 'Lesão ligamentar/meniscal do joelho', 'Joelho', ['Lachman', 'Valgo stress test', 'McMurray'], ['Instabilidade', 'dor na linha articular']),
      p('lesaoOmbroLuta', 'Instabilidade/dor do ombro (inclui acromioclavicular)', 'Ombro', ['Apprehension', 'Cross-body Adduction'], ['Dor na articulação acromioclavicular', 'sensação de instabilidade']),
      p('lesaoDedosMaoLuta', 'Lesão de dedos/mão e polegar', 'Punho / mão', ['Grind Test do polegar'], ['Estabilidade das interfalângicas', 'dor em soco ou pegada']),
      p('dorCervicalLuta', 'Dor cervical', 'Coluna cervical', ['Spurling', 'Distração cervical'], ['Rotação cervical limitada', 'dor em extensão']),
      p('dorLombarLuta', 'Dor lombar', 'Coluna lombar', ['Quadrante lombar'], ['Dor em flexão/extensão', 'controle de tronco']),
      p('dorCotoveloLuta', 'Dor no cotovelo (hiperextensão/chaves)', 'Cotovelo', ['Valgo stress test'], ['Dor medial ou posterior', 'amplitude de extensão']),
    ],
  },
  {
    key: 'handebol',
    nome: 'Handebol',
    busca: [],
    problemas: [
      p('entorseTornozelo', 'Entorse de tornozelo', 'Tornozelo', ['Gaveta anterior', 'Talar Tilt'], ['Instabilidade', 'equilíbrio unipodal']),
      p('lesaoLigamentosJoelho', 'Lesão ligamentar do joelho', 'Joelho', ['Lachman', 'Pivot Shift'], ['Instabilidade em giro/aterrissagem']),
      p('dorOmbroArremesso', 'Dor no ombro do arremessador', 'Ombro', ['Hawkins-Kennedy', 'Apprehension'], ['Discinesia escapular', 'déficit de rotação interna']),
      p('dorPatelarHandebol', 'Dor anterior do joelho (tendão patelar)', 'Joelho', ['Patellar Grind'], ['Dor à palpação do polo inferior da patela']),
      p('lesaoDedosMaoHandebol', 'Lesão de dedos/mão (bola)', 'Punho / mão', [], ['Estabilidade das interfalângicas', 'edema']),
      p('lesaoMuscularCoxa', 'Lesão muscular da coxa', 'Coxa', [], ['Dor à palpação', 'força e flexibilidade de isquiotibiais/adutores']),
    ],
  },
  // REVISAO CLINICA: evidência baixa (33-RESEARCH) - extrapolado de futebol + vôlei de praia
  {
    key: 'futevolei',
    nome: 'Futevôlei',
    busca: ['futvolei', 'areia'],
    problemas: [
      p('dorJoelhoFutevolei', 'Dor/instabilidade no joelho', 'Joelho', ['Lachman', 'McMurray'], ['Dor na linha articular', 'instabilidade em giro na areia']),
      p('entorseTornozeloAreia', 'Entorse de tornozelo (areia)', 'Tornozelo', ['Gaveta anterior', 'Talar Tilt'], ['Equilíbrio unipodal']),
      p('lesaoMuscularCoxaFutevolei', 'Lesão muscular da coxa (chute)', 'Coxa', [], ['Dor à palpação', 'flexibilidade de isquiotibiais e quadríceps']),
      p('dorInguinalFutevolei', 'Dor inguinal / adutores', 'Quadril / virilha', ['FADIR'], ['Dor na resistência à adução', 'palpação de adutores']),
      p('dorLombarFutevolei', 'Dor lombar', 'Coluna lombar', ['Quadrante lombar'], ['Dor em extensão/rotação']),
      p('contusaoPe', 'Dor/contusão no pé (toque na bola e areia)', 'Pé', [], ['Dor à palpação dos metatarsos e dedos', 'edema']),
    ],
  },
  {
    key: 'padel',
    nome: 'Padel',
    busca: ['raquete'],
    problemas: [
      p('epicondilalgiaLateralPadel', 'Dor lateral do cotovelo (epicondilalgia)', 'Cotovelo', ['Cozen', 'Mill', 'Maudsley'], ['Dor à palpação do epicôndilo lateral', 'força de preensão dolorosa']),
      p('dorJoelhoPadel', 'Dor no joelho', 'Joelho', ['Patellar Grind', 'McMurray'], ['Dor em agachamento', 'dor na linha articular']),
      p('dorOmbroPadel', 'Dor no ombro', 'Ombro', ['Hawkins-Kennedy', 'Jobe / Empty Can'], ['Discinesia escapular', 'dor em elevação']),
      p('dorLombarPadel', 'Dor lombar', 'Coluna lombar', ['Quadrante lombar'], ['Dor em extensão/rotação']),
      p('entorseTornozeloPadel', 'Entorse de tornozelo', 'Tornozelo', ['Gaveta anterior', 'Talar Tilt'], ['Equilíbrio unipodal']),
      p('dorPunhoPadel', 'Dor no punho', 'Punho / mão', ['TFCC Load Test', 'Finkelstein'], ['Dor ulnar ou radial', 'força de preensão']),
    ],
  },
  {
    key: 'danca',
    nome: 'Dança',
    busca: ['ballet', 'bale'],
    problemas: [
      p('dorPeTornozeloDanca', 'Dor no pé e tornozelo (sobrecarga/entorse)', 'Tornozelo / pé', ['Talar Tilt', 'Gaveta anterior'], ['Equilíbrio em meia-ponta', 'estabilidade']),
      p('dorPosteriorTornozeloDanca', 'Dor posterior do tornozelo / flexor do hálux', 'Tornozelo / pé', ['Thompson'], ['Dor em plié e relevé', 'dor à palpação posterior']),
      p('ressaltoQuadril', 'Ressalto/estalo no quadril', 'Quadril', ['FADIR', 'Thomas'], ['Ressalto à flexão e extensão', 'força de flexores do quadril']),
      p('dorLombarDanca', 'Dor lombar', 'Coluna lombar', ['Quadrante lombar', 'Prone Instability Test'], ['Dor em extensão', 'controle lombopélvico']),
      p('dorPatelofemoralDanca', 'Dor anterior do joelho', 'Joelho', ['Patellar Grind'], ['Dor no plié e saltos', 'alinhamento dinâmico']),
      p('lesaoIsquiotibiaisDanca', 'Dor posterior da coxa (isquiotibiais)', 'Coxa', [], ['Dor à palpação', 'flexibilidade e força']),
    ],
  },
  // REVISAO CLINICA: evidência baixa (33-RESEARCH) - eventos adversos leves, locais genéricos
  {
    key: 'pilatesYoga',
    nome: 'Pilates / yoga',
    busca: ['pilates', 'yoga'],
    problemas: [
      p('dorLombarPilatesYoga', 'Dor lombar', 'Coluna lombar', ['Quadrante lombar'], ['Dor em flexão/extensão', 'controle de tronco']),
      p('dorOmbroPilatesYoga', 'Dor no ombro (apoios e posturas overhead)', 'Ombro', ['Hawkins-Kennedy'], ['Dor em elevação ou apoio', 'controle escapular']),
      p('dorPunhoApoio', 'Dor no punho (posturas de apoio)', 'Punho / mão', ['TFCC Load Test'], ['Dor em extensão de punho com carga']),
      p('dorJoelhoPilatesYoga', 'Dor no joelho (lótus, rotação em carga)', 'Joelho', ['McMurray', 'Thessaly'], ['Dor na linha articular', 'dor em rotação com carga']),
      p('dorCervicalPilatesYoga', 'Dor cervical', 'Coluna cervical', ['Spurling'], ['Rotação cervical', 'dor em posturas invertidas']),
      p('dorIsquiotibialProximal', 'Dor proximal posterior da coxa (alongamento extremo)', 'Coxa', [], ['Dor à palpação da inserção isquiática', 'dor em alongamento']),
    ],
  },
]

export function esportePorKey(key: string | undefined): Esporte | undefined {
  if (!key) return undefined
  return ESPORTES.find((e) => e.key === key)
}

export function safeEsporte(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const key = value.trim()
  if (key === ESPORTE_OUTRO) return key
  return esportePorKey(key) ? key : undefined
}

export function safeEsporteProblemas(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const out: string[] = []
  for (const item of value) {
    if (typeof item !== 'string') continue
    const key = item.trim()
    if (!KEY_RE.test(key) || out.includes(key)) continue
    out.push(key)
    if (out.length >= ESPORTE_PROBLEMAS_MAX) break
  }
  return out
}

export function problemasDoEsporte(esporteKey: string | undefined): readonly EsporteProblema[] {
  return esportePorKey(esporteKey)?.problemas ?? []
}

export function avaliarTexto(p: EsporteProblema): string {
  return [...p.testes, ...p.achados].join(' · ')
}

export function buscarEsportes(query: string): readonly Esporte[] {
  const q = fold(query.trim())
  if (!q) return ESPORTES
  return ESPORTES.filter((e) => fold(e.nome).includes(q) || e.busca.some((b) => fold(b).includes(q)))
}

export type ResumoEsporte = {
  esporteLabel?: string
  problemas: Array<{ key: string; nome: string; regiao: string }>
}

export function resumoEsporte(
  rotina:
    | { praticaAtividadeFisica?: string; esporte?: string; esporteOutro?: string; esporteProblemas?: unknown }
    | undefined,
): ResumoEsporte {
  if (rotina?.praticaAtividadeFisica !== 'sim') return { problemas: [] }
  const esporte = esportePorKey(rotina.esporte)
  const esporteLabel =
    esporte?.nome ??
    (rotina.esporte === ESPORTE_OUTRO
      ? (rotina.esporteOutro ?? '').trim().slice(0, ESPORTE_OUTRO_MAX) || 'Outro'
      : undefined)
  const marcadas = new Set(safeEsporteProblemas(rotina.esporteProblemas))
  const problemas = (esporte?.problemas ?? [])
    .filter((x) => marcadas.has(x.key))
    .map(({ key, nome, regiao }) => ({ key, nome, regiao }))
  return esporteLabel === undefined ? { problemas } : { esporteLabel, problemas }
}
