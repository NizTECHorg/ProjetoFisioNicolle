import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Copy, Inbox } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/ui/DataTable'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useAuth } from '@/hooks/useAuth'
import { useDecideMembership, useTeam } from '@/hooks/useTeam'
import { canManageTeam } from '@/lib/accountAccess'
import { toast } from '@/stores/toast.store'
import type { TeamMember } from '@/types/account'

function formatJoinCode(code: string): string {
  const raw = code.replace(/\s+/g, '')
  if (raw.length === 8) return `${raw.slice(0, 4)} ${raw.slice(4)}`
  return raw
}

function memberName(member: TeamMember): string {
  return member.fullName.trim() || 'este fisioterapeuta'
}

export function TeamPage() {
  const { profile } = useAuth()
  const { data, isLoading, isError } = useTeam()
  const decide = useDecideMembership()
  const [pendingReject, setPendingReject] = useState<TeamMember | null>(null)

  if (!canManageTeam(profile?.accountType)) {
    return <Navigate to="/pacientes" replace />
  }

  const members = data?.members ?? []
  const joinCode = data?.organization?.joinCode ?? ''
  const pending = members.filter((member) => member.status === 'pending' && member.role === 'therapist')
  const active = members.filter((member) => member.status === 'active' && member.role === 'therapist')
  const decidingId = decide.isPending ? decide.variables?.membershipId : undefined

  async function copyCode() {
    const raw = joinCode.replace(/\s+/g, '')
    if (!raw) {
      toast('Não foi possível copiar. Selecione o código e copie manualmente.', 'error')
      return
    }
    try {
      await navigator.clipboard.writeText(raw)
      toast('Código copiado')
    } catch {
      toast('Não foi possível copiar. Selecione o código e copie manualmente.', 'error')
    }
  }

  function acceptMember(member: TeamMember) {
    decide.mutate({ membershipId: member.id, accept: true, fullName: member.fullName })
  }

  return (
    <section className="mx-auto w-full max-w-7xl">
      <PageHeader
        className="dash-in"
        title="Equipe"
        description="Compartilhe o código e aceite os pedidos dos fisioterapeutas."
      />

      {isLoading ? (
        <div className="dash-in flex min-h-48 items-center justify-center rounded-2xl border border-line bg-surface">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-forest border-t-transparent" />
        </div>
      ) : null}

      {isError ? (
        <article className="dash-in rounded-2xl border border-error/20 bg-error/5 px-6 py-8 text-sm text-error">
          Não foi possível carregar a equipe. Tente de novo em instantes.
        </article>
      ) : null}

      {!isLoading && !isError ? (
        <div className="space-y-6">
          <article className="dash-in rounded-2xl border border-line bg-surface p-4 md:p-6">
            <h2 className="text-xl font-semibold leading-tight text-ink">Código da empresa</h2>
            <p className="mt-1 text-sm leading-6 text-muted">O fisioterapeuta cola este código no cadastro.</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p className="font-sans text-xl font-semibold tracking-widest text-ink">
                {joinCode ? formatJoinCode(joinCode) : '—'}
              </p>
              <Button
                type="button"
                variant="secondary"
                className="min-h-11 min-w-11"
                aria-label="Copiar código"
                onClick={() => void copyCode()}
                disabled={!joinCode}
              >
                <Copy size={16} />
                Copiar código
              </Button>
            </div>
          </article>

          <section className="dash-in" style={{ animationDelay: '80ms' }}>
            <h2 className="mb-4 text-xl font-semibold leading-tight text-ink">Pedidos pendentes</h2>
            {pending.length === 0 ? (
              <article className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-line bg-surface px-6 py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                  <Inbox size={22} />
                </div>
                <p className="mt-4 text-sm font-medium text-ink">Nenhum pedido pendente</p>
                <p className="mt-1 max-w-sm text-xs leading-5 text-muted">
                  Compartilhe o código da empresa. O fisioterapeuta informa esse código no cadastro.
                </p>
              </article>
            ) : (
              <>
                <div className="space-y-3 md:hidden">
                  {pending.map((member) => (
                    <article key={member.id} className="rounded-2xl border border-line bg-surface p-4">
                      <p className="text-sm font-semibold text-ink">{member.fullName || '—'}</p>
                      <p className="mt-0.5 text-xs text-muted">{member.email || '—'}</p>
                      <div className="mt-3">
                        <Badge tone="info">Pendente</Badge>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={decidingId === member.id}
                          onClick={() => acceptMember(member)}
                        >
                          Aceitar pedido
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-error"
                          disabled={decidingId === member.id}
                          onClick={() => setPendingReject(member)}
                        >
                          Recusar pedido
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface md:block">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-line bg-canvas text-xs uppercase tracking-wide text-muted">
                      <tr>
                        <th className="px-4 py-3 font-medium">Nome</th>
                        <th className="px-4 py-3 font-medium">E-mail</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pending.map((member) => (
                        <tr key={member.id} className="border-b border-line last:border-0">
                          <td className="px-4 py-3.5 text-sm font-semibold text-ink">{member.fullName || '—'}</td>
                          <td className="px-4 py-3.5 text-xs text-muted">{member.email || '—'}</td>
                          <td className="px-4 py-3.5">
                            <Badge tone="info">Pendente</Badge>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                variant="secondary"
                                disabled={decidingId === member.id}
                                onClick={() => acceptMember(member)}
                              >
                                Aceitar pedido
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                className="text-error"
                                disabled={decidingId === member.id}
                                onClick={() => setPendingReject(member)}
                              >
                                Recusar pedido
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>

          <section className="dash-in" style={{ animationDelay: '120ms' }}>
            <h2 className="mb-4 text-xl font-semibold leading-tight text-ink">Fisioterapeutas na equipe</h2>
            <DataTable
              columns={[
                {
                  key: 'name',
                  header: 'Nome',
                  render: (row) => <span className="text-sm font-semibold text-ink">{row.fullName || '—'}</span>,
                },
                {
                  key: 'email',
                  header: 'E-mail',
                  render: (row) => <span className="text-xs text-muted">{row.email || '—'}</span>,
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: () => <Badge tone="info">Na equipe</Badge>,
                },
              ]}
              data={active}
              rowKey={(row) => row.id}
              emptyTitle="Nenhum fisioterapeuta na equipe"
              emptyDescription="Quando você aceitar um pedido, o nome aparece aqui."
            />
          </section>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingReject)}
        title="Recusar pedido"
        description={
          pendingReject
            ? `A conta de ${memberName(pendingReject)} será cancelada. Essa pessoa precisará se cadastrar de novo com outro e-mail.`
            : ''
        }
        confirmLabel="Recusar e cancelar conta"
        cancelLabel="Voltar sem recusar"
        tone="danger"
        isLoading={decide.isPending && decide.variables?.accept === false}
        onClose={() => setPendingReject(null)}
        onConfirm={() => {
          if (!pendingReject) return
          decide.mutate(
            { membershipId: pendingReject.id, accept: false, fullName: pendingReject.fullName },
            { onSuccess: () => setPendingReject(null) },
          )
        }}
      />
    </section>
  )
}
