import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import {
  RESPOSTA_NUMERO_MAX,
  RESPOSTA_TEXTO_MAX,
  type Pergunta,
  type SecaoPerguntas,
} from '@/lib/esportesPratica'

type Respostas = Record<string, string | string[]>

type Props = {
  idBase: string
  secoes: readonly SecaoPerguntas[]
  respostas: Respostas | undefined
  onChange: (next: Respostas | undefined) => void
  disabled?: boolean
}

const LINHA =
  'flex min-h-10 cursor-pointer items-start gap-3 rounded-xl px-2 py-1.5 text-sm text-ink transition-colors hover:bg-surface has-[:disabled]:cursor-not-allowed has-[:disabled]:hover:bg-transparent'

/** Questionário próprio do esporte: seções numeradas com perguntas de escolha única, múltipla, lista, sim/não, números e texto. */
export function QuestionarioEsporte({ idBase, secoes, respostas, onChange, disabled }: Props) {
  const atual = respostas ?? {}

  function definir(key: string, valor: string | string[] | undefined) {
    const proximo: Respostas = { ...atual }
    const vazio = valor === undefined || valor === '' || (Array.isArray(valor) && valor.length === 0)
    if (vazio) delete proximo[key]
    else proximo[key] = valor
    onChange(Object.keys(proximo).length ? proximo : undefined)
  }

  function texto(key: string): string {
    const v = atual[key]
    return typeof v === 'string' ? v : ''
  }

  function lista(key: string): string[] {
    const v = atual[key]
    return Array.isArray(v) ? v : []
  }

  function renderPergunta(p: Pergunta) {
    const id = `${idBase}-${p.key}`
    const opcoes = p.opcoes ?? []

    if (p.tipo === 'unica' || p.tipo === 'simNao') {
      const marcada = texto(p.key)
      const emLinha = p.tipo === 'simNao' || opcoes.length <= 3
      return (
        <fieldset key={p.key} className="space-y-1.5">
          <legend className="pb-1 text-sm font-medium text-muted">{p.rotulo}</legend>
          <div className={emLinha ? 'flex flex-wrap gap-x-4' : 'grid gap-0.5'}>
            {opcoes.map((op) => (
              <label key={op.key} className={LINHA}>
                <input
                  type="radio"
                  name={id}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-forest"
                  checked={marcada === op.key}
                  disabled={disabled}
                  // Clicar de novo na opção marcada desmarca (resposta volta a ficar em branco).
                  onClick={() => definir(p.key, marcada === op.key ? undefined : op.key)}
                  onChange={() => undefined}
                />
                <span>{op.nome}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )
    }

    if (p.tipo === 'multipla') {
      const marcadas = lista(p.key)
      return (
        <fieldset key={p.key} className="space-y-1.5">
          <legend className="pb-1 text-sm font-medium text-muted">{p.rotulo}</legend>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
            {opcoes.map((op) => {
              const marcado = marcadas.includes(op.key)
              return (
                <label key={op.key} className={LINHA}>
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 shrink-0 accent-forest"
                    checked={marcado}
                    disabled={disabled}
                    onChange={() =>
                      definir(
                        p.key,
                        // Mantém a ordem do catálogo.
                        opcoes
                          .map((item) => item.key)
                          .filter((key) => (key === op.key ? !marcado : marcadas.includes(key))),
                      )
                    }
                  />
                  <span>{op.nome}</span>
                </label>
              )
            })}
          </div>
        </fieldset>
      )
    }

    if (p.tipo === 'selecao') {
      return (
        <Select
          key={p.key}
          id={id}
          label={p.rotulo}
          value={texto(p.key)}
          disabled={disabled}
          options={[{ value: '', label: 'Selecionar' }, ...opcoes.map((op) => ({ value: op.key, label: op.nome }))]}
          onChange={(event) => definir(p.key, event.target.value || undefined)}
        />
      )
    }

    if (p.tipo === 'numeros') {
      return (
        <fieldset key={p.key} className="space-y-1.5">
          <legend className="pb-1 text-sm font-medium text-muted">{p.rotulo}</legend>
          <div className="grid grid-cols-2 gap-3">
            {(p.campos ?? []).map((campo) => (
              <Input
                key={campo.key}
                id={`${idBase}-${campo.key}`}
                label={campo.rotulo}
                placeholder="0"
                inputMode="decimal"
                maxLength={RESPOSTA_NUMERO_MAX}
                value={texto(campo.key)}
                disabled={disabled}
                onChange={(event) => definir(campo.key, event.target.value.replace(/[^\d.,]/g, '') || undefined)}
              />
            ))}
          </div>
        </fieldset>
      )
    }

    return (
      <Textarea
        key={p.key}
        id={id}
        label={p.rotulo}
        placeholder={p.placeholder}
        rows={2}
        maxLength={RESPOSTA_TEXTO_MAX}
        value={texto(p.key)}
        disabled={disabled}
        onChange={(event) => definir(p.key, event.target.value || undefined)}
      />
    )
  }

  return (
    <div className="space-y-5">
      {secoes.map((sec, index) => (
        <section
          key={sec.titulo}
          aria-label={sec.titulo}
          className={['space-y-4', index > 0 ? 'border-t border-line pt-5' : ''].join(' ')}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {String(index + 1).padStart(2, '0')} · {sec.titulo}
          </p>
          {sec.perguntas.map(renderPergunta)}
        </section>
      ))}
    </div>
  )
}
