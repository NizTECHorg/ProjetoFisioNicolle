import { test } from 'node:test'
import { deepEqual, equal, ok, match } from 'node:assert/strict'
import { buildWhatsAppLink } from './landingWhatsapp.ts'
import {
  ABOUT_PARAGRAPHS,
  CREATOR_NAME,
  CREATOR_ROLE,
  INSTAGRAM_URL,
  PLANS,
  PRICE_PLACEHOLDER,
  WHATSAPP_MESSAGE,
  WHATSAPP_NUMBER,
} from '../pages/landing/landing.config.ts'

const MSG = 'Olá! Vim pela página do Fluxo e gostaria de saber mais.'

test('link do WhatsApp com número e mensagem codificada', () => {
  equal(buildWhatsAppLink('5511999990000', MSG), 'https://wa.me/5511999990000?text=' + encodeURIComponent(MSG))
})

test('remove tudo que não é dígito do número', () => {
  equal(buildWhatsAppLink('+55 (11) 99999-0000', 'oi'), 'https://wa.me/5511999990000?text=oi')
})

test('entrada maliciosa não troca host nem injeta parâmetro', () => {
  const link = buildWhatsAppLink('evil.com/x?y=1', 'a&b=c')
  ok(link.startsWith('https://wa.me/'))
  equal(new URL(link).host, 'wa.me')
  ok(link.endsWith('text=a%26b%3Dc'))
})

test('mensagem vazia não gera ?text=', () => {
  equal(buildWhatsAppLink('', ''), 'https://wa.me/')
  equal(buildWhatsAppLink('123', '   '), 'https://wa.me/123')
})

test('config — WhatsApp', () => {
  match(WHATSAPP_NUMBER, /^\d{10,15}$/)
  equal(WHATSAPP_MESSAGE, MSG)
})

test('config — planos', () => {
  deepEqual(PLANS.map((p) => p.id), ['autonomo', 'empresa'])
  for (const p of PLANS) equal(p.price, PRICE_PLACEHOLDER)
  equal(PRICE_PLACEHOLDER, 'R$ —')
  const text = JSON.stringify(PLANS).toLowerCase()
  for (const banned of ['ilimitad', 'grátis', 'gratis', 'teste grátis', '100%']) {
    ok(!text.includes(banned), banned)
  }
})

test('config — sobre o Fluxo', () => {
  equal(CREATOR_NAME, 'Nicolle Bandeira')
  equal(CREATOR_ROLE, 'Fisioterapeuta e idealizadora do Fluxo')
  equal(ABOUT_PARAGRAPHS.length, 2)
  ok(INSTAGRAM_URL === null || INSTAGRAM_URL.startsWith('https://www.instagram.com/'))
})
