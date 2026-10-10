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

