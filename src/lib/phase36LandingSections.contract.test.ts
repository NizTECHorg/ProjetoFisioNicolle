import { test } from 'node:test'
import { ok } from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')
const DIR = '../pages/landing/'
const has = (src: string, needle: string) => ok(src.includes(needle), `deveria conter: ${needle}`)
const lacks = (src: string, needle: string) => ok(!src.includes(needle), `não deveria conter: ${needle}`)

test('REQ-47: sobre o Fluxo', () => {
  const src = read(`${DIR}CreatorSection.tsx`)
  for (const s of [
    'id="sobre"',
    'Sobre o Fluxo',
    'A prática clínica inspira.',
    'A tecnologia transforma.',
    'CREATOR_NAME',
    'CREATOR_ROLE',
    'Conheça o Fluxo',
    'Integração entre profissionais',
    'lp-blob-shape',
  ])
    has(src, s)
})

test('REQ-47: sem a abreviação "fisio" nos textos da landing', () => {
  for (const f of readdirSync(fileURLToPath(new URL(DIR, import.meta.url)))) {
    if (!f.endsWith('.ts') && !f.endsWith('.tsx')) continue
    const src = read(`${DIR}${f}`)
    ok(!/\bf[ií]sios?\b/i.test(src), `${f} usa "fisio"`)
  }
})

test('REQ-47: relatórios para médicos e convênios e equipe multidisciplinar', () => {
  const product = read(`${DIR}ProductSection.tsx`)
  for (const s of ['Relatórios e integração com a equipe', 'médicos', 'convênios', 'equipe multidisciplinar', '<ReportsMockup />'])
    has(product, s)
})

test('REQ-47: para quem', () => {
  const src = read(`${DIR}AudienceSection.tsx`)
  for (const s of [
    'id="para-quem"',
    'Autônomos',
    'Empresas e clínicas',
    'Registro de alterações: o que mudou, quando e quem',
    'Cada fisioterapeuta cuida dos próprios pacientes',
    'href="#planos"',
  ])
    has(src, s)
})

test('REQ-47: planos', () => {
  const src = read(`${DIR}PlansSection.tsx`)
  for (const s of [
    'id="planos"',
    'PLANS.map',
    'PRICE_SUFFIX',
    'PRICE_NOTE',
    'to="/cadastro"',
    'Dúvidas sobre valores?',
    'WhatsAppLink',
  ])
    has(src, s)
  lacks(src, 'R$')
  for (const s of ['ilimitad', 'grátis', 'mais popular']) lacks(src.toLowerCase(), s)
})

test('REQ-47: faq', () => {
  const src = read(`${DIR}FaqSection.tsx`)
  for (const s of [
    'id="faq"',
    'aria-expanded',
    'aria-controls',
    'role="region"',
    'lp-faq-panel',
    'Meus dados e os dos pacientes estão seguros?',
    'Funciona no celular?',
    'A IA pode inventar informações?',
    'Como funciona para equipes?',
    'Posso exportar em PDF?',
    'Quanto custa? Existe período de teste?',
    'Como peço ajuda ou suporte?',
    'Preciso ser empresa para usar?',
    'Consigo compartilhar com médicos, convênios e a equipe?',
  ])
    has(src, s)
  ok((src.match(/^\s+q: '/gm) ?? []).length === 9, 'deveria ter 9 perguntas')
})

test('REQ-47: footer e fab', () => {
  const footer = read(`${DIR}LandingFooter.tsx`)
  for (const s of [
    '<footer',
    'Pronto para organizar',
    'sua prática</em>?',
    'getFullYear()',
    'Todos os direitos reservados.',
    'to="/login"',
    'to="/cadastro"',
    'onDark',
  ])
    has(footer, s)
  for (const s of ['Termos', 'Privacidade']) lacks(footer, s)
  const fab = read(`${DIR}WhatsAppFab.tsx`)
  for (const s of ['md:hidden', 'Falar no WhatsApp', 'safe-area-inset-bottom', 'WhatsAppLink'])
    has(fab, s)
})

test('REQ-47: landing sem links externos nem imports do app', () => {
  const root = fileURLToPath(new URL(DIR, import.meta.url))
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const full = join(dir, name)
      return statSync(full).isDirectory() ? walk(full) : full.endsWith('.tsx') ? [full] : []
    })
  const files = walk(root)
  ok(files.length > 0)
  for (const f of files) {
    const src = readFileSync(f, 'utf8')
    for (const s of ['href="http', "href={'http"]) lacks(src, s)
    for (const s of ['@/services', '@/stores', '@/components/layout']) lacks(src, s)
  }
})
