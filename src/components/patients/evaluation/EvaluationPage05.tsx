import type { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form'
import type { EvaluationFormData } from '@/schemas/evaluation.schema'
import { BodyDrawingPad } from '@/components/patients/evaluation/BodyDrawingPad'
import { FichaBlock, TextField } from '@/components/patients/evaluation/fichaFormPrimitives'

type PageProps = {
  register: UseFormRegister<EvaluationFormData>
  watch: UseFormWatch<EvaluationFormData>
  setValue: UseFormSetValue<EvaluationFormData>
  readOnly?: boolean
}

/** 05 · Mapa de sintomas: o profissional desenha onde e como o paciente sente, por cor. */
export function EvaluationPage05({ register, watch, setValue, readOnly }: PageProps) {
  const disabled = readOnly

  return (
    <div className="space-y-4">
      <FichaBlock letter="A" title="Desenho dos sintomas">
        {!disabled ? (
          <p className="text-sm leading-relaxed text-muted">
            Escolha a cor pelo tipo de sintoma e desenhe sobre o corpo, na vista da frente ou de costas.
          </p>
        ) : null}
        <BodyDrawingPad
          value={watch('ficha.mapaSintomas.tracos')}
          disabled={disabled}
          onChange={(next) =>
            setValue('ficha.mapaSintomas.tracos', next, { shouldDirty: true, shouldValidate: true })
          }
        />
        <TextField
          label="Observações do desenho"
          name="ficha.mapaSintomas.observacao"
          register={register}
          rows={2}
          disabled={disabled}
        />
      </FichaBlock>
    </div>
  )
}
