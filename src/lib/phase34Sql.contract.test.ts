import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import { equal, ok } from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const sqlPath = fileURLToPath(
  new URL(
    '../../.planning/phases/34-avalia-o-gerada-por-ia-a-partir-dos-dados-do-paciente/sql/34-patient-gender.sql',
    import.meta.url,
  ),
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

function loadSql(): string {
  return stripSqlComments(readFileSync(sqlPath, 'utf8')).replace(/\s+/g, ' ').toLowerCase()
}

test('REQ-45: adiciona a coluna gender de forma idempotente', () => {
  ok(loadSql().includes('alter table public.patients add column if not exists gender text'))
})

test('REQ-45: drop constraint if exists antes de add constraint patients_gender_check', () => {
  const sql = loadSql()
  const drop = sql.indexOf('drop constraint if exists patients_gender_check')
  const add = sql.indexOf('add constraint patients_gender_check')
  ok(drop >= 0 && add > drop)
})

test('REQ-45: check aceita null e exatamente os 4 valores', () => {
  ok(
    loadSql().includes(
      "check (gender is null or gender in ('feminino','masculino','outro','nao_informado'))",
    ),
  )
})

test('REQ-45: não mexe em policy, grant, revoke nem drop column', () => {
  const sql = loadSql()
  for (const term of ['create policy', 'drop policy', 'grant ', 'revoke ', 'drop column']) {
    equal(sql.includes(term), false, term)
  }
})

test('REQ-45: recarrega o schema e não existe supabase/migrations', () => {
  ok(loadSql().trimEnd().endsWith("notify pgrst, 'reload schema';"))
  equal(existsSync(migrationsPath), false)
})
