import { supabase } from '@/lib/supabase/client'
import { mapDbError, sanitizeText } from '@/lib/security'
import type {
  AutonomoPrice,
  CreatePriceInput,
  FinanceRealizadaRow,
  FinanceTotals,
  SessionCharge,
  UpdatePriceInput,
  UpsertSessionChargeInput,
} from '@/types/finance'

const PRICE_COLUMNS = 'id, owner_id, name, amount_brl, archived_at, created_at, updated_at'
const CHARGE_COLUMNS = 'id, owner_id, session_id, price_id, price_name, amount_brl, is_paid'
const REALIZADA_COLUMNS = 'id, patient_id, scheduled_at, status, created_by, patients(full_name)'

interface PriceRow {
  id: string
  owner_id: string
  name: string
  amount_brl: number | string
  archived_at: string | null
  created_at: string
  updated_at: string
}

interface ChargeRow {
  id: string
  owner_id: string
  session_id: string
  price_id: string | null
  price_name: string
  amount_brl: number | string
  is_paid: boolean
}

interface TotalsRow {
  month_total: number | string | null
  year_total: number | string | null
  always_total: number | string | null
}

interface PatientEmbed {
  full_name: string | null
}

interface RealizadaSessionRow {
  id: string
  patient_id: string
  scheduled_at: string
  status: string
  created_by: string
  patients: PatientEmbed | PatientEmbed[] | null
}

function throwIfError(error: { message?: string; code?: string } | null) {
  if (error) throw new Error(mapDbError(error))
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  throwIfError(error)
  if (!data.user) throw new Error('Sessão expirada. Entre novamente.')
  return data.user.id
}

function embedPatient(value: RealizadaSessionRow['patients']): PatientEmbed | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function mapPrice(row: PriceRow): AutonomoPrice {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    amountBrl: Number(row.amount_brl),
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapCharge(row: ChargeRow): SessionCharge {
  return {
    id: row.id,
    ownerId: row.owner_id,
    sessionId: row.session_id,
    priceId: row.price_id,
    priceName: row.price_name,
    amountBrl: Number(row.amount_brl),
    isPaid: row.is_paid,
  }
}

function mapTotals(row: TotalsRow | null | undefined): FinanceTotals {
  return {
    monthTotal: Number(row?.month_total ?? 0),
    yearTotal: Number(row?.year_total ?? 0),
    alwaysTotal: Number(row?.always_total ?? 0),
  }
}

function firstTotalsRow(data: TotalsRow | TotalsRow[] | null): TotalsRow | null {
  if (!data) return null
  return Array.isArray(data) ? (data[0] ?? null) : data
}

export async function listActivePrices(): Promise<AutonomoPrice[]> {
  const { data, error } = await supabase
    .from('autonomo_prices')
    .select(PRICE_COLUMNS)
    .is('archived_at', null)
    .order('created_at', { ascending: true })

  throwIfError(error)
  return ((data ?? []) as PriceRow[]).map(mapPrice)
}

export async function createPrice(input: CreatePriceInput): Promise<AutonomoPrice> {
  const ownerId = await requireUserId()
  const { data, error } = await supabase
    .from('autonomo_prices')
    .insert({
      owner_id: ownerId,
      name: sanitizeText(input.name, 80),
      amount_brl: input.amountBrl,
    })
    .select(PRICE_COLUMNS)
    .single()

  throwIfError(error)
  return mapPrice(data as PriceRow)
}

export async function updatePrice(id: string, input: UpdatePriceInput): Promise<AutonomoPrice> {
  const { data, error } = await supabase
    .from('autonomo_prices')
    .update({
      name: sanitizeText(input.name, 80),
      amount_brl: input.amountBrl,
    })
    .eq('id', id)
    .select(PRICE_COLUMNS)
    .single()

  throwIfError(error)
  return mapPrice(data as PriceRow)
}

export async function archivePrice(id: string): Promise<void> {
  const { error } = await supabase
    .from('autonomo_prices')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)

  throwIfError(error)
}

export async function fetchFinanceTotals(): Promise<FinanceTotals> {
  const { data, error } = await supabase.rpc('autonomo_finance_totals').maybeSingle()
  throwIfError(error)
  return mapTotals(firstTotalsRow(data as TotalsRow | TotalsRow[] | null))
}

export async function fetchChargeBySessionId(sessionId: string): Promise<SessionCharge | null> {
  const { data, error } = await supabase
    .from('autonomo_session_charges')
    .select(CHARGE_COLUMNS)
    .eq('session_id', sessionId)
    .maybeSingle()

  throwIfError(error)
  if (!data) return null
  return mapCharge(data as ChargeRow)
}

export async function fetchChargesBySessionIds(sessionIds: string[]): Promise<SessionCharge[]> {
  if (sessionIds.length === 0) return []

  const { data, error } = await supabase
    .from('autonomo_session_charges')
    .select(CHARGE_COLUMNS)
    .in('session_id', sessionIds)

  throwIfError(error)
  return ((data ?? []) as ChargeRow[]).map(mapCharge)
}

export async function upsertSessionCharge(input: UpsertSessionChargeInput): Promise<void> {
  const ownerId = await requireUserId()
  const hasCatalog = Boolean(input.priceId)
  const adHocAmount = input.adHocAmountBrl
  const hasAdHoc = adHocAmount != null && adHocAmount > 0

  if (!hasCatalog && !hasAdHoc) return

  if (hasCatalog) {
    const { error } = await supabase.from('autonomo_session_charges').upsert(
      {
        owner_id: ownerId,
        session_id: input.sessionId,
        price_id: input.priceId,
        is_paid: input.isPaid,
      },
      { onConflict: 'session_id' },
    )
    throwIfError(error)
    return
  }

  const { error } = await supabase.from('autonomo_session_charges').upsert(
    {
      owner_id: ownerId,
      session_id: input.sessionId,
      price_id: null,
      amount_brl: adHocAmount,
      is_paid: input.isPaid,
    },
    { onConflict: 'session_id' },
  )
  throwIfError(error)
}

export async function markChargePaid(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('autonomo_session_charges')
    .update({ is_paid: true })
    .eq('session_id', sessionId)

  throwIfError(error)
}

export async function listFinanceRealizadas(): Promise<FinanceRealizadaRow[]> {
  const userId = await requireUserId()
  const { data, error } = await supabase
    .from('patient_sessions')
    .select(REALIZADA_COLUMNS)
    .eq('status', 'realizada')
    .eq('created_by', userId)
    .order('scheduled_at', { ascending: false })

  throwIfError(error)

  const sessions = (data ?? []) as RealizadaSessionRow[]
  if (sessions.length === 0) return []

  const sessionIds = sessions.map((row) => row.id)
  const { data: chargeData, error: chargeError } = await supabase
    .from('autonomo_session_charges')
    .select(CHARGE_COLUMNS)
    .in('session_id', sessionIds)

  throwIfError(chargeError)

  const chargesBySession = new Map(
    ((chargeData ?? []) as ChargeRow[]).map((row) => [row.session_id, mapCharge(row)]),
  )

  return sessions.map((row) => {
    const patient = embedPatient(row.patients)
    return {
      sessionId: row.id,
      patientId: row.patient_id,
      patientName: patient?.full_name?.trim() || 'Paciente',
      scheduledAt: row.scheduled_at,
      charge: chargesBySession.get(row.id) ?? null,
    }
  })
}
