import { ChevronDown } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import {
  useFieldArray,
  type Control,
  type UseFormRegister,
  type UseFormSetValue,
  type UseFormWatch,
} from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input } from '@/components/ui/Input'
import {
  CATALOGO_MOBILIDADE,
  CATALOGO_PALPACAO,
  CATALOGO_TESTES,
  fold,
  type AchadoPalpacao,
  type LadoAchado,
} from '@/lib/mobilidadePalpacao'
import type { EvaluationFormData } from '@/schemas/evaluation.schema'
import { SignaturePad } from '@/components/patients/evaluation/SignaturePad'
import {
  BoolCheck,
  CheckboxGrid,
  FichaBlock,
  LineField,
  RadioRow,
  TextField,
} from '@/components/patients/evaluation/fichaFormPrimitives'

type PageProps = {
  register: UseFormRegister<EvaluationFormData>
  watch: UseFormWatch<EvaluationFormData>
  setValue: UseFormSetValue<EvaluationFormData>
  control: Control<EvaluationFormData>
  readOnly?: boolean
}

const CAMPO =
  'min-h-11 w-full rounded-2xl border border-line bg-surface px-4 py-2 text-base font-normal leading-normal text-ink'
const ROTULO = 'block text-sm font-semibold leading-[1.2] text-ink'
const CHIP =
  'inline-flex min-h-11 items-center rounded-2xl border px-4 text-sm font-semibold leading-[1.2] disabled:opacity-100'
const CHIP_ATIVO = 'border-forest bg-forest text-white'
const CHIP_INATIVO = 'border-line bg-surface text-ink'
const VALORES_MOVIMENTO = ['Completo', 'Limitado', 'Não avaliado'] as const

function vazioViraUndefined(value: unknown) {
  if (value === '' || value === null || value === undefined) return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

function ladoTemDor(dor: unknown) {
  if (!dor || typeof dor !== 'object') return false
  const lado = dor as { inicio?: unknown; maxima?: unknown; observacao?: unknown }
  if (typeof lado.inicio === 'string' && lado.inicio.trim()) return true
  if (typeof lado.maxima === 'number' && Number.isFinite(lado.maxima)) return true
  if (typeof lado.observacao === 'string' && lado.observacao.trim()) return true
  return false
}

function LadoMedida({
  regiaoIndex,
  movIndex,
  movimento,
  lado,
  register,
  watch,
  setValue,
  disabled,
}: {
  regiaoIndex: number
  movIndex: number
  movimento: string
  lado: 'direito' | 'esquerdo'
  register: UseFormRegister<EvaluationFormData>
  watch: UseFormWatch<EvaluationFormData>
  setValue: UseFormSetValue<EvaluationFormData>
  disabled?: boolean
}) {
  const idValor = useId()
  const idInicio = useId()
  const idMaxima = useId()
  const idObsDor = useId()
  const [aberto, setAberto] = useState(false)
  const direito = lado === 'direito'
  const letra = direito ? 'D' : 'E'
  const frase = direito ? 'direito' : 'esquerdo'
  const valorNome = direito
    ? (`ficha.avaliacaoPlano.mobilidade.regioes.${regiaoIndex}.movimentos.${movIndex}.valorDireito` as const)
    : (`ficha.avaliacaoPlano.mobilidade.regioes.${regiaoIndex}.movimentos.${movIndex}.valorEsquerdo` as const)
  const dorNome = direito
    ? (`ficha.avaliacaoPlano.mobilidade.regioes.${regiaoIndex}.movimentos.${movIndex}.dorDireito` as const)
    : (`ficha.avaliacaoPlano.mobilidade.regioes.${regiaoIndex}.movimentos.${movIndex}.dorEsquerdo` as const)
  const valorAtual = watch(valorNome)
  const texto = typeof valorAtual === 'string' ? valorAtual : ''
  const temDor = ladoTemDor(watch(dorNome))
  const painelAberto = disabled ? temDor : aberto
  const destaque = aberto || temDor

  return (
    <div className="space-y-2">
      <label htmlFor={idValor} className={ROTULO}>
        {letra}
      </label>
      <input
        id={idValor}
        type="text"
        className={CAMPO}
        aria-label={`Valor ${frase} de ${movimento}`}
        disabled={disabled}
        {...register(valorNome)}
      />
      <div className="flex flex-wrap gap-2">
        {VALORES_MOVIMENTO.map((chip) => {
          const ativo = texto === chip
          return (
            <button
              key={chip}
              type="button"
              disabled={disabled}
              className={`${CHIP} ${ativo ? CHIP_ATIVO : CHIP_INATIVO}`}
              onClick={() =>
                setValue(valorNome, ativo ? '' : chip, { shouldDirty: true, shouldValidate: true })
              }
            >
              {chip}
            </button>
          )
        })}
      </div>
      {!disabled || temDor ? (
        <button
          type="button"
          disabled={disabled}
          aria-label={`Dor no lado ${frase} de ${movimento}`}
          className={`inline-flex min-h-11 items-center rounded-2xl border px-4 text-sm font-semibold disabled:opacity-100 ${destaque ? CHIP_ATIVO : CHIP_INATIVO}`}
          onClick={() => setAberto((atual) => !atual)}
        >
          Dor
        </button>
      ) : null}
      {painelAberto ? (
        <fieldset className="mt-2 space-y-2 rounded-2xl border border-line bg-surface p-4">
          <legend className="text-sm font-semibold leading-[1.2] text-ink">
            {`Dor na ${movimento} — lado ${frase}`}
          </legend>
          <div className="space-y-2">
            <label htmlFor={idInicio} className={ROTULO}>
              Início da dor
            </label>
            <input
              id={idInicio}
              type="text"
              className={CAMPO}
              disabled={disabled}
              {...register(`${dorNome}.inicio`)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={idMaxima} className={ROTULO}>
              Dor máxima (/10)
            </label>
            <input
              id={idMaxima}
              type="number"
              min={0}
              max={10}
              step={1}
              className={CAMPO}
              disabled={disabled}
              {...register(`${dorNome}.maxima`, { setValueAs: vazioViraUndefined })}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={idObsDor} className={ROTULO}>
              Observação
            </label>
            <input
              id={idObsDor}
              type="text"
              className={CAMPO}
              aria-label={`Observação da dor no lado ${frase} de ${movimento}`}
              disabled={disabled}
              {...register(`${dorNome}.observacao`)}
            />
          </div>
        </fieldset>
      ) : null}
    </div>
  )
}

function LinhaMedida({
  regiaoIndex,
  movIndex,
  movimento,
  register,
  watch,
  setValue,
  disabled,
}: {
  regiaoIndex: number
  movIndex: number
  movimento: string
  register: UseFormRegister<EvaluationFormData>
  watch: UseFormWatch<EvaluationFormData>
  setValue: UseFormSetValue<EvaluationFormData>
  disabled?: boolean
}) {
  const idObs = useId()

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <LadoMedida
          regiaoIndex={regiaoIndex}
          movIndex={movIndex}
          movimento={movimento}
          lado="direito"
          register={register}
          watch={watch}
          setValue={setValue}
          disabled={disabled}
        />
        <LadoMedida
          regiaoIndex={regiaoIndex}
          movIndex={movIndex}
          movimento={movimento}
          lado="esquerdo"
          register={register}
          watch={watch}
          setValue={setValue}
          disabled={disabled}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor={idObs} className={ROTULO}>
          Observação
        </label>
        <input
          id={idObs}
          type="text"
          className={CAMPO}
          aria-label={`Observação de ${movimento}`}
          disabled={disabled}
          {...register(
            `ficha.avaliacaoPlano.mobilidade.regioes.${regiaoIndex}.movimentos.${movIndex}.observacao`,
          )}
        />
      </div>
    </div>
  )
}

function CartaoRegiao({
  index,
  escolhidas,
  podeAcrescentar,
  register,
  watch,
  setValue,
  control,
  disabled,
  onAdd,
  onAskRemove,
}: {
  index: number
  escolhidas: ReadonlySet<string>
  podeAcrescentar: boolean
  register: UseFormRegister<EvaluationFormData>
  watch: UseFormWatch<EvaluationFormData>
  setValue: UseFormSetValue<EvaluationFormData>
  control: Control<EvaluationFormData>
  disabled?: boolean
  onAdd: () => void
  onAskRemove: () => void
}) {
  const idRegiao = useId()
  const regiaoRegistro = register(`ficha.avaliacaoPlano.mobilidade.regioes.${index}.regiao`)
  const regiaoBruta = watch(`ficha.avaliacaoPlano.mobilidade.regioes.${index}.regiao`)
  const regiaoKey = typeof regiaoBruta === 'string' ? regiaoBruta : ''
  const catalogo = CATALOGO_MOBILIDADE.find((item) => item.key === regiaoKey)
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: `ficha.avaliacaoPlano.mobilidade.regioes.${index}.movimentos`,
  })
  const opcoes = CATALOGO_MOBILIDADE.filter(
    (item) => item.key === regiaoKey || !escolhidas.has(item.key),
  )

  return (
    <div className="space-y-4 rounded-2xl border border-line bg-canvas p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-2">
          <label htmlFor={idRegiao} className={ROTULO}>
            Região
          </label>
          <select
            id={idRegiao}
            className={CAMPO}
            disabled={disabled}
            {...regiaoRegistro}
            onChange={(event) => {
              regiaoRegistro.onChange(event)
              replace([])
            }}
          >
            <option value="">Escolha a região</option>
            {opcoes.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        {podeAcrescentar ? (
          <Button type="button" variant="secondary" onClick={onAdd}>
            Adicionar outra região
          </Button>
        ) : null}
      </div>
      {!disabled ? (
        <button
          type="button"
          className="min-h-11 text-sm text-muted hover:text-error"
          onClick={onAskRemove}
        >
          Remover região
        </button>
      ) : null}
      {catalogo ? (
        <>
          <RadioRow
            legend="Tipo de avaliação"
            name={`ficha.avaliacaoPlano.mobilidade.regioes.${index}.tipo`}
            register={register}
            disabled={disabled}
            options={[
              { value: 'ativo', label: 'Ativo' },
              { value: 'passivo', label: 'Passivo' },
              { value: 'ambos', label: 'Ambos' },
            ]}
          />
          <RadioRow
            legend="Comparação"
            name={`ficha.avaliacaoPlano.mobilidade.regioes.${index}.comparacao`}
            register={register}
            disabled={disabled}
            options={[
              { value: 'bilateral', label: 'Bilateral' },
              { value: 'unilateral', label: 'Unilateral' },
            ]}
          />
          <div className="space-y-2">
            {catalogo.movimentos.map((item) => {
              const movIndex = fields.findIndex((campo) => campo.movimento === item.key)
              const marcado = movIndex >= 0
              return (
                <div key={item.key} className="space-y-2">
                  <label className="inline-flex min-h-11 items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      className="accent-forest"
                      checked={marcado}
                      disabled={disabled}
                      onChange={() => {
                        if (marcado) remove(movIndex)
                        else append({ movimento: item.key })
                      }}
                    />
                    <span>{item.label}</span>
                  </label>
                  {marcado ? (
                    <LinhaMedida
                      regiaoIndex={index}
                      movIndex={movIndex}
                      movimento={item.label}
                      register={register}
                      watch={watch}
                      setValue={setValue}
                      disabled={disabled}
                    />
                  ) : null}
                </div>
              )
            })}
          </div>
        </>
      ) : null}
    </div>
  )
}

function MobilidadeRegioes({
  register,
  watch,
  setValue,
  control,
  disabled,
}: {
  register: UseFormRegister<EvaluationFormData>
  watch: UseFormWatch<EvaluationFormData>
  setValue: UseFormSetValue<EvaluationFormData>
  control: Control<EvaluationFormData>
  disabled?: boolean
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ficha.avaliacaoPlano.mobilidade.regioes',
  })
  const [pendente, setPendente] = useState<number | null>(null)
  const regioes = watch('ficha.avaliacaoPlano.mobilidade.regioes')
  const escolhidas = new Set(
    (Array.isArray(regioes) ? regioes : [])
      .map((item) => (typeof item?.regiao === 'string' ? item.regiao : ''))
      .filter((key) => key.length > 0),
  )
  const podeAcrescentar = !disabled && escolhidas.size < CATALOGO_MOBILIDADE.length
  const registro = watch('ficha.avaliacaoPlano.mobilidade.registroAnterior')
  const registroAnterior = typeof registro === 'string' ? registro : ''

  function acrescentar() {
    append({ regiao: '', movimentos: [] })
  }

  return (
    <div className="space-y-4">
      {fields.length === 0 ? (
        <p className="text-sm font-normal leading-normal text-muted">
          {disabled
            ? 'Nenhuma região escolhida.'
            : 'Nenhuma região escolhida. Escolha a região para ver só os movimentos dela. Toque em Adicionar outra região.'}
        </p>
      ) : null}
      {fields.length === 0 && podeAcrescentar ? (
        <Button type="button" variant="secondary" onClick={acrescentar}>
          Adicionar outra região
        </Button>
      ) : null}
      {fields.map((field, index) => (
        <CartaoRegiao
          key={field.id}
          index={index}
          escolhidas={escolhidas}
          podeAcrescentar={podeAcrescentar}
          register={register}
          watch={watch}
          setValue={setValue}
          control={control}
          disabled={disabled}
          onAdd={acrescentar}
          onAskRemove={() => setPendente(index)}
        />
      ))}
      {registroAnterior.trim() ? (
        <p className="text-sm font-normal leading-normal text-ink whitespace-pre-wrap">
          <span className="font-semibold">Registro anterior</span>
          {`\n${registroAnterior}`}
        </p>
      ) : null}
      {!disabled ? (
        <ConfirmDialog
          open={pendente !== null}
          title="Remover região?"
          description="Os movimentos desta região saem da avaliação. Esta ação não pode ser desfeita."
          confirmLabel="Remover região"
          cancelLabel="Manter região"
          tone="danger"
          onConfirm={() => {
            if (pendente !== null) remove(pendente)
            setPendente(null)
          }}
          onClose={() => setPendente(null)}
        />
      ) : null}
    </div>
  )
}

const LADOS_ACHADO: ReadonlyArray<{ value: LadoAchado; label: string }> = [
  { value: 'direito', label: 'Direito' },
  { value: 'esquerdo', label: 'Esquerdo' },
  { value: 'bilateral', label: 'Bilateral' },
  { value: 'central', label: 'Central' },
  { value: 'naoSeAplica', label: 'Não se aplica' },
]

const ACHADOS_PALPACAO: ReadonlyArray<{ key: AchadoPalpacao; label: string }> = [
  { key: 'semAlteracao', label: 'Sem alteração' },
  { key: 'doloroso', label: 'Doloroso' },
  { key: 'edema', label: 'Edema' },
  { key: 'tensao', label: 'Tensão aumentada' },
  { key: 'crepitacao', label: 'Crepitação' },
  { key: 'temperatura', label: 'Alteração de temperatura' },
  { key: 'outro', label: 'Outro' },
]

type RascunhoAchado = {
  regiao: string
  buscaLocal: string
  local: string
  localOutro: string
  lado: string
  achado: string
  achadoOutro: string
  dor: string
  observacao: string
}

const RASCUNHO_VAZIO: RascunhoAchado = {
  regiao: '',
  buscaLocal: '',
  local: '',
  localOutro: '',
  lado: '',
  achado: '',
  achadoOutro: '',
  dor: '',
  observacao: '',
}

function ladoValido(valor: string): LadoAchado | undefined {
  return LADOS_ACHADO.find((item) => item.value === valor)?.value
}

function achadoValido(valor: string): AchadoPalpacao | undefined {
  return ACHADOS_PALPACAO.find((item) => item.key === valor)?.key
}

function rotuloRegiaoPalpacao(chave: string) {
  return CATALOGO_PALPACAO.find((item) => item.key === chave)?.label ?? chave
}

function rotuloLocalAchado(regiao: string, local: string, localOutro?: string) {
  if (local === 'outro' && localOutro?.trim()) return localOutro.trim()
  const catalogo = CATALOGO_PALPACAO.find((item) => item.key === regiao)
  return catalogo?.locais.find((item) => item.key === local)?.label ?? local
}

function rotuloAchadoPalpacao(achado?: string, achadoOutro?: string) {
  if (!achado) return ''
  if (achado === 'outro' && achadoOutro?.trim()) return `Outro: ${achadoOutro.trim()}`
  return ACHADOS_PALPACAO.find((item) => item.key === achado)?.label ?? achado
}

function rotuloLadoAchado(lado?: string) {
  if (!lado) return ''
  return LADOS_ACHADO.find((item) => item.value === lado)?.label ?? ''
}

function rotuloDorAchado(dor?: number) {
  if (typeof dor !== 'number' || !Number.isFinite(dor)) return ''
  return `${dor}/10`
}

function gravarAchado(rascunho: RascunhoAchado) {
  const lado = ladoValido(rascunho.lado)
  const achado = achadoValido(rascunho.achado)
  const dor = vazioViraUndefined(rascunho.dor)
  const item: {
    regiao: string
    local: string
    localOutro?: string
    lado?: LadoAchado
    achado?: AchadoPalpacao
    achadoOutro?: string
    dor?: number
    observacao?: string
  } = {
    regiao: rascunho.regiao,
    local: rascunho.local,
  }
  if (rascunho.local === 'outro' && rascunho.localOutro.trim()) item.localOutro = rascunho.localOutro.trim()
  if (lado) item.lado = lado
  if (achado) item.achado = achado
  if (achado === 'outro' && rascunho.achadoOutro.trim()) item.achadoOutro = rascunho.achadoOutro.trim()
  if (typeof dor === 'number') item.dor = dor
  if (rascunho.observacao.trim()) item.observacao = rascunho.observacao.trim()
  return item
}

function locaisDaRegiao(regiao: string, consulta: string) {
  const catalogo = CATALOGO_PALPACAO.find((item) => item.key === regiao)
  if (!catalogo) return []
  const filtro = fold(consulta.trim())
  const visiveis = catalogo.locais.filter((item) => !filtro || fold(item.label).includes(filtro))
  const resto = visiveis.filter((item) => item.key !== 'outro')
  const outro = visiveis.filter((item) => item.key === 'outro')
  return [...resto, ...outro]
}

function RegistroAnterior({ texto }: { texto: string }) {
  if (!texto.trim()) return null
  return (
    <p className="whitespace-pre-wrap">
      <span className="text-sm font-semibold text-ink">Registro anterior</span>
      {'\n'}
      <span className="text-sm font-normal leading-normal text-ink">{texto}</span>
    </p>
  )
}

function AcoesAchado({
  disabled,
  onEdit,
  onAskRemove,
}: {
  disabled?: boolean
  onEdit: () => void
  onAskRemove: () => void
}) {
  if (disabled) return null
  return (
    <div className="flex flex-wrap gap-3">
      <button type="button" className="min-h-11 text-sm text-ink" onClick={onEdit}>
        Editar achado
      </button>
      <button type="button" className="min-h-11 text-sm text-muted hover:text-error" onClick={onAskRemove}>
        Remover achado
      </button>
    </div>
  )
}

function FormularioAchado({
  rascunho,
  setRascunho,
  editando,
  disabled,
  onAdd,
  onSave,
  onCancel,
}: {
  rascunho: RascunhoAchado
  setRascunho: (valor: RascunhoAchado | ((atual: RascunhoAchado) => RascunhoAchado)) => void
  editando: boolean
  disabled?: boolean
  onAdd: () => void
  onSave: () => void
  onCancel: () => void
}) {
  const idRegiao = useId()
  const idLocal = useId()
  const idOutroLocal = useId()
  const idOutroAchado = useId()
  const idDor = useId()
  const idObs = useId()
  const idLado = useId()
  const catalogo = CATALOGO_PALPACAO.find((item) => item.key === rascunho.regiao)
  const locais = catalogo ? locaisDaRegiao(rascunho.regiao, rascunho.buscaLocal) : []

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor={idRegiao} className={ROTULO}>
          Região
        </label>
        <select
          id={idRegiao}
          className={CAMPO}
          disabled={disabled}
          value={rascunho.regiao}
          onChange={(event) => {
            const next = event.target.value
            setRascunho((atual) => {
              const proximo = CATALOGO_PALPACAO.find((item) => item.key === next)
              const permanece = proximo?.locais.some((item) => item.key === atual.local) ?? false
              return {
                ...atual,
                regiao: next,
                buscaLocal: '',
                local: permanece ? atual.local : '',
                localOutro: permanece ? atual.localOutro : '',
              }
            })
          }}
        >
          <option value="">Escolha a região</option>
          {CATALOGO_PALPACAO.map((item) => (
            <option key={item.key} value={item.key}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor={idLocal} className={ROTULO}>
          Local / estrutura
        </label>
        <input
          id={idLocal}
          type="search"
          className={CAMPO}
          disabled={disabled || !rascunho.regiao}
          value={rascunho.buscaLocal}
          onChange={(event) =>
            setRascunho((atual) => ({ ...atual, buscaLocal: event.target.value }))
          }
        />
        {rascunho.regiao ? (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {locais.map((item) => {
              const ativo = rascunho.local === item.key
              return (
                <li key={item.key} className="min-w-0">
                  <button
                    type="button"
                    disabled={disabled}
                    aria-pressed={ativo}
                    title={item.label}
                    className={`flex h-full min-h-10 w-full items-center rounded-xl border px-3 py-2 text-left text-xs font-semibold leading-snug transition-colors disabled:opacity-100 ${
                      ativo ? CHIP_ATIVO : `${CHIP_INATIVO} hover:border-forest/30 hover:bg-canvas`
                    }`}
                    onClick={() =>
                      setRascunho((atual) => ({
                        ...atual,
                        local: item.key,
                        localOutro: item.key === 'outro' ? atual.localOutro : '',
                      }))
                    }
                  >
                    {item.label}
                  </button>
                </li>
              )
            })}
          </ul>
        ) : null}
        <p className="text-sm font-normal leading-normal text-muted">
          Primeiro selecione a região. Local/estrutura mostra só as opções dessa região, com busca e Outro para digitar.
        </p>
      </div>
      {rascunho.local === 'outro' ? (
        <div className="space-y-2">
          <label htmlFor={idOutroLocal} className={ROTULO}>
            Outro local
          </label>
          <input
            id={idOutroLocal}
            type="text"
            className={CAMPO}
            disabled={disabled}
            value={rascunho.localOutro}
            onChange={(event) =>
              setRascunho((atual) => ({ ...atual, localOutro: event.target.value }))
            }
          />
        </div>
      ) : null}
      <fieldset className="space-y-2">
        <legend className="text-xs text-muted">Lado</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {LADOS_ACHADO.map((opcao) => (
            <label key={opcao.value} className="inline-flex min-h-11 items-center gap-2 text-sm text-ink">
              <input
                type="radio"
                name={idLado}
                value={opcao.value}
                className="accent-forest"
                disabled={disabled}
                checked={rascunho.lado === opcao.value}
                onChange={() => setRascunho((atual) => ({ ...atual, lado: opcao.value }))}
              />
              <span>{opcao.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="space-y-2">
        <p className={ROTULO}>Achado à palpação</p>
        <div className="flex flex-wrap gap-2">
          {ACHADOS_PALPACAO.map((item) => {
            const ativo = rascunho.achado === item.key
            return (
              <button
                key={item.key}
                type="button"
                disabled={disabled}
                className={`${CHIP} ${ativo ? CHIP_ATIVO : CHIP_INATIVO}`}
                onClick={() =>
                  setRascunho((atual) => ({
                    ...atual,
                    achado: atual.achado === item.key ? '' : item.key,
                    achadoOutro: item.key === 'outro' && atual.achado !== item.key ? atual.achadoOutro : '',
                  }))
                }
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </div>
      {rascunho.achado === 'outro' ? (
        <div className="space-y-2">
          <label htmlFor={idOutroAchado} className={ROTULO}>
            Outro achado
          </label>
          <input
            id={idOutroAchado}
            type="text"
            className={CAMPO}
            disabled={disabled}
            value={rascunho.achadoOutro}
            onChange={(event) =>
              setRascunho((atual) => ({ ...atual, achadoOutro: event.target.value }))
            }
          />
        </div>
      ) : null}
      <div className="space-y-2">
        <label htmlFor={idDor} className={ROTULO}>
          Dor (0–10)
        </label>
        <input
          id={idDor}
          type="number"
          min={0}
          max={10}
          step={1}
          className={CAMPO}
          disabled={disabled}
          value={rascunho.dor}
          onChange={(event) => setRascunho((atual) => ({ ...atual, dor: event.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor={idObs} className={ROTULO}>
          Observação
        </label>
        <input
          id={idObs}
          type="text"
          className={CAMPO}
          disabled={disabled}
          value={rascunho.observacao}
          onChange={(event) =>
            setRascunho((atual) => ({ ...atual, observacao: event.target.value }))
          }
        />
      </div>
      {!disabled ? (
        editando ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={!rascunho.regiao} onClick={onSave}>
              Salvar achado
            </Button>
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancelar edição
            </Button>
          </div>
        ) : (
          <Button type="button" variant="secondary" disabled={!rascunho.regiao} onClick={onAdd}>
            Adicionar achado
          </Button>
        )
      ) : null}
    </div>
  )
}

function TabelaAchados({
  achados,
  disabled,
  onEdit,
  onAskRemove,
}: {
  achados: Array<{
    id: string
    regiao: string
    local: string
    localOutro?: string
    lado?: string
    achado?: string
    achadoOutro?: string
    dor?: number
    observacao?: string
  }>
  disabled?: boolean
  onEdit: (index: number) => void
  onAskRemove: (index: number) => void
}) {
  const colunas = ['Região', 'Local / estrutura', 'Lado', 'Achado', 'Dor', 'Observação'] as const

  function celulas(item: (typeof achados)[number]) {
    return [
      rotuloRegiaoPalpacao(item.regiao),
      rotuloLocalAchado(item.regiao, item.local, item.localOutro),
      rotuloLadoAchado(item.lado),
      rotuloAchadoPalpacao(item.achado, item.achadoOutro),
      rotuloDorAchado(item.dor),
      item.observacao?.trim() ?? '',
    ]
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold leading-[1.2] text-ink">Achados registrados</p>
      {achados.length === 0 ? (
        <p className="text-sm font-normal leading-normal text-muted">
          {disabled
            ? 'Nenhum achado registrado.'
            : 'Nenhum achado registrado. Preencha o formulário acima e toque em Adicionar achado.'}
        </p>
      ) : (
        <>
          <div className="space-y-3 sm:hidden">
            {achados.map((item, index) => {
              const valores = celulas(item)
              return (
              <div key={item.id} className="space-y-2 rounded-2xl border border-line bg-surface p-4">
                {colunas.map((coluna, colunaIndex) => (
                  <p key={coluna} className="text-sm font-normal leading-normal text-ink">
                    <span className="font-semibold">{coluna}</span>
                    {valores[colunaIndex] ? ` ${valores[colunaIndex]}` : ''}
                  </p>
                ))}
                <AcoesAchado
                  disabled={disabled}
                  onEdit={() => onEdit(index)}
                  onAskRemove={() => onAskRemove(index)}
                />
              </div>
              )
            })}
          </div>
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {colunas.map((coluna) => (
                    <th
                      key={coluna}
                      className="border border-line bg-canvas px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-muted"
                    >
                      {coluna}
                    </th>
                  ))}
                  {!disabled ? (
                    <th className="border border-line bg-canvas px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      <span className="sr-only">Ações</span>
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {achados.map((item, index) => (
                  <tr key={item.id}>
                    {celulas(item).map((valor, colunaIndex) => (
                      <td
                        key={colunas[colunaIndex]}
                        className="border border-line px-3 py-2 text-sm font-normal leading-normal text-ink"
                      >
                        {valor}
                      </td>
                    ))}
                    {!disabled ? (
                      <td className="border border-line px-3 py-2">
                        <AcoesAchado
                          disabled={disabled}
                          onEdit={() => onEdit(index)}
                          onAskRemove={() => onAskRemove(index)}
                        />
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function CamposTesteMarcado({
  indice,
  outro,
  register,
  disabled,
}: {
  indice: number
  outro: boolean
  register: UseFormRegister<EvaluationFormData>
  disabled?: boolean
}) {
  const idOutro = useId()
  const idResultado = useId()

  return (
    <div className="space-y-2 pb-2">
      {outro ? (
        <div className="space-y-2">
          <label htmlFor={idOutro} className={ROTULO}>
            Outro teste
          </label>
          <input
            id={idOutro}
            type="text"
            className={CAMPO}
            disabled={disabled}
            {...register(`ficha.avaliacaoPlano.palpacaoTestes.testes.${indice}.outroTexto`)}
          />
        </div>
      ) : null}
      <div className="space-y-2">
        <label htmlFor={idResultado} className={ROTULO}>
          Resultado
        </label>
        <input
          id={idResultado}
          type="text"
          className={CAMPO}
          disabled={disabled}
          {...register(`ficha.avaliacaoPlano.palpacaoTestes.testes.${indice}.resultado`)}
        />
      </div>
    </div>
  )
}

function GrupoTestes({
  label,
  aberto,
  onToggle,
  children,
}: {
  label: string
  aberto: boolean
  onToggle: () => void
  children: ReactNode
}) {
  const painelId = useId()

  const rotuloId = useId()

  return (
    <div role="group" aria-labelledby={rotuloId} className="border-b border-line last:border-b-0">
      <button
        id={rotuloId}
        type="button"
        aria-expanded={aberto}
        aria-controls={painelId}
        onClick={onToggle}
        className="flex min-h-11 w-full items-center gap-2 px-3 text-left text-sm font-semibold leading-[1.2] text-ink transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/25"
      >
        <ChevronDown
          size={18}
          aria-hidden
          className={[
            'shrink-0 text-forest transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
            aberto ? 'rotate-0' : '-rotate-90',
          ].join(' ')}
        />
        <span>{label}</span>
      </button>
      <div
        id={painelId}
        inert={aberto ? undefined : true}
        className={[
          'grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
          aberto ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        ].join(' ')}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="pb-2 pl-9 pr-3">{children}</div>
        </div>
      </div>
    </div>
  )
}

function ListaTestes({
  register,
  control,
  disabled,
  registroAnterior,
}: {
  register: UseFormRegister<EvaluationFormData>
  control: Control<EvaluationFormData>
  disabled?: boolean
  registroAnterior: string
}) {
  const idBusca = useId()
  const [busca, setBusca] = useState('')
  const [manual, setManual] = useState<{ consulta: string; chaves: Record<string, boolean> }>({
    consulta: '',
    chaves: {},
  })
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ficha.avaliacaoPlano.palpacaoTestes.testes',
  })
  const consulta = busca.trim()
  const filtro = fold(consulta)
  const regioes = CATALOGO_TESTES.flatMap((regiao) => {
    const outro = regiao.testes.find((item) => item.key === 'outro')
    const demais = regiao.testes.filter((item) => item.key !== 'outro')
    if (!filtro) return [regiao]
    const casados = demais.filter((item) => fold(item.label).includes(filtro))
    const outroCasa = outro ? fold(outro.label).includes(filtro) : false
    if (casados.length === 0 && !outroCasa) return []
    return [{ ...regiao, testes: outro ? [...casados, outro] : casados }]
  })
  const visiveis = new Set(
    regioes.flatMap((regiao) => regiao.testes.map((item) => `${regiao.key}:${item.key}`)),
  )
  const escondidos = fields.some((item) => !visiveis.has(`${item.regiao}:${item.teste}`))
  const chaves = manual.consulta === filtro ? manual.chaves : {}
  const [listaAberta, setListaAberta] = useState(false)
  const idLista = useId()

  function abertoDe(key: string) {
    const escolhido = chaves[key]
    if (escolhido !== undefined) return escolhido
    return Boolean(filtro)
  }

  const todasAbertas = regioes.length > 0 && regioes.every((regiao) => abertoDe(regiao.key))

  function alternarTodas() {
    const proximo = !todasAbertas
    setManual({
      consulta: filtro,
      chaves: Object.fromEntries(regioes.map((regiao) => [regiao.key, proximo])),
    })
  }

  function alternar(key: string, atual: boolean) {
    setManual((prev) => ({
      consulta: filtro,
      chaves: {
        ...(prev.consulta === filtro ? prev.chaves : {}),
        [key]: !atual,
      },
    }))
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        aria-expanded={listaAberta}
        aria-controls={idLista}
        onClick={() => setListaAberta((atual) => !atual)}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 text-left transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
      >
        <span className="flex items-center gap-2">
          <ChevronDown
            size={18}
            aria-hidden
            className={[
              'shrink-0 text-forest transition-transform duration-300 motion-reduce:transition-none',
              listaAberta ? 'rotate-0' : '-rotate-90',
            ].join(' ')}
          />
          <span className="text-sm font-semibold leading-[1.2] text-ink">Testes clínicos</span>
        </span>
        <span className="text-xs text-muted">
          {fields.length === 0
            ? 'Nenhum marcado'
            : fields.length === 1
              ? '1 marcado'
              : `${fields.length} marcados`}
        </span>
      </button>
      {listaAberta ? (
      <div id={idLista} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor={idBusca} className={ROTULO}>
          Buscar teste
        </label>
        <input
          id={idBusca}
          type="search"
          className={CAMPO}
          disabled={disabled}
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
        />
      </div>
      {!consulta && fields.length === 0 ? (
        <p className="text-sm font-normal leading-normal text-muted">
          Nenhum teste marcado. Marque os testes na lista. Dá para marcar vários. Outro fica no fim de cada região.
        </p>
      ) : null}
      {consulta && escondidos ? (
        <p className="text-sm text-muted">
          Testes marcados fora desta busca continuam na avaliação.
        </p>
      ) : null}
      {consulta && regioes.length === 0 ? (
        <p className="text-sm font-normal leading-normal text-muted">
          Nenhum teste com esse texto. Apague a busca para ver a lista inteira.
        </p>
      ) : (
        <div className="space-y-2">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={alternarTodas}
            className="min-h-11 rounded-xl px-3 text-sm font-semibold text-forest transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
          >
            {todasAbertas ? 'Fechar todas as regiões' : 'Abrir todas as regiões'}
          </button>
        </div>
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        {regioes.map((regiao) => {
          const aberto = abertoDe(regiao.key)
          return (
            <GrupoTestes
              key={regiao.key}
              label={regiao.label}
              aberto={aberto}
              onToggle={() => alternar(regiao.key, aberto)}
            >
              <ul className="flex flex-col">
                {regiao.testes.map((item) => {
                  const indice = fields.findIndex(
                    (campo) => campo.regiao === regiao.key && campo.teste === item.key,
                  )
                  const marcado = indice >= 0
                  return (
                    <li key={item.key}>
                      <label className="inline-flex min-h-11 items-center gap-2 text-sm text-ink">
                        <input
                          type="checkbox"
                          className="accent-forest"
                          checked={marcado}
                          disabled={disabled}
                          onChange={() => {
                            if (marcado) remove(indice)
                            else append({ regiao: regiao.key, teste: item.key })
                          }}
                        />
                        <span>{item.label}</span>
                      </label>
                      {marcado ? (
                        <CamposTesteMarcado
                          indice={indice}
                          outro={item.key === 'outro'}
                          register={register}
                          disabled={disabled}
                        />
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            </GrupoTestes>
          )
        })}
        </div>
        </div>
      )}
      </div>
      ) : null}
      <RegistroAnterior texto={registroAnterior} />
    </div>
  )
}

function PalpacaoBloco({
  register,
  watch,
  control,
  disabled,
}: {
  register: UseFormRegister<EvaluationFormData>
  watch: UseFormWatch<EvaluationFormData>
  control: Control<EvaluationFormData>
  disabled?: boolean
}) {
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'ficha.avaliacaoPlano.palpacaoTestes.achados',
  })
  const [rascunho, setRascunho] = useState<RascunhoAchado>(RASCUNHO_VAZIO)
  const [editando, setEditando] = useState<number | null>(null)
  const [pendente, setPendente] = useState<number | null>(null)
  const achadosBrutos = watch('ficha.avaliacaoPlano.palpacaoTestes.achados')
  const achados = (Array.isArray(achadosBrutos) ? achadosBrutos : fields).slice(0, fields.length)
  const palpacaoRegistro = watch('ficha.avaliacaoPlano.palpacaoTestes.palpacaoRegistroAnterior')
  const testesRegistro = watch('ficha.avaliacaoPlano.palpacaoTestes.testesRegistroAnterior')

  function adicionar() {
    if (!rascunho.regiao) return
    append(gravarAchado(rascunho))
    setRascunho(RASCUNHO_VAZIO)
  }

  function salvar() {
    if (editando === null || !rascunho.regiao) return
    update(editando, gravarAchado(rascunho))
    setRascunho(RASCUNHO_VAZIO)
    setEditando(null)
  }

  function editar(index: number) {
    const item = achados[index]
    if (!item) return
    setEditando(index)
    setRascunho({
      regiao: item.regiao ?? '',
      buscaLocal: '',
      local: item.local ?? '',
      localOutro: item.localOutro ?? '',
      lado: item.lado ?? '',
      achado: item.achado ?? '',
      achadoOutro: item.achadoOutro ?? '',
      dor: typeof item.dor === 'number' ? String(item.dor) : '',
      observacao: item.observacao ?? '',
    })
  }

  return (
    <div className="space-y-4">
      <FormularioAchado
        rascunho={rascunho}
        setRascunho={setRascunho}
        editando={editando !== null}
        disabled={disabled}
        onAdd={adicionar}
        onSave={salvar}
        onCancel={() => {
          setRascunho(RASCUNHO_VAZIO)
          setEditando(null)
        }}
      />
      <TabelaAchados
        achados={fields.map((field, index) => {
          const item = achados[index] ?? field
          return {
            id: field.id,
            regiao: item.regiao ?? '',
            local: item.local ?? '',
            localOutro: item.localOutro,
            lado: item.lado,
            achado: item.achado,
            achadoOutro: item.achadoOutro,
            dor: item.dor,
            observacao: item.observacao,
          }
        })}
        disabled={disabled}
        onEdit={editar}
        onAskRemove={setPendente}
      />
      <RegistroAnterior texto={typeof palpacaoRegistro === 'string' ? palpacaoRegistro : ''} />
      <ListaTestes
        register={register}
        control={control}
        disabled={disabled}
        registroAnterior={typeof testesRegistro === 'string' ? testesRegistro : ''}
      />
      <TextField
        label="Resultados relevantes"
        name="ficha.avaliacaoPlano.palpacaoTestes.resultados"
        register={register}
        rows={2}
        disabled={disabled}
      />
      <TextField
        label="Teste funcional / medida de desempenho"
        name="ficha.avaliacaoPlano.palpacaoTestes.testeFuncional"
        register={register}
        rows={2}
        disabled={disabled}
      />
      <TextField
        label="Resultado inicial"
        name="ficha.avaliacaoPlano.palpacaoTestes.resultadoInicial"
        register={register}
        rows={2}
        disabled={disabled}
      />
      {!disabled ? (
        <ConfirmDialog
          open={pendente !== null}
          title="Remover achado?"
          description="Este achado sai da palpação. Esta ação não pode ser desfeita."
          confirmLabel="Remover achado"
          cancelLabel="Manter achado"
          tone="danger"
          onConfirm={() => {
            if (pendente === null) return
            remove(pendente)
            if (editando === pendente) {
              setRascunho(RASCUNHO_VAZIO)
              setEditando(null)
            } else if (editando !== null && editando > pendente) {
              setEditando(editando - 1)
            }
            setPendente(null)
          }}
          onClose={() => setPendente(null)}
        />
      ) : null}
    </div>
  )
}

function ForcaTable({
  register,
  control,
  disabled,
}: {
  register: UseFormRegister<EvaluationFormData>
  control: Control<EvaluationFormData>
  disabled?: boolean
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ficha.avaliacaoPlano.forca.linhas',
  })

  return (
    <div className="space-y-3">
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="grid gap-2 sm:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))_auto]"
        >
          <Input
            label={`Grupo ${index + 1}`}
            disabled={disabled}
            {...register(`ficha.avaliacaoPlano.forca.linhas.${index}.grupo`)}
          />
          <Input
            label={`Direito ${index + 1}`}
            disabled={disabled}
            {...register(`ficha.avaliacaoPlano.forca.linhas.${index}.direito`)}
          />
          <Input
            label={`Esquerdo ${index + 1}`}
            disabled={disabled}
            {...register(`ficha.avaliacaoPlano.forca.linhas.${index}.esquerdo`)}
          />
          <Input
            label={`Dor ${index + 1}`}
            disabled={disabled}
            {...register(`ficha.avaliacaoPlano.forca.linhas.${index}.dor`)}
          />
          <Input
            label={`Observação ${index + 1}`}
            disabled={disabled}
            {...register(`ficha.avaliacaoPlano.forca.linhas.${index}.observacao`)}
          />
          {!disabled ? (
            <button
              type="button"
              aria-label="Remover linha de força"
              className="inline-flex min-h-11 items-center justify-center text-sm text-muted hover:text-error sm:mt-7"
              onClick={() => remove(index)}
            >
              Remover
            </button>
          ) : (
            <span />
          )}
        </div>
      ))}
      {!disabled ? (
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            append({ grupo: '', direito: '', esquerdo: '', dor: '', observacao: '' })
          }
        >
          Adicionar linha
        </Button>
      ) : null}
    </div>
  )
}

export function EvaluationPage04({ register, watch, setValue, control, readOnly }: PageProps) {
  const disabled = readOnly

  return (
    <div className="space-y-4">
      <FichaBlock letter="A" title="Inspeção / observação">
        <CheckboxGrid>
          <BoolCheck label="Marcha" name="ficha.avaliacaoPlano.inspecao.marcha" register={register} disabled={disabled} />
          <BoolCheck label="Postura / posição espontânea" name="ficha.avaliacaoPlano.inspecao.postura" register={register} disabled={disabled} />
          <BoolCheck label="Edema" name="ficha.avaliacaoPlano.inspecao.edema" register={register} disabled={disabled} />
          <BoolCheck label="Equimose" name="ficha.avaliacaoPlano.inspecao.equimose" register={register} disabled={disabled} />
          <BoolCheck label="Atrofia aparente" name="ficha.avaliacaoPlano.inspecao.atrofia" register={register} disabled={disabled} />
          <BoolCheck label="Assimetria funcional" name="ficha.avaliacaoPlano.inspecao.assimetria" register={register} disabled={disabled} />
          <BoolCheck label="Compensações" name="ficha.avaliacaoPlano.inspecao.compensacoes" register={register} disabled={disabled} />
          <BoolCheck label="Outro" name="ficha.avaliacaoPlano.inspecao.outro" register={register} disabled={disabled} />
        </CheckboxGrid>
        {watch('ficha.avaliacaoPlano.inspecao.outro') ? (
          <LineField label="Outro (detalhe)" name="ficha.avaliacaoPlano.inspecao.outroDetalhe" register={register} disabled={disabled} />
        ) : null}
        <TextField label="Achados" name="ficha.avaliacaoPlano.inspecao.achados" register={register} rows={3} disabled={disabled} />
      </FichaBlock>

      <FichaBlock letter="B" title="Mobilidade">
        <MobilidadeRegioes
          register={register}
          watch={watch}
          setValue={setValue}
          control={control}
          disabled={disabled}
        />
      </FichaBlock>

      <FichaBlock letter="C" title="Força">
        <ForcaTable register={register} control={control} disabled={disabled} />
      </FichaBlock>

      <FichaBlock letter="D" title="Avaliação neurológica (se indicada)">
        <CheckboxGrid>
          <BoolCheck label="Sensibilidade" name="ficha.avaliacaoPlano.neurologico.sensibilidade" register={register} disabled={disabled} />
          <BoolCheck label="Miótomos" name="ficha.avaliacaoPlano.neurologico.miotomos" register={register} disabled={disabled} />
          <BoolCheck label="Reflexos" name="ficha.avaliacaoPlano.neurologico.reflexos" register={register} disabled={disabled} />
          <BoolCheck label="Neurodinâmica" name="ficha.avaliacaoPlano.neurologico.neurodinamica" register={register} disabled={disabled} />
          <BoolCheck label="Coordenação" name="ficha.avaliacaoPlano.neurologico.coordenacao" register={register} disabled={disabled} />
          <BoolCheck label="Outro" name="ficha.avaliacaoPlano.neurologico.outro" register={register} disabled={disabled} />
        </CheckboxGrid>
        {watch('ficha.avaliacaoPlano.neurologico.outro') ? (
          <LineField label="Outro (detalhe)" name="ficha.avaliacaoPlano.neurologico.outroDetalhe" register={register} disabled={disabled} />
        ) : null}
        <TextField label="Achados" name="ficha.avaliacaoPlano.neurologico.achados" register={register} rows={3} disabled={disabled} />
      </FichaBlock>

      <FichaBlock letter="E" title="Palpação / testes / função">
        <PalpacaoBloco register={register} watch={watch} control={control} disabled={disabled} />
      </FichaBlock>

      <div className="grid gap-4 lg:grid-cols-2">
        <FichaBlock letter="F" title="Síntese dos principais achados">
          <TextField label="Problema 1" name="ficha.avaliacaoPlano.sintese.problema1" register={register} rows={2} disabled={disabled} />
          <TextField label="Problema 2" name="ficha.avaliacaoPlano.sintese.problema2" register={register} rows={2} disabled={disabled} />
          <TextField label="Problema 3" name="ficha.avaliacaoPlano.sintese.problema3" register={register} rows={2} disabled={disabled} />
          <TextField label="Diagnóstico fisioterapêutico / síntese funcional" name="ficha.avaliacaoPlano.sintese.diagnosticoFisio" register={register} rows={3} disabled={disabled} />
          <TextField label="Prognóstico fisioterapêutico" name="ficha.avaliacaoPlano.sintese.prognostico" register={register} rows={3} disabled={disabled} />
        </FichaBlock>

        <FichaBlock letter="G" title="Objetivos">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Curto prazo</p>
          <TextField label="1" name="ficha.avaliacaoPlano.objetivos.curto1" register={register} rows={2} disabled={disabled} />
          <TextField label="2" name="ficha.avaliacaoPlano.objetivos.curto2" register={register} rows={2} disabled={disabled} />
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Médio / longo prazo</p>
          <TextField label="1" name="ficha.avaliacaoPlano.objetivos.medioLongo1" register={register} rows={2} disabled={disabled} />
          <TextField label="2" name="ficha.avaliacaoPlano.objetivos.medioLongo2" register={register} rows={2} disabled={disabled} />
        </FichaBlock>
      </div>

      <FichaBlock letter="H" title="Planejamento">
        <CheckboxGrid>
          <BoolCheck label="Educação / orientações" name="ficha.avaliacaoPlano.planejamento.educacao" register={register} disabled={disabled} />
          <BoolCheck label="Exercício terapêutico" name="ficha.avaliacaoPlano.planejamento.exercicioTerapeutico" register={register} disabled={disabled} />
          <BoolCheck label="Treino funcional" name="ficha.avaliacaoPlano.planejamento.treinoFuncional" register={register} disabled={disabled} />
          <BoolCheck label="Terapia manual quando indicada" name="ficha.avaliacaoPlano.planejamento.terapiaManual" register={register} disabled={disabled} />
          <BoolCheck label="Exposição / progressão de carga" name="ficha.avaliacaoPlano.planejamento.exposicaoCarga" register={register} disabled={disabled} />
          <BoolCheck label="Estratégias de autocuidado" name="ficha.avaliacaoPlano.planejamento.autocuidado" register={register} disabled={disabled} />
          <BoolCheck label="Outro" name="ficha.avaliacaoPlano.planejamento.outro" register={register} disabled={disabled} />
        </CheckboxGrid>
        {watch('ficha.avaliacaoPlano.planejamento.outro') ? (
          <LineField label="Outro (detalhe)" name="ficha.avaliacaoPlano.planejamento.outroDetalhe" register={register} disabled={disabled} />
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <LineField label="Frequência estimada" name="ficha.avaliacaoPlano.planejamento.frequencia" register={register} disabled={disabled} />
          <LineField label="Quantidade inicial de atendimentos" name="ficha.avaliacaoPlano.planejamento.qtdAtendimentos" register={register} disabled={disabled} />
        </div>
        <TextField label="Critérios para progressão" name="ficha.avaliacaoPlano.planejamento.criteriosProgressao" register={register} rows={2} disabled={disabled} />
        <TextField label="Critérios para reavaliação" name="ficha.avaliacaoPlano.planejamento.criteriosReavaliacao" register={register} rows={2} disabled={disabled} />
        <RadioRow
          legend="Necessidade de encaminhamento / comunicação com outro profissional?"
          name="ficha.avaliacaoPlano.planejamento.encaminhamento"
          register={register}
          disabled={disabled}
          options={[
            { value: 'nao', label: 'Não' },
            { value: 'sim', label: 'Sim' },
          ]}
        />
        {watch('ficha.avaliacaoPlano.planejamento.encaminhamento') === 'sim' ? (
          <TextField
            label="Encaminhamento (detalhe)"
            name="ficha.avaliacaoPlano.planejamento.encaminhamentoDetalhe"
            register={register}
            rows={2}
            disabled={disabled}
          />
        ) : null}
      </FichaBlock>

      <FichaBlock letter="ID" title="Identificação profissional">
        <div className="grid gap-4 sm:grid-cols-2">
          <LineField label="Fisioterapeuta" name="ficha.avaliacaoPlano.profissional.fisioterapeuta" register={register} disabled={disabled} />
          <LineField label="CREFITO" name="ficha.avaliacaoPlano.profissional.crefito" register={register} disabled={disabled} />
          <LineField label="Data" name="ficha.avaliacaoPlano.profissional.data" register={register} disabled={disabled} />
          <div className="sm:col-span-2">
            <SignaturePad
              label="Assinatura"
              value={watch('ficha.avaliacaoPlano.profissional.assinaturaTraco')}
              legacyText={watch('ficha.avaliacaoPlano.profissional.assinatura')}
              disabled={disabled}
              onChange={(next) => {
                setValue('ficha.avaliacaoPlano.profissional.assinaturaTraco', next, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
                if (next && watch('ficha.avaliacaoPlano.profissional.assinatura')?.trim()) {
                  setValue('ficha.avaliacaoPlano.profissional.assinatura', '', {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              }}
            />
          </div>
        </div>
      </FichaBlock>
    </div>
  )
}
