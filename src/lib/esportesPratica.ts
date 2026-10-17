// Avaliação esportiva de cada esporte: perfil, nível, tempo, frequência, volume, sintomas,
// modalidades e características da prática (rascunho clínico).
// Chaves publicadas são estáveis; nunca renomear. Sem imports com alias: roda em node --test.

export type OpcaoPratica = { key: string; nome: string }
export type GrupoPratica = { titulo: string; opcoes: OpcaoPratica[] }

// —— Perguntas específicas de cada esporte (questionário próprio) ——

export type TipoPergunta = 'unica' | 'multipla' | 'selecao' | 'simNao' | 'numeros' | 'texto' | 'textoLongo'

export type CampoNumero = {
  key: string
  rotulo: string
  sufixo: string
  placeholder?: string
  /** 'pace' aceita minutos:segundos (ex.: 6:00). Padrão: número (vírgula ou ponto). */
  formato?: 'pace'
}

export type Pergunta = {
  /** Chave da resposta (única dentro do esporte). Para 'numeros', cada campo usa a própria key. */
  key: string
  rotulo: string
  tipo: TipoPergunta
  opcoes?: readonly OpcaoPratica[]
  campos?: readonly CampoNumero[]
  placeholder?: string
  /** Só aparece (e só é guardada) quando outra resposta tem esse valor (ou o inclui, se for múltipla). */
  mostrarSe?: { key: string | readonly string[]; valor: string | readonly string[] }
  /** Na múltipla escolha: opções que excluem as demais (ex.: "Nenhum"). */
  exclusivas?: readonly string[]
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
  /** Mantém o bloco genérico "Sintomas na prática" mesmo com questionário próprio. */
  sintomasGenericos?: boolean
}

const o = (key: string, nome: string): OpcaoPratica => ({ key, nome })

export const RESPOSTA_TEXTO_MAX = 600
export const RESPOSTA_NUMERO_MAX = 6
export const RESPOSTA_TEXTO_CURTO_MAX = 80

export const SIM_NAO: readonly OpcaoPratica[] = [o('sim', 'Sim'), o('nao', 'Não')]

const unica = (key: string, rotulo: string, opcoes: OpcaoPratica[]): Pergunta => ({ key, rotulo, tipo: 'unica', opcoes })
const multipla = (key: string, rotulo: string, opcoes: OpcaoPratica[]): Pergunta => ({ key, rotulo, tipo: 'multipla', opcoes })
const selecao = (key: string, rotulo: string, opcoes: OpcaoPratica[]): Pergunta => ({ key, rotulo, tipo: 'selecao', opcoes })
const simNao = (key: string, rotulo: string): Pergunta => ({ key, rotulo, tipo: 'simNao', opcoes: SIM_NAO })
const numeros = (key: string, rotulo: string, campos: CampoNumero[]): Pergunta => ({ key, rotulo, tipo: 'numeros', campos })
const textoLongo = (key: string, rotulo: string, placeholder: string): Pergunta => ({ key, rotulo, tipo: 'textoLongo', placeholder })
const textoCurto = (key: string, rotulo: string, placeholder: string): Pergunta => ({ key, rotulo, tipo: 'texto', placeholder })
/** Pergunta que só aparece quando `key` tem `valor`. */
const se = (key: string | readonly string[], valor: string | readonly string[], p: Pergunta): Pergunta => ({
  ...p,
  mostrarSe: { key, valor },
})
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

const ARTES_MARCIAIS: OpcaoPratica[] = [
  o('jiuJitsu', 'Jiu-jitsu'),
  o('muayThai', 'Muay thai'),
  o('boxe', 'Boxe'),
  o('judo', 'Judô'),
  o('karate', 'Karatê'),
  o('taekwondo', 'Taekwondo'),
  o('mma', 'MMA'),
]

/** Movimentos frequentes de cada arte (Jiu-jitsu do protótipo; as demais são rascunho clínico). */
const MOVIMENTOS_LUTA: Record<string, OpcaoPratica[]> = {
  jiuJitsu: [
    o('guarda', 'Guarda e retenção'),
    o('passagem', 'Passagem de guarda'),
    o('raspagens', 'Raspagens'),
    o('quedas', 'Quedas'),
    o('finalizacoes', 'Chaves e finalizações'),
    o('controleSolo', 'Controle no solo'),
  ],
  muayThai: [
    o('chutes', 'Chutes'),
    o('joelhadas', 'Joelhadas'),
    o('cotoveladas', 'Cotoveladas'),
    o('socos', 'Socos'),
    o('clinch', 'Clinch'),
    o('checagem', 'Bloqueio / checagem de chutes'),
  ],
  boxe: [
    o('jabDireto', 'Jab / direto'),
    o('cruzadoGancho', 'Cruzado / gancho'),
    o('uppercut', 'Uppercut'),
    o('esquivas', 'Esquivas / pêndulo'),
    o('footwork', 'Deslocamento / footwork'),
    o('bloqueios', 'Bloqueios / clinch'),
  ],
  judo: [
    o('pegada', 'Pegada (kumikata)'),
    o('projecoes', 'Projeções'),
    o('quedas', 'Quedas (ukemi)'),
    o('solo', 'Imobilizações / solo'),
    o('chavesEstrangulamentos', 'Chaves e estrangulamentos'),
    o('randori', 'Randori'),
  ],
  karate: [
    o('socos', 'Socos'),
    o('chutes', 'Chutes'),
    o('bases', 'Bases e deslocamentos'),
    o('kata', 'Kata'),
    o('kumite', 'Kumite'),
    o('bloqueios', 'Bloqueios'),
  ],
  taekwondo: [
    o('chutesAltos', 'Chutes altos'),
    o('chutesGiratorios', 'Chutes giratórios'),
    o('chutesSalto', 'Chutes em salto'),
    o('footwork', 'Deslocamentos / footwork'),
    o('socos', 'Socos'),
    o('bloqueios', 'Bloqueios'),
  ],
  mma: [
    o('trocacao', 'Trocação em pé'),
    o('takedowns', 'Quedas (takedowns)'),
    o('defesaQueda', 'Defesa de queda'),
    o('clinchGrade', 'Clinch / grade'),
    o('groundPound', 'Ground and pound'),
    o('finalizacoes', 'Finalizações'),
  ],
}

const ESTILOS_DANCA: OpcaoPratica[] = [
  o('ballet', 'Ballet clássico'),
  o('contemporaneo', 'Contemporâneo'),
  o('jazz', 'Jazz'),
  o('urbanas', 'Danças urbanas'),
  o('salao', 'Dança de salão'),
  o('pole', 'Pole dance'),
  o('aerea', 'Dança aérea / tecido / lira'),
  o('outra', 'Outra'),
]

// Modelo universal para modalidades fora do catálogo. O nome do esporte usa o campo "outro" da entrada.
const PRATICA_OUTRO: PraticaEsporte = {
  volumeDica: 'ex.: 4 h por semana',
  modalidades: [],
  caracteristicas: [],
  sintomasGenericos: true,
  secoes: [
    secao('Identificação da modalidade', [
      textoCurto('submodalidade', 'Submodalidade ou especialidade', 'Ex.: boulder, surf de ondas grandes...'),
      unica('ambiente', 'Ambiente predominante', [
        o('indoor', 'Indoor / ambiente fechado'),
        o('outdoor', 'Outdoor / ambiente externo'),
        o('misto', 'Misto'),
        o('naoSeAplica', 'Outro / não se aplica'),
      ]),
    ]),
    secao('Características da prática', [
      multipla('demandas', 'Demandas físicas predominantes (múltipla escolha)', [
        o('forca', 'Força'),
        o('potencia', 'Potência'),
        o('resistencia', 'Resistência'),
        o('mobilidade', 'Mobilidade'),
        o('equilibrio', 'Equilíbrio'),
        o('coordenacao', 'Coordenação'),
        o('velocidade', 'Velocidade / agilidade'),
        o('contato', 'Contato / impacto'),
      ]),
      textoLongo(
        'movimentos',
        'Movimentos e gestos específicos da modalidade',
        'Ex.: suspensão pelos braços, remada, aterrissagens, rotações...',
      ),
    ]),
  ],
}

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
    modalidades: [],
    caracteristicas: [],
    volumeProprio: true,
    secoes: [
      secao('Modalidade e prática', [
        unica('modalidade', 'Modalidade principal', [
          o('campo', 'Futebol de campo'),
          o('society', 'Society'),
          o('futsal', 'Futsal'),
          o('areia', 'Futebol de areia'),
        ]),
        unica('posicao', 'Posição habitual', [
          o('goleiro', 'Goleiro'),
          o('zagueiro', 'Zagueiro/defensor'),
          o('lateral', 'Lateral'),
          o('meioCampo', 'Meio-campo'),
          o('atacante', 'Atacante'),
        ]),
        selecao('superficie', 'Superfície predominante', [
          o('gramaNatural', 'Grama natural'),
          o('gramaSintetica', 'Grama sintética'),
          o('quadra', 'Quadra (piso)'),
          o('areia', 'Areia'),
          o('varia', 'Varia bastante'),
        ]),
      ]),
      secao('Demandas esportivas', [
        multipla('gestos', 'Gestos mais exigidos ou associados a dificuldades', [
          o('sprint', 'Sprint'),
          o('frenagem', 'Frenagem'),
          o('mudancaDirecao', 'Mudança de direção'),
          o('chute', 'Chute'),
          o('salto', 'Salto'),
          o('contatoFisico', 'Contato físico'),
        ]),
        numeros('volume', 'Volume semanal', [
          { key: 'volumeTreinos', rotulo: 'Treinos/semana', sufixo: 'treinos/semana' },
          { key: 'volumeJogos', rotulo: 'Jogos/semana', sufixo: 'jogos/semana' },
          { key: 'volumeMinutos', rotulo: 'Minutos médios por treino ou jogo', sufixo: 'min por treino/jogo' },
        ]),
        simNao('mudancaCarga', 'Houve aumento ou mudança recente de carga?'),
      ]),
      secao('Sintomas e limitações', [
        selecao('movimentoSintoma', 'Movimento associado aos sintomas', [
          o('corrida', 'Corrida em velocidade'),
          o('aceleracao', 'Aceleração'),
          o('frenagem', 'Frenagem'),
          o('mudancaDirecao', 'Mudança de direção'),
          o('chute', 'Chute'),
          o('saltoAterrissagem', 'Salto/aterrissagem'),
          o('contatoFisico', 'Contato físico'),
          o('semMovimento', 'Sem movimento específico'),
        ]),
        textoLongo(
          'dificuldade',
          'Principal dificuldade para jogar',
          'Ex.: insegurança no giro, dor ao chutar, perda de velocidade...',
        ),
      ]),
    ],
  },
  corrida: {
    volumeDica: 'ex.: 30 km por semana',
    modalidades: [],
    caracteristicas: [],
    volumeProprio: true,
    secoes: [
      secao('Características da prática', [
        multipla('superficie', 'Superfície ou modalidade (múltipla escolha)', [
          o('rua', 'Rua'),
          o('trilha', 'Trilha'),
          o('pista', 'Pista'),
          o('esteira', 'Esteira'),
        ]),
        unica('distancia', 'Distância principal de treino ou prova', [
          o('ate5k', 'Até 5 km'),
          o('10k', '10 km'),
          o('meiaMaratona', 'Meia maratona (21 km)'),
          o('maratona', 'Maratona (42 km)'),
          o('ultra', 'Ultramaratona'),
          o('outras', 'Outras distâncias'),
        ]),
        multipla('treinos', 'Tipos de treino realizados', [
          o('rodagemLeve', 'Rodagem leve'),
          o('intervalado', 'Intervalado / tiros'),
          o('ritmo', 'Ritmo / tempo'),
          o('longao', 'Longão'),
          o('subidas', 'Subidas'),
          o('descidas', 'Descidas'),
        ]),
        multipla('calcado', 'Tipo de calçado utilizado (múltipla escolha)', [
          o('convencional', 'Convencional'),
          o('maximalista', 'Maximalista (alto amortecimento)'),
          o('minimalista', 'Minimalista'),
          o('placaCarbono', 'Com placa de carbono'),
          o('naoSabe', 'Não sabe informar'),
        ]),
        simNao('trocaCalcado', 'Houve troca recente de calçado?'),
        se('trocaCalcado', 'sim', textoCurto('trocaQuando', 'Há quanto tempo?', 'Ex.: 3 semanas')),
        se('trocaCalcado', 'sim', simNao('trocaModelo', 'Mudou o modelo ou as características do tênis?')),
        se('trocaCalcado', 'sim', simNao('trocaSintomas', 'Os sintomas começaram ou mudaram após a troca?')),
      ]),
      secao('Volume e intensidade', [
        numeros('volume', '', [
          { key: 'kmSemanaAtual', rotulo: 'Km/semana atual', sufixo: 'km/semana', placeholder: 'Ex.: 30' },
          { key: 'kmSemanaHabitual', rotulo: 'Km/semana habitual', sufixo: 'km/semana', placeholder: 'Ex.: 20' },
          { key: 'maiorTreino', rotulo: 'Maior treino (km)', sufixo: 'km', placeholder: 'Ex.: 12' },
          { key: 'ritmo', rotulo: 'Ritmo habitual (min/km)', sufixo: 'min/km', placeholder: 'Ex.: 6:00', formato: 'pace' },
        ]),
        unica('mudancaCarga', 'Houve mudança na carga nas últimas 4 semanas?', [
          o('sim', 'Sim'),
          o('nao', 'Não'),
          o('naoSabe', 'Não sabe'),
        ]),
      ]),
      secao('Sintomas e limitações', [
        simNao('temSintomas', 'Apresenta sintomas relacionados à corrida?'),
        se(
          'temSintomas',
          'sim',
          unica('inicioSintomas', 'Quando começam os sintomas?', [
            o('inicio', 'No início da corrida'),
            o('aposDistancia', 'Após determinada distância ou tempo'),
            o('maiorVelocidade', 'Em maior velocidade ou intensidade'),
            o('aposTreino', 'Após o treino'),
          ]),
        ),
        se(
          'temSintomas',
          'sim',
          unica('evolucaoSintomas', 'Como evoluem durante a corrida?', [
            o('diminuem', 'Diminuem ao continuar'),
            o('aumentam', 'Aumentam progressivamente'),
            o('semelhantes', 'Permanecem semelhantes'),
            o('variaveis', 'São variáveis'),
          ]),
        ),
        textoLongo(
          'limitacao',
          'Descreva a limitação e a resposta nas 24 horas seguintes',
          'Ex.: dor após 5 km, piora em descidas e persiste no dia seguinte...',
        ),
      ]),
    ],
  },
  basquete: {
    volumeDica: 'ex.: 3 treinos de 2 h por semana',
    modalidades: [],
    caracteristicas: [],
    volumeProprio: true,
    secoes: [
      secao('Modalidade e posição', [
        unica('modalidade', 'Modalidade', [o('quadra5x5', 'Quadra 5×5'), o('basquete3x3', '3×3')]),
        unica('posicao', 'Posição habitual', [
          o('armador', 'Armador(a)'),
          o('ala', 'Ala'),
          o('pivo', 'Pivô'),
          o('multiplas', 'Múltiplas posições'),
        ]),
        unica('maoArremesso', 'Mão preferencial para arremesso', [
          o('direita', 'Direita'),
          o('esquerda', 'Esquerda'),
          o('ambas', 'Ambas'),
        ]),
      ]),
      secao('Demandas da prática', [
        multipla('gestos', 'Gestos predominantes (múltipla escolha)', [
          o('saltos', 'Saltos e aterrissagens'),
          o('mudancasDirecao', 'Mudanças de direção'),
          o('aceleracaoFrenagem', 'Aceleração e frenagem'),
          o('arremessos', 'Arremessos'),
          o('bandejas', 'Bandejas/infiltrações'),
          o('pivoteios', 'Pivoteios'),
          o('contatoFisico', 'Contato físico'),
          o('rebotes', 'Rebotes'),
        ]),
        numeros('volume', 'Volume semanal', [
          { key: 'volumeTreinos', rotulo: 'Treinos/semana', sufixo: 'treinos/semana' },
          { key: 'volumeJogos', rotulo: 'Jogos/semana', sufixo: 'jogos/semana' },
        ]),
        numeros('duracao', '', [
          { key: 'duracaoMinutos', rotulo: 'Duração média de treino ou jogo (minutos)', sufixo: 'min', placeholder: 'Ex.: 60' },
        ]),
        unica('mudancaCarga', 'Houve mudança de carga nas últimas semanas?', [
          o('sim', 'Sim'),
          o('nao', 'Não'),
          o('naoSabe', 'Não sabe'),
        ]),
      ]),
      secao('Sintomas e limitações', [
        selecao('gestoSintoma', 'Em qual gesto aparecem os sintomas ou dificuldades?', [
          o('impulsao', 'Impulsão para salto'),
          o('aterrissagem', 'Aterrissagem'),
          o('frenagem', 'Frenagem'),
          o('mudancaDirecao', 'Mudança de direção'),
          o('pivoteio', 'Pivoteio'),
          o('arremesso', 'Arremesso'),
          o('contatoFisico', 'Contato físico'),
          o('semGesto', 'Sem gesto específico'),
        ]),
        textoLongo(
          'dificuldade',
          'Principal dificuldade esportiva',
          'Ex.: insegurança ao aterrissar, dor no pivoteio, perda de potência no salto...',
        ),
      ]),
    ],
  },
  tenis: {
    volumeDica: 'ex.: 3 jogos de 1h30 por semana',
    modalidades: [],
    caracteristicas: [],
    volumeProprio: true,
    secoes: [
      secao('Modalidade e características', [
        unica('esporte', 'Esporte praticado', [o('tenis', 'Tênis'), o('beachTennis', 'Beach tennis')]),
        unica('formato', 'Formato de jogo', [o('simples', 'Simples'), o('duplas', 'Duplas'), o('ambos', 'Ambos')]),
        unica('bracoDominante', 'Braço dominante para os golpes', [
          o('direito', 'Direito'),
          o('esquerdo', 'Esquerdo'),
          o('ambos', 'Ambos'),
        ]),
        // Só no tênis: no beach tennis a quadra é sempre de areia e o backhand é outro gesto.
        se(
          'esporte',
          'tenis',
          unica('superficie', 'Superfície predominante', [
            o('saibro', 'Saibro'),
            o('quadraDura', 'Quadra dura'),
            o('grama', 'Grama'),
            o('outra', 'Outra'),
          ]),
        ),
        se('esporte', 'tenis', unica('backhand', 'Backhand', [o('umaMao', 'Uma mão'), o('duasMaos', 'Duas mãos')])),
        unica('estilo', 'Estilo predominante de jogo', [
          o('fundo', 'Fundo de quadra'),
          o('rede', 'Jogo de rede'),
          o('misto', 'Misto'),
        ]),
      ]),
      secao('Demandas esportivas', [
        multipla('gestos', 'Gestos frequentes (múltipla escolha)', [
          o('forehand', 'Forehand'),
          o('backhand', 'Backhand'),
          o('saque', 'Saque'),
          o('voleio', 'Voleio'),
          o('smash', 'Smash'),
          o('slice', 'Slice'),
          o('deslocamentoLateral', 'Deslocamento lateral'),
          o('frenagem', 'Frenagem e mudança de direção'),
        ]),
        numeros('volume', 'Volume de prática', [
          { key: 'volumeSessoes', rotulo: 'Sessões/semana', sufixo: 'sessões/semana' },
          { key: 'volumeMinutos', rotulo: 'Minutos/sessão', sufixo: 'min/sessão' },
        ]),
        simNao('mudancaCarga', 'Houve mudança recente de carga ou equipamento?'),
      ]),
      secao('Sintomas e limitações', [
        selecao('gestoSintoma', 'Qual gesto provoca sintomas ou apresenta dificuldade?', [
          o('saque', 'Saque'),
          o('forehand', 'Forehand'),
          o('backhand', 'Backhand'),
          o('voleio', 'Voleio'),
          o('smash', 'Smash'),
          o('deslocamento', 'Deslocamento'),
          o('frenagem', 'Frenagem'),
        ]),
        textoLongo(
          'limitacao',
          'Principal limitação na modalidade',
          'Ex.: dor no saque, perda de potência, dificuldade para alcançar bolas laterais...',
        ),
      ]),
    ],
  },
  natacao: {
    volumeDica: 'ex.: 6 km por semana',
    modalidades: [],
    caracteristicas: [],
    volumeProprio: true,
    secoes: [
      secao('Modalidade e características', [
        unica('ambiente', 'Ambiente de prática', [
          o('piscina', 'Piscina'),
          o('aguasAbertas', 'Águas abertas'),
          o('ambos', 'Ambos'),
        ]),
        multipla('estilos', 'Estilos praticados (múltipla escolha)', [
          o('crawl', 'Crawl'),
          o('costas', 'Costas'),
          o('peito', 'Peito'),
          o('borboleta', 'Borboleta'),
          o('medley', 'Medley'),
        ]),
        selecao('estiloPredominante', 'Estilo predominante', [
          o('crawl', 'Crawl'),
          o('costas', 'Costas'),
          o('peito', 'Peito'),
          o('borboleta', 'Borboleta'),
          o('medley', 'Medley'),
        ]),
        se(
          'estilos',
          'crawl',
          unica('respiracaoCrawl', 'Padrão respiratório habitual no crawl', [
            o('direita', 'Predominantemente à direita'),
            o('esquerda', 'Predominantemente à esquerda'),
            o('alterna', 'Alterna os lados'),
            o('variavel', 'Variável'),
          ]),
        ),
      ]),
      secao('Treinamento e carga', [
        numeros('volume', '', [
          { key: 'volumeKm', rotulo: 'Volume semanal (km)', sufixo: 'km/semana', placeholder: 'Ex.: 6' },
          { key: 'mediaSessaoM', rotulo: 'Média por sessão (m)', sufixo: 'm/sessão', placeholder: 'Ex.: 2000' },
        ]),
        unica('tipoTreino', 'Tipo de treinamento predominante', [
          o('tecnica', 'Técnica'),
          o('resistencia', 'Resistência / contínuo'),
          o('intervalado', 'Intervalado / velocidade'),
          o('misto', 'Misto'),
        ]),
        {
          ...multipla('acessorios', 'Acessórios utilizados regularmente', [
            o('palmar', 'Palmar'),
            o('nadadeira', 'Nadadeira'),
            o('pullBuoy', 'Pull buoy'),
            o('prancha', 'Prancha'),
            o('snorkel', 'Snorkel frontal'),
            o('nenhum', 'Nenhum'),
          ]),
          exclusivas: ['nenhum'],
        },
        unica('mudancaCarga', 'Houve mudança de carga ou equipamento recentemente?', [
          o('sim', 'Sim'),
          o('nao', 'Não'),
          o('naoSabe', 'Não sabe'),
        ]),
      ]),
      secao('Sintomas e dificuldades', [
        simNao('temSintomas', 'Apresenta sintomas ou limitações na natação?'),
        se(
          'temSintomas',
          'sim',
          selecao('momentoSintoma', 'Em qual momento ou gesto?', [
            o('entradaMao', 'Entrada da mão na água'),
            o('tracao', 'Tração / propulsão submersa'),
            o('recuperacao', 'Recuperação aérea do braço'),
            o('respiracao', 'Respiração / rotação do tronco'),
            o('pernada', 'Pernada'),
            o('virada', 'Virada / impulsão na parede'),
            o('aposDistancia', 'Após determinada distância'),
            o('semFase', 'Sem fase específica'),
          ]),
        ),
        textoLongo(
          'descricao',
          'Descrição da dificuldade',
          'Ex.: dor no ombro durante a recuperação, desconforto na pernada de peito...',
        ),
      ]),
    ],
  },
  musculacao: {
    // Sem pergunta de volume no questionário: mantém o campo genérico "Volume".
    volumeDica: 'ex.: 5 treinos de 1 h por semana',
    modalidades: [],
    caracteristicas: [],
    secoes: [
      secao('Características do treinamento', [
        unica('tipoPratica', 'Tipo de prática', [
          o('convencional', 'Musculação convencional'),
          o('powerlifting', 'Powerlifting'),
          o('outroResistido', 'Outro treinamento resistido'),
        ]),
        multipla('objetivos', 'Objetivos (múltipla escolha)', [
          o('hipertrofia', 'Hipertrofia'),
          o('forcaMaxima', 'Força máxima'),
          o('resistencia', 'Resistência muscular'),
          o('saude', 'Saúde/condicionamento'),
          o('reabilitacao', 'Reabilitação'),
          o('outro', 'Outro'),
        ]),
        unica('divisao', 'Divisão do treinamento', [
          o('fullBody', 'Corpo todo (full body)'),
          o('grupos', 'Divisão por grupos musculares (ABC etc.)'),
          o('superioresInferiores', 'Superiores / inferiores'),
          o('outra', 'Outra'),
        ]),
      ]),
      secao('Exercícios e carga', [
        multipla('exercicios', 'Padrões ou exercícios praticados regularmente', [
          o('agachamento', 'Agachamento'),
          o('terra', 'Levantamento terra'),
          o('supino', 'Supino'),
          o('desenvolvimento', 'Desenvolvimento'),
          o('remadas', 'Remadas / puxadas'),
          o('afundo', 'Afundo / unilateral'),
          o('isolados', 'Exercícios isolados'),
          o('outros', 'Outros'),
        ]),
        unica('intensidade', 'Intensidade habitual percebida', [
          o('leve', 'Leve — longe da falha'),
          o('moderada', 'Moderada — algumas repetições em reserva'),
          o('alta', 'Alta — frequentemente próximo da falha'),
          o('variavel', 'Variável conforme o treino'),
        ]),
        unica('mudancaTreino', 'Houve mudança recente no treinamento?', [
          o('sim', 'Sim'),
          o('nao', 'Não'),
          o('naoSabe', 'Não sabe'),
        ]),
      ]),
      secao('Sintomas e limitações', [
        simNao('temSintomas', 'Apresenta sintomas ou dificuldade no treino?'),
        se(
          'temSintomas',
          'sim',
          textoCurto('exercicioSintoma', 'Exercício associado aos sintomas', 'Ex.: agachamento livre, supino, terra...'),
        ),
        se(
          'temSintomas',
          'sim',
          unica('momentoSintoma', 'Em qual momento do exercício?', [
            o('excentrica', 'Durante a descida / fase excêntrica'),
            o('concentrica', 'Durante a subida / fase concêntrica'),
            o('posicao', 'Em determinada posição ou amplitude'),
            o('fadiga', 'Com aumento da fadiga ou das repetições'),
            o('apos', 'Após o exercício'),
          ]),
        ),
        textoLongo(
          'limitacao',
          'Principal limitação',
          'Ex.: dor com cargas elevadas, dificuldade na amplitude, perda de força...',
        ),
      ]),
    ],
  },
  crossfit: {
    // Sem pergunta de volume no questionário: mantém o campo genérico "Volume".
    volumeDica: 'ex.: 5 aulas por semana',
    modalidades: [],
    caracteristicas: [],
    secoes: [
      secao('Características da prática', [
        multipla('participacao', 'Tipo de participação', [
          o('aulas', 'Aulas regulares'),
          o('individual', 'Treino individual'),
          o('preparacao', 'Preparação competitiva'),
          o('competicoes', 'Competições ocasionais'),
        ]),
        multipla('componentes', 'Componentes frequentes do treinamento', [
          o('wod', 'WOD / Metcon'),
          o('forca', 'Força'),
          o('lpo', 'LPO'),
          o('ginasticos', 'Ginásticos'),
          o('aerobico', 'Condicionamento aeróbico'),
        ]),
        unica('execucao', 'Execução dos treinos', [
          o('rx', 'Predominantemente Rx'),
          o('scaling', 'Predominantemente adaptado (scaling)'),
          o('alterna', 'Alterna Rx e adaptações'),
        ]),
      ]),
      secao('Movimentos e demandas', [
        multipla('movimentos', 'Movimentos realizados frequentemente', [
          o('olimpicos', 'Levantamentos olímpicos'),
          o('agachamentosTerra', 'Agachamentos e terra'),
          o('overhead', 'Movimentos overhead'),
          o('ginasticosBarra', 'Ginásticos em barra/argolas'),
          o('invertidos', 'Movimentos invertidos'),
          o('saltosCorda', 'Saltos e corda'),
          o('corrida', 'Corrida'),
          o('remoBike', 'Remo / bike'),
        ]),
        unica('sobFadiga', 'Realiza movimentos técnicos ou com carga sob fadiga?', [
          o('frequentemente', 'Frequentemente'),
          o('asVezes', 'Às vezes / depende do treino'),
          o('raramente', 'Raramente'),
        ]),
        unica('mudancaCarga', 'Houve mudança recente na carga de treinamento?', [
          o('sim', 'Sim'),
          o('nao', 'Não'),
          o('naoSabe', 'Não sabe'),
        ]),
      ]),
      secao('Sintomas e limitações', [
        textoCurto(
          'exercicioSintoma',
          'Qual exercício provoca sintomas ou dificuldade?',
          'Ex.: snatch, toes-to-bar, overhead squat...',
        ),
        unica('situacao', 'Em qual situação ocorre?', [
          o('carga', 'Com aumento de carga'),
          o('repeticoes', 'Com aumento de repetições'),
          o('fadiga', 'Sob fadiga'),
          o('amplitude', 'Em determinada amplitude'),
          o('fase', 'Durante uma fase específica do movimento'),
          o('aposTreino', 'Após o treino'),
        ]),
        textoLongo(
          'limitacao',
          'Principal limitação esportiva',
          'Ex.: dificuldade de manter o braço acima da cabeça, dor ao aterrissar dos saltos...',
        ),
      ]),
    ],
  },
  ciclismo: {
    volumeDica: 'ex.: 150 km por semana',
    modalidades: [],
    caracteristicas: [],
    volumeProprio: true,
    secoes: [
      secao('Modalidade e equipamento', [
        unica('modalidade', 'Modalidade predominante', [
          o('estrada', 'Estrada / speed'),
          o('mtb', 'Mountain bike (MTB)'),
          o('gravel', 'Gravel'),
          o('indoor', 'Indoor / spinning'),
          o('triatlo', 'Ciclismo de triatlo / contrarrelógio'),
        ]),
        unica('pedal', 'Tipo de pedal', [o('clipado', 'Clipado'), o('plataforma', 'Plataforma'), o('ambos', 'Ambos')]),
        unica('bikeFit', 'Já realizou bike fit?', [o('sim', 'Sim'), o('nao', 'Não'), o('naoSabe', 'Não sabe')]),
      ]),
      secao('Carga e características do pedal', [
        numeros('volume', '', [
          { key: 'volumeKm', rotulo: 'Volume semanal (km)', sufixo: 'km/semana', placeholder: 'Ex.: 150' },
          { key: 'horasSemana', rotulo: 'Horas por semana', sufixo: 'h/semana', placeholder: 'Ex.: 7' },
          { key: 'pedalLongoHoras', rotulo: 'Pedal mais longo habitual (horas)', sufixo: 'h', placeholder: 'Ex.: 3' },
        ]),
        multipla('treinos', 'Tipos de treino frequentes', [
          o('endurance', 'Endurance'),
          o('intervalado', 'Intervalado / tiros'),
          o('subidas', 'Subidas'),
          o('tecnico', 'Treino técnico'),
          o('pedaisLongos', 'Pedais longos'),
          o('competicoes', 'Competições'),
        ]),
        unica('mudancaTreino', 'Houve mudança recente de treino ou equipamento?', [
          o('sim', 'Sim'),
          o('nao', 'Não'),
          o('naoSabe', 'Não sabe'),
        ]),
      ]),
      secao('Sintomas e limitações', [
        unica('situacaoSintoma', 'Em qual situação aparecem os sintomas?', [
          o('aposTempo', 'Após determinado tempo pedalando'),
          o('subidas', 'Durante subidas'),
          o('intensidade', 'Em maior intensidade'),
          o('posicao', 'Em determinada posição na bicicleta'),
          o('descidas', 'Em descidas ou terreno técnico'),
          o('aposPedal', 'Após o pedal'),
        ]),
        textoLongo(
          'dificuldade',
          'Principal dificuldade no ciclismo',
          'Ex.: dor anterior do joelho em subidas, dormência nas mãos após 1 hora...',
        ),
      ]),
    ],
  },
  lutas: {
    // Sem volume semanal no questionário (só duração do treino): mantém o campo genérico "Volume".
    volumeDica: 'ex.: 4 treinos de 1h30 por semana',
    modalidades: [],
    caracteristicas: [],
    secoes: [
      secao('Modalidade e prática', [
        selecao('arte', 'Arte marcial principal', ARTES_MARCIAIS),
        // Para MMA ou quem pratica várias lutas: cada arte marcada mostra as próprias perguntas.
        multipla('outrasArtes', 'Outras lutas praticadas (opcional)', ARTES_MARCIAIS),
        unica('contato', 'Tipo de contato habitual', [
          o('semContato', 'Treino técnico sem contato'),
          o('leve', 'Contato leve / controlado'),
          o('moderado', 'Sparring / rola moderado'),
          o('intenso', 'Sparring intenso'),
          o('variavel', 'Variável conforme o treino'),
        ]),
        se(
          ['arte', 'outrasArtes'],
          'jiuJitsu',
          unica('preferenciaCombate', 'Preferência durante o combate', [
            o('guarda', 'Jogo de guarda'),
            o('porCima', 'Jogo por cima / passagem'),
            o('misto', 'Misto'),
          ]),
        ),
      ]),
      secao('Demandas específicas', [
        ...ARTES_MARCIAIS.map((arte) =>
          se(['arte', 'outrasArtes'], arte.key, multipla(`movimentos_${arte.key}`, `Movimentos frequentes — ${arte.nome}`, MOVIMENTOS_LUTA[arte.key] ?? [])),
        ),
        numeros('tempoTreino', '', [
          { key: 'tempoTreinoMin', rotulo: 'Tempo médio de treino (minutos)', sufixo: 'min', placeholder: 'Ex.: 90' },
        ]),
        unica('mudancaVolume', 'Houve mudança recente de volume ou intensidade?', [
          o('sim', 'Sim'),
          o('nao', 'Não'),
          o('naoSabe', 'Não sabe'),
        ]),
      ]),
      secao('Contexto competitivo', [simNao('compete', 'Participa de competições?')]),
      secao('Sintomas e limitações', [
        ...ARTES_MARCIAIS.map((arte) =>
          se(
            ['arte', 'outrasArtes'],
            arte.key,
            selecao(`queixa_${arte.key}`, `Movimento ou situação associada à queixa — ${arte.nome}`, [
              ...(MOVIMENTOS_LUTA[arte.key] ?? []),
              o('contatoImpacto', 'Contato / impacto'),
              o('aposTreino', 'Após o treino'),
              o('outro', 'Outro'),
            ]),
          ),
        ),
        textoLongo(
          'dificuldade',
          'Principal dificuldade na modalidade',
          'Ex.: dor ao finalizar, insegurança após queda, desconforto nos chutes...',
        ),
      ]),
    ],
  },
  handebol: {
    volumeDica: 'ex.: 3 treinos + 1 jogo por semana',
    modalidades: [],
    caracteristicas: [],
    volumeProprio: true,
    secoes: [
      secao('Modalidade e posição', [
        unica('modalidade', 'Modalidade', [o('quadra', 'Quadra'), o('areia', 'Areia')]),
        unica('posicao', 'Posição principal', [
          o('goleiro', 'Goleiro(a)'),
          o('armador', 'Armador(a)'),
          o('ponta', 'Ponta'),
          o('pivo', 'Pivô'),
          o('multiplas', 'Múltiplas posições'),
        ]),
        unica('maoArremesso', 'Mão preferencial para arremessar', [
          o('direita', 'Direita'),
          o('esquerda', 'Esquerda'),
          o('ambas', 'Ambas'),
        ]),
      ]),
      secao('Gestos e demandas esportivas', [
        multipla('movimentos', 'Movimentos frequentes (múltipla escolha)', [
          o('arremessoApoio', 'Arremesso em apoio'),
          o('arremessoSuspensao', 'Arremesso em suspensão'),
          o('saltos', 'Saltos / aterrissagens'),
          o('aceleracaoFrenagem', 'Aceleração / frenagem'),
          o('mudancasDirecao', 'Mudanças de direção'),
          o('bloqueiosContato', 'Bloqueios / contato'),
          o('deslocamentoDefensivo', 'Deslocamento defensivo'),
          o('defesaQuedas', 'Defesa / quedas'),
        ]),
        unica('contato', 'Exposição habitual ao contato físico', [
          o('baixa', 'Baixa'),
          o('moderada', 'Moderada'),
          o('alta', 'Alta'),
          o('variavel', 'Variável conforme a função ou jogo'),
        ]),
      ]),
      secao('Volume de treinamento', [
        numeros('volume', '', [
          { key: 'volumeTreinos', rotulo: 'Treinos/semana', sufixo: 'treinos/semana', placeholder: 'Ex.: 3' },
          { key: 'volumeJogos', rotulo: 'Jogos/semana', sufixo: 'jogos/semana', placeholder: 'Ex.: 1' },
          { key: 'duracaoMin', rotulo: 'Duração média da sessão (min)', sufixo: 'min', placeholder: 'Ex.: 90' },
        ]),
        unica('mudancaCarga', 'Houve mudança recente na carga?', [
          o('sim', 'Sim'),
          o('nao', 'Não'),
          o('naoSabe', 'Não sabe'),
        ]),
      ]),
      secao('Sintomas e limitações', [
        selecao('movimentoSintoma', 'Movimento associado aos sintomas', [
          o('arremesso', 'Arremesso'),
          o('impulsao', 'Impulsão'),
          o('aterrissagem', 'Aterrissagem'),
          o('mudancaDirecao', 'Mudança de direção'),
          o('contatoFisico', 'Contato físico'),
          o('outro', 'Outro'),
        ]),
        textoLongo(
          'dificuldade',
          'Principal dificuldade esportiva',
          'Ex.: dor no arremesso, insegurança ao aterrissar, dificuldade para frear...',
        ),
      ]),
    ],
  },
  futevolei: {
    volumeDica: 'ex.: 4 jogos de 2 h por semana',
    modalidades: [],
    caracteristicas: [],
    volumeProprio: true,
    secoes: [
      secao('Características da prática', [
        multipla('participacao', 'Tipo de participação', [
          o('tecnicos', 'Treinos técnicos'),
          o('recreativos', 'Jogos recreativos'),
          o('competitivos', 'Treinos competitivos'),
          o('torneios', 'Torneios'),
        ]),
        unica('perna', 'Perna preferencial para os golpes', [
          o('direita', 'Direita'),
          o('esquerda', 'Esquerda'),
          o('ambas', 'Ambas'),
        ]),
        unica('areia', 'Condição predominante da areia (opcional)', [
          o('fofa', 'Areia fofa'),
          o('compactada', 'Areia compactada'),
          o('variavel', 'Variável'),
          o('naoSabe', 'Não sabe informar'),
        ]),
      ]),
      secao('Fundamentos e demandas esportivas', [
        multipla('movimentos', 'Movimentos praticados com frequência', [
          o('recepcaoPe', 'Recepção com pé'),
          o('recepcaoCoxa', 'Recepção com coxa'),
          o('recepcaoPeito', 'Recepção com peito'),
          o('cabeceio', 'Cabeceio'),
          o('levantamento', 'Levantamento'),
          o('ataquePe', 'Ataque com o pé'),
          o('shark', 'Shark attack'),
          o('bicicleta', 'Bicicleta / acrobacias'),
          o('saltos', 'Saltos / aterrissagens'),
          o('deslocamentos', 'Deslocamentos na areia'),
        ]),
        numeros('volume', 'Volume semanal', [
          { key: 'volumeTreinos', rotulo: 'Treinos/semana', sufixo: 'treinos/semana', placeholder: 'Ex.: 2' },
          { key: 'volumeJogos', rotulo: 'Jogos/semana', sufixo: 'jogos/semana', placeholder: 'Ex.: 3' },
          { key: 'duracaoMin', rotulo: 'Duração média da sessão (minutos)', sufixo: 'min por sessão', placeholder: 'Ex.: 90' },
        ]),
        unica('mudancaCarga', 'Houve aumento ou mudança recente de carga?', [
          o('sim', 'Sim'),
          o('nao', 'Não'),
          o('naoSabe', 'Não sabe'),
        ]),
      ]),
      secao('Sintomas e limitações', [
        selecao('movimentoSintoma', 'Em qual movimento aparecem os sintomas?', [
          o('cabeceio', 'Cabeceio'),
          o('recepcao', 'Recepção'),
          o('ataquePe', 'Ataque com o pé'),
          o('shark', 'Shark attack'),
          o('bicicleta', 'Bicicleta'),
          o('impulsao', 'Impulsão'),
          o('aterrissagem', 'Aterrissagem'),
          o('deslocamento', 'Deslocamento na areia'),
          o('outro', 'Outro'),
        ]),
        textoLongo(
          'dificuldade',
          'Principal dificuldade esportiva',
          'Ex.: dor ao elevar a perna, insegurança ao aterrissar, perda de potência no ataque...',
        ),
      ]),
    ],
  },
  padel: {
    volumeDica: 'ex.: 3 jogos de 1h30 por semana',
    modalidades: [],
    caracteristicas: [],
    volumeProprio: true,
    secoes: [
      // Seção 01 e golpes da 02 não aparecem nas imagens: rascunho a partir do cadastro anterior do padel.
      secao('Características da prática', [
        multipla('participacao', 'Tipo de participação', [
          o('aulas', 'Aulas'),
          o('recreativos', 'Jogos recreativos'),
          o('torneios', 'Torneios'),
        ]),
        unica('lado', 'Lado da quadra', [
          o('direita', 'Direita (drive)'),
          o('esquerda', 'Esquerda (revés)'),
          o('ambos', 'Ambos'),
        ]),
        unica('bracoDominante', 'Braço dominante para os golpes', [
          o('direito', 'Direito'),
          o('esquerdo', 'Esquerdo'),
        ]),
      ]),
      secao('Golpes e deslocamentos', [
        multipla('golpes', 'Golpes frequentes (múltipla escolha)', [
          o('smash', 'Smash'),
          o('bandeja', 'Bandeja'),
          o('vibora', 'Víbora'),
          o('voleio', 'Voleio'),
          o('forehand', 'Forehand'),
          o('backhand', 'Backhand'),
          o('saidaParede', 'Saída de parede'),
        ]),
        multipla('deslocamentos', 'Padrões de deslocamento predominantes', [
          o('laterais', 'Deslocamentos laterais'),
          o('aceleracaoFrenagem', 'Aceleração / frenagem'),
          o('mudancasDirecao', 'Mudanças de direção'),
          o('recuos', 'Recuos e recuperação'),
          o('giros', 'Giros / reposicionamento'),
          o('saltos', 'Saltos / aterrissagens'),
        ]),
      ]),
      secao('Carga de treinamento', [
        numeros('volume', '', [
          { key: 'volumeTreinos', rotulo: 'Treinos/semana', sufixo: 'treinos/semana', placeholder: 'Ex.: 2' },
          { key: 'volumeJogos', rotulo: 'Jogos/semana', sufixo: 'jogos/semana', placeholder: 'Ex.: 3' },
          { key: 'duracaoMin', rotulo: 'Duração média (minutos)', sufixo: 'min', placeholder: 'Ex.: 90' },
        ]),
        unica('mudancaCarga', 'Houve mudança recente de carga ou equipamento?', [
          o('sim', 'Sim'),
          o('nao', 'Não'),
          o('naoSabe', 'Não sabe'),
        ]),
      ]),
      secao('Sintomas e limitações', [
        selecao('golpeSintoma', 'Golpe ou movimento associado à queixa', [
          ...[
          o('smash', 'Smash'),
          o('bandeja', 'Bandeja'),
          o('vibora', 'Víbora'),
          o('voleio', 'Voleio'),
          o('forehand', 'Forehand'),
          o('backhand', 'Backhand'),
          o('saidaParede', 'Saída de parede'),
        ],
          o('frenagem', 'Frenagem'),
          o('mudancaDirecao', 'Mudança de direção'),
          o('outro', 'Outro'),
        ]),
        textoLongo(
          'dificuldade',
          'Principal dificuldade esportiva',
          'Ex.: dor no ombro no smash, desconforto no cotovelo, dificuldade ao recuar...',
        ),
      ]),
    ],
  },
  danca: {
    volumeDica: 'ex.: 8 h de aula por semana',
    modalidades: [],
    caracteristicas: [],
    volumeProprio: true,
    secoes: [
      secao('Estilo e características', [
        selecao('estilo', 'Estilo principal', ESTILOS_DANCA),
        // Protótipo: a versão final pode ter estilo predominante e outros secundários.
        multipla('outrosEstilos', 'Outros estilos praticados (opcional)', ESTILOS_DANCA),
        se(
          ['estilo', 'outrosEstilos'],
          'ballet',
          unica('ponta', 'Realiza trabalho de ponta?', [o('sim', 'Sim'), o('nao', 'Não'), o('iniciando', 'Iniciando')]),
        ),
      ]),
      secao('Demandas do movimento', [
        multipla('movimentos', 'Movimentos frequentes', [
          o('releve', 'Relevé / meia-ponta'),
          o('piruetas', 'Piruetas / giros'),
          o('saltos', 'Saltos e aterrissagens'),
          o('equilibrio', 'Equilíbrio unipodal'),
          o('amplitudes', 'Grandes amplitudes / développés'),
          o('ponta', 'Trabalho de ponta'),
        ]),
        unica('superficie', 'Superfície predominante (se aplicável)', [
          o('amortecimento', 'Piso com estrutura de amortecimento'),
          o('rigido', 'Piso rígido'),
          o('variavel', 'Variável'),
          o('naoSabe', 'Não sabe informar'),
        ]),
      ]),
      secao('Carga da prática', [
        numeros('carga', '', [
          { key: 'horasAula', rotulo: 'Horas de aula/semana', sufixo: 'h/semana', placeholder: 'Ex.: 6' },
          { key: 'horasEnsaio', rotulo: 'Horas de ensaio/semana', sufixo: 'h/semana', placeholder: 'Ex.: 4' },
        ]),
        simNao('apresentacoes', 'Realiza apresentações ou competições?'),
        unica('mudancaCarga', 'Houve mudança recente na carga ou técnica?', [
          o('sim', 'Sim'),
          o('nao', 'Não'),
          o('naoSabe', 'Não sabe'),
        ]),
      ]),
      secao('Sintomas e limitações', [
        selecao('movimentoSintoma', 'Qual movimento está relacionado aos sintomas ou dificuldades?', [
          o('releve', 'Relevé / meia-ponta'),
          o('piruetas', 'Piruetas / giros'),
          o('saltos', 'Saltos e aterrissagens'),
          o('equilibrio', 'Equilíbrio unipodal'),
          o('amplitudes', 'Grandes amplitudes / développés'),
          o('ponta', 'Trabalho de ponta'),
        ]),
        textoLongo(
          'dificuldade',
          'Principal dificuldade funcional',
          'Ex.: dor ao fazer relevé, insegurança na aterrissagem, limitação na inversão...',
        ),
      ]),
    ],
  },
  pilatesYoga: {
    // Sem volume semanal no questionário (só duração da sessão): mantém o campo genérico "Volume".
    volumeDica: 'ex.: 3 aulas por semana',
    modalidades: [],
    caracteristicas: [],
    secoes: [
      secao('Modalidade e prática', [
        unica('pratica', 'Prática principal', [o('pilates', 'Pilates'), o('yoga', 'Yoga')]),
        se(
          'pratica',
          'pilates',
          unica('tipoPilates', 'Tipo de Pilates', [
            o('solo', 'Solo / Mat Pilates'),
            o('aparelhos', 'Aparelhos'),
            o('ambos', 'Ambos'),
          ]),
        ),
        se(
          'tipoPilates',
          ['aparelhos', 'ambos'],
          multipla('aparelhos', 'Aparelhos utilizados (opcional)', [
            o('reformer', 'Reformer'),
            o('cadillac', 'Cadillac / Tower'),
            o('chair', 'Chair'),
            o('barrel', 'Barrel'),
          ]),
        ),
        // Yoga: o protótipo só mostra o Pilates; perguntas do Yoga são rascunho clínico.
        se(
          'pratica',
          'yoga',
          unica('estiloYoga', 'Estilo de Yoga', [
            o('hatha', 'Hatha'),
            o('vinyasa', 'Vinyasa / flow'),
            o('ashtanga', 'Ashtanga'),
            o('iyengar', 'Iyengar'),
            o('restaurativo', 'Restaurativo / yin'),
            o('hot', 'Hot yoga'),
            o('outro', 'Outro'),
          ]),
        ),
        se(
          'pratica',
          'yoga',
          multipla('posturasYoga', 'Posturas frequentes (opcional)', [
            o('invertidas', 'Invertidas'),
            o('extensoes', 'Extensões profundas'),
            o('flexoes', 'Flexões profundas'),
            o('torcoes', 'Torções'),
            o('equilibrio', 'Equilíbrio'),
            o('apoioBracos', 'Apoio nos braços'),
          ]),
        ),
      ]),
      secao('Demandas da prática', [
        multipla('exigencias', 'Movimentos e exigências predominantes', [
          o('tronco', 'Controle / estabilização do tronco'),
          o('resistencia', 'Movimentos contra resistência'),
          o('mobilidade', 'Mobilidade de coluna / quadril'),
          o('equilibrio', 'Equilíbrio'),
          o('apoioMmss', 'Apoio de membros superiores'),
          o('unilaterais', 'Exercícios unilaterais'),
        ]),
        numeros('duracao', '', [
          { key: 'duracaoMin', rotulo: 'Duração média da sessão (minutos)', sufixo: 'min', placeholder: 'Ex.: 60' },
        ]),
        unica('mudancaPratica', 'Houve mudança recente na prática?', [
          o('sim', 'Sim'),
          o('nao', 'Não'),
          o('naoSabe', 'Não sabe'),
        ]),
      ]),
      secao('Sintomas e limitações', [
        simNao('temSintomas', 'Apresenta sintomas ou dificuldade durante a prática?'),
        se(
          'temSintomas',
          'sim',
          textoCurto(
            'posturaQueixa',
            'Movimento ou postura relacionada à queixa',
            'Ex.: prancha, ponte, extensão da coluna, inversão...',
          ),
        ),
        se(
          'temSintomas',
          'sim',
          unica('situacao', 'Em qual situação aparece?', [
            o('entrar', 'Ao entrar na posição'),
            o('sustentar', 'Ao sustentar a posição'),
            o('sair', 'Ao sair ou fazer a transição'),
            o('amplitude', 'Em determinada amplitude'),
            o('apos', 'Após a prática'),
          ]),
        ),
        textoLongo(
          'limitacao',
          'Principal limitação funcional',
          'Ex.: dor no punho em apoio, desconforto lombar na extensão, dificuldade de equilíbrio...',
        ),
      ]),
    ],
  },
  ski: {
    volumeDica: 'ex.: 7 dias por temporada',
    modalidades: [],
    caracteristicas: [],
    volumeProprio: true,
    secoes: [
      secao('Modalidade e experiência', [
        unica('modalidade', 'Modalidade principal', [
          o('alpino', 'Esqui alpino / pista'),
          o('freeride', 'Freeride / fora de pista'),
          o('freestyle', 'Freestyle / park'),
          o('crossCountry', 'Cross-country / esqui de fundo'),
        ]),
        unica('experiencia', 'Experiência acumulada', [
          o('primeira', 'Primeira temporada'),
          o('1a3', '1–3 temporadas'),
          o('4a10', '4–10 temporadas'),
          o('mais10', 'Mais de 10 temporadas'),
        ]),
        numeros('volume', '', [
          { key: 'diasTemporada', rotulo: 'Dias por temporada', sufixo: 'dias/temporada', placeholder: 'Ex.: 10' },
          { key: 'horasDia', rotulo: 'Horas por dia', sufixo: 'h/dia', placeholder: 'Ex.: 5' },
        ]),
      ]),
      secao('Terreno e técnica', [
        multipla('terrenos', 'Terrenos habitualmente praticados', [
          o('preparada', 'Pista preparada'),
          o('ingreme', 'Pista íngreme'),
          o('moguls', 'Moguls / bumps'),
          o('irregular', 'Neve irregular'),
          o('powder', 'Powder / neve profunda'),
          o('park', 'Park / saltos'),
        ]),
        unica('curva', 'Tipo de curva predominante', [
          o('cunha', 'Cunha / snowplow'),
          o('paralelas', 'Curvas paralelas'),
          o('carving', 'Carving'),
          o('derrapadas', 'Curvas derrapadas / skidded'),
          o('misto', 'Misto'),
          o('naoSabe', 'Não sabe informar'),
        ]),
        multipla('dificuldades', 'Dificuldades específicas (múltipla escolha)', [
          o('velocidade', 'Controle de velocidade'),
          o('curvasUmLado', 'Curvas para um lado'),
          o('esquiExterno', 'Carga no esqui externo'),
          o('terrenoIrregular', 'Terreno irregular'),
          o('impactos', 'Absorção de impactos'),
          o('fadiga', 'Fadiga nas descidas'),
          o('equilibrio', 'Equilíbrio'),
          o('saltos', 'Saltos / aterrissagens'),
        ]),
      ]),
      secao('Preparação e equipamento', [
        unica('preparacao', 'Preparação física habitual', [
          o('especifico', 'Treinamento específico para esqui'),
          o('geral', 'Treinamento físico geral'),
          o('nenhuma', 'Não realiza preparação'),
        ]),
        unica('equipamento', 'Equipamento utilizado', [
          o('proprio', 'Próprio'),
          o('alugado', 'Alugado'),
          o('ambos', 'Ambos'),
        ]),
        unica('mudanca', 'Houve mudança recente de equipamento ou volume?', [
          o('sim', 'Sim'),
          o('nao', 'Não'),
          o('naoSabe', 'Não sabe'),
        ]),
      ]),
      secao('Sintomas e limitações', [
        simNao('temSintomas', 'Apresenta sintomas durante a prática?'),
        se(
          'temSintomas',
          'sim',
          selecao('situacao', 'Em qual situação?', [
            o('curvas', 'Durante as curvas'),
            o('esquiExterno', 'Ao carregar o esqui externo'),
            o('frenagem', 'Na frenagem / derrapagem'),
            o('irregular', 'Em terreno irregular'),
            o('descidas', 'Após descidas prolongadas'),
            o('aterrissagens', 'Nas aterrissagens'),
            o('queda', 'Após queda'),
            o('outro', 'Outro'),
          ]),
        ),
        se(
          'temSintomas',
          'sim',
          textoLongo(
            'limitacao',
            'Principal limitação',
            'Ex.: dor no joelho durante curvas à direita, fadiga intensa nas descidas...',
          ),
        ),
      ]),
    ],
  },
  snowboard: {
    volumeDica: 'ex.: 7 dias por temporada',
    modalidades: [],
    caracteristicas: [],
    volumeProprio: true,
    secoes: [
      secao('Modalidade e experiência', [
        multipla('tipoPratica', 'Tipo de prática (múltipla escolha)', [
          o('pista', 'Pista'),
          o('freeride', 'Freeride / fora de pista'),
          o('park', 'Park / freestyle'),
          o('competicao', 'Competição'),
        ]),
        unica('base', 'Base habitual', [
          o('regular', 'Regular — pé esquerdo à frente'),
          o('goofy', 'Goofy — pé direito à frente'),
          o('naoSabe', 'Não sabe informar'),
        ]),
        unica('switch', 'Pratica switch?', [o('sim', 'Sim'), o('nao', 'Não'), o('aprendendo', 'Aprendendo')]),
        numeros('volume', '', [
          { key: 'diasTemporada', rotulo: 'Dias por temporada', sufixo: 'dias/temporada', placeholder: 'Ex.: 10' },
          { key: 'horasDia', rotulo: 'Horas médias por dia', sufixo: 'h/dia', placeholder: 'Ex.: 5' },
        ]),
      ]),
      secao('Terreno e controle da prancha', [
        selecao('terreno', 'Terreno predominante', [
          o('preparada', 'Pista preparada'),
          o('ingreme', 'Pista íngreme'),
          o('irregular', 'Neve irregular'),
          o('powder', 'Powder / neve profunda'),
          o('park', 'Park / saltos'),
          o('variado', 'Terreno variado'),
        ]),
        unica('borda', 'Apresenta maior dificuldade em alguma borda?', [
          o('toe', 'Toe edge — borda dos dedos'),
          o('heel', 'Heel edge — borda dos calcanhares'),
          o('ambas', 'Ambas'),
          o('nenhuma', 'Sem dificuldade específica'),
          o('naoSabe', 'Não sabe informar'),
        ]),
        multipla('dificuldades', 'Outras dificuldades (múltipla escolha)', [
          o('velocidade', 'Controle de velocidade'),
          o('transicao', 'Transição entre bordas'),
          o('curvasUmLado', 'Curvas para um lado'),
          o('terrenoIrregular', 'Terreno irregular'),
          o('equilibrio', 'Equilíbrio'),
          o('impactos', 'Absorção de impactos'),
          o('saltos', 'Saltos / aterrissagens'),
          o('fadiga', 'Fadiga nas descidas'),
        ]),
      ]),
      secao('Equipamento e preparação', [
        unica('preparacao', 'Preparação física antes da temporada', [
          o('especifico', 'Treinamento específico'),
          o('geral', 'Treinamento físico geral'),
          o('nenhuma', 'Não realiza'),
        ]),
        multipla('protecao', 'Equipamentos de proteção utilizados', [
          o('capacete', 'Capacete'),
          o('punho', 'Protetor de punho'),
          o('quadril', 'Proteção de quadril / cóccix'),
          o('coluna', 'Protetor de coluna'),
        ]),
        unica('mudancaEquipamento', 'Houve mudança recente na prancha, botas ou fixações?', [
          o('sim', 'Sim'),
          o('nao', 'Não'),
          o('naoSabe', 'Não sabe'),
        ]),
      ]),
      secao('Histórico de quedas e sintomas', [
        simNao('queda', 'Teve queda com lesão ou sintomas recentes?'),
        se(
          'queda',
          'sim',
          selecao('comoQueda', 'Como ocorreu a queda?', [
            o('punho', 'Apoio sobre a mão / punho'),
            o('ombro', 'Impacto no ombro'),
            o('coccix', 'Impacto no cóccix / quadril'),
            o('cabeca', 'Impacto na cabeça'),
            o('torcao', 'Torção de joelho / tornozelo'),
            o('outro', 'Outro mecanismo'),
          ]),
        ),
        selecao('situacao', 'Situação relacionada aos sintomas ou limitação', [
          o('toe', 'Toe edge'),
          o('heel', 'Heel edge'),
          o('transicao', 'Transição entre bordas'),
          o('frenagem', 'Frenagem'),
          o('irregular', 'Terreno irregular'),
          o('saltos', 'Saltos / aterrissagens'),
          o('aposQueda', 'Após queda'),
          o('descida', 'Descida prolongada'),
          o('outro', 'Outro'),
        ]),
        textoLongo(
          'limitacao',
          'Principal limitação esportiva',
          'Ex.: insegurança na heel edge, dor no punho após queda, perda de controle nas curvas...',
        ),
      ]),
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
          if (campo.formato === 'pace') {
            const t = v.trim().slice(0, RESPOSTA_NUMERO_MAX)
            if (/^\d{1,2}:[0-5]\d$/.test(t)) out[campo.key] = t
            continue
          }
          const n = v.replace(',', '.').trim().slice(0, RESPOSTA_NUMERO_MAX)
          if (/^\d+(\.\d+)?$/.test(n)) out[campo.key] = n
        }
        continue
      }
      const v = raw[p.key]
      if (p.tipo === 'multipla') {
        let keys = filtrarOpcoes(v, p.opcoes ?? [])
        // "Nenhum" junto com outras opções não faz sentido: ficam as outras.
        if (keys.length > 1) keys = keys.filter((k) => !(p.exclusivas ?? []).includes(k))
        if (keys.length) out[p.key] = keys
      } else if (p.tipo === 'textoLongo' || p.tipo === 'texto') {
        const t = texto(v, p.tipo === 'texto' ? RESPOSTA_TEXTO_CURTO_MAX : RESPOSTA_TEXTO_MAX)
        if (t) out[p.key] = t
      } else {
        const k = opcao(v, p.opcoes ?? [])
        if (k) out[p.key] = k
      }
    }
  }
  return podarRespostas(out, pratica.secoes ?? [])
}

export function perguntaVisivel(p: Pergunta, respostas: Record<string, string | string[]> | undefined): boolean {
  if (!p.mostrarSe) return true
  const { key, valor } = p.mostrarSe
  const valores: readonly string[] = typeof valor === 'string' ? [valor] : valor
  // Várias chaves: aparece se qualquer uma tiver algum dos valores (ex.: arte principal OU outras artes).
  return (typeof key === 'string' ? [key] : key).some((k) => {
    const v = respostas?.[k]
    return Array.isArray(v) ? v.some((item) => valores.includes(item)) : typeof v === 'string' && valores.includes(v)
  })
}

/** Marca/desmarca na múltipla escolha respeitando a ordem do catálogo e as opções exclusivas. */
export function alternarMultipla(p: Pergunta, marcadas: readonly string[], key: string): string[] {
  const exclusivas = p.exclusivas ?? []
  let proximo: string[]
  if (marcadas.includes(key)) proximo = marcadas.filter((k) => k !== key)
  else if (exclusivas.includes(key)) proximo = [key]
  else proximo = [...marcadas.filter((k) => !exclusivas.includes(k)), key]
  return (p.opcoes ?? []).map((op) => op.key).filter((k) => proximo.includes(k))
}

function chavesDaPergunta(p: Pergunta): string[] {
  return p.tipo === 'numeros' ? (p.campos ?? []).map((c) => c.key) : [p.key]
}

/** Tira respostas de perguntas que deixaram de aparecer (ex.: marcou "Não" depois de responder o "Sim"). */
export function podarRespostas(
  respostas: Record<string, string | string[]>,
  secoes: readonly SecaoPerguntas[],
): Record<string, string | string[]> {
  const out = { ...respostas }
  for (const sec of secoes) {
    for (const p of sec.perguntas) {
      if (!perguntaVisivel(p, out)) for (const key of chavesDaPergunta(p)) delete out[key]
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
      if (!perguntaVisivel(p, respostas)) continue
      if (p.tipo === 'numeros' && !p.rotulo) {
        // Sem rótulo de grupo: cada campo vira sua própria linha.
        for (const c of p.campos ?? []) {
          const v = respostas[c.key]
          if (typeof v === 'string') linhas.push(`${c.rotulo}: ${v}`)
        }
        continue
      }
      const rotulo = p.rotulo.replace(/\s*\((múltipla escolha|opcional)\)$/i, '')
      let valor = ''
      if (p.tipo === 'numeros') {
        valor = (p.campos ?? [])
          .filter((c) => typeof respostas[c.key] === 'string')
          .map((c) => `${respostas[c.key]} ${c.sufixo}`)
          .join(' · ')
      } else if (p.tipo === 'multipla') {
        const v = respostas[p.key]
        valor = Array.isArray(v) ? nomes(v, p.opcoes ?? []) : ''
      } else if (p.tipo === 'textoLongo' || p.tipo === 'texto') {
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
