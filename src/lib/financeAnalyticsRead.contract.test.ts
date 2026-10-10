import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { equal } from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const servicePath = fileURLToPath(new URL('../services/finance.service.ts', import.meta.url))
const hookPath = fileURLToPath(new URL('../hooks/useFinance.ts', import.meta.url))

function sliceExport(source: string, name: string): string {
  const marker = `function ${name}`
  const start = source.indexOf(marker)
  if (start < 0) throw new Error(`função ausente: ${name}`)
  const next = source.indexOf('\nexport ', start + marker.length)
  return source.slice(start, next < 0 ? source.length : next)
}

test('REQ-38: leitura da analítica pede cobrança paga com scheduled_at e pagina', () => {
  const service = readFileSync(servicePath, 'utf8')
  const body = sliceExport(service, 'listFinancePaidForAnalytics')

  for (const token of ['is_paid', 'scheduled_at', 'patient_sessions', '.range(', "order('id'"] as const) {
    equal(body.includes(token), true, `corpo sem ${token}`)
  }

  for (const banned of ['full_name', 'realizada', 'status'] as const) {
    equal(body.includes(banned), false, `corpo contém ${banned}`)
  }

  const realizadas = sliceExport(service, 'listFinanceRealizadas')
  equal(realizadas.includes(".eq('status', 'realizada')"), true)
})

test('REQ-38: useFinanceAnalytics fica no prefixo finance sem exact', () => {
  const hook = readFileSync(hookPath, 'utf8')
  const body = sliceExport(hook, 'useFinanceAnalytics')

  equal(body.includes("['finance', 'analytics', userId]"), true)
  equal(body.includes('queryFn: listFinancePaidForAnalytics'), true)
  equal(body.includes('enabled: signedIn'), true)
  equal(body.includes('staleTime: 60_000'), true)
  equal(hook.includes('exact: true'), false)
})
