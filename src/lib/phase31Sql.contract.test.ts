import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import { equal, ok } from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const sqlPath = fileURLToPath(
  new URL('../../.planning/phases/31-excluir-a-pr-pria-conta/sql/31-delete-account.sql', import.meta.url),
)
const migrationsPath = fileURLToPath(new URL('../../supabase/migrations', import.meta.url))

function stripSqlComments(source: string): string {
  return source
    .split('\n')
    .map((line) => {
      const idx = line.indexOf('--')
      return idx < 0 ? line : line.slice(0, idx)
    })
    .join('\n')
}

function sliceFunction(sql: string, name: string): string {
  const start = sql.indexOf(`create or replace function ${name}`)
  if (start < 0) throw new Error(`função ausente: ${name}`)
  const end = sql.indexOf('$$;', start)
  return sql.slice(start, end < 0 ? sql.length : end + 3)
}

function loadSql(): string {
  return stripSqlComments(readFileSync(sqlPath, 'utf8'))
}

const DELETE_FN = 'public.delete_account_data(p_user_id uuid)'
const FINISH_FN = 'public.finish_account_deletion(p_user_id uuid)'

function before(body: string, a: string, b: string, label: string) {
  const ia = body.indexOf(a)
  const ib = body.indexOf(b)
  ok(ia >= 0, `falta: ${a}`)
  ok(ib >= 0, `falta: ${b}`)
  ok(ia < ib, label)
}

test('REQ-42: as duas funções existem, security definer, search_path vazio, sem auth.uid()', () => {
  const sql = loadSql()
  for (const fn of [DELETE_FN, FINISH_FN]) {
    ok(sql.includes(`create or replace function ${fn}`), `falta ${fn}`)
    const body = sliceFunction(sql, fn)
    ok(body.includes('security definer'))
    ok(body.includes("set search_path = ''"))
    ok(!body.includes('auth.uid()'), 'não pode usar auth.uid()')
  }
})

test('REQ-42: grants só para service_role', () => {
  const sql = loadSql()
  for (const name of ['delete_account_data', 'finish_account_deletion']) {
    ok(sql.includes(`revoke all on function public.${name}(uuid) from public, anon, authenticated`))
    ok(sql.includes(`grant execute on function public.${name}(uuid) to service_role`))
  }
  ok(!sql.includes('grant execute on function public.delete_account_data(uuid) to authenticated'))
  ok(!/to authenticated/.test(sql))
})

test('REQ-42: tombstone privado com RLS e sem acesso de public/anon/authenticated', () => {
  const sql = loadSql()
  ok(sql.includes('create table if not exists private.account_deletion_pending'))
  ok(sql.includes('alter table private.account_deletion_pending enable row level security'))
  ok(sql.includes('revoke all on table private.account_deletion_pending from public, anon, authenticated'))
})

test('REQ-42: trava o perfil e grava tombstone antes de apagar patients', () => {
  const body = sliceFunction(loadSql(), DELETE_FN)
  before(body, 'for update', 'delete from', 'for update antes do primeiro delete')
  before(
    body,
    'insert into private.account_deletion_pending',
    'delete from public.patients',
    'tombstone antes de apagar patients',
  )
})

test('REQ-42: financeiro apaga cobranças antes de preços', () => {
  const body = sliceFunction(loadSql(), DELETE_FN)
  before(
    body,
    'delete from public.autonomo_session_charges',
    'delete from public.autonomo_prices',
    'charges antes de prices',
  )
})

test('REQ-42: empresa apaga quadro e vínculos antes da organização', () => {
  const body = sliceFunction(loadSql(), DELETE_FN)
  before(body, 'delete from public.board_cards', 'delete from public.board_columns', 'cards antes de colunas')
  before(
    body,
    'delete from public.organization_memberships',
    'delete from public.organizations',
    'vínculos antes da organização',
  )
  const orgIdx = body.indexOf('delete from public.organizations')
  const colsOrg = body.indexOf('delete from public.board_columns where organization_id')
  ok(colsOrg >= 0, 'falta delete de board_columns por organization_id')
  ok(colsOrg < orgIdx, 'colunas da organização antes da organização')
  const cardsOrg = body.indexOf('delete from public.board_cards where organization_id')
  ok(cardsOrg >= 0 && cardsOrg < colsOrg, 'cards da organização antes das colunas')
})

test('REQ-42: filhos da fase 28 apagados antes de patients', () => {
  const body = sliceFunction(loadSql(), DELETE_FN)
  const tables = [
    'google_calendar_session_links',
    'autonomo_session_charges',
    'patient_session_evolutions',
    'patient_images',
    'patient_ai_reports',
    'patient_pain_logs',
    'patient_focus_areas',
    'patient_alerts',
    'patient_goals',
    'patient_evaluations',
    'board_cards',
    'patient_sessions',
  ]
  const patientsIdx = body.indexOf('delete from public.patients')
  ok(patientsIdx > 0, 'falta delete from public.patients')
  for (const t of tables) {
    const idx = body.indexOf(`delete from public.${t}`)
    ok(idx >= 0, `falta delete from public.${t}`)
    ok(idx < patientsIdx, `${t} deve ser apagada antes de patients`)
  }
})

test('REQ-42: transferência do fisio ativo ao dono, com gatilhos de carimbo desligados', () => {
  const body = sliceFunction(loadSql(), DELETE_FN)
  for (const s of [
    'update public.patients',
    'update public.patient_images',
    'update public.patient_ai_reports',
    'update public.board_columns',
    'update public.board_cards',
    'update storage.objects',
    'therapist_id = null',
  ]) {
    ok(body.includes(s), `falta ${s}`)
  }
  const updCols = body.indexOf('update public.board_columns')
  const updCards = body.indexOf('update public.board_cards')
  const disCols = body.indexOf('disable trigger board_columns_stamp_scope')
  const disCards = body.indexOf('disable trigger board_cards_stamp_scope')
  ok(disCols >= 0 && disCols < updCols, 'disable de colunas antes do update')
  ok(disCards >= 0 && disCards < updCols, 'disable de cards antes do update')
  const enCols = body.indexOf('enable trigger board_columns_stamp_scope')
  const enCards = body.indexOf('enable trigger board_cards_stamp_scope')
  ok(enCols > updCards, 'enable de colunas depois do update de cards')
  ok(enCards > updCards, 'enable de cards depois do update de cards')
})

test("REQ-42: fisios da equipe viram autonomo enquanto os vínculos ainda existem", () => {
  const body = sliceFunction(loadSql(), DELETE_FN)
  before(
    body,
    "account_type = 'autonomo'",
    'delete from public.organization_memberships',
    'troca de tipo antes de apagar vínculos',
  )
})

test('REQ-42: guarda final cobre todas as FKs no action', () => {
  const body = sliceFunction(loadSql(), DELETE_FN)
  const last = body.lastIndexOf('delete from public.patients')
  ok(last >= 0)
  const tail = body.slice(last)
  ok(tail.includes('account_still_referenced'))
  for (const t of [
    'patients',
    'patient_ai_reports',
    'patient_images',
    'autonomo_prices',
    'autonomo_session_charges',
    'board_cards',
    'board_columns',
    'organizations',
  ]) {
    ok(tail.includes(`public.${t}`), `guarda deve citar ${t}`)
  }
})

test('REQ-42: Google Calendar apagado por user_id', () => {
  const body = sliceFunction(loadSql(), DELETE_FN)
  for (const t of ['google_calendar_secrets', 'google_calendar_connections', 'google_calendar_session_links']) {
    ok(body.includes(`delete from public.${t} where user_id`), `falta delete de ${t} por user_id`)
  }
})

test('REQ-42: SQL termina com notify e não há supabase/migrations', () => {
  const sql = loadSql().trim()
  ok(sql.endsWith("notify pgrst, 'reload schema';"))
  equal(existsSync(migrationsPath), false)
})
