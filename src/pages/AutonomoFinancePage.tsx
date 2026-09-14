import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Wallet } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DataTable } from '@/components/ui/DataTable'
import { useAuth } from '@/hooks/useAuth'
import {
  useArchivePrice,
  useCreatePrice,
  useFinancePrices,
  useFinanceRealizadas,
  useFinanceTotals,
  useUpdatePrice,
} from '@/hooks/useFinance'
import { canSeeFinance } from '@/lib/accountAccess'
import { formatCurrency } from '@/lib/security'
import { emptyPriceForm, parseBrlInput, priceFormSchema, type PriceFormData } from '@/schemas/finance.schema'
import type { AutonomoPrice } from '@/types/finance'

function formatBrlInput(value: number): string {
  return value.toFixed(2).replace('.', ',')
}

export function AutonomoFinancePage() {
  const { profile } = useAuth()
  const pricesQuery = useFinancePrices()
  const totalsQuery = useFinanceTotals()
  const realizadasQuery = useFinanceRealizadas()
  const createPrice = useCreatePrice()
  const updatePrice = useUpdatePrice()
  const archivePrice = useArchivePrice()

  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<AutonomoPrice | null>(null)
  const [pendingArchive, setPendingArchive] = useState<AutonomoPrice | null>(null)

  const createForm = useForm<PriceFormData>({
    resolver: zodResolver(priceFormSchema),
    defaultValues: emptyPriceForm(),
  })
  const editForm = useForm<PriceFormData>({
    resolver: zodResolver(priceFormSchema),
    defaultValues: emptyPriceForm(),
  })

  if (!canSeeFinance(profile?.accountType)) {
    return <Navigate to="/pacientes" replace />
  }

  const isLoading = pricesQuery.isLoading || totalsQuery.isLoading || realizadasQuery.isLoading
  const isError = pricesQuery.isError || totalsQuery.isError || realizadasQuery.isError
  const prices = pricesQuery.data ?? []
  const monthTotal = formatCurrency(Number(totalsQuery.data?.monthTotal ?? 0))
  const yearTotal = formatCurrency(Number(totalsQuery.data?.yearTotal ?? 0))
  const alwaysTotal = formatCurrency(Number(totalsQuery.data?.alwaysTotal ?? 0))

  function openCreate() {
    createForm.reset(emptyPriceForm())
    setCreateOpen(true)
  }

  function closeCreate() {
    setCreateOpen(false)
    createForm.reset(emptyPriceForm())
  }

  function openEdit(price: AutonomoPrice) {
    editForm.reset({ name: price.name, amount: formatBrlInput(price.amountBrl) })
    setEditing(price)
  }

  function closeEdit() {
    setEditing(null)
    editForm.reset(emptyPriceForm())
  }

  function onCreate(values: PriceFormData) {
    const amountBrl = parseBrlInput(values.amount)
    if (amountBrl === null) return
    createPrice.mutate(
      { name: values.name, amountBrl },
      { onSuccess: () => closeCreate() },
    )
  }

  function onEdit(values: PriceFormData) {
    if (!editing) return
    const amountBrl = parseBrlInput(values.amount)
    if (amountBrl === null) return
    updatePrice.mutate(
      { id: editing.id, input: { name: values.name, amountBrl } },
      { onSuccess: () => closeEdit() },
    )
  }

  return (
    <section className="mx-auto w-full max-w-7xl">
      <PageHeader
        className="dash-in"
        title="Financeiro"
        description="Catálogo de preços, sessões realizadas e o que já foi pago."
        action={
          <Button type="button" onClick={openCreate}>
            <Plus size={16} />
            Novo preço
          </Button>
        }
      />

      {isLoading ? (
        <div className="dash-in flex min-h-48 items-center justify-center rounded-2xl border border-line bg-surface">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-forest border-t-transparent" />
        </div>
      ) : null}

      {isError ? (
        <article className="dash-in rounded-2xl border border-error/20 bg-error/5 px-6 py-8 text-sm text-error">
          Não foi possível carregar o financeiro. Tente de novo em instantes.
        </article>
      ) : null}

      {!isLoading && !isError ? (
        <div className="space-y-6">
          <section className="dash-in">
            <h2 className="mb-4 text-xl font-semibold leading-tight text-ink">Totais</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <article className="rounded-2xl border border-line bg-surface p-4 md:p-6">
                <p className="text-sm text-muted">Este mês</p>
                <p className="mt-2 text-3xl font-semibold leading-tight text-ink">{monthTotal}</p>
              </article>
              <article className="rounded-2xl border border-line bg-surface p-4 md:p-6">
                <p className="text-sm text-muted">Este ano</p>
                <p className="mt-2 text-3xl font-semibold leading-tight text-ink">{yearTotal}</p>
              </article>
              <article className="rounded-2xl border border-line bg-surface p-4 md:p-6">
                <p className="text-sm text-muted">Sempre</p>
                <p className="mt-2 text-3xl font-semibold leading-tight text-ink">{alwaysTotal}</p>
              </article>
            </div>
            <p className="mt-3 text-xs text-muted">
              Soma das sessões pagas, inclusive pré-pagas agendadas.
            </p>
          </section>

          <section className="dash-in" style={{ animationDelay: '80ms' }}>
            <h2 className="mb-4 text-xl font-semibold leading-tight text-ink">Catálogo de preços</h2>
            {prices.length === 0 ? (
              <article className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-line bg-surface px-6 py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                  <Wallet size={22} />
                </div>
                <p className="mt-4 text-sm font-semibold text-ink">Nenhum preço no catálogo</p>
                <p className="mt-1 max-w-sm text-sm leading-5 text-muted">
                  Cadastre um preço com Novo preço. Na sessão você ainda pode informar um valor avulso.
                </p>
              </article>
            ) : (
              <DataTable
                columns={[
                  {
                    key: 'name',
                    header: 'Nome',
                    render: (row) => <span className="text-sm font-semibold text-ink">{row.name}</span>,
                  },
                  {
                    key: 'amount',
                    header: 'Valor',
                    render: (row) => formatCurrency(Number(row.amountBrl)),
                  },
                  {
                    key: 'actions',
                    header: 'Ações',
                    render: (row) => (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          className="min-h-11 min-w-11"
                          onClick={() => openEdit(row)}
                        >
                          Editar preço
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="min-h-11 min-w-11 text-error"
                          onClick={() => setPendingArchive(row)}
                        >
                          Arquivar preço
                        </Button>
                      </div>
                    ),
                  },
                ]}
                data={prices}
                rowKey={(row) => row.id}
              />
            )}
          </section>

          <section className="dash-in" style={{ animationDelay: '120ms' }}>
            <h2 className="text-xl font-semibold leading-tight text-ink">Sessões realizadas</h2>
          </section>
        </div>
      ) : null}

      <Modal
        open={createOpen}
        title="Novo preço"
        description="O valor entra no catálogo para escolher na sessão."
        onClose={closeCreate}
      >
        <form className="space-y-4" onSubmit={createForm.handleSubmit(onCreate)}>
          <Input
            label="Nome do preço"
            placeholder="Ex.: Domiciliar"
            autoFocus
            error={createForm.formState.errors.name?.message}
            {...createForm.register('name')}
          />
          <Input
            label="Valor (R$)"
            placeholder="0,00"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            hint="Use vírgula para centavos. Ex.: 180,50"
            error={createForm.formState.errors.amount?.message}
            {...createForm.register('amount')}
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={closeCreate}>
              Voltar
            </Button>
            <Button type="submit" isLoading={createPrice.isPending}>
              Cadastrar preço
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(editing)}
        title="Editar preço"
        description="Alterar o valor vale só para sessões futuras. Sessões já gravadas não mudam."
        onClose={closeEdit}
      >
        <form className="space-y-4" onSubmit={editForm.handleSubmit(onEdit)}>
          <Input
            label="Nome do preço"
            placeholder="Ex.: Domiciliar"
            autoFocus
            error={editForm.formState.errors.name?.message}
            {...editForm.register('name')}
          />
          <Input
            label="Valor (R$)"
            placeholder="0,00"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            hint="Use vírgula para centavos. Ex.: 180,50"
            error={editForm.formState.errors.amount?.message}
            {...editForm.register('amount')}
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={closeEdit}>
              Voltar
            </Button>
            <Button type="submit" isLoading={updatePrice.isPending}>
              Salvar preço
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingArchive)}
        title="Arquivar preço?"
        description="Este preço sai do catálogo de novas sessões. Sessões já gravadas mantêm o valor e o nome da época."
        confirmLabel="Arquivar preço"
        cancelLabel="Voltar sem arquivar"
        tone="danger"
        isLoading={archivePrice.isPending}
        onClose={() => setPendingArchive(null)}
        onConfirm={() => {
          if (!pendingArchive) return
          archivePrice.mutate(pendingArchive.id, {
            onSuccess: () => setPendingArchive(null),
          })
        }}
      />
    </section>
  )
}
