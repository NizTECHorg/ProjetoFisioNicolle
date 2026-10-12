import { test } from 'node:test'
import { equal, ok } from 'node:assert/strict'
import {
  ACCOUNT_DELETION_ERRORS,
  accountDeletionCopy,
  accountDeletionErrorMessage,
  accountDeletionKind,
  canSubmitAccountDeletion,
  isAccountDeleteWordMatch,
} from './accountDeletion.ts'

test('isAccountDeleteWordMatch exige EXCLUIR exato, ignorando espaços nas pontas', () => {
  equal(isAccountDeleteWordMatch('EXCLUIR'), true)
  equal(isAccountDeleteWordMatch('  EXCLUIR '), true)
  equal(isAccountDeleteWordMatch('excluir'), false)
  equal(isAccountDeleteWordMatch('Excluir'), false)
  equal(isAccountDeleteWordMatch('EXCLUI'), false)
  equal(isAccountDeleteWordMatch(''), false)
})

test('canSubmitAccountDeletion exige palavra e senha não vazia', () => {
  equal(canSubmitAccountDeletion('EXCLUIR', 'x'), true)
  equal(canSubmitAccountDeletion('EXCLUIR', ''), false)
  equal(canSubmitAccountDeletion('excluir', 'senha'), false)
})

test('accountDeletionKind por tipo de conta e vínculo', () => {
  equal(accountDeletionKind('autonomo', null), 'autonomo')
  equal(accountDeletionKind('empresa', { role: 'owner', status: 'active' }), 'empresa')
  equal(
    accountDeletionKind('fisioterapeuta', { role: 'therapist', status: 'active' }),
    'fisio_empresa',
  )
  equal(
    accountDeletionKind('fisioterapeuta', { role: 'therapist', status: 'pending' }),
    'autonomo',
  )
  equal(accountDeletionKind('fisioterapeuta', null), 'autonomo')
  equal(accountDeletionKind(null, null), 'autonomo')
})

test('accountDeletionCopy autonomo', () => {
  const c = accountDeletionCopy('autonomo', null)
  equal(c.title, 'Excluir minha conta?')
  ok(c.description.includes('definitiva'))
  ok(c.description.includes('não pode ser desfeita'))
  const all = c.items.join(' ')
  for (const w of ['login', 'pacientes', 'financeiro', 'quadro', 'Google Agenda', 'arquivos']) {
    ok(all.includes(w), w)
  }
})

test('accountDeletionCopy empresa: contagem, plural e equipe', () => {
  ok(accountDeletionCopy('empresa', 12).items.some((i) => i.includes('12 pacientes')))
  const one = accountDeletionCopy('empresa', 1).items.join(' ')
  ok(one.includes('1 paciente'))
  ok(!one.includes('1 pacientes'))
  ok(
    accountDeletionCopy('empresa', null).items.some((i) =>
      i.includes('Todos os pacientes da empresa'),
    ),
  )
  ok(
    accountDeletionCopy('empresa', 3).items.some(
      (i) => i.includes('mantêm o login') && i.includes('perdem o vínculo') && i.includes('autônomos'),
    ),
  )
})

test('accountDeletionCopy fisio_empresa', () => {
  const c = accountDeletionCopy('fisio_empresa', null)
  const all = c.items.join(' ')
  ok(all.includes('ficam com a empresa'))
  ok(all.includes('todo o histórico'))
  ok(!all.toLowerCase().includes('financeiro'))
})

test('note fixa para os três tipos', () => {
  for (const k of ['autonomo', 'empresa', 'fisio_empresa'] as const) {
    equal(accountDeletionCopy(k, null).note, 'Eventos já enviados ao Google Agenda continuam lá.')
  }
})

test('accountDeletionErrorMessage mapeia códigos para copy fixa', () => {
  equal(accountDeletionErrorMessage('invalid_password', 401), 'Senha incorreta.')
  equal(accountDeletionErrorMessage('rate_limited', 429), ACCOUNT_DELETION_ERRORS.rateLimited)
  equal(accountDeletionErrorMessage(undefined, 429), ACCOUNT_DELETION_ERRORS.rateLimited)
  equal(accountDeletionErrorMessage('delete_failed', 500), ACCOUNT_DELETION_ERRORS.generic)
  equal(accountDeletionErrorMessage('storage_failed', 500), ACCOUNT_DELETION_ERRORS.generic)
  equal(accountDeletionErrorMessage(undefined, undefined), ACCOUNT_DELETION_ERRORS.generic)
  equal(accountDeletionErrorMessage('qualquer', 400), ACCOUNT_DELETION_ERRORS.generic)
})
