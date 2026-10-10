import { test } from 'node:test'
import { ok } from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const read = (relative: string) => readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')

function sliceFrom(source: string, start: string): string {
  const from = source.indexOf(start)
  ok(from >= 0, `${start} não encontrado`)
  const next = source.indexOf('\nexport ', from + start.length)
  return next === -1 ? source.slice(from) : source.slice(from, next)
}

const service = read('../services/patientDeletion.service.ts')
const serviceBody = sliceFrom(service, 'export async function deletePatientCompletely')

test('service: ordem list -> rpc delete -> remove -> rpc finish', () => {
  // listAllPatientFiles/cleanupPatientFiles são helpers; a ordem vale no corpo exportado e nos helpers.
  const iList = serviceBody.indexOf('listAllPatientFiles(patientId)')
  const iRpc = serviceBody.indexOf("rpc('delete_patient_full'")
  const iClean = serviceBody.indexOf('cleanupPatientFiles(patientId, files)')
  ok(iList >= 0 && iRpc > iList && iClean > iRpc, 'ordem list -> rpc -> cleanup')
  const iListFn = service.indexOf('.list(')
  const iRemove = service.indexOf('.remove(')
  const iFinish = service.indexOf("rpc('finish_patient_deletion'")
  ok(iListFn >= 0 && iRemove > iListFn && iFinish > iRemove, 'list antes de remove antes de finish')
})

test('service: buckets vêm de patientDeleteConfirm', () => {
  ok(service.includes("PATIENT_FILE_BUCKETS") && service.includes("@/lib/patientDeleteConfirm"))
})

test('service: não apaga patients direto, confere data.length, usa pendências, sem toast', () => {
  ok(!/from\('patients'\)/.test(service))
  ok(service.includes('.length'))
  ok(service.includes('list_pending_patient_file_cleanups'))
  ok(!service.includes('toast('))
})

const hooksSource = read('../hooks/usePatients.ts')

test('hook: useDeletePatient navega, limpa cache, invalida e usa copy fixa', () => {
  ok(hooksSource.includes("from '@/services/patientDeletion.service'"))
  const body = sliceFrom(hooksSource, 'export function useDeletePatient(')
  const iNav = body.indexOf("navigate('/pacientes', { replace: true })")
  const iRemove = body.indexOf("removeQueries({ queryKey: ['patients', patientId] })")
  const iInvalidate = body.indexOf('invalidateQueries')
  ok(iNav >= 0 && iRemove > iNav && iInvalidate > iRemove, 'ordem navigate -> remove -> invalidate')
  ok(body.includes("queryKey: ['patients'], refetchType: 'none'"))
  for (const key of ['calendar-sessions', 'board', 'board-dues', 'finance', 'search']) {
    ok(body.includes(`queryKey: ['${key}']`), `invalida ${key}`)
  }
  ok(body.includes("toast('Paciente excluído.', 'success')"))
  ok(
    body.includes(
      "toast('Não foi possível excluir o paciente. Tente de novo em instantes.', 'error')",
    ),
  )
  ok(!body.includes('error.message'))
  ok(!body.includes('invalidatePatient('))
  ok(!/onError,|onError:\s*onError/.test(body))
})
