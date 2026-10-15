import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import { equal, ok } from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const PHASE_DIR = '../../.planning/phases/35-empresa-v-e-edita-tudo-com-hist-rico-de-altera-es/sql'
const discoveryPath = fileURLToPath(new URL(`${PHASE_DIR}/35-00-discovery-unico.sql`, import.meta.url))
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
