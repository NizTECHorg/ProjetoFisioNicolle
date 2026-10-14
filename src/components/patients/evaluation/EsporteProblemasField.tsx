import { useState } from 'react'
import type { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form'
import type { EvaluationFormData } from '@/schemas/evaluation.schema'
import { Input } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  ESPORTE_OUTRO,
  ESPORTE_OUTRO_MAX,
  avaliarTexto,
  buscarEsportes,
  esportePorKey,
  problemasDoEsporte,
  safeEsporteProblemas,
} from '@/lib/esportesAvaliacao'

type Props = {
  register: UseFormRegister<EvaluationFormData>
  watch: UseFormWatch<EvaluationFormData>
  setValue: UseFormSetValue<EvaluationFormData>
  disabled?: boolean
}

const OPTS = { shouldDirty: true, shouldValidate: true } as const

function chipClass(selected: boolean): string {
  return [
    'min-h-11 rounded-2xl border px-4 text-sm font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25',
    'disabled:cursor-not-allowed disabled:opacity-60',
    selected
      ? 'border-accent bg-accent-soft text-forest'
      : 'border-line bg-canvas text-ink hover:border-forest/25',
  ].join(' ')
}

export function EsporteProblemasField({ register, watch, setValue, disabled }: Props) {
  const [query, setQuery] = useState('')
  const [pending, setPending] = useState<{ alvo: string | undefined } | null>(null)

  const esporte = watch('ficha.funcao.rotina.esporte')
  const catalogo = esportePorKey(esporte)
  const problemas = problemasDoEsporte(esporte)
  const keysValidas = new Set(problemas.map((p) => p.key))
  const marcados = safeEsporteProblemas(watch('ficha.funcao.rotina.esporteProblemas')).filter((k) =>
    keysValidas.has(k),
  )

  const filtrados = buscarEsportes(query)
  const chips = filtrados.map((e) => ({ key: e.key, nome: e.nome }))
  if (catalogo && !chips.some((c) => c.key === catalogo.key)) {
    chips.push({ key: catalogo.key, nome: catalogo.nome })
  }

  function aplicar(alvo: string | undefined) {
    setValue('ficha.funcao.rotina.esporte', alvo, OPTS)
    setValue('ficha.funcao.rotina.esporteProblemas', undefined, OPTS)
  }

  function escolher(key: string) {
    const alvo = key === esporte ? undefined : key
    if (marcados.length > 0 && alvo !== esporte) {
      setPending({ alvo })
      return
    }
    aplicar(alvo)
  }

  function alternar(key: string) {
    const set = new Set(marcados)
    if (set.has(key)) set.delete(key)
    else set.add(key)
    const novo = problemas.map((p) => p.key).filter((k) => set.has(k))
    setValue('ficha.funcao.rotina.esporteProblemas', novo.length ? novo : undefined, OPTS)
  }

  return (
    <div className="space-y-3">
      <Input
        label="Esporte"
        placeholder="Buscar esporte"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        disabled={disabled}
      />
      <div role="group" aria-label="Esporte" className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            aria-pressed={esporte === chip.key}
            disabled={disabled}
            onClick={() => escolher(chip.key)}
            className={chipClass(esporte === chip.key)}
          >
            {chip.nome}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={esporte === ESPORTE_OUTRO}
          disabled={disabled}
          onClick={() => escolher(ESPORTE_OUTRO)}
          className={chipClass(esporte === ESPORTE_OUTRO)}
        >
          Outro
        </button>
      </div>
      {filtrados.length === 0 ? (
        <p className="text-sm text-muted">Nenhum esporte encontrado. Use Outro.</p>
      ) : null}

      {esporte === ESPORTE_OUTRO ? (
        <Input
          label="Qual esporte?"
          hint="Só o nome do esporte."
          maxLength={ESPORTE_OUTRO_MAX}
          {...register('ficha.funcao.rotina.esporteOutro')}
          disabled={disabled}
        />
      ) : null}

      {catalogo ? (
        <fieldset className="space-y-2" disabled={disabled}>
          <legend className="text-sm font-semibold leading-[1.2] text-ink">
            Problemas frequentes no {catalogo.nome}
          </legend>
          <p className="text-xs text-muted">
            Problemas frequentes para orientar a avaliação. Não é diagnóstico.
          </p>
          <div className="space-y-2">
            {problemas.map((p) => {
              const avaliar = avaliarTexto(p)
              return (
                <label
                  key={p.key}
                  className="flex min-h-11 cursor-pointer items-start gap-3 rounded-2xl border border-line bg-canvas px-4 py-2.5"
                >
                  <input
                    type="checkbox"
                    className="mt-1 accent-forest"
                    checked={marcados.includes(p.key)}
                    disabled={disabled}
                    onChange={() => alternar(p.key)}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-ink">{p.nome}</span>
                    <span className="block text-xs text-muted">{p.regiao}</span>
                    {avaliar ? (
                      <span className="block text-xs text-muted">Avaliar: {avaliar}</span>
                    ) : null}
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>
      ) : null}

      <ConfirmDialog
        open={pending !== null}
        title="Trocar de esporte?"
        description={`Os problemas marcados de ${catalogo?.nome ?? 'esporte atual'} serão desmarcados.`}
        confirmLabel="Trocar e limpar"
        cancelLabel="Manter"
        tone="default"
        onConfirm={() => {
          if (pending) aplicar(pending.alvo)
          setPending(null)
        }}
        onClose={() => setPending(null)}
      />
    </div>
  )
}
