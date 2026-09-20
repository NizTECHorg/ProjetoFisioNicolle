import { useFieldArray, type Control, type UseFormRegister, type UseFormWatch } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
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
  control: Control<EvaluationFormData>
  readOnly?: boolean
}

function MobilityTable({
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
    name: 'ficha.avaliacaoPlano.mobilidade.linhas',
  })

  return (
    <div className="space-y-3">
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="grid gap-2 sm:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))_auto]"
        >
          <Input
            label={`Movimento ${index + 1}`}
            disabled={disabled}
            {...register(`ficha.avaliacaoPlano.mobilidade.linhas.${index}.movimento`)}
          />
          <Input
            label={`Direito ${index + 1}`}
            disabled={disabled}
            {...register(`ficha.avaliacaoPlano.mobilidade.linhas.${index}.direito`)}
          />
          <Input
            label={`Esquerdo ${index + 1}`}
            disabled={disabled}
            {...register(`ficha.avaliacaoPlano.mobilidade.linhas.${index}.esquerdo`)}
          />
          <Input
            label={`Dor ${index + 1}`}
            disabled={disabled}
            {...register(`ficha.avaliacaoPlano.mobilidade.linhas.${index}.dor`)}
          />
          <Input
            label={`Observação ${index + 1}`}
            disabled={disabled}
            {...register(`ficha.avaliacaoPlano.mobilidade.linhas.${index}.observacao`)}
          />
          {!disabled ? (
            <button
              type="button"
              aria-label="Remover linha de mobilidade"
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
            append({ movimento: '', direito: '', esquerdo: '', dor: '', observacao: '' })
          }
        >
          Adicionar linha
        </Button>
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

export function EvaluationPage04({ register, watch, control, readOnly }: PageProps) {
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
        <MobilityTable register={register} control={control} disabled={disabled} />
        <CheckboxGrid>
          <BoolCheck label="Movimento ativo" name="ficha.avaliacaoPlano.mobilidade.ativo" register={register} disabled={disabled} />
          <BoolCheck label="Movimento passivo" name="ficha.avaliacaoPlano.mobilidade.passivo" register={register} disabled={disabled} />
          <BoolCheck label="Comparação bilateral" name="ficha.avaliacaoPlano.mobilidade.bilateral" register={register} disabled={disabled} />
        </CheckboxGrid>
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
