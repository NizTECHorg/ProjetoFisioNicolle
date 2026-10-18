import { test } from 'node:test'
import { ok } from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')

test('REQ-49: cartão e detalhe seguem o contrato de texto e acessibilidade', () => {
  const card = read('../components/special-tests/SpecialTestCard.tsx')
  const detail = read('../components/special-tests/SpecialTestDetail.tsx')
  const both = card + detail
  for (const needle of [
    'Ver detalhes',
    'Ver detalhes de ${test.name}',
    "aria-current={selected ? 'true' : undefined}",
    'text-[#1e3a8a]',
    'min-h-11',
    'Objetivo',
    'Técnica de Execução',
    'Interpretação',
    'Voltar à navegação',
    'aria-label="Fechar detalhes"',
    "e.key === 'Escape'",
    'tabIndex={-1}',
  ]) {
    ok(both.includes(needle), `faltando: ${needle}`)
  }
  const a = detail.indexOf('Objetivo')
  const b = detail.indexOf('Técnica de Execução')
  const c = detail.indexOf('Interpretação')
  ok(a < b && b < c)
  ok(!both.includes('dangerouslySetInnerHTML'))
  ok(!both.includes('console.'))
})

test('REQ-49: navegação dos testes segue o contrato', () => {
  const nav = read('../components/special-tests/SpecialTestsNav.tsx')
  for (const needle of [
    'aria-label="Navegação dos testes"',
    'Regiões e testes',
    'aria-expanded={open}',
    "aria-current={current ? 'true' : undefined}",
    'Em breve',
    'rotate-180',
    'motion-reduce:transition-none',
    'min-h-10',
    'max-h-[calc(100dvh-8rem)]',
    'onSelectRegion(region.id)',
  ]) {
    ok(nav.includes(needle), `faltando: ${needle}`)
  }
  ok(!nav.includes('console.'))
  ok(!nav.includes('dangerouslySetInnerHTML'))
})
