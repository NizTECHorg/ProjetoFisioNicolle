import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import { equal, ok } from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const PHASE_DIR = '../../.planning/phases/37-termos-de-consentimento-assinados-pelo-paciente/sql'
const discoveryPath = fileURLToPath(new URL(`${PHASE_DIR}/37-00-discovery-unico.sql`, import.meta.url))
const migrationsPath = fileURLToPath(new URL('../../supabase/migrations', import.meta.url))

export function stripSqlComments(source: string): string {
  return source
    .split('\n')
    .map((line) => {
      const idx = line.indexOf('--')
      return idx < 0 ? line : line.slice(0, idx)
    })
    .join('\n')
}

export function norm(source: string): string {
  return stripSqlComments(source).replace(/\s+/g, ' ').trim().toLowerCase()
}

function loadDiscovery(): string {
  return stripSqlComments(readFileSync(discoveryPath, 'utf8'))
}

test('REQ-48: discovery existe e começa com select jsonb_build_object(', () => {
  ok(existsSync(discoveryPath))
  ok(loadDiscovery().trim().toLowerCase().startsWith('select jsonb_build_object('))
})

test('REQ-48: discovery é somente leitura', () => {
  const sql = loadDiscovery()
  for (const word of ['create', 'alter', 'drop', 'insert', 'update', 'delete', 'grant', 'revoke', 'truncate']) {
    ok(!new RegExp(`\\b${word}\\b`, 'i').test(sql), `palavra proibida no discovery: ${word}`)
  }
})

test('REQ-48: discovery traz as chaves necessárias', () => {
  const sql = loadDiscovery()
  for (const key of [
    'a_profiles_colunas',
    'b_patients_colunas',
    'c_patient_terms_existe',
    'd_buckets',
    'e_policies_storage_patient_images',
    'g_triggers_profiles_auth',
    'h_handle_new_user',
    'i_can_write_patient',
    'j_audit_record_existe',
    'm_grants_coluna',
  ]) {
    ok(sql.includes(key), `chave ausente: ${key}`)
  }
})

test('REQ-48: supabase/migrations não existe (SQL é aplicado à mão)', () => {
  equal(existsSync(migrationsPath), false)
})

const termosPath = fileURLToPath(new URL(`${PHASE_DIR}/37-01-termos.sql`, import.meta.url))
const verifyPath = fileURLToPath(new URL(`${PHASE_DIR}/37-02-verify.sql`, import.meta.url))

test('REQ-48: 37-01-termos.sql traz os elementos obrigatórios', () => {
  const sql = norm(readFileSync(termosPath, 'utf8'))
  for (const piece of [
    'add column if not exists cpf text',
    'patients_cpf_format_check',
    'not valid',
    'add column if not exists crefito text',
    'profiles_crefito_len_check',
    'create or replace function private.profiles_copy_crefito()',
    'exception when others',
    'security definer',
    "set search_path = ''",
    'before insert on public.profiles',
    'create table if not exists public.patient_terms',
    'on delete cascade',
    'enable row level security',
    'force row level security',
    "notify pgrst, 'reload schema'",
    'grant select (cpf), insert (cpf), update (cpf) on public.patients to authenticated',
    'update (crefito) on public.profiles to authenticated',
    'patient_terms_path_check',
    "split_part(storage_path, '/', 1) = patient_id::text",
    'raw_user_meta_data ->> \'crefito\'',
  ]) {
    ok(sql.includes(piece), `trecho ausente: ${piece}`)
  }
  ok(/\\\.pdf\$'/.test(sql), 'check de storage_path deve terminar em .pdf$')
})

test('REQ-48: patient_terms é imutável (sem update) e protegido por can_*_patient', () => {
  const sql = norm(readFileSync(termosPath, 'utf8'))
  ok(sql.includes('for select'))
  ok(sql.includes('for insert'))
  ok(sql.includes('for delete'))
  ok(!/create policy \S+ on public\.patient_terms for update/.test(sql))
  ok(!/for update/.test(sql), 'nenhuma policy for update')
  ok(sql.includes('revoke update on table public.patient_terms from authenticated'))
  ok(sql.includes('grant select, insert, delete on table public.patient_terms to authenticated'))
  ok(/private\.can_write_patient\(patient_id\)/.test(sql))
  ok(/private\.can_read_patient\(patient_id\)/.test(sql))
  ok(sql.includes('created_by = (select auth.uid())'))
})

test('REQ-48: 37-01 não reescreve helpers, não cria unique em cpf nem trigger em auth.users', () => {
  const sql = norm(readFileSync(termosPath, 'utf8'))
  ok(!sql.includes('handle_new_user'))
  ok(!/drop function/.test(sql))
  for (const fn of ['can_read_patient', 'can_write_patient', 'audit_record', 'protect_profile_fields']) {
    ok(!new RegExp(`create or replace function \\S*${fn}`).test(sql), `não pode recriar ${fn}`)
  }
  ok(!/cpf[^,;]*unique/.test(sql.replace(/guardian_cpf[^,]*,/g, '')), 'cpf sem unique')
  ok(!/create trigger \S+ (before|after) [a-z ]+ on auth\.users/.test(sql))
  ok(!sql.includes('on auth.users for'))
})

test('REQ-48: 37-02-verify.sql é somente leitura e traz as chaves', () => {
  const raw = readFileSync(verifyPath, 'utf8')
  const sql = stripSqlComments(raw).trim().toLowerCase()
  ok(sql.startsWith('select jsonb_build_object('))
  for (const word of ['create ', 'alter ', 'drop ', 'insert into', 'grant ', 'revoke ']) {
    ok(!sql.includes(word), `proibido no verify: ${word}`)
  }
  for (const key of [
    'a_patients_cpf', 'b_profiles_crefito', 'c_cpf_check', 'd_crefito_trigger', 'e_copy_crefito_secdef',
    'f_copy_crefito_engole_erro', 'g_terms_force_rls', 'h_terms_policies', 'i_authenticated_pode_alterar',
    'j_anon_select', 'k_fk_cascade', 'l_audit_trigger', 'm_bucket_pdf', 'n_authenticated_coluna_cpf',
    'o_authenticated_coluna_crefito',
  ]) {
    ok(sql.includes(key), `chave ausente: ${key}`)
  }
})
