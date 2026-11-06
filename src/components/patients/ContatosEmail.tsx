import { useEffect, useState, type KeyboardEvent } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useDeleteEmailContact, useEmailContacts, useSaveEmailContact } from '@/hooks/useEmailContacts'
import {
  CONTATO_EMAIL_MAX,
  CONTATO_EMAIL_NOME_MAX,
  buscarContatosEmail,
  validarContatoEmail,
} from '@/lib/contatosEmail'

const BUSCA_A_PARTIR_DE = 6

const campoClass = 'min-h-11 w-full min-w-0 rounded-xl border border-line bg-canvas px-3 text-sm text-ink'

type Props = {
  open: boolean
  selecionados: string[]
  /** true quando já tem o máximo de pessoas: só dá para desmarcar. */
  lotado: boolean
  onAlternar: (email: string) => void
}

/** Contatos salvos da conta: marcar inclui a pessoa no envio, em qualquer paciente. */
export function ContatosEmail({ open, selecionados, lotado, onAlternar }: Props) {
  const { data: contatos = [], isError } = useEmailContacts(open)
  const salvar = useSaveEmailContact()
  const remover = useDeleteEmailContact()
  const [busca, setBusca] = useState('')
  const [novoAberto, setNovoAberto] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setBusca('')
    setNovoAberto(false)
    setNome('')
    setEmail('')
    setErro(null)
  }, [open])

  function salvarNovo() {
    const contato = validarContatoEmail(nome, email)
    if (!contato.ok) {
      setErro(contato.erro)
      return
    }
    setErro(null)
    salvar.mutate(
      { nome: contato.nome, email: contato.email },
      {
        onSuccess: () => {
          setNome('')
          setEmail('')
          setNovoAberto(false)
          if (!lotado && !selecionados.includes(contato.email)) onAlternar(contato.email)
        },
      },
    )
  }

  // Estes campos ficam dentro do formulário de envio: Enter aqui não pode mandar o e-mail.
  function semEnviar(event: KeyboardEvent<HTMLInputElement>, acao?: () => void) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    acao?.()
  }

  const encontrados = buscarContatosEmail(contatos, busca)

  return (
    <div className="space-y-2 border-t border-line pt-4">
      <p className="text-sm font-medium text-ink">Contatos salvos</p>
      {isError ? <p className="text-xs text-error">Não foi possível carregar os contatos salvos.</p> : null}

      {contatos.length >= BUSCA_A_PARTIR_DE ? (
        <label className="flex min-h-11 items-center gap-2 rounded-xl border border-line bg-canvas px-3">
          <Search size={15} className="shrink-0 text-muted" aria-hidden />
          <input
            type="search"
            autoComplete="off"
            placeholder="Buscar por nome"
            aria-label="Buscar contato por nome"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            onKeyDown={(event) => semEnviar(event)}
            className="min-h-10 w-full min-w-0 bg-transparent text-sm text-ink outline-none"
          />
        </label>
      ) : null}

      {contatos.length > 0 && encontrados.length === 0 ? (
        <p className="text-sm text-muted">Nenhum contato com esse nome.</p>
      ) : null}

      {encontrados.length > 0 ? (
        <ul className="max-h-60 space-y-1 overflow-y-auto">
          {encontrados.map((contato) => {
            const marcado = selecionados.includes(contato.email)
            return (
              <li key={contato.id} className="flex min-h-12 items-center gap-2 rounded-xl border border-line px-3 py-1.5">
                <label className={['flex min-w-0 flex-1 items-center gap-3', lotado && !marcado ? 'opacity-60' : 'cursor-pointer'].join(' ')}>
                  <input
                    type="checkbox"
                    className="accent-forest"
                    checked={marcado}
                    disabled={lotado && !marcado}
                    onChange={() => onAlternar(contato.email)}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink">{contato.nome}</span>
                    <span className="block truncate text-xs text-muted">{contato.email}</span>
                  </span>
                </label>
                <button
                  type="button"
                  aria-label={`Remover ${contato.nome} dos contatos`}
                  disabled={remover.isPending}
                  onClick={() => {
                    if (marcado) onAlternar(contato.email)
                    remover.mutate(contato.id)
                  }}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted hover:text-error"
                >
                  <X size={16} aria-hidden />
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}

      {novoAberto ? (
        <div className="space-y-2 rounded-xl border border-line p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="text"
              autoComplete="off"
              autoFocus
              maxLength={CONTATO_EMAIL_NOME_MAX}
              placeholder="Nome"
              aria-label="Nome do contato"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              onKeyDown={(event) => semEnviar(event, salvarNovo)}
              className={campoClass}
            />
            <input
              type="email"
              inputMode="email"
              autoComplete="off"
              maxLength={CONTATO_EMAIL_MAX}
              placeholder="Ex.: medico@clinica.com"
              aria-label="E-mail do contato"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onKeyDown={(event) => semEnviar(event, salvarNovo)}
              className={campoClass}
            />
          </div>
          {erro ? <p className="text-xs text-error">{erro}</p> : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" className="min-h-11" onClick={() => setNovoAberto(false)}>
              Cancelar
            </Button>
            <Button type="button" className="min-h-11" isLoading={salvar.isPending} onClick={salvarNovo}>
              Salvar contato
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setNovoAberto(true)}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-forest hover:bg-accent-soft"
        >
          <Plus size={15} aria-hidden />
          Salvar novo contato
        </button>
      )}
    </div>
  )
}
