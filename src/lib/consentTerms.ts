import { formatCpf, isValidCpf, normalizeCpf } from './cpf.ts'

export type TermKey = 'consentimento' | 'liberacao' | 'uso_imagem' | 'uso_imagem_redes' | 'tcle_conduta'

export const TERM_KEYS: readonly TermKey[] = [
  'consentimento',
  'liberacao',
  'uso_imagem',
  'uso_imagem_redes',
  'tcle_conduta',
]

export type ConsentTerm = {
  key: TermKey
  category: string
  title: string
  subtitle: string
  template: string
}

export const BLANK = '_______________'

const HEAD = 'Eu, {{declarante}}, CPF {{cpfDeclarante}}{{vinculo}}, '

/**
 * Linha do campo clínico do TCLE. Mais curta que BLANK de propósito: o fisio preenche em "Editar"
 * se quiser, mas campo vazio não bloqueia o salvamento (BLANK bloqueia).
 */
export const CAMPO_CLINICO = '__________'
const campo = (rotulo: string) => `\n\n${rotulo}: ${CAMPO_CLINICO}`

export const CONSENT_TERMS: readonly ConsentTerm[] = [
  {
    key: 'consentimento',
    category: 'Consentimento',
    title: 'Termo de Consentimento para Atendimento Fisioterapêutico',
    subtitle: 'Autorização do paciente para realização de procedimentos fisioterapêuticos.',
    template:
      HEAD +
      'declaro que fui informado(a) sobre os procedimentos fisioterapêuticos que serão realizados, incluindo seus benefícios, riscos e alternativas de tratamento. Autorizo o(a) fisioterapeuta {{fisio}}, CREFITO {{crefito}}, a realizar o tratamento proposto. Estou ciente de que posso revogar este consentimento a qualquer momento.',
  },
  {
    key: 'liberacao',
    category: 'Liberação',
    title: 'Termo de Liberação para Tratamento',
    subtitle: 'Liberação do paciente para participação ativa no programa de reabilitação.',
    template:
      HEAD +
      'declaro que fui orientado(a) quanto à importância da minha participação ativa no tratamento, incluindo a realização de exercícios domiciliares prescritos pelo(a) fisioterapeuta {{fisio}}, CREFITO {{crefito}}. Comprometo-me a seguir as orientações e comunicar qualquer alteração no meu quadro clínico.',
  },
  {
    key: 'uso_imagem',
    category: 'Uso de Imagem',
    title: 'Termo de Uso de Imagem',
    subtitle: 'Autorização para registro fotográfico e/ou em vídeo para fins de acompanhamento clínico.',
    template:
      HEAD +
      'autorizo o(a) fisioterapeuta {{fisio}}, CREFITO {{crefito}}, a realizar o registro de imagens (fotos e/ou vídeos) durante as sessões de fisioterapia e a guardar no meu prontuário as imagens dos meus exames (como radiografias, tomografias, ressonâncias, ultrassons e laudos), para fins exclusivos de acompanhamento clínico e evolução do tratamento. As imagens não serão utilizadas para outros fins sem minha autorização prévia por escrito. Estou ciente de que posso revogar esta autorização a qualquer momento, sem nenhum ônus ou prejuízo ao meu tratamento.',
  },
  {
    key: 'uso_imagem_redes',
    category: 'Uso de Imagem em Redes Sociais',
    title: 'Termo de Autorização de Uso de Imagem em Redes Sociais',
    subtitle: 'Autorização para divulgação de imagens em redes sociais e materiais do(a) fisioterapeuta.',
    template:
      HEAD +
      'autorizo o(a) fisioterapeuta {{fisio}}, CREFITO {{crefito}}, a utilizar fotos e/ou vídeos registrados durante as sessões de fisioterapia em suas redes sociais e materiais de divulgação profissional, de forma gratuita, com finalidade educativa e informativa, sem expor meu nome completo ou dados clínicos que me identifiquem sem meu consentimento. Declaro estar ciente de que esta autorização é opcional, não interfere no meu tratamento e pode ser revogada a qualquer momento mediante solicitação, sem prejuízo das publicações já realizadas até a data da revogação.',
  },
  {
    key: 'tcle_conduta',
    category: 'TCLE · Conduta',
    title: 'Termo de Consentimento Livre e Esclarecido (TCLE) — Conduta Fisioterapêutica',
    subtitle:
      'Tratamento proposto, riscos, benefícios e possíveis efeitos colaterais. Use Editar para preencher os campos clínicos.',
    template:
      HEAD +
      'declaro, em pleno gozo de minhas faculdades mentais, que fui previamente informado(a) pelo(a) fisioterapeuta {{fisio}}, CREFITO {{crefito}}, de forma clara, sobre o meu estado de saúde funcional. Declaro também que recebi todos os esclarecimentos necessários sobre o tratamento fisioterapêutico, sua finalidade, seus riscos e benefícios, bem como sobre os efeitos colaterais e outras intercorrências que podem ocorrer, conforme descrito abaixo:' +
      campo('Diagnóstico e prognóstico fisioterapêutico') +
      campo('Procedimentos (método, técnica ou recurso)') +
      campo('Segmento(s) ou área(s) do corpo a tratar') +
      campo('Objetivos do tratamento') +
      campo('Possíveis efeitos colaterais') +
      campo('Modalidade de atendimento (individual, grupo ou teleatendimento)') +
      campo('Frequência de atendimento') +
      '\n\nInformações complementares: nenhuma.' +
      '\n\nPor fim, declaro que as informações acima são suficientes para a compreensão do tratamento fisioterapêutico e concordo em me submeter ao tratamento proposto.' +
      '\n\nTermo elaborado em cumprimento ao art. 10, inciso II, alínea "d", e ao art. 14, inciso V, da Resolução COFFITO nº 424/2013.',
  },
]

export function getConsentTerm(key: TermKey): ConsentTerm {
  const t = CONSENT_TERMS.find((x) => x.key === key)
  if (!t) throw new Error(`Termo desconhecido: ${key}`)
  return t
}

export type TermGuardian = { name: string; cpf: string }

export type TermValues = {
  patientName: string
  patientCpf: string
  therapistName: string
  crefito: string
  guardian: TermGuardian | null
}

export function declarantOf(v: TermValues): { name: string; cpf: string } {
  return v.guardian
    ? { name: v.guardian.name.trim(), cpf: v.guardian.cpf }
    : { name: v.patientName.trim(), cpf: v.patientCpf }
}

export function fillTerm(template: string, v: TermValues): string {
  const d = declarantOf(v)
  const cpfDigits = normalizeCpf(d.cpf)
  const map: Record<string, string> = {
    '{{declarante}}': d.name || BLANK,
    '{{cpfDeclarante}}': cpfDigits.length === 11 ? formatCpf(cpfDigits) : BLANK,
    '{{vinculo}}': v.guardian ? `, responsável legal por ${v.patientName.trim() || BLANK}` : '',
    '{{fisio}}': v.therapistName.trim() || BLANK,
    '{{crefito}}': v.crefito.trim() || BLANK,
  }
  let out = template
  for (const [token, value] of Object.entries(map)) out = out.replaceAll(token, value)
  return out
}

export type SaveReadiness = {
  hasPatient: boolean
  signatureOk: boolean
  values: TermValues
  text: string
}

export function termMissingForSave(r: SaveReadiness): string[] {
  const d = declarantOf(r.values)
  const missing: string[] = []
  if (!r.hasPatient) missing.push('paciente')
  if (!r.signatureOk) missing.push('assinatura')
  if (!d.name) missing.push('nome de quem assina')
  if (!isValidCpf(d.cpf)) missing.push('CPF válido')
  if (!r.values.therapistName.trim()) missing.push('nome do fisioterapeuta')
  if (!r.values.crefito.trim()) missing.push('CREFITO')
  if (missing.length === 0 && r.text.includes(BLANK)) missing.push('campos em branco no texto')
  return missing
}

export function formatMissing(items: string[]): string {
  return items.length ? `Para salvar, falta: ${items.join(', ')}.` : ''
}

export function buildTermFileName(key: TermKey, patientName: string, date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  const type = key.replace(/_/g, '-')
  const prefix = `termo-${type}-`
  const suffix = `-${day}.pdf`
  let slug = patientName
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (!slug) slug = 'paciente'
  const room = Math.max(1, 80 - prefix.length - suffix.length)
  slug = slug.slice(0, room).replace(/-+$/g, '') || 'paciente'
  return `${prefix}${slug}${suffix}`
}
