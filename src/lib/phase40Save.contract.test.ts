import { test } from 'node:test'
import { ok } from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const read = (relative: string) => readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')
const SERVICE = read('../services/evaluations.service.ts')
const HOOKS = read('../hooks/usePatients.ts')

test('createPatientEvaluation devolve o id e mantém o sync do paciente', () => {
  const inicio = SERVICE.indexOf('export async function createPatientEvaluation')
  const corpo = SERVICE.slice(inicio, SERVICE.indexOf('export async function updatePatientEvaluation'))
  ok(corpo.includes('Promise<string>'))
  ok(corpo.includes(".select('id')"))
  ok(corpo.includes('syncPatientFromEvaluation(patientId, input)'))
})

test('hooks de avaliação aceitam mensagens próprias com padrões atuais', () => {
  ok(HOOKS.includes('successMessage'))
  ok(HOOKS.includes("'Avaliação salva'"))
  ok(HOOKS.includes("'Avaliação atualizada'"))
  ok(/useUpdatePatientEvaluation\(\s*patientId: string,\s*toastOptions\?/.test(HOOKS))
})
