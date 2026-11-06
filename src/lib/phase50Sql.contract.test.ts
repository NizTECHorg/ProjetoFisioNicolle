import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { ok } from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const DIR = '../../.planning/phases/50-aba-relat-rio-do-paciente/sql'

function strip(source: string): string {
  return source
    .split('\n')
    .map((line) => {
      const idx = line.indexOf('--')
      return idx < 0 ? line : line.slice(0, idx)
    })
    .join('\n')
}

function load(name: string): string {
  const path = fileURLToPath(new URL(`${DIR}/${name}`, import.meta.url))
  return strip(readFileSync(path, 'utf8')).replace(/\s+/g, ' ').trim().toLowerCase()
}

const sql = load('50-01-relatorios.sql')
const verify = load('50-02-verify.sql')

test('REQ-57: patient_id cascade e created_by set null', () => {
  ok(sql.includes('references public.patients (id) on delete cascade'))
  ok(sql.includes('references public.profiles (id) on delete set null'))
})

test('REQ-57: RLS forcado, quatro policies e funcoes de acesso', () => {
  ok(sql.includes('force row level security'))
  for (const p of ['select', 'insert', 'update', 'delete']) {
    ok(sql.includes(`create policy patient_reports_${p} on public.patient_reports`), p)
  }
  ok(sql.includes('private.can_read_patient'))
  ok(sql.includes('private.can_write_patient'))
})

test('REQ-57: privilegios por coluna e revoke de anon', () => {
  ok(sql.includes('grant update (content, place, signature_path, storage_path, updated_at)'))
  ok(/revoke all on table public\.patient_reports from anon, public, authenticated/.test(sql))
})

test('REQ-57: insert confere sessoes do mesmo paciente e recarrega schema', () => {
  ok(sql.includes('unnest(session_ids)'))
  ok(sql.includes("notify pgrst, 'reload schema'"))
})

test('REQ-57: nada que bloqueie ou mexa em objetos existentes', () => {
  ok(!sql.includes('create trigger'))
  ok(!sql.includes('delete_patient_full'))
  ok(!sql.includes('delete_account_data'))
  ok(!sql.includes('patient_ai_reports'))
  ok(!/create table (if not exists )?storage\./.test(sql))
  ok(!sql.includes('storage.buckets'))
})

test('REQ-57: verify e somente leitura e confere side_effects', () => {
  ok(verify.startsWith('select jsonb_build_object('))
  ok(!/(^|;)\s*(insert|update|delete|drop|alter|create)\b/.test(verify))
  ok(verify.includes('side_effects'))
})
