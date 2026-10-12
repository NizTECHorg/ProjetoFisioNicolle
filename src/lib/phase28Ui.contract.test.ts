import { test } from 'node:test'
import { ok } from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const read = (relative: string) => readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')

const dialog = read('../components/patients/DeletePatientDialog.tsx')

test('dialog: copy travada', () => {
  for (const text of [
    'Excluir paciente?',
    'Excluir paciente',
    'Voltar sem excluir',
    'Digite o nome do paciente para confirmar',
    'Eventos já enviados ao Google Agenda continuam lá.',
    'sessões, avaliações, evoluções, metas, imagens, PDFs, relatórios da IA e cobranças',
  ]) {
    ok(dialog.includes(text), `falta: ${text}`)
  }
})

test('dialog: botão de perigo só habilita com nome e mostra loading', () => {
  ok(dialog.includes('isDeleteNameMatch('), 'usa isDeleteNameMatch')
  ok(dialog.includes('disabled={!matches}'))
  ok(dialog.includes('isLoading={isPending}'))
  ok(dialog.includes('!bg-error'))
})

test('dialog: não fecha durante pending e não usa ConfirmDialog', () => {
  ok(/isPending \? \(\) => \{\}/.test(dialog), 'onClose no-op em pending')
  ok(dialog.includes('onClose={handleClose}'))
  ok(dialog.includes('disabled={isPending}'))
  ok(!dialog.includes('ConfirmDialog'))
})

const header = read('../components/patients/PatientProfileHeader.tsx')
const page = read('../pages/PatientPage.tsx')
const list = read('../pages/PatientsPage.tsx')

test('header: não tem mais o botão de excluir', () => {
  ok(!header.includes('Excluir paciente'))
  ok(!header.includes('onDeletePatient'))
})

test('Resumo: área sensível abaixo dos atalhos, só com canWrite && onDeletePatient', () => {
  const shortcutsAt = page.indexOf('>Atalhos<')
  const zoneAt = page.indexOf('Área sensível')
  ok(shortcutsAt >= 0 && zoneAt > shortcutsAt, 'área sensível depois dos atalhos')
  ok(page.slice(shortcutsAt, zoneAt).includes('canWrite && onDeletePatient'))
  ok(page.includes('border-error/25'))
})

test('atalhos: só os que funcionam, sem Em breve', () => {
  ok(!page.includes('Em breve'))
})

test('PatientPage: liga diálogo e hook antes dos returns antecipados', () => {
  ok(page.includes("import { DeletePatientDialog }"))
  ok(page.includes('onDeletePatient='))
  ok(page.includes('patientName={dashboard.name}'))
  const hook = page.indexOf('useDeletePatient(')
  const early = page.indexOf('if (dashboardLoading)')
  ok(hook >= 0 && early >= 0 && hook < early)
})

test('lista de pacientes não ganha ação de excluir', () => {
  ok(!list.includes('Excluir paciente'))
  ok(!list.includes('useDeletePatient'))
  ok(!list.includes('DeletePatientDialog'))
})
