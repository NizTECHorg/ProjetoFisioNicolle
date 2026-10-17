import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8')

test('REQ-48: auth.service expoe crefito e updateOwnCrefito sem auth.updateUser', () => {
  const s = read('src/services/auth.service.ts')
  assert.match(s, /account_type, crefito,/)
  assert.ok(s.includes('export async function updateOwnCrefito'))
  const start = s.indexOf('export async function updateOwnCrefito')
  const next = s.indexOf('export async function', start + 10)
  assert.ok(!s.slice(start, next).includes('auth.updateUser'))
})

test('REQ-48: schema com crefito opcional max 40 sem min', () => {
  const s = read('src/schemas/auth.schema.ts')
  assert.ok(s.includes('crefito: z.string().trim().max(40'))
  const line = s.split('\n').find((l) => l.includes('crefito: z.string()')) ?? ''
  assert.ok(!line.includes('.min('))
})

test('REQ-48: paginas de cadastro e conta', () => {
  const r = read('src/pages/auth/RegisterPage.tsx')
  assert.ok(r.includes('CREFITO (opcional)'))
  assert.ok(r.includes("register('crefito')"))
  const a = read('src/pages/AccountPage.tsx')
  assert.ok(a.includes('Salvar CREFITO'))
  assert.ok(a.includes('updateOwnCrefito('))
  assert.ok(a.includes("toast('CREFITO salvo.'"))
})
