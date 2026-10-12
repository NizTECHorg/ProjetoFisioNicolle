import { test } from 'node:test'
import { ok, doesNotMatch, match } from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  fileURLToPath(new URL('../../supabase/functions/delete-account/index.ts', import.meta.url)),
  'utf8',
)

const serveAt = source.indexOf('Deno.serve(')
const handler = serveAt >= 0 ? source.slice(serveAt) : ''

function functionBody(name: string): string {
  const from = source.indexOf(`function ${name}(`)
  ok(from >= 0, `${name} não encontrada`)
  const end = source.indexOf('\n}\n', from)
  return source.slice(from, end === -1 ? undefined : end)
}

test('REQ-42: função self-contained com supabase-js via npm', () => {
  ok(source.includes("from 'npm:@supabase/supabase-js@2'"))
  ok(!source.includes("from './") && !source.includes("from '../"))
})

test('REQ-42: OPTIONS e 405 para método diferente de POST', () => {
  ok(source.includes("req.method === 'OPTIONS'"))
  ok(source.includes("req.method !== 'POST'"))
  ok(source.includes("'method_not_allowed'") && source.includes('405'))
})

test('REQ-42: JWT validado por getUser e chave de serviço só do env', () => {
  ok(source.includes('auth.getUser(token)'))
  ok(source.includes("Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')"))
})

test('REQ-42: sem IDOR, id vem só de user.id', () => {
  doesNotMatch(source, /body\??\.(userId|user_id|id|email)/)
  ok(source.includes('p_user_id: user.id'))
  ok(source.includes('deleteUser(user.id)'))
})

test('REQ-42: confirmação EXCLUIR e senha reverificadas no servidor', () => {
  ok(source.includes("!== 'EXCLUIR'"))
  match(source, /signInWithPassword\(\{\s*email: user\.email/)
})

test('REQ-42: ordem senha, secret Google, rpc, revogar, storage, deleteUser, finish', () => {
  const idx = [
    handler.indexOf('signInWithPassword'),
    handler.indexOf('google_calendar_secrets'),
    handler.indexOf("rpc('delete_account_data'"),
    handler.indexOf('revokeGoogleToken('),
    handler.indexOf('purgeFolder('),
    handler.indexOf('auth.admin.deleteUser('),
    handler.indexOf("rpc('finish_account_deletion'"),
  ]
  idx.forEach((v) => ok(v >= 0, 'passo ausente no handler'))
  for (let i = 1; i < idx.length; i++) ok(idx[i] > idx[i - 1], `ordem quebrada no passo ${i}`)
})

test('REQ-42: purgeFolder lista e remove', () => {
  const body = functionBody('purgeFolder')
  ok(body.includes('.list(') && body.includes('.remove('))
})

test('REQ-42: buckets de pacientes e de conta', () => {
  for (const b of ['patient-avatars', 'patient-images', 'patient-ai-reports', 'account-avatars']) {
    ok(source.includes(`'${b}'`), b)
  }
})

test('REQ-42: codes fixos de erro', () => {
  for (const c of [
    'invalid_request',
    'invalid_password',
    'rate_limited',
    'delete_failed',
    'storage_failed',
    'unauthorized',
  ]) {
    ok(source.includes(c), c)
  }
})

test('REQ-42: nenhuma mensagem interna vai ao cliente', () => {
  doesNotMatch(source, /jsonResponse\([^)]*error\.message/)
  ok(!source.includes('shouldSoftDelete'))
})
