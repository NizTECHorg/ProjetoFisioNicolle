import { test } from 'node:test'
import { deepEqual, equal } from 'node:assert/strict'
import { hexParaRgb01, normalizarCor, paletaDaCor, tamanhoLogo } from './pdfBrand.ts'

test('normalizarCor aceita #rgb, #rrggbb e sem #, e recusa o resto', () => {
  equal(normalizarCor('#ABC'), '#aabbcc')
  equal(normalizarCor('1e3a8a'), '#1e3a8a')
  equal(normalizarCor(' #1E3A8A '), '#1e3a8a')
  equal(normalizarCor('azul'), null)
  equal(normalizarCor(''), null)
})

test('paleta: destaque é a cor, fundo claro e tons escuros derivados', () => {
  deepEqual(hexParaRgb01('#ff0000'), [1, 0, 0])
  const p = paletaDaCor('#ff0000')
  deepEqual(p.accent, [1, 0, 0])
  equal(Math.round(p.accentSoft[1] * 100) / 100, 0.88)
  equal(Math.round(p.navy[0] * 100) / 100, 0.55)
  equal(Math.round(p.forest[0] * 100) / 100, 0.3)
})

test('tamanhoLogo respeita altura e largura máximas sem distorcer', () => {
  deepEqual(tamanhoLogo(100, 50, 32, 200), { width: 64, height: 32 })
  deepEqual(tamanhoLogo(1000, 100, 32, 180), { width: 180, height: 18 })
  deepEqual(tamanhoLogo(0, 10, 32, 180), { width: 0, height: 0 })
})
