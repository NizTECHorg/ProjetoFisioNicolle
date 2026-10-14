import { useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import type { UseFormSetValue, UseFormWatch } from 'react-hook-form'
import type { EvaluationFormData } from '@/schemas/evaluation.schema'
import { Input } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  ESPORTES_MAX,
  ESPORTE_OUTRO,
  ESPORTE_OUTRO_MAX,
  avaliarTexto,
  buscarEsportes,
  esportePorKey,
  esportesDaFuncao,
  problemasDoEsporte,
  rotuloEsporte,
  type EsporteEntrada,
} from '@/lib/esportesAvaliacao'

type Props = {
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

/**
 * Bloco Esportes (página 03): vários esportes por pessoa. Cada esporte escolhido abre
 * um cartão com os problemas frequentes dele para marcar. Grava em ficha.funcao.esportes.
 */
export function EsportesField({ watch, setValue, disabled }: Props) {
  const [query, setQuery] = useState('')
  const [remover, setRemover] = useState<string | null>(null)
  const [recolhidos, setRecolhidos] = useState<ReadonlySet<string>>(() => new Set())

  function alternarRecolhido(key: string) {
    setRecolhidos((atual) => {
      const proximo = new Set(atual)
      if (proximo.has(key)) proximo.delete(key)
      else proximo.add(key)
      return proximo
    })
  }

  const lista = esportesDaFuncao(watch('ficha.funcao'))
  const escolhidos = new Set(lista.map((e) => e.esporte))
  const cheio = lista.length >= ESPORTES_MAX

  function gravar(proxima: EsporteEntrada[]) {
    setValue('ficha.funcao.esportes', proxima.length ? proxima : undefined, OPTS)
    // Avaliação antiga guardava um esporte só em rotina: depois da primeira edição, fica tudo na lista.
    if (watch('ficha.funcao.rotina.esporte')) {
      setValue('ficha.funcao.rotina.esporte', undefined, OPTS)
      setValue('ficha.funcao.rotina.esporteOutro', undefined, OPTS)
      setValue('ficha.funcao.rotina.esporteProblemas', undefined, OPTS)
    }
  }

  function tirar(key: string) {
    gravar(lista.filter((e) => e.esporte !== key))
  }

  function alternarEsporte(key: string) {
    if (escolhidos.has(key)) {
      const atual = lista.find((e) => e.esporte === key)
      if ((atual?.problemas?.length ?? 0) > 0 || (atual?.outro ?? '').trim()) {
        setRemover(key)
        return
      }
      tirar(key)
      return
    }
    if (cheio) return
    gravar([...lista, { esporte: key }])
  }

  function alternarProblema(esporte: string, problema: string) {
    gravar(
      lista.map((e) => {
        if (e.esporte !== esporte) return e
        const set = new Set(e.problemas ?? [])
        if (set.has(problema)) set.delete(problema)
        else set.add(problema)
        const problemas = problemasDoEsporte(esporte)
          .map((p) => p.key)
          .filter((k) => set.has(k))
        return problemas.length ? { ...e, problemas } : { esporte: e.esporte, outro: e.outro }
      }),
    )
  }

  function mudarOutro(texto: string) {
    gravar(
      lista.map((e) =>
        e.esporte === ESPORTE_OUTRO ? { esporte: ESPORTE_OUTRO, outro: texto.slice(0, ESPORTE_OUTRO_MAX) || undefined } : e,
      ),
    )
  }

  const filtrados = buscarEsportes(query)
  const removendo = remover ? lista.find((e) => e.esporte === remover) : undefined

  return (
    <div className="space-y-4">
      {!disabled ? (
        <div className="space-y-3">
          <Input
            label="Adicionar esporte"
            placeholder="Buscar esporte"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div role="group" aria-label="Esportes do paciente" className="flex flex-wrap gap-2">
            {filtrados.map((esporte) => {
              const marcado = escolhidos.has(esporte.key)
              return (
                <button
                  key={esporte.key}
                  type="button"
                  aria-pressed={marcado}
                  disabled={!marcado && cheio}
                  onClick={() => alternarEsporte(esporte.key)}
                  className={chipClass(marcado)}
                >
                  {esporte.nome}
                </button>
              )
            })}
            <button
              type="button"
              aria-pressed={escolhidos.has(ESPORTE_OUTRO)}
              disabled={!escolhidos.has(ESPORTE_OUTRO) && cheio}
              onClick={() => alternarEsporte(ESPORTE_OUTRO)}
              className={chipClass(escolhidos.has(ESPORTE_OUTRO))}
            >
              Outro
            </button>
          </div>
          {filtrados.length === 0 ? <p className="text-sm text-muted">Nenhum esporte encontrado. Use Outro.</p> : null}
          <p className="text-xs text-muted">
            Escolha um ou mais esportes (até {ESPORTES_MAX}). Os problemas frequentes de cada um orientam a
            avaliação. Não é diagnóstico.
          </p>
        </div>
      ) : null}

      {lista.length === 0 ? (
        <p className="text-sm text-muted">{disabled ? 'Nenhum esporte informado.' : 'Nenhum esporte escolhido.'}</p>
      ) : null}

      {lista.map((entrada) => {
        const catalogo = esportePorKey(entrada.esporte)
        const problemas = problemasDoEsporte(entrada.esporte)
        const marcados = new Set(entrada.problemas ?? [])
        const recolhido = recolhidos.has(entrada.esporte)
        return (
          <section
            key={entrada.esporte}
            aria-label={rotuloEsporte(entrada)}
            className={['relative space-y-3 rounded-2xl border border-line bg-canvas transition-[padding] duration-200', recolhido ? 'px-4 py-2' : 'p-4'].join(' ')}
          >
            <div className="flex items-center justify-between gap-2 pr-1">
              {catalogo ? (
                <button
                  type="button"
                  aria-expanded={!recolhido}
                  aria-controls={`esporte-${entrada.esporte}-problemas`}
                  onClick={() => alternarRecolhido(entrada.esporte)}
                  className="-m-1 flex min-h-8 min-w-0 items-center gap-1.5 rounded-lg p-1 text-left text-sm font-semibold text-ink transition-colors hover:text-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
                >
                  <span className="min-w-0">
                    Problemas frequentes no {catalogo.nome}
                    {marcados.size > 0 ? (
                      <span className="font-normal text-muted"> · {marcados.size} marcado{marcados.size > 1 ? 's' : ''}</span>
                    ) : null}
                  </span>
                  <ChevronDown
                    size={16}
                    aria-hidden
                    className={[
                      'shrink-0 text-muted transition-transform duration-200 motion-reduce:transition-none',
                      recolhido ? '-rotate-90' : 'rotate-0',
                    ].join(' ')}
                  />
                </button>
              ) : (
                <p className="text-sm font-semibold text-ink">{rotuloEsporte(entrada)}</p>
              )}
              {!disabled ? (
                <button
                  type="button"
                  aria-label={`Remover ${rotuloEsporte(entrada)}`}
                  title="Remover esporte"
                  onClick={() => alternarEsporte(entrada.esporte)}
                  className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-error/10 hover:text-error"
                >
                  <X size={16} aria-hidden />
                </button>
              ) : null}
            </div>

            {entrada.esporte === ESPORTE_OUTRO ? (
              <Input
                label="Qual esporte?"
                hint="Só o nome do esporte."
                maxLength={ESPORTE_OUTRO_MAX}
                value={entrada.outro ?? ''}
                disabled={disabled}
                onChange={(event) => mudarOutro(event.target.value)}
              />
            ) : (
              <div id={`esporte-${entrada.esporte}-problemas`} hidden={recolhido} className="space-y-2">
                {problemas.map((p) => {
                  const avaliar = avaliarTexto(p)
                  return (
                    <label
                      key={p.key}
                      className="flex min-h-11 cursor-pointer items-start gap-3 rounded-2xl border border-line bg-surface px-4 py-2.5"
                    >
                      <input
                        type="checkbox"
                        className="mt-1 accent-forest"
                        checked={marcados.has(p.key)}
                        disabled={disabled}
                        onChange={() => alternarProblema(entrada.esporte, p.key)}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-ink">{p.nome}</span>
                        <span className="block text-xs text-muted">{p.regiao}</span>
                        {avaliar ? <span className="block text-xs text-muted">Avaliar: {avaliar}</span> : null}
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          </section>
        )
      })}

      <ConfirmDialog
        open={removendo !== undefined}
        title="Remover esporte?"
        description={removendo ? `${rotuloEsporte(removendo)} e o que foi marcado nele saem da avaliação.` : ''}
        confirmLabel="Remover"
        cancelLabel="Manter"
        tone="danger"
        onConfirm={() => {
          if (remover) tirar(remover)
          setRemover(null)
        }}
        onClose={() => setRemover(null)}
      />
    </div>
  )
}
