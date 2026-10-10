import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { equal } from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const chartPath = fileURLToPath(new URL('../components/finance/FinanceAnalyticsCharts.tsx', import.meta.url))

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
