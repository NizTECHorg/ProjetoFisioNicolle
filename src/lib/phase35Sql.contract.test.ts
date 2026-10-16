import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import { equal, ok } from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const PHASE_DIR = '../../.planning/phases/35-empresa-v-e-edita-tudo-com-hist-rico-de-altera-es/sql'
const discoveryPath = fileURLToPath(new URL(`${PHASE_DIR}/35-00-discovery-unico.sql`, import.meta.url))
const sqlPath = fileURLToPath(new URL(`${PHASE_DIR}/35-01-audit-and-company-write.sql`, import.meta.url))
const verifyPath = fileURLToPath(new URL(`${PHASE_DIR}/35-02-verify.sql`, import.meta.url))
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

function loadDiscovery(): string {
  return stripSqlComments(readFileSync(discoveryPath, 'utf8'))
}

const CLINICAL_TABLES = [
  'patients',
  'patient_sessions',
  'patient_session_evolutions',
  'patient_evaluations',
  'patient_goals',
  'patient_alerts',
  'patient_focus_areas',
  'patient_pain_logs',
  'patient_images',
  'patient_ai_reports',
]

test('REQ-46: discovery existe e começa com select jsonb_build_object(', () => {
  ok(existsSync(discoveryPath))
  ok(loadDiscovery().trim().toLowerCase().startsWith('select jsonb_build_object('))
})

test('REQ-46: discovery é somente leitura', () => {
  const sql = loadDiscovery()
  for (const word of ['create', 'alter', 'drop', 'insert', 'update', 'delete', 'grant', 'revoke', 'truncate']) {
    ok(!new RegExp(`\\b${word}\\b`, 'i').test(sql), `palavra proibida no discovery: ${word}`)
  }
})

test('REQ-46: discovery contém todas as chaves e as 10 tabelas clínicas', () => {
  const sql = loadDiscovery()
  for (const key of [
    'a_colunas',
    'b_triggers',
    'c_funcoes',
    'd_policies',
    'e_grants_coluna',
    'f_audit_existe',
    'g_force_rls',
    'h_pacientes_por_criador',
    'i_dono_funcoes',
  ]) {
    ok(sql.includes(`'${key}'`), `chave ausente: ${key}`)
  }
  for (const t of CLINICAL_TABLES) ok(sql.includes(`'${t}'`), `tabela ausente: ${t}`)
})

test('REQ-46: supabase/migrations não existe', () => {
  equal(existsSync(migrationsPath), false)
})

function loadSql(): string {
  return stripSqlComments(readFileSync(sqlPath, 'utf8'))
}

function norm(s: string): string {
  return s.replace(/\s+/g, ' ')
}

function sliceFunction(sql: string, name: string): string {
  const start = sql.indexOf(`create or replace function ${name}`)
  if (start < 0) throw new Error(`função ausente: ${name}`)
  const end = sql.indexOf('$$;', start)
  return sql.slice(start, end < 0 ? sql.length : end + 3)
}

const STAMP_TABLES = ['patients', 'patient_sessions', 'patient_evaluations', 'patient_session_evolutions']

test('REQ-46: colunas de carimbo nas 4 tabelas, antes de qualquer função', () => {
  const sql = loadSql()
  for (const t of STAMP_TABLES) {
    const start = sql.indexOf(`alter table public.${t}`)
    ok(start >= 0, `alter table ausente: ${t}`)
    const block = norm(sql.slice(start, sql.indexOf(';', start)))
    for (const col of [
      'add column if not exists updated_by uuid references auth.users (id) on delete set null',
      'add column if not exists updated_by_name text',
      'add column if not exists updated_at timestamptz',
      'add column if not exists created_by_name text',
      'add column if not exists created_at timestamptz',
    ]) {
      ok(block.includes(col), `${t}: falta ${col}`)
    }
  }
  const lastAlter = Math.max(...STAMP_TABLES.map((t) => sql.lastIndexOf(`alter table public.${t}`)))
  ok(lastAlter < sql.indexOf('create or replace function'))
})

test('REQ-46: is_org_owner_of_patient e can_write_patient', () => {
  const sql = loadSql()
  const owner = norm(sliceFunction(sql, 'private.is_org_owner_of_patient(p_patient_id uuid)'))
  ok(owner.includes('security definer'))
  ok(owner.includes("set search_path = ''"))
  for (const frag of [
    'o.owner_id = (select auth.uid())',
    'tm.organization_id = o.id',
    'tm.profile_id = p.created_by',
    "tm.role = 'therapist'",
    "tm.status = 'active'",
  ]) {
    ok(owner.includes(frag), `falta ${frag}`)
  }
  const write = norm(sliceFunction(sql, 'private.can_write_patient(p_patient_id uuid)'))
  ok(write.includes('security definer'))
  ok(write.includes("set search_path = ''"))
  ok(write.includes('p.created_by = (select auth.uid())'))
  ok(write.includes('private.is_org_owner_of_patient(p_patient_id)'))
  ok(write.includes("'pending'") && write.includes("'rejected'"))
  ok(sql.includes('grant execute on function private.can_write_patient(uuid) to authenticated'))
  ok(sql.includes('revoke all on function private.can_write_patient(uuid) from public, anon'))
  ok(
    sql.indexOf('create or replace function private.is_org_owner_of_patient') <
      sql.indexOf('create or replace function private.can_write_patient'),
  )
})

test('REQ-46: não recria leitura nem policies de tabelas clínicas', () => {
  const sql = loadSql()
  equal(sql.includes('create or replace function private.can_read_patient'), false)
  equal(/create (or replace )?function private\.is_assigned_therapist/.test(sql), false)
  equal(sql.includes('create policy patients_'), false)
  equal(/drop policy[^;]*on public\.patient/.test(sql), false)
})

test('REQ-46: audit_log append-only com RLS forçada e uma única policy de select', () => {
  const sql = loadSql()
  const start = sql.indexOf('create table if not exists public.audit_log')
  ok(start >= 0)
  const block = norm(sql.slice(start, sql.indexOf(');', start)))
  for (const frag of [
    'id bigint generated always as identity',
    'at timestamptz not null default now()',
    'actor_id uuid',
    'actor_name text',
    "action text not null check (action in ('create', 'update', 'delete'))",
    'entity text',
    'entity_id text',
    'patient_id uuid not null',
    'organization_id uuid',
    'item_date text',
  ]) {
    ok(block.includes(frag), `audit_log: falta ${frag}`)
  }
  equal(block.includes('references'), false)
  ok(sql.includes('alter table public.audit_log enable row level security'))
  ok(sql.includes('alter table public.audit_log force row level security'))
  ok(sql.includes('revoke all on public.audit_log from'))
  ok(sql.includes('grant select on public.audit_log to authenticated'))
  for (const g of ['grant insert', 'grant update', 'grant delete', 'grant all']) {
    equal(sql.includes(g), false, g)
  }
  equal((sql.match(/create policy /g) ?? []).length, 1)
  const pol = norm(sql.slice(sql.indexOf('create policy audit_log_select'), sql.indexOf(';', sql.indexOf('create policy audit_log_select'))))
  ok(pol.includes('for select to authenticated'))
  ok(pol.includes('private.can_read_patient_base(patient_id)'))
  ok(pol.includes('private.is_org_owner(organization_id)'))
})

test('REQ-46: audit_stamp e audit_record', () => {
  const sql = loadSql()
  const stamp = norm(sliceFunction(sql, 'public.audit_stamp()'))
  ok(stamp.includes('security definer'))
  ok(stamp.includes("set search_path = ''"))
  ok(stamp.includes('auth.uid()'))
  ok(stamp.includes('return new'))
  ok(stamp.includes('jsonb_populate_record'))
  ok(stamp.includes('old.created_by'))
  ok(sql.includes('revoke execute on function public.audit_stamp() from public, anon, authenticated'))
  const rec = norm(sliceFunction(sql, 'public.audit_record()'))
  ok(rec.includes('security definer'))
  ok(rec.includes("set search_path = ''"))
  ok(rec.includes('tg_op'))
  ok(rec.includes('return null'))
  ok(
    rec.includes(
      'insert into public.audit_log (actor_id, actor_name, action, entity, entity_id, patient_id, organization_id, item_date)',
    ),
  )
  ok(sql.includes('revoke execute on function public.audit_record() from public, anon, authenticated'))
})

test('REQ-46: triggers de carimbo (4) e de registro (10), com drop if exists', () => {
  const sql = norm(loadSql())
  equal((sql.match(/create trigger \w+_zz_audit_record/g) ?? []).length, 10)
  equal((sql.match(/create trigger \w+_zz_audit_stamp/g) ?? []).length, 4)
  for (const t of CLINICAL_TABLES) {
    const name = `${t}_zz_audit_record`
    ok(sql.includes(`drop trigger if exists ${name} on public.${t};`))
    ok(sql.includes(`create trigger ${name} after insert or update or delete on public.${t} for each row execute function public.audit_record()`))
  }
  for (const t of STAMP_TABLES) {
    const name = `${t}_zz_audit_stamp`
    ok(sql.includes(`drop trigger if exists ${name} on public.${t};`))
    ok(sql.includes(`create trigger ${name} before insert or update on public.${t} for each row execute function public.audit_stamp()`))
  }
})

test('REQ-46: guard da Phase 29 ignora o carimbo e mantém only_status_allowed', () => {
  const sql = loadSql()
  const guard = norm(sliceFunction(sql, 'public.guard_assigned_session_update()'))
  ok(guard.includes('security definer'))
  ok(guard.includes("set search_path = ''"))
  ok(guard.includes('private.can_write_patient(old.patient_id)'))
  ok(guard.includes('only_status_allowed'))
  for (const c of ["'status'", "'updated_at'", "'updated_by'", "'updated_by_name'"]) ok(guard.includes(`- ${c}`))
  ok(norm(sql).includes('drop trigger if exists patient_sessions_guard_assigned_update on public.patient_sessions;'))
  ok(norm(sql).includes('create trigger patient_sessions_guard_assigned_update before update on public.patient_sessions'))
  ok(sql.includes('revoke execute on function public.guard_assigned_session_update() from public, anon, authenticated'))
})

test('REQ-46: delete_patient_full limpa o histórico entre tombstone e raiz', () => {
  const sql = loadSql()
  const body = sliceFunction(sql, 'public.delete_patient_full(p_patient_id uuid)')
  ok(body.includes('security definer'))
  ok(body.includes("set search_path = ''"))
  ok(body.includes('not_authenticated'))
  ok(body.includes('private.can_write_patient(p_patient_id)'))
  ok(body.includes('operation_not_permitted'))
  const tomb = body.indexOf('insert into private.patient_deletion_tombstones')
  const audit = body.indexOf('delete from public.audit_log where patient_id = p_patient_id')
  const root = body.indexOf('delete from public.patients where id = p_patient_id')
  ok(tomb >= 0 && tomb < audit && audit < root)
  ok(body.includes('delete from public.patient_session_evolutions'))
  equal(body.includes('set_config'), false)
  ok(sql.includes('revoke all on function public.delete_patient_full(uuid) from public, anon'))
  ok(sql.includes('grant execute on function public.delete_patient_full(uuid) to authenticated'))
  ok(readFileSync(sqlPath, 'utf8').trimEnd().endsWith("notify pgrst, 'reload schema';"))
})

test('REQ-46: 35-02-verify tem parte A só leitura e parte B com rollback por exceção', () => {
  ok(existsSync(verifyPath))
  const raw = readFileSync(verifyPath, 'utf8')
  const sql = stripSqlComments(raw)
  ok(sql.includes('select jsonb_build_object('))
  ok(sql.includes("raise exception 'VERIFY35 %'"))
  equal(/\bcommit\b/i.test(sql), false)
  const partA = sql.slice(0, sql.indexOf('do $$'))
  for (const w of ['create', 'alter', 'drop', 'grant', 'revoke']) {
    equal(new RegExp(`\\b${w}\\b`, 'i').test(partA), false, `parte A contém ${w}`)
  }
  ok(sql.includes('request.jwt.claim.sub'))
  ok(sql.includes('request.jwt.claims'))
  ok(sql.includes('set local role authenticated'))
})

test('REQ-46: audit_record grava create/update/delete (bate com o check) e nunca bloqueia o salvamento', () => {
  const hotfixPath = fileURLToPath(new URL(`${PHASE_DIR}/35-03-hotfix-audit-action.sql`, import.meta.url))
  for (const path of [sqlPath, hotfixPath]) {
    const rec = readFileSync(path, 'utf8')
    ok(!rec.includes('lower(tg_op)'), 'lower(tg_op) gera "insert", que o check recusa')
    ok(rec.includes("case tg_op when 'INSERT' then 'create' when 'UPDATE' then 'update' else 'delete' end"))
    ok(rec.includes('exception when others then'))
    ok(rec.includes("raise warning 'audit_record falhou"))
  }
})
