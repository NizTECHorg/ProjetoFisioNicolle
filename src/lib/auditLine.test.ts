import assert from 'node:assert/strict'
import test from 'node:test'

import {
  formatAuditLine,
  formatAuditStamp,
  formatDeletionLine,
  mergeAuditMeta,
} from './auditLine.ts'

const tz = { timeZone: 'America/Sao_Paulo' }

test('REQ-46: formatAuditStamp formata dd/mm/aaaa hh:mm sem virgula', () => {
  assert.equal(formatAuditStamp('2026-10-14T18:32:00Z', tz), '14/10/2026 15:32')
})

test('REQ-46: formatAuditLine alterada por tipo', () => {
  const meta = {
    createdAt: '2026-10-10T12:00:00Z',
    createdByName: 'Ana',
    updatedAt: '2026-10-14T18:32:00Z',
    updatedByName: 'Nicolle',
  }
  assert.equal(formatAuditLine(meta, 'avaliacao', tz), 'Avaliação alterada em 14/10/2026 15:32 por Nicolle')
  assert.equal(formatAuditLine(meta, 'sessao', tz), 'Sessão alterada em 14/10/2026 15:32 por Nicolle')
  assert.equal(formatAuditLine(meta, 'paciente', tz), 'Paciente alterado em 14/10/2026 15:32 por Nicolle')
})

test('REQ-46: formatAuditLine criada quando nunca alterada', () => {
  assert.equal(
    formatAuditLine(
      { createdAt: '2026-10-10T12:00:00Z', createdByName: 'Ana', updatedAt: null, updatedByName: null },
      'avaliacao',
      tz,
    ),
    'Avaliação criada em 10/10/2026 09:00 por Ana',
  )
})

test('REQ-46: update ate 2 s depois da criacao conta como criacao', () => {
  assert.equal(
    formatAuditLine(
      {
        createdAt: '2026-10-10T12:00:00Z',
        createdByName: 'Ana',
        updatedAt: '2026-10-10T12:00:01Z',
        updatedByName: 'Nicolle',
      },
      'avaliacao',
      tz,
    ),
    'Avaliação criada em 10/10/2026 09:00 por Ana',
  )
})

test('REQ-46: nome so com espacos conta como ausente; nomes sao aparados', () => {
  assert.equal(
    formatAuditLine(
      {
        createdAt: '2026-10-10T12:00:00Z',
        createdByName: '  Ana ',
        updatedAt: '2026-10-14T18:32:00Z',
        updatedByName: '   ',
      },
      'sessao',
      tz,
    ),
    'Sessão criada em 10/10/2026 09:00 por Ana',
  )
})

test('REQ-46: sem autor retorna null', () => {
  assert.equal(formatAuditLine({}, 'sessao', tz), null)
  assert.equal(formatAuditLine({ createdByName: 'Ana' }, 'sessao', tz), null)
})

test('REQ-46: mergeAuditMeta usa evolucao criada depois como alteracao da sessao', () => {
  const merged = mergeAuditMeta(
    { createdAt: '2026-10-10T12:00:00Z', createdByName: 'Ana', updatedAt: null, updatedByName: null },
    { createdAt: '2026-10-14T18:32:00Z', createdByName: 'Nicolle', updatedAt: null, updatedByName: null },
  )
  assert.equal(merged.createdByName, 'Ana')
  assert.equal(formatAuditLine(merged, 'sessao', tz), 'Sessão alterada em 14/10/2026 15:32 por Nicolle')
})

test('REQ-46: mergeAuditMeta escolhe o mais recente e ignora null/undefined', () => {
  const primary = {
    createdAt: '2026-10-10T12:00:00Z',
    createdByName: 'Ana',
    updatedAt: '2026-10-12T12:00:00Z',
    updatedByName: 'Bia',
  }
  assert.deepEqual(mergeAuditMeta(primary, null, undefined), primary)
  const merged = mergeAuditMeta(primary, {
    createdAt: '2026-10-10T12:00:00Z',
    createdByName: 'Ana',
    updatedAt: '2026-10-14T18:32:00Z',
    updatedByName: 'Nicolle',
  })
  assert.equal(merged.updatedByName, 'Nicolle')
  assert.equal(merged.updatedAt, '2026-10-14T18:32:00Z')
})

test('REQ-46: formatDeletionLine sessao e avaliacao', () => {
  assert.equal(
    formatDeletionLine(
      { entity: 'session', itemDate: '2026-10-10T13:00:00Z', at: '2026-10-14T18:32:00Z', actorName: 'Nicolle' },
      tz,
    ),
    'Sessão de 10/10/2026 excluída em 14/10/2026 15:32 por Nicolle',
  )
  assert.equal(
    formatDeletionLine(
      { entity: 'evaluation', itemDate: '2026-10-10', at: '2026-10-14T18:32:00Z', actorName: 'Nicolle' },
      tz,
    ),
    'Avaliação de 10/10/2026 excluída em 14/10/2026 15:32 por Nicolle',
  )
})

test('REQ-46: formatDeletionLine sem data do item e sem autor', () => {
  assert.equal(
    formatDeletionLine({ entity: 'session', itemDate: null, at: '2026-10-14T18:32:00Z', actorName: null }, tz),
    'Sessão excluída em 14/10/2026 15:32 por alguém da equipe',
  )
})
