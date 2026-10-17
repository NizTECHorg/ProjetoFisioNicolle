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

test('avaliação esportiva: descarta opção de outro esporte, frequência inválida e texto vazio', () => {
  deepEqual(
    safeAvaliacaoPratica(
      {
        perfil: 'profissional',
        nivel: 'mestre',
        frequencia: 9,
        anosPratica: '   ',
        volume: '150 km por semana',
        modalidades: ['mtb', 'praia', 'mtb'],
        caracteristicas: ['subidas', 'levantador'],
        sintomasMomentos: ['depois', 'antes'],
      },
      'ciclismo',
    ),
    {
      perfil: 'profissional',
      volume: '150 km por semana',
      modalidades: ['mtb'],
      caracteristicas: ['subidas'],
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
