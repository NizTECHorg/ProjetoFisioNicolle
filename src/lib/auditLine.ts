// Helper puro (sem imports) das linhas discretas de auditoria em pt-BR. REQ-46.

export type AuditNoun = 'paciente' | 'sessao' | 'avaliacao'

export interface AuditMeta {
  createdAt?: string | null
  createdByName?: string | null
  updatedAt?: string | null
  updatedByName?: string | null
}

export interface AuditDeletion {
  entity: 'session' | 'evaluation'
  itemDate: string | null
  at: string
  actorName: string | null
}

export interface AuditFormatOptions {
  timeZone?: string
}

// Update até 2 s depois do insert (carimbo do trigger) não conta como alteração.
export const AUDIT_EDIT_THRESHOLD_MS = 2000

const NOUN_LABELS: Record<AuditNoun, [string, string, string]> = {
  paciente: ['Paciente', 'alterado', 'criado'],
  sessao: ['Sessão', 'alterada', 'criada'],
  avaliacao: ['Avaliação', 'alterada', 'criada'],
}

const ENTITY_LABELS: Record<AuditDeletion['entity'], string> = {
  session: 'Sessão',
  evaluation: 'Avaliação',
}

const FALLBACK_ACTOR = 'alguém da equipe'

function cleanName(name: string | null | undefined): string | null {
  const trimmed = name?.trim()
  return trimmed ? trimmed : null
}

function toMs(iso: string | null | undefined): number | null {
  if (!iso) return null
  const ms = new Date(iso).getTime()
  return Number.isNaN(ms) ? null : ms
}

function partsOf(iso: string, opts: Intl.DateTimeFormatOptions, timeZone?: string) {
  const parts = new Intl.DateTimeFormat('pt-BR', { ...opts, timeZone }).formatToParts(new Date(iso))
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return get
}

function formatDay(iso: string, timeZone?: string): string {
  const get = partsOf(iso, { day: '2-digit', month: '2-digit', year: 'numeric' }, timeZone)
  return `${get('day')}/${get('month')}/${get('year')}`
}

export function formatAuditStamp(iso: string, opts?: AuditFormatOptions): string {
  const get = partsOf(
    iso,
    { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' },
    opts?.timeZone,
  )
  return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}`
}

export function formatAuditLine(meta: AuditMeta, noun: AuditNoun, opts?: AuditFormatOptions): string | null {
  const [label, edited, created] = NOUN_LABELS[noun]
  const updatedBy = cleanName(meta.updatedByName)
  const updatedMs = toMs(meta.updatedAt)
  const createdMs = toMs(meta.createdAt)

  const isEdit =
    updatedBy !== null &&
    updatedMs !== null &&
    (createdMs === null || updatedMs - createdMs > AUDIT_EDIT_THRESHOLD_MS)
  if (isEdit && meta.updatedAt) {
    return `${label} ${edited} em ${formatAuditStamp(meta.updatedAt, opts)} por ${updatedBy}`
  }

  const createdBy = cleanName(meta.createdByName)
  if (createdBy && meta.createdAt && createdMs !== null) {
    return `${label} ${created} em ${formatAuditStamp(meta.createdAt, opts)} por ${createdBy}`
  }
  return null
}

export function mergeAuditMeta(primary: AuditMeta, ...others: Array<AuditMeta | null | undefined>): AuditMeta {
  let bestAt = primary.updatedAt ?? null
  let bestBy = primary.updatedByName ?? null
  let bestMs = toMs(bestAt)
  const primaryCreatedMs = toMs(primary.createdAt)

  const consider = (at: string | null | undefined, by: string | null | undefined) => {
    const ms = toMs(at)
    if (ms === null || !at) return
    if (bestMs === null || ms > bestMs) {
      bestAt = at
      bestBy = by ?? null
      bestMs = ms
    }
  }

  for (const other of others) {
    if (!other) continue
    if (cleanName(other.updatedByName)) consider(other.updatedAt, other.updatedByName)
    const otherCreatedMs = toMs(other.createdAt)
    if (
      otherCreatedMs !== null &&
      primaryCreatedMs !== null &&
      otherCreatedMs > primaryCreatedMs + AUDIT_EDIT_THRESHOLD_MS
    ) {
      consider(other.createdAt, other.createdByName)
    }
  }

  return {
    createdAt: primary.createdAt ?? null,
    createdByName: primary.createdByName ?? null,
    updatedAt: bestAt,
    updatedByName: bestBy,
  }
}

export function formatDeletionLine(row: AuditDeletion, opts?: AuditFormatOptions): string {
  const label = ENTITY_LABELS[row.entity]
  const actor = cleanName(row.actorName) ?? FALLBACK_ACTOR
  let item = ''
  if (row.itemDate) {
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(row.itemDate)
    const day = dateOnly ? `${dateOnly[3]}/${dateOnly[2]}/${dateOnly[1]}` : formatDay(row.itemDate, opts?.timeZone)
    item = ` de ${day}`
  }
  return `${label}${item} excluída em ${formatAuditStamp(row.at, opts)} por ${actor}`
}
