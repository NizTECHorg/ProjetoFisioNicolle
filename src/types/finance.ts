/**
 * Contratos do financeiro do autônomo (REQ-17).
 * Não estender database.types.ts nem importar permissions.ts.
 */

export interface AutonomoPrice {
  id: string
  ownerId: string
  name: string
  amountBrl: number
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface SessionCharge {
  id: string
  ownerId: string
  sessionId: string
  priceId: string | null
  priceName: string
  amountBrl: number
  isPaid: boolean
}

export interface FinanceTotals {
  monthTotal: number
  yearTotal: number
  alwaysTotal: number
}

export interface FinanceRealizadaRow {
  sessionId: string
  patientId: string
  patientName: string
  scheduledAt: string
  charge: SessionCharge | null
}

export interface CreatePriceInput {
  name: string
  amountBrl: number
}

export interface UpdatePriceInput {
  name: string
  amountBrl: number
}

export interface SessionChargeDraft {
  priceId: string | null
  adHocAmountBrl: number | null
  isPaid: boolean
}

export interface UpsertSessionChargeInput extends SessionChargeDraft {
  sessionId: string
}
