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

export function EvaluationPage03({ register, watch, readOnly }: PageProps) {
  const disabled = readOnly

  return (
    <div className="space-y-4">
      <FichaBlock letter="A" title="Principal limitação funcional">
        <p className="text-sm text-muted">
          O que você gostaria de fazer e hoje não consegue ou faz com dificuldade?
        </p>
        <TextField label="1" name="ficha.funcao.limitacaoFuncional.item1" register={register} rows={2} disabled={disabled} />
        <TextField label="2" name="ficha.funcao.limitacaoFuncional.item2" register={register} rows={2} disabled={disabled} />
        <TextField label="3" name="ficha.funcao.limitacaoFuncional.item3" register={register} rows={2} disabled={disabled} />
      </FichaBlock>

      <FichaBlock letter="B" title="Atividades afetadas">
        <CheckboxGrid>
          <BoolCheck label="Caminhar" name="ficha.funcao.atividadesAfetadas.caminhar" register={register} disabled={disabled} />
          <BoolCheck label="Correr" name="ficha.funcao.atividadesAfetadas.correr" register={register} disabled={disabled} />
          <BoolCheck label="Escadas" name="ficha.funcao.atividadesAfetadas.escadas" register={register} disabled={disabled} />
          <BoolCheck label="Agachar" name="ficha.funcao.atividadesAfetadas.agachar" register={register} disabled={disabled} />
          <BoolCheck label="Sentar" name="ficha.funcao.atividadesAfetadas.sentar" register={register} disabled={disabled} />
          <BoolCheck label="Levantar" name="ficha.funcao.atividadesAfetadas.levantar" register={register} disabled={disabled} />
          <BoolCheck label="Dormir" name="ficha.funcao.atividadesAfetadas.dormir" register={register} disabled={disabled} />
          <BoolCheck label="Dirigir" name="ficha.funcao.atividadesAfetadas.dirigir" register={register} disabled={disabled} />
          <BoolCheck label="Trabalhar" name="ficha.funcao.atividadesAfetadas.trabalhar" register={register} disabled={disabled} />
          <BoolCheck label="Estudar" name="ficha.funcao.atividadesAfetadas.estudar" register={register} disabled={disabled} />
          <BoolCheck label="Cuidar da casa" name="ficha.funcao.atividadesAfetadas.cuidarCasa" register={register} disabled={disabled} />
          <BoolCheck label="Vestir-se" name="ficha.funcao.atividadesAfetadas.vestirSe" register={register} disabled={disabled} />
          <BoolCheck label="Esporte" name="ficha.funcao.atividadesAfetadas.esporte" register={register} disabled={disabled} />
          <BoolCheck label="Lazer" name="ficha.funcao.atividadesAfetadas.lazer" register={register} disabled={disabled} />
          <BoolCheck label="Autocuidado" name="ficha.funcao.atividadesAfetadas.autocuidado" register={register} disabled={disabled} />
          <BoolCheck label="Outra" name="ficha.funcao.atividadesAfetadas.outra" register={register} disabled={disabled} />
        </CheckboxGrid>
        {watch('ficha.funcao.atividadesAfetadas.outra') ? (
          <LineField label="Outra (detalhe)" name="ficha.funcao.atividadesAfetadas.outraDetalhe" register={register} disabled={disabled} />
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <LineField label="Capacidade atual" name="ficha.funcao.atividadesAfetadas.capacidadeAtual" register={register} disabled={disabled} />
          <LineField label="Atividade" name="ficha.funcao.atividadesAfetadas.atividade" register={register} disabled={disabled} />
          <LineField label="Consigo por" name="ficha.funcao.atividadesAfetadas.consigoPor" register={register} disabled={disabled} />
          <LineField label="Antes conseguia por" name="ficha.funcao.atividadesAfetadas.antesConseguiaPor" register={register} disabled={disabled} />
        </div>
      </FichaBlock>

      <FichaBlock letter="C" title="Rotina e demanda">
        <fieldset className="space-y-2">
          <legend className="text-xs text-muted">Trabalho</legend>
          <CheckboxGrid>
            <BoolCheck label="Sentado" name="ficha.funcao.rotina.trabalho.sentado" register={register} disabled={disabled} />
            <BoolCheck label="Em pé" name="ficha.funcao.rotina.trabalho.emPe" register={register} disabled={disabled} />
            <BoolCheck label="Manual" name="ficha.funcao.rotina.trabalho.manual" register={register} disabled={disabled} />
            <BoolCheck label="Repetitivo" name="ficha.funcao.rotina.trabalho.repetitivo" register={register} disabled={disabled} />
            <BoolCheck label="Carga física elevada" name="ficha.funcao.rotina.trabalho.cargaElevada" register={register} disabled={disabled} />
            <BoolCheck label="Variável" name="ficha.funcao.rotina.trabalho.variavel" register={register} disabled={disabled} />
          </CheckboxGrid>
        </fieldset>
        <LineField label="Horas/dia" name="ficha.funcao.rotina.horasDia" register={register} disabled={disabled} />
        <RadioRow
          legend="Pratica atividade física?"
          name="ficha.funcao.rotina.praticaAtividadeFisica"
          register={register}
          disabled={disabled}
          options={[
            { value: 'nao', label: 'Não' },
            { value: 'sim', label: 'Sim' },
          ]}
        />
        {watch('ficha.funcao.rotina.praticaAtividadeFisica') === 'sim' ? (
          <LineField label="Qual / frequência" name="ficha.funcao.rotina.atividadeQualFreq" register={register} disabled={disabled} />
        ) : null}
      </FichaBlock>

      <FichaBlock letter="D" title="Expectativas e objetivos do paciente">
        <TextField
          label="O que seria uma boa melhora para você?"
          name="ficha.funcao.expectativas.boaMelhora"
          register={register}
          rows={3}
          disabled={disabled}
        />
        <fieldset className="space-y-2">
          <legend className="text-xs text-muted">Objetivo principal</legend>
          <CheckboxGrid>
            <BoolCheck label="Reduzir sintomas" name="ficha.funcao.expectativas.objetivos.reduzirSintomas" register={register} disabled={disabled} />
            <BoolCheck label="Recuperar movimento" name="ficha.funcao.expectativas.objetivos.recuperarMovimento" register={register} disabled={disabled} />
            <BoolCheck label="Recuperar força" name="ficha.funcao.expectativas.objetivos.recuperarForca" register={register} disabled={disabled} />
            <BoolCheck label="Voltar ao trabalho" name="ficha.funcao.expectativas.objetivos.voltarTrabalho" register={register} disabled={disabled} />
            <BoolCheck label="Voltar ao esporte" name="ficha.funcao.expectativas.objetivos.voltarEsporte" register={register} disabled={disabled} />
            <BoolCheck label="Recuperar independência" name="ficha.funcao.expectativas.objetivos.recuperarIndependencia" register={register} disabled={disabled} />
            <BoolCheck label="Dormir melhor" name="ficha.funcao.expectativas.objetivos.dormirMelhor" register={register} disabled={disabled} />
            <BoolCheck label="Outro" name="ficha.funcao.expectativas.objetivos.outro" register={register} disabled={disabled} />
          </CheckboxGrid>
        </fieldset>
        {watch('ficha.funcao.expectativas.objetivos.outro') ? (
          <LineField label="Outro (detalhe)" name="ficha.funcao.expectativas.objetivos.outroDetalhe" register={register} disabled={disabled} />
        ) : null}
      </FichaBlock>

      <FichaBlock letter="E" title="Triagem de segurança" tone="danger">
        <p className="text-xs font-medium text-error">Investigar conforme contexto</p>
        <CheckboxGrid>
          <BoolCheck label="Trauma importante recente" name="ficha.funcao.triagemSeguranca.traumaRecente" register={register} disabled={disabled} />
          <BoolCheck label="Febre / calafrios ou mal-estar sistêmico" name="ficha.funcao.triagemSeguranca.febreMalEstar" register={register} disabled={disabled} />
          <BoolCheck label="Perda de peso inexplicada relatada" name="ficha.funcao.triagemSeguranca.perdaPeso" register={register} disabled={disabled} />
          <BoolCheck label="Histórico de câncer relevante" name="ficha.funcao.triagemSeguranca.historicoCancer" register={register} disabled={disabled} />
          <BoolCheck label="Déficit neurológico novo ou progressivo" name="ficha.funcao.triagemSeguranca.deficitNeuro" register={register} disabled={disabled} />
          <BoolCheck label="Alteração recente de bexiga/intestino" name="ficha.funcao.triagemSeguranca.alteracaoBexigaIntestino" register={register} disabled={disabled} />
          <BoolCheck label="Alteração sensitiva perineal" name="ficha.funcao.triagemSeguranca.alteracaoSensitivaPerineal" register={register} disabled={disabled} />
          <BoolCheck label="Dor torácica associada" name="ficha.funcao.triagemSeguranca.dorToracica" register={register} disabled={disabled} />
          <BoolCheck label="Dispneia" name="ficha.funcao.triagemSeguranca.dispneia" register={register} disabled={disabled} />
          <BoolCheck label="Sinais pós-operatórios preocupantes" name="ficha.funcao.triagemSeguranca.sinaisPosOp" register={register} disabled={disabled} />
          <BoolCheck label="Outro achado inesperado" name="ficha.funcao.triagemSeguranca.outroAchado" register={register} disabled={disabled} />
        </CheckboxGrid>
        {watch('ficha.funcao.triagemSeguranca.outroAchado') ? (
          <LineField label="Outro achado (detalhe)" name="ficha.funcao.triagemSeguranca.outroAchadoDetalhe" register={register} disabled={disabled} />
        ) : null}
        <fieldset className="space-y-2">
          <legend className="text-xs text-muted">Conduta diante de achado relevante</legend>
          <CheckboxGrid>
            <BoolCheck label="Avaliei e documentei" name="ficha.funcao.triagemSeguranca.conduta.avalieiDocumentei" register={register} disabled={disabled} />
            <BoolCheck label="Preciso investigar mais" name="ficha.funcao.triagemSeguranca.conduta.precisoInvestigar" register={register} disabled={disabled} />
            <BoolCheck label="Encaminhamento indicado" name="ficha.funcao.triagemSeguranca.conduta.encaminhamento" register={register} disabled={disabled} />
            <BoolCheck label="Fluxo de urgência acionado" name="ficha.funcao.triagemSeguranca.conduta.urgencia" register={register} disabled={disabled} />
            <BoolCheck label="Não se aplica" name="ficha.funcao.triagemSeguranca.conduta.naoSeAplica" register={register} disabled={disabled} />
          </CheckboxGrid>
        </fieldset>
        <TextField label="Observações" name="ficha.funcao.triagemSeguranca.observacoes" register={register} rows={3} disabled={disabled} />
      </FichaBlock>

      <FichaBlock letter="F" title="Medicações / outras informações">
        <TextField label="Medicamentos em uso relevantes" name="ficha.funcao.medicacoes.medicamentos" register={register} rows={3} disabled={disabled} />
        <TextField label="Alergias relatadas" name="ficha.funcao.medicacoes.alergias" register={register} rows={2} disabled={disabled} />
        <TextField label="Outras informações clinicamente relevantes" name="ficha.funcao.medicacoes.outrasInfo" register={register} rows={3} disabled={disabled} />
      </FichaBlock>
    </div>
  )
}
