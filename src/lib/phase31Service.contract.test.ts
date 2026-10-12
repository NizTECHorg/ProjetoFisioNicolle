import { test } from 'node:test'
import { equal, ok } from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const service = readFileSync(
  new URL('../services/accountDeletion.service.ts', import.meta.url),
  'utf8',
)

test('service chama a Edge Function delete-account com confirm e password', () => {
  ok(service.includes("functions.invoke('delete-account'"))
  ok(service.includes('confirm: ACCOUNT_DELETE_WORD') || service.includes("confirm: 'EXCLUIR'"))
})

test('corpo do invoke não carrega id de usuário', () => {
  const m = service.match(/body:\s*\{([^}]*)\}/)
  ok(m, 'body encontrado')
  const body = m[1] ?? ''
  ok(!/userId|user_id|\bid:/.test(body))
})

test('rate limit local vem antes do invoke', () => {
  const rl = service.indexOf("checkRateLimit('account:delete:'")
  const inv = service.indexOf("functions.invoke('delete-account'")
  ok(rl >= 0 && inv >= 0 && rl < inv)
})

test('erros usam copy fixa, nunca error.message cru', () => {
  ok(service.includes('accountDeletionErrorMessage'))
  ok(!/throw new Error\([^)]*error\.message/.test(service))
})

test('signOut local e sem toast', () => {
  ok(service.includes("signOut({ scope: 'local' })"))
  ok(!service.includes('toast('))
})

test('countAccountDeletionPatients usa count exact e head', () => {
  ok(service.includes("from('patients')"))
  ok(service.includes("count: 'exact'"))
  ok(service.includes('head: true'))
})

test('src/ não referencia SERVICE_ROLE nem delete_account_data fora de testes', () => {
  const root = fileURLToPath(new URL('..', import.meta.url))
  const files = (readdirSync(root, { recursive: true }) as string[]).filter(
    (f) => /\.tsx?$/.test(f) && !f.endsWith('.test.ts'),
  )
  ok(files.length > 0)
  for (const f of files) {
    const text = readFileSync(join(root, f), 'utf8')
    equal(text.includes('SERVICE_ROLE'), false, `${f} cita SERVICE_ROLE`)
    equal(text.includes('delete_account_data'), false, `${f} cita delete_account_data`)
  }
})
