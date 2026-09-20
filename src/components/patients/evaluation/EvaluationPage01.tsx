import type { UseFormRegister, UseFormWatch } from 'react-hook-form'
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
  readOnly?: boolean
}

export function EvaluationPage01({ register, watch, readOnly }: PageProps) {
  const jaAconteceu = watch('ficha.anamnese.historiaAtual.jaAconteceuAntes')
  const disabled = readOnly

  return (
    <div className="space-y-4">
      <FichaBlock letter="A" title="Identificação">
        <div className="grid gap-4 sm:grid-cols-2">
          <LineField label="Nome completo" name="ficha.anamnese.identificacao.nomeCompleto" register={register} disabled={disabled} />
          <LineField label="Data de nascimento" name="ficha.anamnese.identificacao.dataNascimento" register={register} disabled={disabled} />
          <LineField label="Naturalidade" name="ficha.anamnese.identificacao.naturalidade" register={register} disabled={disabled} />
          <LineField label="Gênero" name="ficha.anamnese.identificacao.genero" register={register} disabled={disabled} />
          <LineField label="Estado civil" name="ficha.anamnese.identificacao.estadoCivil" register={register} disabled={disabled} />
          <LineField label="Profissão / ocupação" name="ficha.anamnese.identificacao.profissao" register={register} disabled={disabled} />
        </div>
        <TextField label="Endereço residencial" name="ficha.anamnese.identificacao.enderecoResidencial" register={register} rows={2} disabled={disabled} />
        <TextField label="Endereço profissional (quando aplicável)" name="ficha.anamnese.identificacao.enderecoProfissional" register={register} rows={2} disabled={disabled} />
        <TextField label="Contato" name="ficha.anamnese.identificacao.contato" register={register} rows={2} disabled={disabled} />
        <LineField label="Data da avaliação (na ficha)" name="ficha.anamnese.identificacao.dataAvaliacao" register={register} disabled={disabled} />
        <p className="text-xs text-muted">
          Campos mínimos alinhados à Resolução COFFITO nº 414/2012 — cópia editável nesta avaliação.
        </p>
      </FichaBlock>

      <FichaBlock letter="B" title="Queixa principal">
        <TextField
          label="O que trouxe você à fisioterapia?"
          name="ficha.anamnese.queixa.oQueTrouxe"
          register={register}
          rows={4}
          disabled={disabled}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <LineField label="Principal região" name="ficha.anamnese.queixa.regiao" register={register} disabled={disabled} />
          <LineField label="Há quanto tempo?" name="ficha.anamnese.queixa.haQuantoTempo" register={register} disabled={disabled} />
        </div>
        <fieldset className="space-y-2">
          <legend className="text-xs text-muted">Lado</legend>
          <CheckboxGrid>
            <BoolCheck label="Direito" name="ficha.anamnese.queixa.lado.direito" register={register} disabled={disabled} />
            <BoolCheck label="Esquerdo" name="ficha.anamnese.queixa.lado.esquerdo" register={register} disabled={disabled} />
            <BoolCheck label="Bilateral" name="ficha.anamnese.queixa.lado.bilateral" register={register} disabled={disabled} />
            <BoolCheck label="Central" name="ficha.anamnese.queixa.lado.central" register={register} disabled={disabled} />
            <BoolCheck label="Não se aplica" name="ficha.anamnese.queixa.lado.naoSeAplica" register={register} disabled={disabled} />
          </CheckboxGrid>
        </fieldset>
      </FichaBlock>

      <FichaBlock letter="C" title="História atual">
        <fieldset className="space-y-2">
          <legend className="text-xs text-muted">Início</legend>
          <CheckboxGrid>
            <BoolCheck label="Súbito" name="ficha.anamnese.historiaAtual.inicio.subito" register={register} disabled={disabled} />
            <BoolCheck label="Gradual" name="ficha.anamnese.historiaAtual.inicio.gradual" register={register} disabled={disabled} />
            <BoolCheck label="Após trauma" name="ficha.anamnese.historiaAtual.inicio.aposTrauma" register={register} disabled={disabled} />
            <BoolCheck label="Após cirurgia" name="ficha.anamnese.historiaAtual.inicio.aposCirurgia" register={register} disabled={disabled} />
            <BoolCheck label="Após mudança de carga/atividade" name="ficha.anamnese.historiaAtual.inicio.aposMudancaCarga" register={register} disabled={disabled} />
            <BoolCheck label="Sem mecanismo claro" name="ficha.anamnese.historiaAtual.inicio.semMecanismoClaro" register={register} disabled={disabled} />
          </CheckboxGrid>
        </fieldset>
        <LineField label="Data aproximada de início" name="ficha.anamnese.historiaAtual.dataAproxInicio" register={register} disabled={disabled} />
        <TextField label="Descreva como começou" name="ficha.anamnese.historiaAtual.comoComecou" register={register} rows={3} disabled={disabled} />
        <fieldset className="space-y-2">
          <legend className="text-xs text-muted">Evolução desde o início</legend>
          <CheckboxGrid>
            <BoolCheck label="Melhorando" name="ficha.anamnese.historiaAtual.evolucao.melhorando" register={register} disabled={disabled} />
            <BoolCheck label="Piorando" name="ficha.anamnese.historiaAtual.evolucao.piorando" register={register} disabled={disabled} />
            <BoolCheck label="Estável" name="ficha.anamnese.historiaAtual.evolucao.estavel" register={register} disabled={disabled} />
            <BoolCheck label="Oscilando" name="ficha.anamnese.historiaAtual.evolucao.oscilando" register={register} disabled={disabled} />
          </CheckboxGrid>
        </fieldset>
        <RadioRow
          legend="Já aconteceu antes?"
          name="ficha.anamnese.historiaAtual.jaAconteceuAntes"
          register={register}
          disabled={disabled}
          options={[
            { value: 'nao', label: 'Não' },
            { value: 'sim', label: 'Sim' },
          ]}
        />
        {jaAconteceu === 'sim' ? (
          <TextField
            label="Se sim, quando/como?"
            name="ficha.anamnese.historiaAtual.jaAconteceuDetalhe"
            register={register}
            rows={2}
            disabled={disabled}
          />
        ) : null}
      </FichaBlock>

      <FichaBlock letter="D" title="Tratamentos e investigações anteriores">
        <CheckboxGrid>
          <BoolCheck label="Fisioterapia" name="ficha.anamnese.tratamentos.fisio" register={register} disabled={disabled} />
          <BoolCheck label="Medicamentos" name="ficha.anamnese.tratamentos.medicamentos" register={register} disabled={disabled} />
          <BoolCheck label="Infiltração" name="ficha.anamnese.tratamentos.infiltracao" register={register} disabled={disabled} />
          <BoolCheck label="Cirurgia" name="ficha.anamnese.tratamentos.cirurgia" register={register} disabled={disabled} />
          <BoolCheck label="Imobilização" name="ficha.anamnese.tratamentos.imobilizacao" register={register} disabled={disabled} />
          <BoolCheck label="Outro" name="ficha.anamnese.tratamentos.outro" register={register} disabled={disabled} />
        </CheckboxGrid>
        {watch('ficha.anamnese.tratamentos.outro') ? (
          <LineField label="Outro (detalhe)" name="ficha.anamnese.tratamentos.outroDetalhe" register={register} disabled={disabled} />
        ) : null}
        <fieldset className="space-y-2">
          <legend className="text-xs text-muted">Exames complementares</legend>
          <CheckboxGrid>
            <BoolCheck label="Radiografia" name="ficha.anamnese.tratamentos.exames.rx" register={register} disabled={disabled} />
            <BoolCheck label="Ultrassom" name="ficha.anamnese.tratamentos.exames.us" register={register} disabled={disabled} />
            <BoolCheck label="Ressonância" name="ficha.anamnese.tratamentos.exames.rm" register={register} disabled={disabled} />
            <BoolCheck label="Tomografia" name="ficha.anamnese.tratamentos.exames.tc" register={register} disabled={disabled} />
            <BoolCheck label="Eletroneuromiografia" name="ficha.anamnese.tratamentos.exames.enmg" register={register} disabled={disabled} />
            <BoolCheck label="Outros" name="ficha.anamnese.tratamentos.exames.outros" register={register} disabled={disabled} />
          </CheckboxGrid>
        </fieldset>
        {watch('ficha.anamnese.tratamentos.exames.outros') ? (
          <LineField label="Outros exames" name="ficha.anamnese.tratamentos.exames.outrosDetalhe" register={register} disabled={disabled} />
        ) : null}
        <TextField label="Achados / informações relevantes dos exames" name="ficha.anamnese.tratamentos.achados" register={register} rows={3} disabled={disabled} />
      </FichaBlock>

      <FichaBlock letter="E" title="Histórico pregresso resumido">
        <CheckboxGrid>
          <BoolCheck label="Cirurgias anteriores" name="ficha.anamnese.historicoPregresso.cirurgias" register={register} disabled={disabled} />
          <BoolCheck label="Fraturas" name="ficha.anamnese.historicoPregresso.fraturas" register={register} disabled={disabled} />
          <BoolCheck label="Lesões musculoesqueléticas relevantes" name="ficha.anamnese.historicoPregresso.lesoesMsk" register={register} disabled={disabled} />
          <BoolCheck label="Condições neurológicas" name="ficha.anamnese.historicoPregresso.neuro" register={register} disabled={disabled} />
          <BoolCheck label="Condições cardiovasculares" name="ficha.anamnese.historicoPregresso.cardio" register={register} disabled={disabled} />
          <BoolCheck label="Diabetes" name="ficha.anamnese.historicoPregresso.diabetes" register={register} disabled={disabled} />
          <BoolCheck label="Câncer atual/prévio" name="ficha.anamnese.historicoPregresso.cancer" register={register} disabled={disabled} />
          <BoolCheck label="Doença inflamatória/reumatológica" name="ficha.anamnese.historicoPregresso.inflamatorioReuma" register={register} disabled={disabled} />
          <BoolCheck label="Outros" name="ficha.anamnese.historicoPregresso.outros" register={register} disabled={disabled} />
        </CheckboxGrid>
        {watch('ficha.anamnese.historicoPregresso.outros') ? (
          <LineField label="Outros (detalhe)" name="ficha.anamnese.historicoPregresso.outrosDetalhe" register={register} disabled={disabled} />
        ) : null}
        <TextField label="Observações" name="ficha.anamnese.historicoPregresso.observacoes" register={register} rows={3} disabled={disabled} />
      </FichaBlock>
    </div>
  )
}
