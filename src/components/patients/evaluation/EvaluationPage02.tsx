import type { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form'
import type { EvaluationFormData } from '@/schemas/evaluation.schema'
import { BodyMapPicker, type BodyMapMark } from '@/components/patients/evaluation/BodyMapPicker'
import {
  BoolCheck,
  CheckboxGrid,
  EvaField,
  FichaBlock,
  LineField,
  RadioRow,
  TextField,
} from '@/components/patients/evaluation/fichaFormPrimitives'

type PageProps = {
  register: UseFormRegister<EvaluationFormData>
  watch: UseFormWatch<EvaluationFormData>
  setValue: UseFormSetValue<EvaluationFormData>
  readOnly?: boolean
}

export function EvaluationPage02({ register, watch, setValue, readOnly }: PageProps) {
  const disabled = readOnly
  const marks = (watch('ficha.sintomas.mapa.marks') ?? []) as BodyMapMark[]

  return (
    <div className="space-y-4">
      <FichaBlock letter="A" title="Mapa corporal">
        <BodyMapPicker
          marks={marks}
          canWrite={!disabled}
          onChange={(next) =>
            setValue('ficha.sintomas.mapa.marks', next, { shouldDirty: true, shouldValidate: true })
          }
        />
      </FichaBlock>

      <FichaBlock letter="B" title="Característica predominante">
        <CheckboxGrid>
          <BoolCheck label="Dor" name="ficha.sintomas.caracteristica.dor" register={register} disabled={disabled} />
          <BoolCheck label="Rigidez" name="ficha.sintomas.caracteristica.rigidez" register={register} disabled={disabled} />
          <BoolCheck label="Fraqueza" name="ficha.sintomas.caracteristica.fraqueza" register={register} disabled={disabled} />
          <BoolCheck label="Parestesia / formigamento" name="ficha.sintomas.caracteristica.parestesia" register={register} disabled={disabled} />
          <BoolCheck label="Dormência" name="ficha.sintomas.caracteristica.dormencia" register={register} disabled={disabled} />
          <BoolCheck label="Instabilidade" name="ficha.sintomas.caracteristica.instabilidade" register={register} disabled={disabled} />
          <BoolCheck label="Travamento" name="ficha.sintomas.caracteristica.travamento" register={register} disabled={disabled} />
          <BoolCheck label="Estalo" name="ficha.sintomas.caracteristica.estalo" register={register} disabled={disabled} />
          <BoolCheck label="Edema" name="ficha.sintomas.caracteristica.edema" register={register} disabled={disabled} />
          <BoolCheck label="Outro" name="ficha.sintomas.caracteristica.outro" register={register} disabled={disabled} />
        </CheckboxGrid>
        {watch('ficha.sintomas.caracteristica.outro') ? (
          <LineField label="Outro (detalhe)" name="ficha.sintomas.caracteristica.outroDetalhe" register={register} disabled={disabled} />
        ) : null}
      </FichaBlock>

      <FichaBlock letter="C" title="Intensidade (0–10)">
        <div className="grid gap-4 sm:grid-cols-3">
          <EvaField label="Agora" name="ficha.sintomas.intensidade.agora" register={register} disabled={disabled} />
          <EvaField label="Melhor momento" name="ficha.sintomas.intensidade.melhor" register={register} disabled={disabled} />
          <EvaField label="Pior momento" name="ficha.sintomas.intensidade.pior" register={register} disabled={disabled} />
        </div>
      </FichaBlock>

      <FichaBlock letter="D" title="Comportamento em 24 horas">
        <RadioRow
          legend="Manhã"
          name="ficha.sintomas.comportamento24h.manha"
          register={register}
          disabled={disabled}
          options={[
            { value: 'melhor', label: 'Melhor' },
            { value: 'igual', label: 'Igual' },
            { value: 'pior', label: 'Pior' },
          ]}
        />
        <RadioRow
          legend="Durante o dia"
          name="ficha.sintomas.comportamento24h.dia"
          register={register}
          disabled={disabled}
          options={[
            { value: 'melhor', label: 'Melhor' },
            { value: 'igual', label: 'Igual' },
            { value: 'pior', label: 'Pior' },
          ]}
        />
        <RadioRow
          legend="Noite"
          name="ficha.sintomas.comportamento24h.noite"
          register={register}
          disabled={disabled}
          options={[
            { value: 'melhor', label: 'Melhor' },
            { value: 'igual', label: 'Igual' },
            { value: 'pior', label: 'Pior' },
          ]}
        />
        <RadioRow
          legend="Interfere no sono?"
          name="ficha.sintomas.comportamento24h.interfereSono"
          register={register}
          disabled={disabled}
          options={[
            { value: 'nao', label: 'Não' },
            { value: 'sim', label: 'Sim' },
          ]}
        />
        <RadioRow
          legend="Acorda por causa dos sintomas?"
          name="ficha.sintomas.comportamento24h.acordaPorSintomas"
          register={register}
          disabled={disabled}
          options={[
            { value: 'nao', label: 'Não' },
            { value: 'sim', label: 'Sim' },
          ]}
        />
      </FichaBlock>

      <div className="grid gap-4 lg:grid-cols-2">
        <FichaBlock letter="E" title="O que piora?">
          <CheckboxGrid>
            <BoolCheck label="Caminhar" name="ficha.sintomas.piora.caminhar" register={register} disabled={disabled} />
            <BoolCheck label="Agachar" name="ficha.sintomas.piora.agachar" register={register} disabled={disabled} />
            <BoolCheck label="Deitar" name="ficha.sintomas.piora.deitar" register={register} disabled={disabled} />
            <BoolCheck label="Carregar peso" name="ficha.sintomas.piora.carregarPeso" register={register} disabled={disabled} />
            <BoolCheck label="Correr" name="ficha.sintomas.piora.correr" register={register} disabled={disabled} />
            <BoolCheck label="Sentar" name="ficha.sintomas.piora.sentar" register={register} disabled={disabled} />
            <BoolCheck label="Escadas" name="ficha.sintomas.piora.escadas" register={register} disabled={disabled} />
            <BoolCheck label="Permanecer em pé" name="ficha.sintomas.piora.permanecerEmPe" register={register} disabled={disabled} />
            <BoolCheck label="Movimento específico" name="ficha.sintomas.piora.movimentoEspecifico" register={register} disabled={disabled} />
            <BoolCheck label="Trabalho" name="ficha.sintomas.piora.trabalho" register={register} disabled={disabled} />
            <BoolCheck label="Esporte" name="ficha.sintomas.piora.esporte" register={register} disabled={disabled} />
            <BoolCheck label="Outro" name="ficha.sintomas.piora.outro" register={register} disabled={disabled} />
          </CheckboxGrid>
          {watch('ficha.sintomas.piora.outro') ? (
            <LineField label="Outro (detalhe)" name="ficha.sintomas.piora.outroDetalhe" register={register} disabled={disabled} />
          ) : null}
          <TextField label="Detalhe" name="ficha.sintomas.piora.detalhe" register={register} rows={3} disabled={disabled} />
        </FichaBlock>

        <FichaBlock letter="F" title="O que melhora?">
          <CheckboxGrid>
            <BoolCheck label="Repouso" name="ficha.sintomas.melhora.repouso" register={register} disabled={disabled} />
            <BoolCheck label="Calor" name="ficha.sintomas.melhora.calor" register={register} disabled={disabled} />
            <BoolCheck label="Exercício" name="ficha.sintomas.melhora.exercicio" register={register} disabled={disabled} />
            <BoolCheck label="Movimento" name="ficha.sintomas.melhora.movimento" register={register} disabled={disabled} />
            <BoolCheck label="Frio" name="ficha.sintomas.melhora.frio" register={register} disabled={disabled} />
            <BoolCheck label="Mudança de posição" name="ficha.sintomas.melhora.mudancaPosicao" register={register} disabled={disabled} />
            <BoolCheck label="Medicamento" name="ficha.sintomas.melhora.medicamento" register={register} disabled={disabled} />
            <BoolCheck label="Outro" name="ficha.sintomas.melhora.outro" register={register} disabled={disabled} />
          </CheckboxGrid>
          {watch('ficha.sintomas.melhora.outro') ? (
            <LineField label="Outro (detalhe)" name="ficha.sintomas.melhora.outroDetalhe" register={register} disabled={disabled} />
          ) : null}
          <TextField label="Detalhe" name="ficha.sintomas.melhora.detalhe" register={register} rows={3} disabled={disabled} />
        </FichaBlock>
      </div>

      <FichaBlock letter="G" title="Irritabilidade / resposta">
        <RadioRow
          legend="Quanto esforço costuma ser necessário para provocar os sintomas?"
          name="ficha.sintomas.irritabilidade.esforcoProvocar"
          register={register}
          disabled={disabled}
          options={[
            { value: 'pouco', label: 'Pouco' },
            { value: 'moderado', label: 'Moderado' },
            { value: 'muito', label: 'Muito' },
            { value: 'variavel', label: 'Variável' },
          ]}
        />
        <RadioRow
          legend="Quanto tempo leva para voltar ao nível habitual?"
          name="ficha.sintomas.irritabilidade.tempoVoltar"
          register={register}
          disabled={disabled}
          options={[
            { value: 'minutos', label: 'Minutos' },
            { value: 'horas', label: 'Horas' },
            { value: 'ateDiaSeguinte', label: 'Até o dia seguinte' },
            { value: 'maisDe24h', label: 'Mais de 24h' },
            { value: 'variavel', label: 'Variável' },
          ]}
        />
      </FichaBlock>
    </div>
  )
}
