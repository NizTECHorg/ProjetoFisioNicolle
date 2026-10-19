import { test } from 'node:test'
import { ok } from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')
const HEADER = '../pages/landing/LandingHeader.tsx'
const HERO = '../pages/landing/HeroSection.tsx'
const PRODUCT = '../pages/landing/ProductSection.tsx'
const MOCKUPS_DIR = '../pages/landing/mockups/'

const has = (src: string, needle: string) => ok(src.includes(needle), `deveria conter: ${needle}`)
const lacks = (src: string, needle: string) => ok(!src.includes(needle), `não deveria conter: ${needle}`)

test('REQ-47: header', () => {
  const src = read(HEADER)
  for (const s of [
    'aria-expanded',
    'aria-controls="lp-mobile-menu"',
    "'Escape'",
    "'#produto'",
    "'#sobre'",
    "'#para-quem'",
    "'#planos'",
    "'#faq'",
    'to="/login"',
    'to="/cadastro"',
    'Começar agora',
    'Entrar',
  ])
    has(src, s)
  for (const s of ['@/services', '@/stores', '@/components/layout']) lacks(src, s)
})

test('REQ-47: hero', () => {
  const src = read(HERO)
  for (const s of [
    'id="inicio"',
    '<h1',
    'movimento',
    'Cuidado em',
    'prontuário em ordem.',
    'to="/cadastro"',
    'to="/login"',
    'WhatsAppLink',
    'Dados protegidos',
    'Funciona no celular',
    'IA só com o que você escreveu',
    '<HeroDevices />',
  ])
    has(src, s)
  lacks(src, 'homi.png')
  // Computador atrás e celular na frente; capturas trocáveis no config
  const devices = read(HERO.replace('HeroSection.tsx', 'HeroDevices.tsx'))
  for (const s of [
    'HERO_DESKTOP_IMAGE',
    'HERO_MOBILE_IMAGE',
    'fetchPriority="high"',
    'homi-lp.webp',
    'aria-hidden="true"',
    'useParallax',
  ])
    has(devices, s)
  lacks(devices, 'homi.png')
})

test('REQ-47: produto', () => {
  const src = read(PRODUCT)
  for (const s of [
    'id="produto"',
    'Avaliação com mapa corporal',
    'Sessões e evolução',
    'Resumo e avaliação com IA',
    'Agenda e PDF',
    'A IA usa apenas o que está escrito no prontuário',
    '<LiveCards />',
  ])
    has(src, s)
  // Cartões animados com o "antes" e a solução
  const cards = read(PRODUCT.replace('ProductSection.tsx', 'LiveCards.tsx'))
  for (const s of [
    'Prontuário completo',
    'Agenda do dia',
    'Financeiro e analítica',
    'Equipe',
    'PDF para o paciente',
    'Metas do tratamento',
    'aria-hidden="true"',
  ])
    has(cards, s)
  lacks(cards, 'sem conflito')
  lacks(src, 'sem conflito')

  const dir = fileURLToPath(new URL(MOCKUPS_DIR, import.meta.url))
  const files = readdirSync(dir).filter((f) => f.endsWith('.tsx'))
  ok(files.length === 5, 'devem existir 5 mockups')
  for (const f of files) {
    const m = read(MOCKUPS_DIR + f)
    has(m, 'aria-hidden="true"')
    lacks(m, 'homi.png')
    lacks(m, 'muir.png')
    lacks(m, '@/services')
  }
})
