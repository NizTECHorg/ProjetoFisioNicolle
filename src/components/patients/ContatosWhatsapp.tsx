import { useEffect, useState, type ReactNode } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useDeleteWhatsappContact, useSaveWhatsappContact, useWhatsappContacts } from '@/hooks/useWhatsappContacts'
import { CONTATO_NOME_MAX, buscarContatos, validarContato } from '@/lib/contatosWhatsapp'

const BUSCA_A_PARTIR_DE = 6

const campoClass = 'min-h-11 w-full min-w-0 rounded-xl border border-line bg-canvas px-3 text-sm text-ink'

type Props = {
  open: boolean
  formatar: (digits: string) => string
  /** Botão de abrir a conversa, o mesmo das outras linhas do diálogo. */
  botao: (digits: string, rotulo: string) => ReactNode
}

/** Contatos salvos da conta, disponíveis no envio de qualquer paciente. */
export function ContatosWhatsapp({ open, formatar, botao }: Props) {
  const { data: contatos = [], isError } = useWhatsappContacts(open)
  const salvar = useSaveWhatsappContact()
  const remover = useDeleteWhatsappContact()
  const [busca, setBusca] = useState('')
  const [novoAberto, setNovoAberto] = useState(false)
  const [nome, setNome] = useState('')
  const [numero, setNumero] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setBusca('')
    setNovoAberto(false)
    setNome('')
    setNumero('')
    setErro(null)
  }, [open])

  function salvarNovo() {
    const contato = validarContato(nome, numero)
    if (!contato.ok) {
      setErro(contato.erro)
      return
    }
    setErro(null)
    salvar.mutate(
      { nome: contato.nome, digits: contato.digits },
      {
        onSuccess: () => {
          setNome('')
          setNumero('')
          setNovoAberto(false)
        },
      },
    )
  }

  const encontrados = buscarContatos(contatos, busca)

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
            className="min-h-10 w-full min-w-0 bg-transparent text-sm text-ink outline-none"
          />
        </label>
      ) : null}

      {contatos.length > 0 && encontrados.length === 0 ? (
        <p className="text-sm text-muted">Nenhum contato com esse nome.</p>
      ) : null}

      {encontrados.length > 0 ? (
        <ul className="max-h-60 space-y-1 overflow-y-auto">
          {encontrados.map((contato) => (
            <li key={contato.id} className="flex min-h-12 items-center gap-2 rounded-xl border border-line px-3 py-1.5">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink">{contato.nome}</span>
                <span className="block truncate text-xs text-muted">{formatar(contato.digits)}</span>
              </span>
              {botao(contato.digits, contato.nome)}
              <button
                type="button"
                aria-label={`Remover ${contato.nome} dos contatos`}
                disabled={remover.isPending}
                onClick={() => remover.mutate(contato.id)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted hover:text-error"
              >
                <X size={16} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {novoAberto ? (
        <div className="space-y-2 rounded-xl border border-line p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="text"
              autoComplete="off"
              autoFocus
              maxLength={CONTATO_NOME_MAX}
              placeholder="Nome"
              aria-label="Nome do contato"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              className={campoClass}
            />
            <input
              type="tel"
              inputMode="tel"
              autoComplete="off"
              placeholder="Ex.: (11) 91234-5678"
              aria-label="Número do contato"
              value={numero}
              onChange={(event) => setNumero(event.target.value)}
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
