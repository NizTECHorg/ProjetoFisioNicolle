import type { EvaluationFicha } from '@/schemas/evaluationFicha.schema'
import { DetailLeaf } from '@/components/patients/evaluation/fichaFormPrimitives'
import { FOCUS_REGIONS } from '@/lib/focusRegions'

const SYMBOL_GLYPH: Record<string, string> = {
  X: 'X',
  hatch: '////',
  O: 'O',
  arrow: '↑',
  star: '★',
}

function checkedLabels(
  flags: Record<string, unknown> | undefined,
  labels: Record<string, string>,
): string | null {
  if (!flags) return null
  const parts = Object.entries(labels)
    .filter(([key]) => flags[key] === true)
    .map(([, label]) => label)
  if (flags.outroDetalhe && typeof flags.outroDetalhe === 'string' && flags.outroDetalhe.trim()) {
    parts.push(flags.outroDetalhe.trim())
  }
  if (flags.outraDetalhe && typeof flags.outraDetalhe === 'string' && flags.outraDetalhe.trim()) {
    parts.push(flags.outraDetalhe.trim())
  }
  if (flags.outrosDetalhe && typeof flags.outrosDetalhe === 'string' && flags.outrosDetalhe.trim()) {
    parts.push(flags.outrosDetalhe.trim())
  }
  if (flags.outroAchadoDetalhe && typeof flags.outroAchadoDetalhe === 'string' && flags.outroAchadoDetalhe.trim()) {
    parts.push(flags.outroAchadoDetalhe.trim())
  }
  return parts.length > 0 ? parts.join(', ') : null
}

type EvaluationFichaDetailProps = {
  ficha: EvaluationFicha
}

export function EvaluationFichaDetail({ ficha }: EvaluationFichaDetailProps) {
  const id = ficha.anamnese?.identificacao
  const queixa = ficha.anamnese?.queixa
  const historia = ficha.anamnese?.historiaAtual
  const tratamentos = ficha.anamnese?.tratamentos
  const pregresso = ficha.anamnese?.historicoPregresso
  const sintomas = ficha.sintomas
  const funcao = ficha.funcao
  const plano = ficha.avaliacaoPlano

  const marks = sintomas?.mapa?.marks ?? []
  const markLabels = marks
    .map((mark) => {
      const region = FOCUS_REGIONS.find((r) => r.key === mark.regionKey)
      if (!region) return null
      const glyph = mark.symbol ? SYMBOL_GLYPH[mark.symbol] ?? mark.symbol : ''
      return glyph ? `${region.label} (${glyph})` : region.label
    })
    .filter(Boolean)
    .join(', ')

  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">01 · Anamnese</p>
        <DetailLeaf label="Nome" value={id?.nomeCompleto} />
        <DetailLeaf label="Nascimento" value={id?.dataNascimento} />
        <DetailLeaf label="Profissão" value={id?.profissao} />
        <DetailLeaf label="Contato" value={id?.contato} />
        <DetailLeaf label="Queixa" value={queixa?.oQueTrouxe} />
        <DetailLeaf label="Região" value={queixa?.regiao} />
        <DetailLeaf
          label="Lado"
          value={checkedLabels(queixa?.lado, {
            direito: 'Direito',
            esquerdo: 'Esquerdo',
            bilateral: 'Bilateral',
            central: 'Central',
            naoSeAplica: 'Não se aplica',
          })}
        />
        <DetailLeaf label="Há quanto tempo" value={queixa?.haQuantoTempo} />
        <DetailLeaf label="Como começou" value={historia?.comoComecou} />
        <DetailLeaf label="Achados de exames" value={tratamentos?.achados} />
        <DetailLeaf label="Histórico — observações" value={pregresso?.observacoes} />
      </section>

      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">02 · Sintomas</p>
        <DetailLeaf label="Mapa corporal" value={markLabels || null} />
        <DetailLeaf
          label="Característica"
          value={checkedLabels(sintomas?.caracteristica, {
            dor: 'Dor',
            rigidez: 'Rigidez',
            fraqueza: 'Fraqueza',
            parestesia: 'Parestesia',
            dormencia: 'Dormência',
            instabilidade: 'Instabilidade',
            travamento: 'Travamento',
            estalo: 'Estalo',
            edema: 'Edema',
            outro: 'Outro',
          })}
        />
        <DetailLeaf label="EVA agora" value={sintomas?.intensidade?.agora} />
        <DetailLeaf label="EVA melhor" value={sintomas?.intensidade?.melhor} />
        <DetailLeaf label="EVA pior" value={sintomas?.intensidade?.pior} />
        <DetailLeaf label="O que piora — detalhe" value={sintomas?.piora?.detalhe} />
        <DetailLeaf label="O que melhora — detalhe" value={sintomas?.melhora?.detalhe} />
      </section>

      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">03 · Função</p>
        <DetailLeaf label="Limitação 1" value={funcao?.limitacaoFuncional?.item1} />
        <DetailLeaf label="Limitação 2" value={funcao?.limitacaoFuncional?.item2} />
        <DetailLeaf label="Limitação 3" value={funcao?.limitacaoFuncional?.item3} />
        <DetailLeaf label="Boa melhora" value={funcao?.expectativas?.boaMelhora} />
        <DetailLeaf label="Triagem — observações" value={funcao?.triagemSeguranca?.observacoes} />
        <DetailLeaf label="Medicamentos" value={funcao?.medicacoes?.medicamentos} />
        <DetailLeaf label="Alergias" value={funcao?.medicacoes?.alergias} />
      </section>

      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">04 · Avaliação e plano</p>
        <DetailLeaf label="Inspeção — achados" value={plano?.inspecao?.achados} />
        <DetailLeaf label="Neurológico — achados" value={plano?.neurologico?.achados} />
        <DetailLeaf label="Palpação" value={plano?.palpacaoTestes?.palpacao} />
        <DetailLeaf label="Testes clínicos" value={plano?.palpacaoTestes?.testesClinicos} />
        <DetailLeaf label="Diagnóstico fisioterapêutico" value={plano?.sintese?.diagnosticoFisio} />
        <DetailLeaf label="Prognóstico" value={plano?.sintese?.prognostico} />
        <DetailLeaf label="Objetivo curto 1" value={plano?.objetivos?.curto1} />
        <DetailLeaf label="Frequência" value={plano?.planejamento?.frequencia} />
        <DetailLeaf label="Progressão" value={plano?.planejamento?.criteriosProgressao} />
        <DetailLeaf label="Fisioterapeuta" value={plano?.profissional?.fisioterapeuta} />
      </section>
    </div>
  )
}
