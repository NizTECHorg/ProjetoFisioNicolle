import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { equal } from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const chartPath = fileURLToPath(new URL('../components/finance/FinanceAnalyticsCharts.tsx', import.meta.url))

function sliceFunction(source: string, name: string): string {
  const marker = `function ${name}`
  const start = source.indexOf(marker)
  if (start < 0) throw new Error(`função ausente: ${name}`)
  const nextFunction = source.indexOf('\nfunction ', start + marker.length)
  const nextExport = source.indexOf('\nexport ', start + marker.length)
  const ends = [nextFunction, nextExport].filter((index) => index >= 0)
  const end = ends.length === 0 ? source.length : Math.min(...ends)
  return source.slice(start, end)
}

test('REQ-38: fonte do SVG traz cópia, fills e papéis sem animar', () => {
  const source = readFileSync(chartPath, 'utf8')

  for (const token of [
    'Ainda não há pagamentos para analisar.',
    'Por mês',
    'Contra o mês anterior',
    'formatCurrency',
    ' · ',
    'fill="#2f7dff"',
    'fill="#0b1d36"',
    'stroke="#e1e8f0"',
    'role="button"',
    'aria-pressed',
    'role="img"',
    'buildFinanceAnalytics',
    'toggleSelectedMonth',
  ] as const) {
    equal(source.includes(token), true, `fonte sem ${token}`)
  }

  for (const banned of [
    'dash-line',
    'transition-all',
    'dash-in',
    'lucide-react',
    'recharts',
    'dangerouslySetInnerHTML',
    'full_name',
    'font-medium',
  ] as const) {
    equal(source.includes(banned), false, `fonte contém ${banned}`)
  }
})

test('REQ-38: por preço lista o nome e não troca o mês', () => {
  const source = readFileSync(chartPath, 'utf8')
  equal(source.includes('Por preço'), true)
  equal(source.includes('Nenhum pagamento neste mês.'), true)
  const price = sliceFunction(source, 'PriceBars')
  equal(price.includes('role="img"'), true)
  equal(price.includes('onSelectMonth'), false)
})
