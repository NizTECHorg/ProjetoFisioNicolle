import { test } from 'node:test'
import { deepEqual, equal } from 'node:assert/strict'
import {
  PATIENT_FILE_BUCKETS,
  isDeleteNameMatch,
  patientFilePathsFromListing,
} from './patientDeleteConfirm.ts'

test('isDeleteNameMatch ignora espaços nas pontas e caixa', () => {
  equal(isDeleteNameMatch('  maria silva ', 'Maria Silva'), true)
  equal(isDeleteNameMatch('MARIA SILVA', 'Maria Silva'), true)
})

test('isDeleteNameMatch não libera vazio nem parcial', () => {
  equal(isDeleteNameMatch('', 'Maria Silva'), false)
  equal(isDeleteNameMatch('   ', 'Maria Silva'), false)
  equal(isDeleteNameMatch('Maria', 'Maria Silva'), false)
})

test('isDeleteNameMatch: acento conta e Unicode é normalizado', () => {
  equal(isDeleteNameMatch('joão', 'João'), true)
  equal(isDeleteNameMatch('joao', 'João'), false)
  equal(isDeleteNameMatch('João', 'João'), true)
})

test('isDeleteNameMatch: nome vazio nunca libera', () => {
  equal(isDeleteNameMatch('x', ''), false)
  equal(isDeleteNameMatch('', ''), false)
})

test('patientFilePathsFromListing descarta pseudo-pastas', () => {
  deepEqual(
    patientFilePathsFromListing('p1', [
      { name: 'a.jpg', id: '1' },
      { name: 'sub', id: null },
      { name: '.emptyFolderPlaceholder', id: '2' },
    ]),
    ['p1/a.jpg', 'p1/.emptyFolderPlaceholder'],
  )
})

test('PATIENT_FILE_BUCKETS', () => {
  deepEqual([...PATIENT_FILE_BUCKETS], ['patient-avatars', 'patient-images', 'patient-ai-reports'])
})
