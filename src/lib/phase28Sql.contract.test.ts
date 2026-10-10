import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import { equal, ok } from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const sqlPath = fileURLToPath(
  new URL('../../.planning/phases/28-excluir-paciente-por-completo/sql/28-delete-patient.sql', import.meta.url),
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

const DELETE_FN = 'public.delete_patient_full(p_patient_id uuid)'

test('REQ-39.3: delete_patient_full é security definer com checagem de dono e 42501', () => {
  const sql = loadSql()
  ok(sql.includes(`create or replace function ${DELETE_FN}`))
  const body = sliceFunction(sql, DELETE_FN)
  ok(body.includes('security definer'))
  ok(body.includes("set search_path = ''"))
  ok(body.includes('private.can_write_patient(p_patient_id)'))
  ok(body.includes("errcode = '42501'"))
})

test('REQ-39.4: delete_patient_full apaga as 13 tabelas, patients por último, tombstone antes', () => {
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
  const patientsIdx = body.indexOf('delete from public.patients ')
  ok(patientsIdx > 0, 'falta delete from public.patients')
  for (const t of tables) {
    const idx = body.indexOf(`delete from public.${t}`)
    ok(idx >= 0, `falta delete from public.${t}`)
    ok(idx < patientsIdx, `${t} deve ser apagada antes de patients`)
  }
  const tombIdx = body.indexOf('insert into private.patient_deletion_tombstones')
  ok(tombIdx >= 0 && tombIdx < patientsIdx, 'tombstone deve ser gravado antes de apagar patients')
})

test('REQ-39.5: sem SQL dinâmico nem exception when others', () => {
  const body = sliceFunction(loadSql(), DELETE_FN)
  equal(body.includes('execute format('), false)
  equal(body.includes("execute '"), false)
  equal(/exception\s+when\s+others/i.test(body), false)
})

test('grants e revokes da função e do tombstone; sem delete em storage.objects; sem migrations', () => {
  const sql = loadSql()
  ok(sql.includes('revoke all on function public.delete_patient_full(uuid) from public, anon'))
  ok(sql.includes('grant execute on function public.delete_patient_full(uuid) to authenticated'))
  ok(sql.includes('revoke all on table private.patient_deletion_tombstones from public, anon, authenticated'))
  equal(sql.includes('delete from storage.objects'), false)
  equal(existsSync(migrationsPath), false)
})

test('REQ-39.4: helper de limpeza compara deleted_by com auth.uid()', () => {
  const sql = loadSql()
  const body = sliceFunction(sql, 'private.can_cleanup_deleted_patient_files(p_patient_id uuid)')
  ok(body.includes('security definer'))
  ok(body.includes("set search_path = ''"))
  ok(body.includes('stable'))
  ok(body.includes('deleted_by = (select auth.uid())'))
})

test('REQ-39.4: exatamente 6 policies de limpeza, só select/delete para authenticated', () => {
  const sql = loadSql()
  const names = [
    'patient_avatars_storage_cleanup_select',
    'patient_avatars_storage_cleanup_delete',
    'patient_images_storage_cleanup_select',
    'patient_images_storage_cleanup_delete',
    'patient_ai_reports_storage_cleanup_select',
    'patient_ai_reports_storage_cleanup_delete',
  ]
  const buckets: Record<string, string> = {
    patient_avatars: 'patient-avatars',
    patient_images: 'patient-images',
    patient_ai_reports: 'patient-ai-reports',
  }
  equal((sql.match(/create policy /g) ?? []).length, 6)
  for (const name of names) {
    const start = sql.indexOf(`create policy ${name} `)
    ok(start >= 0, `falta policy ${name}`)
    const block = sql.slice(start, sql.indexOf(';', start))
    const prefix = name.replace(/_storage_cleanup_(select|delete)$/, '')
    const op = name.endsWith('_select') ? 'select' : 'delete'
    ok(block.includes(`for ${op}`), `${name} deve ser for ${op}`)
    ok(block.includes('to authenticated'))
    equal(block.includes('to anon'), false)
    ok(block.includes(`bucket_id = '${buckets[prefix]}'`))
    ok(block.includes('[0-9a-f]{8}-'))
    ok(block.includes('private.can_cleanup_deleted_patient_files'))
  }
  equal(/for\s+(insert|update)/i.test(sql), false)
  const drops = sql.match(/drop policy if exists \w+/g) ?? []
  for (const d of drops) ok(/_cleanup_(select|delete)$/.test(d), `drop inesperado: ${d}`)
})

test('REQ-39: finish_patient_deletion e list_pending_patient_file_cleanups', () => {
  const sql = loadSql()
  const finish = sliceFunction(sql, 'public.finish_patient_deletion(p_patient_id uuid)')
  ok(finish.includes('security definer'))
  ok(finish.includes("set search_path = ''"))
  ok(finish.includes('deleted_by = (select auth.uid())'))
  for (const b of ['patient-avatars', 'patient-images', 'patient-ai-reports']) ok(finish.includes(`'${b}'`))
  ok(finish.includes('storage.objects'))
  const list = sliceFunction(sql, 'public.list_pending_patient_file_cleanups()')
  ok(list.includes('security definer'))
  ok(list.includes("set search_path = ''"))
  ok(sql.includes('revoke all on function public.finish_patient_deletion(uuid) from public, anon'))
  ok(sql.includes('grant execute on function public.finish_patient_deletion(uuid) to authenticated'))
  ok(sql.includes('revoke all on function public.list_pending_patient_file_cleanups() from public, anon'))
  ok(sql.includes('grant execute on function public.list_pending_patient_file_cleanups() to authenticated'))
})

test('notify pgrst é a última instrução', () => {
  const sql = loadSql().trim()
  ok(sql.endsWith("notify pgrst, 'reload schema';"))
})
