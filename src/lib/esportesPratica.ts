// Avaliação esportiva de cada esporte: perfil, nível, tempo, frequência, volume, sintomas,
// modalidades e características da prática (rascunho clínico).
// Chaves publicadas são estáveis; nunca renomear. Sem imports com alias: roda em node --test.

export type OpcaoPratica = { key: string; nome: string }
export type GrupoPratica = { titulo: string; opcoes: OpcaoPratica[] }

// —— Perguntas específicas de cada esporte (questionário próprio) ——

export type TipoPergunta = 'unica' | 'multipla' | 'selecao' | 'simNao' | 'numeros' | 'textoLongo'

export type CampoNumero = { key: string; rotulo: string; sufixo: string }

export type Pergunta = {
  /** Chave da resposta (única dentro do esporte). Para 'numeros', cada campo usa a própria key. */
  key: string
  rotulo: string
  tipo: TipoPergunta
  opcoes?: readonly OpcaoPratica[]
  campos?: readonly CampoNumero[]
  placeholder?: string
}

export type SecaoPerguntas = { titulo: string; perguntas: readonly Pergunta[] }

export type PraticaEsporte = {
  /** Exemplo de volume no placeholder (cada esporte mede de um jeito). */
  volumeDica: string
  modalidades: OpcaoPratica[]
  caracteristicas: GrupoPratica[]
  /** Questionário próprio do esporte. Quando existe, substitui modalidades/características e o bloco genérico de sintomas. */
  secoes?: readonly SecaoPerguntas[]
  /** O questionário já pergunta o volume: esconde o campo genérico "Volume". */
  volumeProprio?: boolean
}

const o = (key: string, nome: string): OpcaoPratica => ({ key, nome })
const g = (titulo: string, opcoes: OpcaoPratica[]): GrupoPratica => ({ titulo, opcoes })

export const RESPOSTA_TEXTO_MAX = 600
export const RESPOSTA_NUMERO_MAX = 6

export const SIM_NAO: readonly OpcaoPratica[] = [o('sim', 'Sim'), o('nao', 'Não')]

const unica = (key: string, rotulo: string, opcoes: OpcaoPratica[]): Pergunta => ({ key, rotulo, tipo: 'unica', opcoes })
const multipla = (key: string, rotulo: string, opcoes: OpcaoPratica[]): Pergunta => ({ key, rotulo, tipo: 'multipla', opcoes })
const selecao = (key: string, rotulo: string, opcoes: OpcaoPratica[]): Pergunta => ({ key, rotulo, tipo: 'selecao', opcoes })
const simNao = (key: string, rotulo: string): Pergunta => ({ key, rotulo, tipo: 'simNao', opcoes: SIM_NAO })
const numeros = (key: string, rotulo: string, campos: CampoNumero[]): Pergunta => ({ key, rotulo, tipo: 'numeros', campos })
const textoLongo = (key: string, rotulo: string, placeholder: string): Pergunta => ({ key, rotulo, tipo: 'textoLongo', placeholder })
const secao = (titulo: string, perguntas: Pergunta[]): SecaoPerguntas => ({ titulo, perguntas })

export const PERFIS_ESPORTIVOS: readonly OpcaoPratica[] = [
  o('recreativo', 'Recreativo'),
  o('amadorCompetitivo', 'Amador competitivo'),
  o('profissional', 'Profissional'),
]

export const NIVEIS_ESPORTIVOS: readonly OpcaoPratica[] = [
  o('iniciante', 'Iniciante'),
  o('intermediario', 'Intermediário'),
  o('atleta', 'Atleta'),
]

export const SITUACOES_PRATICA: readonly OpcaoPratica[] = [
  o('normal', 'Praticando normalmente'),
  o('limitado', 'Praticando com limitação'),
  o('afastado', 'Afastado'),
]

export const DOMINANCIAS: readonly OpcaoPratica[] = [
  o('direito', 'Direito'),
  o('esquerdo', 'Esquerdo'),
  o('ambos', 'Ambos'),
]

export const MOMENTOS_SINTOMA: readonly OpcaoPratica[] = [
  o('antes', 'Antes'),
  o('durante', 'Durante'),
  o('depois', 'Logo depois'),
  o('diaSeguinte', 'No dia seguinte'),
]

/** 1 a 7 vezes por semana; 7 vale "todo dia ou mais". */
export const FREQUENCIA_MAX = 7
export const ANOS_PRATICA_MAX = 30
export const VOLUME_MAX = 120
export const PRATICA_OBS_MAX = 600
export const SINTOMAS_MAX = 600

export function rotuloFrequencia(vezes: number): string {
  return vezes >= FREQUENCIA_MAX ? 'Todo dia' : `${vezes}x por semana`
}

const PRATICA_OUTRO: PraticaEsporte = { volumeDica: 'ex.: 4 h por semana', modalidades: [], caracteristicas: [] }

export const PRATICAS: Readonly<Record<string, PraticaEsporte>> = {
  volei: {
    volumeDica: 'ex.: 6 h por semana',
    modalidades: [],
    caracteristicas: [],
    volumeProprio: true,
    secoes: [
      secao('Modalidade e posição', [
        unica('modalidade', 'Modalidade', [o('quadra', 'Quadra'), o('praia', 'Praia')]),
        unica('posicao', 'Posição principal', [
          o('levantador', 'Levantador(a)'),
          o('ponteiro', 'Ponteiro(a)'),
          o('oposto', 'Oposto(a)'),
          o('central', 'Central'),
          o('libero', 'Líbero'),
        ]),
      ]),
      secao('Demandas da prática', [
        multipla('gestos', 'Gestos mais frequentes (múltipla escolha)', [
          o('ataque', 'Ataque'),
          o('bloqueio', 'Bloqueio'),
          o('saque', 'Saque'),
          o('recepcao', 'Recepção/manchete'),
          o('levantamento', 'Levantamento'),
          o('defesa', 'Defesa/mergulho'),
          o('saltos', 'Saltos e aterrissagens'),
          o('deslocamentos', 'Deslocamentos'),
        ]),
        numeros('volume', 'Volume de prática', [
          { key: 'volumeHoras', rotulo: 'Horas/semana', sufixo: 'h/semana' },
          { key: 'volumeJogos', rotulo: 'Jogos/semana', sufixo: 'jogos/semana' },
        ]),
        unica('cargaSaltos', 'Carga aproximada de saltos', [
          o('baixa', 'Baixa'),
          o('moderada', 'Moderada'),
          o('alta', 'Alta'),
          o('naoSabe', 'Não sabe informar'),
        ]),
        simNao('mudancaVolume', 'Houve mudança recente no volume ou intensidade?'),
      ]),
      secao('Sintomas e dificuldades', [
        selecao('faseSintoma', 'Em qual fase do movimento aparecem?', [
          o('aproximacao', 'Aproximação para ataque'),
          o('impulsao', 'Impulsão'),
          o('contatoBola', 'Contato com a bola'),
          o('aterrissagem', 'Aterrissagem'),
          o('deslocamentoLateral', 'Deslocamento lateral'),
          o('semGesto', 'Sem gesto específico'),
        ]),
        textoLongo(
          'dificuldade',
          'Principal dificuldade na modalidade',
          'Ex.: perda de potência no salto, dor no ataque, insegurança na aterrissagem...',
        ),
      ]),
    ],
  },
  futebol: {
    volumeDica: 'ex.: 2 jogos + 2 treinos por semana',
    modalidades: [o('campo', 'Campo'), o('society', 'Society'), o('futsal', 'Futsal'), o('areia', 'Areia')],
    caracteristicas: [
      g('Posição', [o('goleiro', 'Goleiro'), o('zagueiro', 'Zagueiro'), o('lateral', 'Lateral'), o('meioCampo', 'Meio-campo'), o('atacante', 'Atacante')]),
      g('Piso', [o('gramaNatural', 'Grama natural'), o('gramaSintetica', 'Grama sintética'), o('quadra', 'Quadra')]),
    ],
  },
  corrida: {
    volumeDica: 'ex.: 30 km por semana',
    modalidades: [o('rua', 'Rua'), o('trilha', 'Trilha'), o('pista', 'Pista'), o('esteira', 'Esteira')],
    caracteristicas: [
      g('Distância principal', [o('ate10k', 'Até 10 km'), o('meiaMaratona', 'Meia maratona'), o('maratona', 'Maratona'), o('ultra', 'Ultramaratona')]),
      g('Treino', [o('intervalado', 'Intervalado / tiros'), o('longao', 'Longão'), o('subidas', 'Subidas'), o('provas', 'Participa de provas')]),
      g('Calçado', [o('tenisAmortecido', 'Tênis com amortecimento'), o('tenisMinimalista', 'Minimalista'), o('trocaRecente', 'Troca recente de tênis')]),
    ],
  },
  basquete: {
    volumeDica: 'ex.: 3 treinos de 2 h por semana',
    modalidades: [o('quadra5x5', 'Quadra 5x5'), o('basquete3x3', '3x3')],
    caracteristicas: [
      g('Posição', [o('armador', 'Armador'), o('ala', 'Ala'), o('pivo', 'Pivô')]),
      g('Gestos frequentes', [o('saltos', 'Saltos / rebote'), o('mudancaDirecao', 'Mudanças de direção'), o('arremesso', 'Arremesso')]),
    ],
  },
  tenis: {
    volumeDica: 'ex.: 3 jogos de 1h30 por semana',
    modalidades: [o('simples', 'Simples'), o('duplas', 'Duplas'), o('beachTennis', 'Beach tennis')],
    caracteristicas: [
      g('Piso', [o('saibro', 'Saibro'), o('rapida', 'Quadra rápida'), o('areia', 'Areia')]),
      g('Backhand', [o('umaMao', 'Uma mão'), o('duasMaos', 'Duas mãos')]),
      g('Equipamento', [o('trocaRaquete', 'Troca recente de raquete'), o('cordaoTenso', 'Corda muito tensa')]),
    ],
  },
  natacao: {
    volumeDica: 'ex.: 6 km por semana',
    modalidades: [o('piscina', 'Piscina'), o('aguasAbertas', 'Águas abertas'), o('master', 'Master / competição')],
    caracteristicas: [
      g('Estilos', [o('crawl', 'Crawl'), o('costas', 'Costas'), o('peito', 'Peito'), o('borboleta', 'Borboleta'), o('medley', 'Medley')]),
      g('Acessórios', [o('palmar', 'Palmar'), o('nadadeira', 'Nadadeira'), o('pullBuoy', 'Pull buoy')]),
      g('Respiração', [o('respiraUmLado', 'Respira para um lado só'), o('respiraBilateral', 'Respiração bilateral')]),
    ],
  },
  musculacao: {
    volumeDica: 'ex.: 5 treinos de 1 h por semana',
    modalidades: [o('hipertrofia', 'Hipertrofia'), o('forca', 'Força'), o('powerlifting', 'Powerlifting'), o('condicionamento', 'Condicionamento / saúde')],
    caracteristicas: [
      g('Divisão do treino', [o('fullBody', 'Corpo todo'), o('divisaoGrupos', 'Divisão por grupos (ABC…)'), o('superiorInferior', 'Superiores / inferiores')]),
      g('Exercícios principais', [o('agachamento', 'Agachamento'), o('levantamentoTerra', 'Levantamento terra'), o('supino', 'Supino'), o('desenvolvimento', 'Desenvolvimento (acima da cabeça)')]),
      g('Carga', [o('cargasAltas', 'Cargas perto da máxima'), o('aumentoRecente', 'Aumento recente de carga')]),
    ],
  },
  crossfit: {
    volumeDica: 'ex.: 5 aulas por semana',
    modalidades: [o('aulasBox', 'Aulas no box'), o('competicao', 'Competição')],
    caracteristicas: [
      g('Movimentos frequentes', [
        o('olimpicos', 'Levantamentos olímpicos'),
        o('ginasticos', 'Ginásticos (barra, argolas)'),
        o('kipping', 'Kipping'),
        o('overhead', 'Acima da cabeça'),
        o('saltos', 'Saltos (box jump, corda)'),
        o('corridaRemo', 'Corrida / remo'),
      ]),
    ],
  },
  ciclismo: {
    volumeDica: 'ex.: 150 km por semana',
    modalidades: [o('estrada', 'Estrada (speed)'), o('mtb', 'Mountain bike'), o('gravel', 'Gravel'), o('indoor', 'Indoor / spinning'), o('triatlo', 'Triatlo')],
    caracteristicas: [
      g('Bike', [o('bikeFit', 'Fez bike fit'), o('pedalClip', 'Pedal clip'), o('trocaBike', 'Troca recente de bike')]),
      g('Treino', [o('subidas', 'Muitas subidas'), o('pedaisLongos', 'Pedais longos'), o('provas', 'Participa de provas')]),
    ],
  },
  lutas: {
    volumeDica: 'ex.: 4 treinos de 1h30 por semana',
    modalidades: [
      o('jiuJitsu', 'Jiu-jitsu'),
      o('muayThai', 'Muay thai'),
      o('boxe', 'Boxe'),
      o('judo', 'Judô'),
      o('karate', 'Karatê'),
      o('taekwondo', 'Taekwondo'),
      o('mma', 'MMA'),
    ],
    caracteristicas: [
      g('Treino', [o('sparring', 'Sparring / rola'), o('quedas', 'Quedas e projeções'), o('finalizacoes', 'Chaves e finalizações'), o('chutes', 'Chutes')]),
      g('Competição', [o('compete', 'Compete'), o('cortePeso', 'Faz corte de peso')]),
    ],
  },
  handebol: {
    volumeDica: 'ex.: 3 treinos + 1 jogo por semana',
    modalidades: [o('quadra', 'Quadra'), o('areia', 'Areia')],
    caracteristicas: [
      g('Posição', [o('goleiro', 'Goleiro'), o('armador', 'Armador'), o('ponta', 'Ponta'), o('pivo', 'Pivô')]),
      g('Gestos frequentes', [o('arremessoSalto', 'Arremesso em salto'), o('contato', 'Muito contato físico')]),
    ],
  },
  futevolei: {
    volumeDica: 'ex.: 4 jogos de 2 h por semana',
    modalidades: [o('recreativo', 'Recreativo'), o('torneios', 'Torneios')],
    caracteristicas: [
      g('Gestos frequentes', [o('shark', 'Ataque de pé (shark)'), o('cabeceio', 'Cabeceio'), o('peito', 'Recepção de peito'), o('saltos', 'Saltos')]),
      g('Areia', [o('areiaFofa', 'Areia fofa'), o('areiaCompacta', 'Areia compacta')]),
    ],
  },
  padel: {
    volumeDica: 'ex.: 3 jogos de 1h30 por semana',
    modalidades: [o('recreativo', 'Recreativo'), o('torneios', 'Torneios')],
    caracteristicas: [
      g('Lado da quadra', [o('direita', 'Direita (drive)'), o('esquerda', 'Esquerda (revés)')]),
      g('Golpes frequentes', [o('smash', 'Smash'), o('bandejaVibora', 'Bandeja / víbora'), o('saidaParede', 'Saída de parede')]),
    ],
  },
  danca: {
    volumeDica: 'ex.: 8 h de aula por semana',
    modalidades: [
      o('ballet', 'Ballet'),
      o('contemporaneo', 'Contemporâneo'),
      o('jazz', 'Jazz'),
      o('urbanas', 'Danças urbanas'),
      o('salao', 'Dança de salão'),
      o('aerea', 'Aérea / pole'),
    ],
    caracteristicas: [
      g('Prática', [o('pontas', 'Sapatilha de ponta'), o('saltos', 'Muitos saltos'), o('chao', 'Trabalho de chão'), o('apresentacoes', 'Apresentações / festivais')]),
      g('Piso', [o('linoleo', 'Linóleo / tablado'), o('pisoDuro', 'Piso duro')]),
    ],
  },
  pilatesYoga: {
    volumeDica: 'ex.: 3 aulas por semana',
    modalidades: [o('pilatesSolo', 'Pilates solo'), o('pilatesAparelhos', 'Pilates aparelhos'), o('yoga', 'Yoga'), o('yogaDinamica', 'Yoga dinâmica (vinyasa, ashtanga)')],
    caracteristicas: [
      g('Posturas frequentes', [o('invertidas', 'Invertidas'), o('extensoes', 'Extensões profundas'), o('flexoes', 'Flexões profundas'), o('equilibrio', 'Equilíbrio')]),
    ],
  },
  ski: {
    volumeDica: 'ex.: 7 dias por temporada',
    modalidades: [o('pista', 'Pista'), o('freeride', 'Fora de pista (freeride)'), o('park', 'Park / saltos'), o('crossCountry', 'Cross-country'), o('competicao', 'Competição')],
    caracteristicas: [
      g('Pistas', [o('faceis', 'Verde / azul'), o('dificeis', 'Vermelha / preta'), o('moguls', 'Moguls')]),
      g('Temporada', [o('preparacao', 'Faz preparação física antes'), o('equipProprio', 'Equipamento próprio'), o('equipAlugado', 'Equipamento alugado')]),
    ],
  },
  snowboard: {
    volumeDica: 'ex.: 7 dias por temporada',
    modalidades: [o('pista', 'Pista'), o('park', 'Park / freestyle'), o('freeride', 'Fora de pista (freeride)'), o('competicao', 'Competição')],
    caracteristicas: [
      g('Base', [o('regular', 'Regular (pé esquerdo à frente)'), o('goofy', 'Goofy (pé direito à frente)')]),
      g('Temporada', [o('preparacao', 'Faz preparação física antes'), o('equipProprio', 'Equipamento próprio'), o('equipAlugado', 'Equipamento alugado'), o('protetorPunho', 'Usa protetor de punho')]),
    ],
  },
}

export function praticaDoEsporte(esporteKey: string | undefined): PraticaEsporte {
  return (esporteKey ? PRATICAS[esporteKey] : undefined) ?? PRATICA_OUTRO
}

function opcoesCaracteristicas(pratica: PraticaEsporte): OpcaoPratica[] {
  return pratica.caracteristicas.flatMap((grupo) => grupo.opcoes)
}

/** Chave válida da lista, sem repetir, na ordem do catálogo. */
export function filtrarOpcoes(value: unknown, opcoes: readonly OpcaoPratica[]): string[] {
  if (!Array.isArray(value)) return []
  const marcadas = new Set(value.filter((v): v is string => typeof v === 'string'))
  return opcoes.map((op) => op.key).filter((key) => marcadas.has(key))
}

function opcao(value: unknown, opcoes: readonly OpcaoPratica[]): string | undefined {
  return typeof value === 'string' && opcoes.some((op) => op.key === value) ? value : undefined
}

function texto(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined
  const out = value.slice(0, max)
  return out.trim() ? out : undefined
}

export type AvaliacaoPratica = {
  perfil?: string
  nivel?: string
  situacao?: string
  dominancia?: string
  anosPratica?: string
  frequencia?: number
  volume?: string
  modalidades?: string[]
  caracteristicas?: string[]
  praticaObs?: string
  sintomasMomentos?: string[]
  sintomas?: string
  /** Respostas do questionário próprio do esporte (chave da pergunta → valor). */
  respostas?: Record<string, string | string[]>
}

/** Só respostas de perguntas que existem no esporte, com opções válidas; vazias somem. */
export function safeRespostas(value: unknown, pratica: PraticaEsporte): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {}
  if (!value || typeof value !== 'object' || Array.isArray(value)) return out
  const raw = value as Record<string, unknown>
  for (const sec of pratica.secoes ?? []) {
    for (const p of sec.perguntas) {
      if (p.tipo === 'numeros') {
        for (const campo of p.campos ?? []) {
          const v = raw[campo.key]
          if (typeof v !== 'string') continue
          const n = v.replace(',', '.').trim().slice(0, RESPOSTA_NUMERO_MAX)
          if (/^\d+(\.\d+)?$/.test(n)) out[campo.key] = n
        }
        continue
      }
      const v = raw[p.key]
      if (p.tipo === 'multipla') {
        const keys = filtrarOpcoes(v, p.opcoes ?? [])
        if (keys.length) out[p.key] = keys
      } else if (p.tipo === 'textoLongo') {
        const t = texto(v, RESPOSTA_TEXTO_MAX)
        if (t) out[p.key] = t
      } else {
        const k = opcao(v, p.opcoes ?? [])
        if (k) out[p.key] = k
      }
    }
  }
  return out
}

/** Linhas "Pergunta: resposta" do questionário próprio, na ordem do catálogo. */
export function linhasRespostas(respostas: Record<string, string | string[]> | undefined, pratica: PraticaEsporte): string[] {
  if (!respostas) return []
  const linhas: string[] = []
  for (const sec of pratica.secoes ?? []) {
    for (const p of sec.perguntas) {
      const rotulo = p.rotulo.replace(/\s*\(múltipla escolha\)$/i, '')
      let valor = ''
      if (p.tipo === 'numeros') {
        valor = (p.campos ?? [])
          .filter((c) => typeof respostas[c.key] === 'string')
          .map((c) => `${respostas[c.key]} ${c.sufixo}`)
          .join(' · ')
      } else if (p.tipo === 'multipla') {
        const v = respostas[p.key]
        valor = Array.isArray(v) ? nomes(v, p.opcoes ?? []) : ''
      } else if (p.tipo === 'textoLongo') {
        const v = respostas[p.key]
        valor = typeof v === 'string' ? v.trim() : ''
      } else {
        const v = respostas[p.key]
        valor = typeof v === 'string' ? nomeDe(v, p.opcoes ?? []) : ''
      }
      if (valor) linhas.push(rotulo.endsWith('?') ? `${rotulo} ${valor}` : `${rotulo}: ${valor}`)
    }
  }
  return linhas
}

/** Só o que vale para o esporte; campo vazio some. */
export function safeAvaliacaoPratica(raw: Record<string, unknown>, esporteKey: string): AvaliacaoPratica {
  const pratica = praticaDoEsporte(esporteKey)
  const out: AvaliacaoPratica = {}
  const perfil = opcao(raw.perfil, PERFIS_ESPORTIVOS)
  if (perfil) out.perfil = perfil
  const nivel = opcao(raw.nivel, NIVEIS_ESPORTIVOS)
  if (nivel) out.nivel = nivel
  const situacao = opcao(raw.situacao, SITUACOES_PRATICA)
  if (situacao) out.situacao = situacao
  const dominancia = opcao(raw.dominancia, DOMINANCIAS)
  if (dominancia) out.dominancia = dominancia
  const anos = texto(raw.anosPratica, ANOS_PRATICA_MAX)
  if (anos) out.anosPratica = anos
  const freq = raw.frequencia
  if (typeof freq === 'number' && Number.isInteger(freq) && freq >= 1 && freq <= FREQUENCIA_MAX) out.frequencia = freq
  const volume = texto(raw.volume, VOLUME_MAX)
  if (volume) out.volume = volume
  const modalidades = filtrarOpcoes(raw.modalidades, pratica.modalidades)
  if (modalidades.length) out.modalidades = modalidades
  const caracteristicas = filtrarOpcoes(raw.caracteristicas, opcoesCaracteristicas(pratica))
  if (caracteristicas.length) out.caracteristicas = caracteristicas
  const obs = texto(raw.praticaObs, PRATICA_OBS_MAX)
  if (obs) out.praticaObs = obs
  const momentos = filtrarOpcoes(raw.sintomasMomentos, MOMENTOS_SINTOMA)
  if (momentos.length) out.sintomasMomentos = momentos
  const sintomas = texto(raw.sintomas, SINTOMAS_MAX)
  if (sintomas) out.sintomas = sintomas
  const respostas = safeRespostas(raw.respostas, pratica)
  if (Object.keys(respostas).length) out.respostas = respostas
  return out
}

function nomes(keys: readonly string[] | undefined, opcoes: readonly OpcaoPratica[]): string {
  const set = new Set(keys ?? [])
  return opcoes
    .filter((op) => set.has(op.key))
    .map((op) => op.nome)
    .join(', ')
}

function nomeDe(key: string | undefined, opcoes: readonly OpcaoPratica[]): string {
  return opcoes.find((op) => op.key === key)?.nome ?? ''
}

/** Linhas "Rótulo: valor" para visualização e PDF; só o que foi preenchido. */
export function linhasAvaliacaoPratica(entrada: AvaliacaoPratica, esporteKey: string): string[] {
  const pratica = praticaDoEsporte(esporteKey)
  const linhas: string[] = []
  const add = (rotulo: string, valor: string | undefined) => {
    if (valor && valor.trim()) linhas.push(`${rotulo}: ${valor.trim()}`)
  }
  add('Perfil', nomeDe(entrada.perfil, PERFIS_ESPORTIVOS))
  add('Nível', nomeDe(entrada.nivel, NIVEIS_ESPORTIVOS))
  add('Situação atual', nomeDe(entrada.situacao, SITUACOES_PRATICA))
  add('Lado dominante', nomeDe(entrada.dominancia, DOMINANCIAS))
  add('Tempo de prática', entrada.anosPratica)
  add('Frequência', entrada.frequencia ? rotuloFrequencia(entrada.frequencia) : undefined)
  add('Volume', entrada.volume)
  add('Modalidades', nomes(entrada.modalidades, pratica.modalidades))
  for (const grupo of pratica.caracteristicas) add(grupo.titulo, nomes(entrada.caracteristicas, grupo.opcoes))
  linhas.push(...linhasRespostas(entrada.respostas, pratica))
  add('Características da prática', entrada.praticaObs)
  add('Quando os sintomas aparecem', nomes(entrada.sintomasMomentos, MOMENTOS_SINTOMA))
  add('Sintomas na prática', entrada.sintomas)
  return linhas
}
