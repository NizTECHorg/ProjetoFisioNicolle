import { test } from 'node:test'
import { deepEqual, equal, ok } from 'node:assert/strict'
import { ESPORTES, resumoEsportes, safeEsportesLista } from './esportesAvaliacao.ts'
import {
  PRATICAS,
  alternarMultipla,
  linhasAvaliacaoPratica,
  praticaDoEsporte,
  safeAvaliacaoPratica,
  safeRespostas,
} from './esportesPratica.ts'
import { emptyEvaluationFicha, evaluationFichaSchema } from '../schemas/evaluationFicha.schema.ts'

test('avaliação esportiva: todo esporte do catálogo tem prática, chaves únicas por esporte', () => {
  for (const esporte of ESPORTES) {
    const pratica = PRATICAS[esporte.key]
    ok(pratica, `sem prática: ${esporte.key}`)
    ok(pratica.volumeDica.length > 0)
    const mods = pratica.modalidades.map((m) => m.key)
    equal(new Set(mods).size, mods.length, `modalidade repetida em ${esporte.key}`)
    const cars = pratica.caracteristicas.flatMap((g) => g.opcoes.map((o) => o.key))
    equal(new Set(cars).size, cars.length, `característica repetida em ${esporte.key}`)
  }
})

test('avaliação esportiva: descarta campos antigos, frequência inválida e texto vazio', () => {
  deepEqual(
    safeAvaliacaoPratica(
      {
        perfil: 'profissional',
        nivel: 'mestre',
        frequencia: 9,
        anosPratica: '   ',
        volume: '7 dias por temporada',
        modalidades: ['freeride', 'praia', 'freeride'],
        caracteristicas: ['goofy', 'levantador'],
        sintomasMomentos: ['depois', 'antes'],
      },
      'snowboard',
    ),
    {
      perfil: 'profissional',
      volume: '7 dias por temporada',
      // Esporte com questionário próprio: modalidades/características antigas não valem mais.
      sintomasMomentos: ['antes', 'depois'],
    },
  )
})

test('avaliação esportiva: lista mantém os campos e o schema aceita', () => {
  const entrada = {
    esporte: 'volei',
    nivel: 'atleta',
    frequencia: 5,
    respostas: { modalidade: 'praia', posicao: 'ponteiro', gestos: ['ataque', 'saque'], volumeHoras: '6' },
    sintomas: 'Dor no ombro ao atacar',
    problemas: ['dorOmbroAtaque'],
  }
  deepEqual(safeEsportesLista([entrada]), [entrada])
  const ficha = emptyEvaluationFicha()
  const parsed = evaluationFichaSchema.parse({ ...ficha, funcao: { ...ficha.funcao, esportes: [entrada] } })
  deepEqual(parsed.funcao.esportes, [entrada])
})

test('vôlei: questionário saneia respostas (opção inválida, ordem, números, texto vazio)', () => {
  const pratica = praticaDoEsporte('volei')
  ok(pratica.secoes && pratica.secoes.length === 3)
  ok(pratica.volumeProprio)
  deepEqual(
    safeRespostas(
      {
        modalidade: 'quadra',
        posicao: 'goleiro',
        gestos: ['saque', 'ataque', 'xx', 'saque'],
        volumeHoras: '6,5',
        volumeJogos: 'muitos',
        cargaSaltos: 'alta',
        mudancaVolume: 'sim',
        faseSintoma: 'aterrissagem',
        dificuldade: '   ',
        inventada: 'x',
      },
      pratica,
    ),
    {
      modalidade: 'quadra',
      gestos: ['ataque', 'saque'],
      volumeHoras: '6.5',
      cargaSaltos: 'alta',
      mudancaVolume: 'sim',
      faseSintoma: 'aterrissagem',
    },
  )
})

test('avaliação esportiva: linhas para visualização e PDF', () => {
  deepEqual(
    linhasAvaliacaoPratica(
      {
        nivel: 'intermediario',
        frequencia: 3,
        respostas: {
          modalidade: 'praia',
          posicao: 'libero',
          gestos: ['recepcao', 'defesa'],
          volumeHoras: '6',
          volumeJogos: '2',
          mudancaVolume: 'nao',
          faseSintoma: 'aterrissagem',
          dificuldade: 'Insegurança na aterrissagem',
        },
      },
      'volei',
    ),
    [
      'Nível: Intermediário',
      'Frequência: 3x por semana',
      'Modalidade: Praia',
      'Posição principal: Líbero',
      'Gestos mais frequentes: Recepção/manchete, Defesa/mergulho',
      'Volume de prática: 6 h/semana · 2 jogos/semana',
      'Houve mudança recente no volume ou intensidade? Não',
      'Em qual fase do movimento aparecem? Aterrissagem',
      'Principal dificuldade na modalidade: Insegurança na aterrissagem',
    ],
  )
  const resumo = resumoEsportes({ esportes: [{ esporte: 'outro', outro: 'Remo', frequencia: 7 }] })
  deepEqual(resumo[0]?.linhas, ['Frequência: Todo dia'])
})

test('futebol: questionário próprio com 3 seções e volume em 3 números', () => {
  const pratica = praticaDoEsporte('futebol')
  ok(pratica.volumeProprio)
  deepEqual(pratica.secoes?.map((s) => s.titulo), ['Modalidade e prática', 'Demandas esportivas', 'Sintomas e limitações'])
  deepEqual(
    linhasAvaliacaoPratica(
      {
        respostas: {
          modalidade: 'society',
          posicao: 'atacante',
          superficie: 'gramaSintetica',
          gestos: ['chute', 'sprint'],
          volumeTreinos: '3',
          volumeJogos: '1',
          volumeMinutos: '90',
          mudancaCarga: 'sim',
          movimentoSintoma: 'chute',
        },
      },
      'futebol',
    ),
    [
      'Modalidade principal: Society',
      'Posição habitual: Atacante',
      'Superfície predominante: Grama sintética',
      'Gestos mais exigidos ou associados a dificuldades: Sprint, Chute',
      'Volume semanal: 3 treinos/semana · 1 jogos/semana · 90 min por treino/jogo',
      'Houve aumento ou mudança recente de carga? Sim',
      'Movimento associado aos sintomas: Chute',
    ],
  )
})

test('corrida: perguntas condicionais, ritmo min:seg e números em linhas separadas', () => {
  const pratica = praticaDoEsporte('corrida')
  ok(pratica.volumeProprio)
  // "Não" na troca de calçado apaga as respostas que dependiam do "Sim"
  deepEqual(
    safeRespostas(
      { trocaCalcado: 'nao', trocaQuando: '2 semanas', trocaModelo: 'sim', ritmo: '6:00', kmSemanaAtual: '30', maiorTreino: 'x' },
      pratica,
    ),
    { trocaCalcado: 'nao', ritmo: '6:00', kmSemanaAtual: '30' },
  )
  deepEqual(safeRespostas({ ritmo: '6:75' }, pratica), {})
  deepEqual(
    linhasAvaliacaoPratica(
      {
        respostas: {
          superficie: ['rua', 'trilha'],
          distancia: 'meiaMaratona',
          calcado: ['placaCarbono'],
          trocaCalcado: 'sim',
          trocaQuando: '3 semanas',
          trocaSintomas: 'sim',
          kmSemanaAtual: '30',
          ritmo: '5:40',
          mudancaCarga: 'naoSabe',
          temSintomas: 'sim',
          inicioSintomas: 'aposDistancia',
          evolucaoSintomas: 'aumentam',
        },
      },
      'corrida',
    ),
    [
      'Superfície ou modalidade: Rua, Trilha',
      'Distância principal de treino ou prova: Meia maratona (21 km)',
      'Tipo de calçado utilizado: Com placa de carbono',
      'Houve troca recente de calçado? Sim',
      'Há quanto tempo? 3 semanas',
      'Os sintomas começaram ou mudaram após a troca? Sim',
      'Km/semana atual: 30',
      'Ritmo habitual (min/km): 5:40',
      'Houve mudança na carga nas últimas 4 semanas? Não sabe',
      'Apresenta sintomas relacionados à corrida? Sim',
      'Quando começam os sintomas? Após determinada distância ou tempo',
      'Como evoluem durante a corrida? Aumentam progressivamente',
    ],
  )
})

test('basquete: questionário próprio (mão de arremesso, gestos, volume e duração)', () => {
  const pratica = praticaDoEsporte('basquete')
  ok(pratica.volumeProprio)
  deepEqual(pratica.secoes?.map((s) => s.titulo), ['Modalidade e posição', 'Demandas da prática', 'Sintomas e limitações'])
  deepEqual(
    linhasAvaliacaoPratica(
      {
        respostas: {
          modalidade: 'basquete3x3',
          posicao: 'ala',
          maoArremesso: 'esquerda',
          gestos: ['rebotes', 'saltos'],
          volumeTreinos: '3',
          duracaoMinutos: '60',
          mudancaCarga: 'nao',
          gestoSintoma: 'pivoteio',
        },
      },
      'basquete',
    ),
    [
      'Modalidade: 3×3',
      'Posição habitual: Ala',
      'Mão preferencial para arremesso: Esquerda',
      'Gestos predominantes: Saltos e aterrissagens, Rebotes',
      'Volume semanal: 3 treinos/semana',
      'Duração média de treino ou jogo (minutos): 60',
      'Houve mudança de carga nas últimas semanas? Não',
      'Em qual gesto aparecem os sintomas ou dificuldades? Pivoteio',
    ],
  )
})

test('tênis: superfície e backhand só aparecem no tênis (beach tennis não)', () => {
  const pratica = praticaDoEsporte('tenis')
  deepEqual(
    safeRespostas({ esporte: 'beachTennis', superficie: 'saibro', backhand: 'umaMao', estilo: 'rede' }, pratica),
    { esporte: 'beachTennis', estilo: 'rede' },
  )
  deepEqual(
    linhasAvaliacaoPratica(
      {
        respostas: {
          esporte: 'tenis',
          formato: 'duplas',
          superficie: 'saibro',
          backhand: 'duasMaos',
          gestos: ['saque', 'slice'],
          volumeSessoes: '3',
          volumeMinutos: '90',
          mudancaCarga: 'sim',
          gestoSintoma: 'saque',
        },
      },
      'tenis',
    ),
    [
      'Esporte praticado: Tênis',
      'Formato de jogo: Duplas',
      'Superfície predominante: Saibro',
      'Backhand: Duas mãos',
      'Gestos frequentes: Saque, Slice',
      'Volume de prática: 3 sessões/semana · 90 min/sessão',
      'Houve mudança recente de carga ou equipamento? Sim',
      'Qual gesto provoca sintomas ou apresenta dificuldade? Saque',
    ],
  )
})

test('natação: respiração do crawl depende de "Crawl" nos estilos; "Nenhum" é exclusivo', () => {
  const pratica = praticaDoEsporte('natacao')
  deepEqual(safeRespostas({ estilos: ['peito'], respiracaoCrawl: 'direita' }, pratica), { estilos: ['peito'] })
  deepEqual(safeRespostas({ estilos: ['crawl', 'peito'], respiracaoCrawl: 'alterna' }, pratica), {
    estilos: ['crawl', 'peito'],
    respiracaoCrawl: 'alterna',
  })
  deepEqual(safeRespostas({ acessorios: ['nenhum', 'palmar'] }, pratica), { acessorios: ['palmar'] })
  const acessorios = pratica.secoes?.[1]?.perguntas.find((p) => p.key === 'acessorios')
  ok(acessorios)
  deepEqual(alternarMultipla(acessorios, ['palmar', 'prancha'], 'nenhum'), ['nenhum'])
  deepEqual(alternarMultipla(acessorios, ['nenhum'], 'nadadeira'), ['nadadeira'])
  deepEqual(
    linhasAvaliacaoPratica(
      {
        respostas: {
          ambiente: 'aguasAbertas',
          estilos: ['crawl'],
          estiloPredominante: 'crawl',
          respiracaoCrawl: 'direita',
          volumeKm: '6',
          mediaSessaoM: '2000',
          tipoTreino: 'resistencia',
          temSintomas: 'sim',
          momentoSintoma: 'recuperacao',
        },
      },
      'natacao',
    ),
    [
      'Ambiente de prática: Águas abertas',
      'Estilos praticados: Crawl',
      'Estilo predominante: Crawl',
      'Padrão respiratório habitual no crawl: Predominantemente à direita',
      'Volume semanal (km): 6',
      'Média por sessão (m): 2000',
      'Tipo de treinamento predominante: Resistência / contínuo',
      'Apresenta sintomas ou limitações na natação? Sim',
      'Em qual momento ou gesto? Recuperação aérea do braço',
    ],
  )
})

test('musculação: questionário próprio sem volume (campo genérico continua)', () => {
  const pratica = praticaDoEsporte('musculacao')
  ok(!pratica.volumeProprio)
  deepEqual(safeRespostas({ temSintomas: 'nao', exercicioSintoma: 'supino', momentoSintoma: 'apos' }, pratica), {
    temSintomas: 'nao',
  })
  deepEqual(
    linhasAvaliacaoPratica(
      {
        volume: '5 treinos de 1 h',
        respostas: {
          tipoPratica: 'powerlifting',
          objetivos: ['forcaMaxima'],
          exercicios: ['agachamento', 'supino'],
          intensidade: 'moderada',
          temSintomas: 'sim',
          exercicioSintoma: 'Agachamento livre',
          momentoSintoma: 'excentrica',
        },
      },
      'musculacao',
    ),
    [
      'Volume: 5 treinos de 1 h',
      'Tipo de prática: Powerlifting',
      'Objetivos: Força máxima',
      'Padrões ou exercícios praticados regularmente: Agachamento, Supino',
      'Intensidade habitual percebida: Moderada — algumas repetições em reserva',
      'Apresenta sintomas ou dificuldade no treino? Sim',
      'Exercício associado aos sintomas: Agachamento livre',
      'Em qual momento do exercício? Durante a descida / fase excêntrica',
    ],
  )
})

test('crossfit: questionário próprio (participação, componentes, movimentos, situação)', () => {
  const pratica = praticaDoEsporte('crossfit')
  ok(!pratica.volumeProprio)
  deepEqual(
    linhasAvaliacaoPratica(
      {
        respostas: {
          participacao: ['aulas', 'competicoes'],
          componentes: ['wod', 'forca'],
          execucao: 'alterna',
          movimentos: ['olimpicos', 'remoBike'],
          sobFadiga: 'asVezes',
          exercicioSintoma: 'Snatch',
          situacao: 'fadiga',
        },
      },
      'crossfit',
    ),
    [
      'Tipo de participação: Aulas regulares, Competições ocasionais',
      'Componentes frequentes do treinamento: WOD / Metcon, Força',
      'Execução dos treinos: Alterna Rx e adaptações',
      'Movimentos realizados frequentemente: Levantamentos olímpicos, Remo / bike',
      'Realiza movimentos técnicos ou com carga sob fadiga? Às vezes / depende do treino',
      'Qual exercício provoca sintomas ou dificuldade? Snatch',
      'Em qual situação ocorre? Sob fadiga',
    ],
  )
})

test('ciclismo: questionário próprio (pedal, bike fit, km/horas, situação dos sintomas)', () => {
  const pratica = praticaDoEsporte('ciclismo')
  ok(pratica.volumeProprio)
  deepEqual(
    linhasAvaliacaoPratica(
      {
        respostas: {
          modalidade: 'estrada',
          pedal: 'clipado',
          bikeFit: 'nao',
          volumeKm: '150',
          horasSemana: '7',
          pedalLongoHoras: '3',
          treinos: ['endurance', 'subidas'],
          situacaoSintoma: 'subidas',
        },
      },
      'ciclismo',
    ),
    [
      'Modalidade predominante: Estrada / speed',
      'Tipo de pedal: Clipado',
      'Já realizou bike fit? Não',
      'Volume semanal (km): 150',
      'Horas por semana: 7',
      'Pedal mais longo habitual (horas): 3',
      'Tipos de treino frequentes: Endurance, Subidas',
      'Em qual situação aparecem os sintomas? Durante subidas',
    ],
  )
})

test('lutas: perguntas mudam conforme a arte; várias artes mostram as perguntas de cada uma', () => {
  const pratica = praticaDoEsporte('lutas')
  // Muay thai não pode guardar movimentos/queixa/preferência do jiu-jitsu
  deepEqual(
    safeRespostas(
      { arte: 'muayThai', preferenciaCombate: 'guarda', movimentos_jiuJitsu: ['raspagens'], movimentos_muayThai: ['chutes'] },
      pratica,
    ),
    { arte: 'muayThai', movimentos_muayThai: ['chutes'] },
  )
  deepEqual(
    linhasAvaliacaoPratica(
      {
        respostas: {
          arte: 'jiuJitsu',
          outrasArtes: ['muayThai'],
          contato: 'moderado',
          preferenciaCombate: 'guarda',
          movimentos_jiuJitsu: ['raspagens', 'finalizacoes'],
          movimentos_muayThai: ['joelhadas'],
          tempoTreinoMin: '90',
          compete: 'nao',
          queixa_jiuJitsu: 'finalizacoes',
        },
      },
      'lutas',
    ),
    [
      'Arte marcial principal: Jiu-jitsu',
      'Outras lutas praticadas: Muay thai',
      'Tipo de contato habitual: Sparring / rola moderado',
      'Preferência durante o combate: Jogo de guarda',
      'Movimentos frequentes — Jiu-jitsu: Raspagens, Chaves e finalizações',
      'Movimentos frequentes — Muay thai: Joelhadas',
      'Tempo médio de treino (minutos): 90',
      'Participa de competições? Não',
      'Movimento ou situação associada à queixa — Jiu-jitsu: Chaves e finalizações',
    ],
  )
})

test('handebol: questionário próprio com 4 seções', () => {
  const pratica = praticaDoEsporte('handebol')
  ok(pratica.volumeProprio)
  deepEqual(pratica.secoes?.map((s) => s.titulo), [
    'Modalidade e posição',
    'Gestos e demandas esportivas',
    'Volume de treinamento',
    'Sintomas e limitações',
  ])
  deepEqual(
    linhasAvaliacaoPratica(
      {
        respostas: {
          modalidade: 'areia',
          posicao: 'armador',
          maoArremesso: 'direita',
          movimentos: ['arremessoSuspensao', 'defesaQuedas'],
          contato: 'variavel',
          volumeTreinos: '3',
          volumeJogos: '1',
          duracaoMin: '90',
          movimentoSintoma: 'aterrissagem',
        },
      },
      'handebol',
    ),
    [
      'Modalidade: Areia',
      'Posição principal: Armador(a)',
      'Mão preferencial para arremessar: Direita',
      'Movimentos frequentes: Arremesso em suspensão, Defesa / quedas',
      'Exposição habitual ao contato físico: Variável conforme a função ou jogo',
      'Treinos/semana: 3',
      'Jogos/semana: 1',
      'Duração média da sessão (min): 90',
      'Movimento associado aos sintomas: Aterrissagem',
    ],
  )
})

test('futevôlei: questionário próprio (participação, perna, areia, fundamentos, volume)', () => {
  const pratica = praticaDoEsporte('futevolei')
  ok(pratica.volumeProprio)
  deepEqual(
    linhasAvaliacaoPratica(
      {
        respostas: {
          participacao: ['recreativos'],
          perna: 'esquerda',
          areia: 'variavel',
          movimentos: ['cabeceio', 'recepcaoPeito'],
          volumeTreinos: '2',
          volumeJogos: '3',
          duracaoMin: '90',
          movimentoSintoma: 'shark',
        },
      },
      'futevolei',
    ),
    [
      'Tipo de participação: Jogos recreativos',
      'Perna preferencial para os golpes: Esquerda',
      'Condição predominante da areia: Variável',
      'Movimentos praticados com frequência: Recepção com peito, Cabeceio',
      'Volume semanal: 2 treinos/semana · 3 jogos/semana · 90 min por sessão',
      'Em qual movimento aparecem os sintomas? Shark attack',
    ],
  )
})

test('padel: questionário próprio (golpes, deslocamentos, carga, queixa)', () => {
  const pratica = praticaDoEsporte('padel')
  ok(pratica.volumeProprio)
  deepEqual(
    linhasAvaliacaoPratica(
      {
        respostas: {
          lado: 'esquerda',
          golpes: ['vibora', 'smash'],
          deslocamentos: ['recuos', 'giros'],
          volumeTreinos: '2',
          duracaoMin: '90',
          mudancaCarga: 'nao',
          golpeSintoma: 'saidaParede',
        },
      },
      'padel',
    ),
    [
      'Lado da quadra: Esquerda (revés)',
      'Golpes frequentes: Smash, Víbora',
      'Padrões de deslocamento predominantes: Recuos e recuperação, Giros / reposicionamento',
      'Treinos/semana: 2',
      'Duração média (minutos): 90',
      'Houve mudança recente de carga ou equipamento? Não',
      'Golpe ou movimento associado à queixa: Saída de parede',
    ],
  )
})

test('dança: ponta só com ballet (principal ou outro estilo); vários estilos', () => {
  const pratica = praticaDoEsporte('danca')
  ok(pratica.volumeProprio)
  deepEqual(safeRespostas({ estilo: 'jazz', ponta: 'sim' }, pratica), { estilo: 'jazz' })
  deepEqual(safeRespostas({ estilo: 'jazz', outrosEstilos: ['ballet'], ponta: 'iniciando' }, pratica), {
    estilo: 'jazz',
    outrosEstilos: ['ballet'],
    ponta: 'iniciando',
  })
  deepEqual(
    linhasAvaliacaoPratica(
      {
        respostas: {
          estilo: 'ballet',
          ponta: 'nao',
          movimentos: ['releve', 'piruetas'],
          superficie: 'rigido',
          horasAula: '6',
          horasEnsaio: '4',
          apresentacoes: 'sim',
          movimentoSintoma: 'saltos',
        },
      },
      'danca',
    ),
    [
      'Estilo principal: Ballet clássico',
      'Realiza trabalho de ponta? Não',
      'Movimentos frequentes: Relevé / meia-ponta, Piruetas / giros',
      'Superfície predominante (se aplicável): Piso rígido',
      'Horas de aula/semana: 6',
      'Horas de ensaio/semana: 4',
      'Realiza apresentações ou competições? Sim',
      'Qual movimento está relacionado aos sintomas ou dificuldades? Saltos e aterrissagens',
    ],
  )
})

test('pilates/yoga: perguntas alternam entre Pilates e Yoga; aparelhos só com aparelhos/ambos', () => {
  const pratica = praticaDoEsporte('pilatesYoga')
  deepEqual(safeRespostas({ pratica: 'yoga', tipoPilates: 'aparelhos', aparelhos: ['reformer'], estiloYoga: 'hatha' }, pratica), {
    pratica: 'yoga',
    estiloYoga: 'hatha',
  })
  deepEqual(safeRespostas({ pratica: 'pilates', tipoPilates: 'solo', aparelhos: ['reformer'] }, pratica), {
    pratica: 'pilates',
    tipoPilates: 'solo',
  })
  deepEqual(
    linhasAvaliacaoPratica(
      {
        respostas: {
          pratica: 'pilates',
          tipoPilates: 'ambos',
          aparelhos: ['reformer', 'chair'],
          exigencias: ['tronco'],
          duracaoMin: '60',
          temSintomas: 'sim',
          posturaQueixa: 'Ponte',
          situacao: 'sustentar',
        },
      },
      'pilatesYoga',
    ),
    [
      'Prática principal: Pilates',
      'Tipo de Pilates: Ambos',
      'Aparelhos utilizados: Reformer, Chair',
      'Movimentos e exigências predominantes: Controle / estabilização do tronco',
      'Duração média da sessão (minutos): 60',
      'Apresenta sintomas ou dificuldade durante a prática? Sim',
      'Movimento ou postura relacionada à queixa: Ponte',
      'Em qual situação aparece? Ao sustentar a posição',
    ],
  )
})

test('ski: questionário próprio; situação e limitação só com sintomas', () => {
  const pratica = praticaDoEsporte('ski')
  ok(pratica.volumeProprio)
  deepEqual(safeRespostas({ temSintomas: 'nao', situacao: 'queda', limitacao: 'dor' }, pratica), { temSintomas: 'nao' })
  deepEqual(
    linhasAvaliacaoPratica(
      {
        respostas: {
          modalidade: 'alpino',
          experiencia: '4a10',
          diasTemporada: '10',
          horasDia: '5',
          terrenos: ['preparada', 'moguls'],
          curva: 'paralelas',
          dificuldades: ['curvasUmLado'],
          preparacao: 'geral',
          equipamento: 'alugado',
          temSintomas: 'sim',
          situacao: 'esquiExterno',
          limitacao: 'Dor no joelho nas curvas à direita',
        },
      },
      'ski',
    ),
    [
      'Modalidade principal: Esqui alpino / pista',
      'Experiência acumulada: 4–10 temporadas',
      'Dias por temporada: 10',
      'Horas por dia: 5',
      'Terrenos habitualmente praticados: Pista preparada, Moguls / bumps',
      'Tipo de curva predominante: Curvas paralelas',
      'Dificuldades específicas: Curvas para um lado',
      'Preparação física habitual: Treinamento físico geral',
      'Equipamento utilizado: Alugado',
      'Apresenta sintomas durante a prática? Sim',
      'Em qual situação? Ao carregar o esqui externo',
      'Principal limitação: Dor no joelho nas curvas à direita',
    ],
  )
})

test('snowboard: questionário próprio; "como ocorreu a queda" só com queda', () => {
  const pratica = praticaDoEsporte('snowboard')
  ok(pratica.volumeProprio)
  deepEqual(safeRespostas({ queda: 'nao', comoQueda: 'punho', situacao: 'heel' }, pratica), { queda: 'nao', situacao: 'heel' })
  deepEqual(
    linhasAvaliacaoPratica(
      {
        respostas: {
          tipoPratica: ['pista', 'park'],
          base: 'goofy',
          switch: 'aprendendo',
          diasTemporada: '10',
          terreno: 'variado',
          borda: 'heel',
          protecao: ['capacete', 'punho'],
          queda: 'sim',
          comoQueda: 'punho',
          situacao: 'aposQueda',
        },
      },
      'snowboard',
    ),
    [
      'Tipo de prática: Pista, Park / freestyle',
      'Base habitual: Goofy — pé direito à frente',
      'Pratica switch? Aprendendo',
      'Dias por temporada: 10',
      'Terreno predominante: Terreno variado',
      'Apresenta maior dificuldade em alguma borda? Heel edge — borda dos calcanhares',
      'Equipamentos de proteção utilizados: Capacete, Protetor de punho',
      'Teve queda com lesão ou sintomas recentes? Sim',
      'Como ocorreu a queda? Apoio sobre a mão / punho',
      'Situação relacionada aos sintomas ou limitação: Após queda',
    ],
  )
})

test('todos os esportes do catálogo têm questionário próprio', () => {
  for (const esporte of ESPORTES) ok(praticaDoEsporte(esporte.key).secoes?.length, `sem questionário: ${esporte.key}`)
})

test('outro: modelo universal (submodalidade, ambiente, demandas, gestos) e sintomas genéricos', () => {
  const pratica = praticaDoEsporte('outro')
  ok(pratica.sintomasGenericos)
  deepEqual(
    resumoEsportes({
      esportes: [
        {
          esporte: 'outro',
          outro: 'Escalada',
          respostas: { submodalidade: 'Boulder', ambiente: 'indoor', demandas: ['forca', 'coordenacao'] },
          sintomas: 'Dor no dedo ao travar',
        },
      ],
    })[0],
    {
      label: 'Escalada',
      linhas: [
        'Submodalidade ou especialidade: Boulder',
        'Ambiente predominante: Indoor / ambiente fechado',
        'Demandas físicas predominantes: Força, Coordenação',
        'Sintomas na prática: Dor no dedo ao travar',
      ],
      problemas: [],
    },
  )
})

test('surf: novo esporte com questionário próprio e problemas frequentes', () => {
  const pratica = praticaDoEsporte('surf')
  ok(pratica.volumeProprio)
  deepEqual(
    resumoEsportes({
      esportes: [
        {
          esporte: 'surf',
          respostas: {
            prancha: 'shortboard',
            base: 'regular',
            ambiente: ['beachBreak'],
            movimentos: ['remada', 'popUp'],
            dificuldadeAgua: 'remada',
            sessoesSemana: '3',
            temSintomas: 'sim',
            gestoSintoma: 'remada',
          },
          problemas: ['ombroRemadaSurf'],
        },
      ],
    })[0],
    {
      label: 'Surf',
      linhas: [
        'Tipo de prancha predominante: Shortboard / pranchinha',
        'Posição habitual na prancha: Regular — pé esquerdo à frente',
        'Ambiente predominante: Beach break',
        'Movimentos realizados frequentemente: Remada, Pop-up',
        'Principal dificuldade na água: Resistência durante a remada',
        'Sessões por semana: 3',
        'Apresenta sintomas ou limitações? Sim',
        'Gesto ou situação associada aos sintomas: Remada',
      ],
      problemas: [{ key: 'ombroRemadaSurf', nome: 'Dor no ombro durante a remada', regiao: 'Ombro' }],
    },
  )
})

test('circo: artes circenses com questionário próprio e sintomas condicionais', () => {
  const pratica = praticaDoEsporte('circo')
  ok(pratica.volumeProprio)
  deepEqual(safeRespostas({ temSintomas: 'nao', movimentoQueixa: 'inversoes', momento: 'apos' }, pratica), { temSintomas: 'nao' })
  deepEqual(
    linhasAvaliacaoPratica(
      {
        respostas: {
          modalidade: 'tecido',
          contexto: ['aulas'],
          movimentos: ['subidas', 'travas'],
          demanda: 'preensao',
          treinosSemana: '3',
          horasSessao: '2',
          temSintomas: 'sim',
          movimentoQueixa: 'suspensoes',
          momento: 'sustentacao',
        },
      },
      'circo',
    ),
    [
      'Modalidade circense principal: Tecido acrobático',
      'Contexto da prática: Aulas regulares',
      'Movimentos e habilidades frequentes: Subidas e escaladas, Travas / enrolamentos',
      'Principal demanda ou dificuldade: Força de preensão / pegada',
      'Treinos por semana: 3',
      'Horas por sessão: 2',
      'Apresenta dor ou dificuldade na prática? Sim',
      'Movimento relacionado à queixa: Suspensões',
      'Momento dos sintomas: Sustentação da posição',
    ],
  )
})
