// Phase 50: contrato puro do Relatório do paciente (sem alias, roda em node --test).
import { wrapLines, type TextMeasurer } from './pdfText.ts'
import { situacaoEvolucao } from './evolucaoStatus.ts'
import type { PatientSessionRecord } from '../types/patient.ts'

export const RELATORIO_TITULO = 'Relatório fisioterapêutico'
export const RELATORIO_LINHAS_MAX = 15
export const RELATORIO_FONT_SIZE = 12
export const RELATORIO_LEADING = 18
export const RELATORIO_MARGIN = 48
export const RELATORIO_PAGE_WIDTH = 595.28
export const RELATORIO_CONTENT_WIDTH = RELATORIO_PAGE_WIDTH - RELATORIO_MARGIN * 2
export const RELATORIO_MAX_SESSOES = 12
export const RELATORIO_CONTEUDO_MAX_CHARS = 3000
export const RELATORIO_MODELO_ROTULO = 'Feito pelo modelo'

const NOME_EM_BRANCO = '_____________________________________'

/** Texto do modelo. "Sem mais para o momento.", Local, Data e assinatura quem desenha é o PDF. */
export function textoModeloRelatorio(paciente: string): string {
  return [
    `Informo que ${paciente.trim() || NOME_EM_BRANCO}, foi admitido(a) para atendimento fisioterapêutico em (data de início do tratamento), apresentando as seguintes queixas: (Relatar os sintomas).`,
    'De acordo com o quadro, observou-se (descrição da área afetada e dos exames realizados). O exame físico apresentou: (relato das alterações na ADM, força muscular, escala de dor)',
    'Apresenta como diagnóstico funcional: (Exposição das limitações de ADM, comprometimento muscular e outros comprometimentos que prejudiquem sua funcionalidade)',
    'Os objetivos e plano de tratamento propostos foram: (Descrever cada um dos objetivos e etapas do plano de tratamento)',
    'Evoluiu (Relatar a evolução do paciente, a continuação ou não dos atendimentos e, se necessário, possíveis encaminhamentos a outros profissionais)',
  ].join('\n\n')
}

/** Preserva \n; remove controles (exceto \n e \t); no máximo uma linha em branco seguida. */
export function normalizarTextoRelatorio(texto: string): string {
  return texto
    .replace(/\r\n?/g, '\n')
    .replace(/[\p{Cc}]/gu, (c) => (c === '\n' || c === '\t' ? c : ''))
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((l) => l.replace(/[ \t]+$/, ''))
    .join('\n')
    .trim()
}

/** Única porta para quebrar o texto: o PDF desenha exatamente estas linhas. */
export function linhasRelatorio(medidor: TextMeasurer, texto: string): string[] {
  const norm = normalizarTextoRelatorio(texto)
  if (!norm) return []
  return wrapLines(medidor, norm, RELATORIO_FONT_SIZE, RELATORIO_CONTENT_WIDTH)
}

export function contarLinhasRelatorio(medidor: TextMeasurer, texto: string): number {
  return linhasRelatorio(medidor, texto).length
}

export function ajustarAoLimite(
  medidor: TextMeasurer,
  texto: string,
): { texto: string; reduzido: boolean } {
  const norm = normalizarTextoRelatorio(texto)
  const cabe = (t: string) => contarLinhasRelatorio(medidor, t) <= RELATORIO_LINHAS_MAX
  if (cabe(norm)) return { texto: norm, reduzido: false }

  const tentar = (cortes: number[]): string | null => {
    for (let i = cortes.length - 1; i >= 0; i--) {
      const prefixo = norm.slice(0, cortes[i]).trim()
      if (prefixo && cabe(prefixo)) return prefixo
    }
    return null
  }

  const fimsFrase: number[] = []
  for (const m of norm.matchAll(/[.!?](?=\s|$)/g)) fimsFrase.push(m.index + 1)
  const porFrase = tentar(fimsFrase)
  if (porFrase) return { texto: porFrase, reduzido: true }

  const fimsPalavra: number[] = []
  for (const m of norm.matchAll(/\S+/g)) fimsPalavra.push(m.index + m[0].length)
  const porPalavra = tentar(fimsPalavra)
  return { texto: porPalavra ?? '', reduzido: true }
}

type EvolucaoCampos = NonNullable<PatientSessionRecord['evolution']>

function camposEvolucao(ev: EvolucaoCampos): string[] {
  return [
    ev.patientState,
    ev.changesSinceLast,
    ev.conducts,
    ev.treatmentResponse,
    ev.sideEffects,
    ev.incidents,
    ev.nextPlan,
  ]
    .map((v) => (v ?? '').trim())
    .filter((v) => v.length > 0)
}

export function sessaoSelecionavelRelatorio(
  session: Pick<PatientSessionRecord, 'status' | 'evolution'>,
): { selecionavel: boolean; rascunho: boolean } {
  const situacao = situacaoEvolucao(session)
  if ((situacao !== 'finalizada' && situacao !== 'rascunho') || !session.evolution) {
    return { selecionavel: false, rascunho: false }
  }
  if (camposEvolucao(session.evolution).length === 0) {
    return { selecionavel: false, rascunho: false }
  }
  return { selecionavel: true, rascunho: situacao === 'rascunho' }
}

export function rotuloSessoesRelatorio(
  sessions: Pick<PatientSessionRecord, 'scheduledAt' | 'dateLabel'>[],
): string {
  const count = sessions.length
  const countLabel = count === 1 ? '1 sessão' : `${count} sessões`
  if (count === 0) return countLabel
  const sorted = [...sessions].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
  const first = sorted[0]?.dateLabel
  const last = sorted[sorted.length - 1]?.dateLabel
  if (first && last && first !== last) return `${countLabel} · ${first}–${last}`
  if (first) return `${countLabel} · ${first}`
  return countLabel
}

export function textosFonteRelatorio(
  sessions: Pick<PatientSessionRecord, 'dateLabel' | 'evolution'>[],
): string[] {
  const out: string[] = []
  for (const s of sessions) {
    out.push(s.dateLabel)
    if (s.evolution) out.push(...camposEvolucao(s.evolution))
  }
  return out
}

const NUMERO_RE = /\d+(?:[.,]\d+)?/g

export function numerosNaoConfirmados(texto: string, fontes: readonly string[]): string[] {
  const conhecidos = new Set<string>()
  for (const f of fontes) {
    for (const m of f.matchAll(NUMERO_RE)) conhecidos.add(m[0].replace(',', '.'))
  }
  const achados: string[] = []
  for (const m of texto.matchAll(NUMERO_RE)) {
    if (!conhecidos.has(m[0].replace(',', '.')) && !achados.includes(m[0])) achados.push(m[0])
  }
  return achados
}

export function dataPorExtenso(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}
