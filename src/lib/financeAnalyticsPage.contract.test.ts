import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { equal } from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const pagePath = fileURLToPath(new URL('../pages/AutonomoFinancePage.tsx', import.meta.url))
const accessPath = fileURLToPath(new URL('./accountAccess.ts', import.meta.url))
const bakeryPath = fileURLToPath(new URL('../pages/FinancePage.tsx', import.meta.url))

function sliceFunction(source: string, name: string): string {
  const marker = `function ${name}`
  const start = source.indexOf(marker)
  if (start < 0) throw new Error(`função ausente: ${name}`)
  const next = source.indexOf('\nexport ', start + marker.length)
  const nextFunction = source.indexOf('\nfunction ', start + marker.length)
  const ends = [next, nextFunction].filter((index) => index >= 0)
  const end = ends.length === 0 ? source.length : Math.min(...ends)
  return source.slice(start, end)
}

test('REQ-38: a página troca Totais e Analítica sem rota e sem alargar o erro', () => {
  const source = readFileSync(pagePath, 'utf8')

  for (const token of [
    'Visões dos totais',
    'useFinanceAnalytics',
    'FinanceAnalyticsCharts',
    'Não foi possível carregar a analítica. Tente de novo em instantes.',
    'const isError = pricesError || totalsError',
    'Catálogo de preços',
    'Sessões realizadas',
    'Soma das sessões pagas, inclusive pré-pagas agendadas.',
    'canSeeFinance',
    'Home',
    'End',
  ] as const) {
    equal(source.includes(token), true, `fonte sem ${token}`)
  }

  equal(source.includes('ArrowLeft') || source.includes('ArrowRight'), true)
  equal(source.includes('useSearchParams'), false)
  equal(source.includes('localStorage'), false)
})

test('REQ-38: financeiro continua só para autônomo e a padaria não ganha a aba', () => {
  const access = readFileSync(accessPath, 'utf8')
  const guard = sliceFunction(access, 'canSeeFinance')
  equal(guard.includes("accountType === 'autonomo'"), true)

  const bakery = readFileSync(bakeryPath, 'utf8')
  equal(bakery.includes('Analítica'), false)
  equal(bakery.includes('financeAnalytics'), false)
})
