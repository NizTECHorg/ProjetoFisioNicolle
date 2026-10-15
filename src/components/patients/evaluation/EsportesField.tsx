import { useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import type { UseFormSetValue, UseFormWatch } from 'react-hook-form'
import type { EvaluationFormData } from '@/schemas/evaluation.schema'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
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
import {
  ANOS_PRATICA_MAX,
  DOMINANCIAS,
  FREQUENCIA_MAX,
  MOMENTOS_SINTOMA,
  NIVEIS_ESPORTIVOS,
  PERFIS_ESPORTIVOS,
  PRATICA_OBS_MAX,
  SINTOMAS_MAX,
  SITUACOES_PRATICA,
  VOLUME_MAX,
  praticaDoEsporte,
  rotuloFrequencia,
  type AvaliacaoPratica,
  type OpcaoPratica,
} from '@/lib/esportesPratica'

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

function miniChipClass(selected: boolean): string {
  return [
    'min-h-9 rounded-xl border px-3 text-sm transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25',
    'disabled:cursor-not-allowed disabled:opacity-60',
    selected
      ? 'border-accent bg-accent-soft font-medium text-forest'
      : 'border-line bg-surface text-ink hover:border-forest/25',
  ].join(' ')
}

const FREQUENCIAS: readonly OpcaoPratica[] = Array.from({ length: FREQUENCIA_MAX }, (_, i) => ({
  key: String(i + 1),
  nome: i + 1 >= FREQUENCIA_MAX ? 'Todo dia' : `${i + 1}x`,
}))

/** Linha de chips: escolha única (clicar de novo desmarca) ou várias. */
function OpcoesChips({
  legenda,
  opcoes,
  marcadas,
  onToggle,
  disabled,
}: {
  legenda: string
  opcoes: readonly OpcaoPratica[]
  marcadas: readonly string[]
  onToggle: (key: string) => void
  disabled?: boolean
}) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="text-xs text-muted">{legenda}</legend>
      <div className="flex flex-wrap gap-1.5">
        {opcoes.map((op) => {
          const marcado = marcadas.includes(op.key)
          return (
            <button
              key={op.key}
              type="button"
              aria-pressed={marcado}
              disabled={disabled}
              onClick={() => onToggle(op.key)}
              className={miniChipClass(marcado)}
            >
              {op.nome}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function SubTitulo({ children }: { children: string }) {
  return <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-muted">{children}</p>
}

/** Tira campo vazio para a ficha não guardar "" nem []. */
function limpar(entrada: EsporteEntrada): EsporteEntrada {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(entrada)) {
    if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) continue
    out[k] = v
  }
  return out as EsporteEntrada
}

function alternarNaLista(lista: readonly string[] | undefined, key: string): string[] {
  const atual = lista ?? []
  return atual.includes(key) ? atual.filter((k) => k !== key) : [...atual, key]
}

/**
 * Bloco Esportes (Anamnese D): vários esportes por pessoa. Cada esporte escolhido abre
 * um cartão com a avaliação esportiva (perfil, nível, tempo, frequência, volume, modalidades,
 * características, sintomas) e os problemas frequentes dele. Grava em ficha.funcao.esportes.
 */
export function EsportesField({ watch, setValue, disabled }: Props) {
  const [query, setQuery] = useState('')
  const [remover, setRemover] = useState<string | null>(null)
  const [recolhidos, setRecolhidos] = useState<ReadonlySet<string>>(() => new Set())

  const [problemasFechados, setProblemasFechados] = useState<ReadonlySet<string>>(() => new Set())

  function alternarProblemas(key: string) {
    setProblemasFechados((atual) => {
      const proximo = new Set(atual)
      if (proximo.has(key)) proximo.delete(key)
      else proximo.add(key)
      return proximo
    })
  }

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
      // Pede confirmação se já tem algo preenchido além do esporte.
      if (atual && Object.keys(limpar(atual)).some((k) => k !== 'esporte')) {
        setRemover(key)
        return
      }
      tirar(key)
      return
    }
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
        return limpar({ ...e, problemas })
      }),
    )
  }

  function mudarOutro(texto: string) {
    atualizar(ESPORTE_OUTRO, { outro: texto.slice(0, ESPORTE_OUTRO_MAX) })
  }

  /** Muda campos da avaliação esportiva de um esporte, mantendo o resto. */
  function atualizar(esporte: string, patch: Partial<EsporteEntrada>) {
    gravar(lista.map((e) => (e.esporte === esporte ? limpar({ ...e, ...patch }) : e)))
  }

  /** Escolha única: clicar na mesma opção desmarca. */
  function escolher(esporte: string, campo: 'perfil' | 'nivel' | 'situacao' | 'dominancia', atual: string | undefined, key: string) {
    atualizar(esporte, { [campo]: atual === key ? undefined : key } as Partial<AvaliacaoPratica>)
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
              onClick={() => alternarEsporte(ESPORTE_OUTRO)}
              className={chipClass(escolhidos.has(ESPORTE_OUTRO))}
            >
              Outro
            </button>
          </div>
          {filtrados.length === 0 ? <p className="text-sm text-muted">Nenhum esporte encontrado. Use Outro.</p> : null}
          <p className="text-xs text-muted">
            Escolha um ou mais esportes. Os problemas frequentes de cada um orientam a
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
        const pratica = praticaDoEsporte(entrada.esporte)
        const marcados = new Set(entrada.problemas ?? [])
        const recolhido = recolhidos.has(entrada.esporte)
        const corpoId = `esporte-${entrada.esporte}-avaliacao`
        const idBase = `esporte-${entrada.esporte}`
        const resumo = [
          NIVEIS_ESPORTIVOS.find((n) => n.key === entrada.nivel)?.nome,
          entrada.frequencia ? rotuloFrequencia(entrada.frequencia) : undefined,
          marcados.size > 0 ? `${marcados.size} problema${marcados.size > 1 ? 's' : ''}` : undefined,
        ]
          .filter(Boolean)
          .join(' · ')
        const set = (patch: Partial<EsporteEntrada>) => atualizar(entrada.esporte, patch)
        return (
          <section
            key={entrada.esporte}
            aria-label={rotuloEsporte(entrada)}
            className={['relative rounded-2xl border border-line bg-canvas transition-[padding] duration-200', recolhido ? 'px-4 py-1.5' : 'space-y-4 p-4'].join(' ')}
          >
            <div className="flex items-center justify-between gap-2 pr-1">
              <button
                type="button"
                aria-expanded={!recolhido}
                aria-controls={corpoId}
                onClick={() => alternarRecolhido(entrada.esporte)}
                className="-m-1 flex min-h-8 min-w-0 items-center gap-1.5 rounded-lg p-1 text-left text-sm font-semibold text-ink transition-colors hover:text-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
              >
                <span className="min-w-0">
                  {rotuloEsporte(entrada)}
                  {resumo ? <span className="font-normal text-muted"> · {resumo}</span> : null}
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

            <div id={corpoId} hidden={recolhido} className="space-y-4">
              {entrada.esporte === ESPORTE_OUTRO ? (
                <Input
                  id={`${idBase}-outro`}
                  label="Qual esporte?"
                  hint="Só o nome do esporte."
                  maxLength={ESPORTE_OUTRO_MAX}
                  value={entrada.outro ?? ''}
                  disabled={disabled}
                  onChange={(event) => mudarOutro(event.target.value)}
                />
              ) : null}

              <div className="space-y-3">
                <SubTitulo>Avaliação esportiva</SubTitulo>
                <div className="grid gap-3 sm:grid-cols-2">
                  <OpcoesChips
                    legenda="Perfil"
                    opcoes={PERFIS_ESPORTIVOS}
                    marcadas={entrada.perfil ? [entrada.perfil] : []}
                    onToggle={(key) => escolher(entrada.esporte, 'perfil', entrada.perfil, key)}
                    disabled={disabled}
                  />
                  <OpcoesChips
                    legenda="Nível"
                    opcoes={NIVEIS_ESPORTIVOS}
                    marcadas={entrada.nivel ? [entrada.nivel] : []}
                    onToggle={(key) => escolher(entrada.esporte, 'nivel', entrada.nivel, key)}
                    disabled={disabled}
                  />
                  <OpcoesChips
                    legenda="Situação atual"
                    opcoes={SITUACOES_PRATICA}
                    marcadas={entrada.situacao ? [entrada.situacao] : []}
                    onToggle={(key) => escolher(entrada.esporte, 'situacao', entrada.situacao, key)}
                    disabled={disabled}
                  />
                  <OpcoesChips
                    legenda="Lado dominante"
                    opcoes={DOMINANCIAS}
                    marcadas={entrada.dominancia ? [entrada.dominancia] : []}
                    onToggle={(key) => escolher(entrada.esporte, 'dominancia', entrada.dominancia, key)}
                    disabled={disabled}
                  />
                </div>
                <OpcoesChips
                  legenda="Frequência por semana"
                  opcoes={FREQUENCIAS}
                  marcadas={entrada.frequencia ? [String(entrada.frequencia)] : []}
                  onToggle={(key) => set({ frequencia: entrada.frequencia === Number(key) ? undefined : Number(key) })}
                  disabled={disabled}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    id={`${idBase}-anos`}
                    label="Há quanto tempo pratica"
                    placeholder="ex.: 3 anos"
                    maxLength={ANOS_PRATICA_MAX}
                    value={entrada.anosPratica ?? ''}
                    disabled={disabled}
                    onChange={(event) => set({ anosPratica: event.target.value })}
                  />
                  <Input
                    id={`${idBase}-volume`}
                    label="Volume"
                    placeholder={pratica.volumeDica}
                    maxLength={VOLUME_MAX}
                    value={entrada.volume ?? ''}
                    disabled={disabled}
                    onChange={(event) => set({ volume: event.target.value })}
                  />
                </div>
              </div>

              {pratica.modalidades.length > 0 || pratica.caracteristicas.length > 0 ? (
                <div className="space-y-3">
                  <SubTitulo>Modalidade e características da prática</SubTitulo>
                  {pratica.modalidades.length > 0 ? (
                    <OpcoesChips
                      legenda="Modalidades"
                      opcoes={pratica.modalidades}
                      marcadas={entrada.modalidades ?? []}
                      onToggle={(key) => set({ modalidades: alternarNaLista(entrada.modalidades, key) })}
                      disabled={disabled}
                    />
                  ) : null}
                  {pratica.caracteristicas.map((grupo) => (
                    <OpcoesChips
                      key={grupo.titulo}
                      legenda={grupo.titulo}
                      opcoes={grupo.opcoes}
                      marcadas={entrada.caracteristicas ?? []}
                      onToggle={(key) => set({ caracteristicas: alternarNaLista(entrada.caracteristicas, key) })}
                      disabled={disabled}
                    />
                  ))}
                </div>
              ) : null}
              <Textarea
                id={`${idBase}-pratica`}
                label="Outras características da prática"
                placeholder="Treino, equipamento, mudanças recentes…"
                rows={2}
                maxLength={PRATICA_OBS_MAX}
                value={entrada.praticaObs ?? ''}
                disabled={disabled}
                onChange={(event) => set({ praticaObs: event.target.value })}
              />

              <div className="space-y-3">
                <SubTitulo>Sintomas na prática</SubTitulo>
                <OpcoesChips
                  legenda="Quando aparecem"
                  opcoes={MOMENTOS_SINTOMA}
                  marcadas={entrada.sintomasMomentos ?? []}
                  onToggle={(key) => set({ sintomasMomentos: alternarNaLista(entrada.sintomasMomentos, key) })}
                  disabled={disabled}
                />
                <Textarea
                  id={`${idBase}-sintomas`}
                  label="Sintomas"
                  placeholder="O que sente, onde, em qual gesto ou fase do treino"
                  rows={2}
                  maxLength={SINTOMAS_MAX}
                  value={entrada.sintomas ?? ''}
                  disabled={disabled}
                  onChange={(event) => set({ sintomas: event.target.value })}
                />
              </div>

              {catalogo && problemas.length > 0 ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    aria-expanded={!problemasFechados.has(entrada.esporte)}
                    aria-controls={`esporte-${entrada.esporte}-problemas`}
                    onClick={() => alternarProblemas(entrada.esporte)}
                    className="group -mx-1 flex min-h-8 max-w-full items-center gap-1.5 rounded-lg px-1 text-left text-xs font-semibold uppercase tracking-wide text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
                  >
                    <span className="min-w-0">
                      Problemas frequentes no {catalogo.nome}
                      {marcados.size > 0 ? (
                        <span className="font-normal normal-case tracking-normal"> · {marcados.size} marcado{marcados.size > 1 ? 's' : ''}</span>
                      ) : null}
                    </span>
                    <ChevronDown
                      size={16}
                      aria-hidden
                      className={[
                        'shrink-0 opacity-40 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-80 motion-reduce:transition-none',
                        problemasFechados.has(entrada.esporte) ? '-rotate-90' : 'rotate-0',
                      ].join(' ')}
                    />
                  </button>
                  {/* Abre/fecha deslizando a altura (grid 1fr/0fr) com fade; fechado fica inert. */}
                  <div
                    id={`esporte-${entrada.esporte}-problemas`}
                    inert={problemasFechados.has(entrada.esporte) ? true : undefined}
                    className={[
                      'grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
                      problemasFechados.has(entrada.esporte) ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100',
                    ].join(' ')}
                  >
                    <div className="min-h-0 space-y-2 overflow-hidden">
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
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        )
      })}

      <ConfirmDialog
        open={removendo !== undefined}
        title="Remover esporte?"
        description={removendo ? `${rotuloEsporte(removendo)} e o que foi preenchido nele saem da avaliação.` : ''}
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
