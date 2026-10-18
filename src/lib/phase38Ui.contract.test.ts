import { test } from 'node:test'
import { ok } from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')

test('REQ-49: rota /testes-especiais usa SpecialTestsPage via lazy', () => {
  const routes = read('../routes/index.tsx')
  ok(routes.includes("import('@/pages/SpecialTestsPage')"))
  ok(routes.includes('path="/testes-especiais" element={<SpecialTestsPage />}'))
  ok(!routes.includes('<UnderConstructionPage />'))
})

test('REQ-49: copy da página', () => {
  const page = read('../pages/SpecialTestsPage.tsx')
  for (const needle of [
    'Testes Especiais Ortopédicos',
    'Selecione a região anatômica para ver os testes específicos',
    'Buscar teste...',
    'Limpar busca',
    'Fechar detalhes',
    'Nenhum teste encontrado.',
    'Em breve',
    'ainda estão sendo preparados.',
  ]) {
    ok(page.includes(needle), `faltando: ${needle}`)
  }
})

test('REQ-49: layout responsivo', () => {
  const page = read('../pages/SpecialTestsPage.tsx')
  for (const needle of [
    'useIsDesktop()',
    'useIsTabletUp()',
    '<Modal',
    '<SpecialTestPanel',
    '<SpecialTestsNav',
  ]) {
    ok(page.includes(needle), `faltando: ${needle}`)
  }
  const media = read('../hooks/useMediaQuery.ts')
  ok(media.includes('(min-width: 1280px)'))
  ok(media.includes('(min-width: 768px)'))
})

test('REQ-49: parâmetros de URL são validados', () => {
  const page = read('../pages/SpecialTestsPage.tsx')
  ok(page.includes('isRegionId('))
  ok(page.includes('findSpecialTest('))
  ok(!page.includes('[params.get('))
})

test('REQ-49: ordem das regiões e dos testes', () => {
  const data = read('./testesEspeciais.ts')
  for (const list of [
    ['Coluna', 'Ombro', 'Cotovelo', 'Joelho', 'Quadril', 'Tornozelo', 'Mão', 'Fraturas'],
    [
      'Teste de Lasègue (Elevação da Perna Reta)',
      'Teste de Lasègue Cruzado (Contralateral)',
      'Teste de Slump',
      'Teste de Spurling',
      'Teste de Valsalva',
      'Teste de Schober',
    ],
  ]) {
    const idx = list.map((n) => data.indexOf(`'${n}'`) >= 0 ? data.indexOf(`'${n}'`) : data.indexOf(n))
    ok(idx.every((i) => i >= 0), `ausente: ${list.join(',')}`)
    ok(idx.every((v, i) => i === 0 || (idx[i - 1] ?? 0) < v), `ordem: ${list[0]}`)
  }
})

test('REQ-49: higiene dos arquivos da fase', () => {
  for (const f of [
    '../pages/SpecialTestsPage.tsx',
    './testesEspeciais.ts',
    '../hooks/useMediaQuery.ts',
    '../components/special-tests/SpecialTestCard.tsx',
    '../components/special-tests/SpecialTestDetail.tsx',
    '../components/special-tests/SpecialTestsNav.tsx',
    '../components/special-tests/specialTestDom.ts',
  ]) {
    const src = read(f)
    ok(!src.includes('dangerouslySetInnerHTML'), f)
    ok(!src.includes('console.'), f)
  }
})
