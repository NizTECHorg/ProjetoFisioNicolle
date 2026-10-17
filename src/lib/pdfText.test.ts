import { test } from 'node:test'
import { deepEqual, equal, ok } from 'node:assert/strict'
import { toWinAnsiSafe, wrapLines } from './pdfText.ts'

const font = { widthOfTextAtSize: (t: string, s: number) => t.length * s * 0.5 }

test('toWinAnsiSafe troca aspas/travessão/reticências', () => {
  equal(toWinAnsiSafe('“Olá” — teste…'), '"Olá" - teste...')
})

test('toWinAnsiSafe mantém acentos e troca emoji', () => {
  equal(toWinAnsiSafe('ação ç é ã õ'), 'ação ç é ã õ')
  equal(toWinAnsiSafe('ok 😀'), 'ok ??')
})

test('wrapLines quebra por largura', () => {
  const max = 10 // cabem 10 caracteres em size 2
  const lines = wrapLines(font, 'aaa bbb ccc ddd', 2, max)
  ok(lines.length > 1)
  for (const l of lines) ok(font.widthOfTextAtSize(l, 2) <= max)
  equal(lines.join(' '), 'aaa bbb ccc ddd')
})

test('wrapLines preserva quebras e trata palavra longa', () => {
  ok(wrapLines(font, 'a\nb', 2, 10).length >= 2)
  const lines = wrapLines(font, 'xxxxxxxxxxxxxxxxxxxxxxxx', 2, 10)
  ok(lines.length >= 2)
  for (const l of lines) ok(font.widthOfTextAtSize(l, 2) <= 10)
  deepEqual(wrapLines(font, '', 2, 10), ['-'])
})
