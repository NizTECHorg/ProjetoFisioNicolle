import { useId, useState } from 'react'
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
import { CATALOGO_MOBILIDADE } from '@/lib/mobilidadePalpacao'
import type { EvaluationFormData } from '@/schemas/evaluation.schema'
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
        <TextField label="Palpação relevante" name="ficha.avaliacaoPlano.palpacaoTestes.palpacao" register={register} rows={2} disabled={disabled} />
        <TextField label="Testes clínicos selecionados" name="ficha.avaliacaoPlano.palpacaoTestes.testesClinicos" register={register} rows={2} disabled={disabled} />
        <TextField label="Resultados relevantes" name="ficha.avaliacaoPlano.palpacaoTestes.resultados" register={register} rows={2} disabled={disabled} />
        <TextField label="Teste funcional / medida de desempenho" name="ficha.avaliacaoPlano.palpacaoTestes.testeFuncional" register={register} rows={2} disabled={disabled} />
        <TextField label="Resultado inicial" name="ficha.avaliacaoPlano.palpacaoTestes.resultadoInicial" register={register} rows={2} disabled={disabled} />
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
          <LineField label="Assinatura" name="ficha.avaliacaoPlano.profissional.assinatura" register={register} disabled={disabled} />
        </div>
      </FichaBlock>
    </div>
  )
}
