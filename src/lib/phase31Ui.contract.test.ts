import { test } from 'node:test'
import { ok } from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const read = (relative: string) => readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')

const page = read('../pages/AccountPage.tsx')
const dialog = read('../components/account/DeleteAccountDialog.tsx')

test('AccountPage: Área sensível no estilo da ficha', () => {
  for (const text of [
    'Área sensível',
    'Excluir minha conta',
    'DeleteAccountDialog',
    'border-error/25',
    'bg-error/5',
  ]) {
    ok(page.includes(text), `falta: ${text}`)
  }
})

test('AccountPage: Área sensível vem depois do artigo de Senha', () => {
  ok(page.indexOf('Salvar senha') < page.indexOf('Área sensível'))
})

test('AccountPage: fluxo de sucesso em ordem', () => {
  const start = page.indexOf('async function onAccountDeleted')
  ok(start >= 0, 'onAccountDeleted definido')
  const end = page.indexOf('\n  }', start)
  const body = page.slice(start, end)
  const a = body.indexOf('signOutAfterAccountDeletion(')
  const b = body.indexOf('.clear()')
  const c = body.indexOf("navigate('/', { replace: true })")
  const d = body.indexOf("toast('Sua conta foi excluída.', 'success')")
  ok(a >= 0 && a < b && b < c && c < d, 'ordem signOut < clear < navigate < toast')
})

test('AccountPage: tipo da conta e contagem só para empresa', () => {
  ok(page.includes('accountDeletionKind('))
  ok(page.includes("deletionKind === 'empresa'"))
  ok(page.includes('countAccountDeletionPatients('))
  ok(page.indexOf("deletionKind === 'empresa'") < page.indexOf('countAccountDeletionPatients('))
})

test('DeleteAccountDialog: copy, bloqueio e erros fixos', () => {
  for (const text of [
    'isPending ? () => {} : onClose',
    'Digite EXCLUIR para confirmar',
    'Senha atual',
    'canSubmitAccountDeletion(',
    'deleteOwnAccount(',
    'ACCOUNT_DELETION_ERRORS.invalidPassword',
    'ACCOUNT_DELETION_ERRORS.generic',
  ]) {
    ok(dialog.includes(text), `falta: ${text}`)
  }
  ok(!dialog.includes('error.message}'))
  ok(!dialog.includes('toast(message'))
})
