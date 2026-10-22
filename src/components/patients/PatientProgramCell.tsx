import { useId, useState, type KeyboardEvent, type MouseEvent } from 'react'
import { Pencil, Plus } from 'lucide-react'
import { useUpdatePatient } from '@/hooks/usePatients'

const EMPTY = '—'

/**
 * Célula Programa da lista de pacientes: clica, digita (com sugestões dos programas já usados)
 * e Enter/sair do campo salva. Esc cancela. Sem permissão de escrita, só mostra o texto.
 */
export function PatientProgramCell({
  patientId,
  program,
  suggestions,
  writable,
}: {
  patientId: string
  program: string
  suggestions: readonly string[]
  writable: boolean
}) {
  const atual = program === EMPTY ? '' : program
  const [editando, setEditando] = useState(false)
  const [valor, setValor] = useState(atual)
  const listaId = useId()
  const update = useUpdatePatient()

  if (!writable) {
    return <span className="text-muted">{atual || EMPTY}</span>
  }

  function parar(event: MouseEvent | KeyboardEvent) {
    // A linha inteira navega para a ficha; o campo não pode disparar isso.
    event.stopPropagation()
  }

  function abrir(event: MouseEvent) {
    parar(event)
    setValor(atual)
    setEditando(true)
  }

  function salvar() {
    setEditando(false)
    const proximo = valor.trim()
    if (proximo === atual) return
    update.mutate({ id: patientId, input: { programName: proximo } })
  }

  if (editando) {
    return (
      <span onClick={parar} onKeyDown={parar} className="block">
        <input
          autoFocus
          list={listaId}
          maxLength={80}
          value={valor}
          placeholder="Ex.: Reabilitação de ombro"
          aria-label="Programa do paciente"
          onChange={(event) => setValor(event.target.value)}
          onBlur={salvar}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              salvar()
            }
            if (event.key === 'Escape') {
              event.preventDefault()
              setEditando(false)
            }
          }}
          className="w-full min-w-40 rounded-xl border border-accent bg-surface px-3 py-2 text-sm text-ink outline-none ring-2 ring-accent/20"
        />
        <datalist id={listaId}>
          {suggestions.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={abrir}
      onKeyDown={parar}
      disabled={update.isPending}
      className="group inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-lg px-2 -mx-2 text-left transition-colors hover:bg-accent-soft"
      aria-label={atual ? `Editar programa: ${atual}` : 'Adicionar programa'}
    >
      {atual ? (
        <>
          <span className="truncate text-ink">{atual}</span>
          <Pencil size={13} aria-hidden className="shrink-0 text-muted" />
        </>
      ) : (
        <span className="inline-flex items-center gap-1 text-sm text-accent">
          <Plus size={14} aria-hidden />
          Adicionar
        </span>
      )}
    </button>
  )
}
