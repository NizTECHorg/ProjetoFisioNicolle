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
