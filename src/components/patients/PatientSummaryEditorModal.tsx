import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { useSavePatientSummaryEdits } from '@/hooks/usePatients'
import {
  SUMMARY_FIELD_KEYS,
  SUMMARY_FIELD_LABELS,
  SUMMARY_FIELD_ROWS,
  diffSummaryEdits,
  resolveSummaryFields,
  summaryEditsSchema,
  type SummaryEditsFormData,
  type SummaryTexts,
} from '@/lib/patientSummary'
import { PATIENT_AI_COPY } from '@/schemas/patientAi.schema'

type PatientSummaryEditorModalProps = {
  patientId: string
  open: boolean
  onClose: () => void
  original: SummaryTexts
  edits: SummaryTexts | null
}

export function PatientSummaryEditorModal({
  patientId,
  open,
  onClose,
  original,
  edits,
}: PatientSummaryEditorModalProps) {
  const save = useSavePatientSummaryEdits(patientId)
  const form = useForm<SummaryEditsFormData>({
    resolver: zodResolver(summaryEditsSchema),
  })

  const resolved = resolveSummaryFields(original, edits)
  const resolvedRef = useRef(resolved)
  resolvedRef.current = resolved

  useEffect(() => {
    if (!open) return
    form.reset(resolvedRef.current)
  }, [open, form])

  return (
    <Modal
      open={open}
      wide
      title={PATIENT_AI_COPY.editModalTitle}
      description={PATIENT_AI_COPY.editModalDescription}
      onClose={onClose}
    >
      <form
        className="space-y-4 [&_label]:font-semibold"
        onSubmit={form.handleSubmit((values) => {
          const diff = diffSummaryEdits(original, values)
          save.mutate(diff, { onSuccess: onClose })
        })}
      >
        {SUMMARY_FIELD_KEYS.map((key) => (
          <Textarea
            key={key}
            label={SUMMARY_FIELD_LABELS[key]}
            rows={SUMMARY_FIELD_ROWS[key]}
            error={form.formState.errors[key]?.message}
            {...form.register(key)}
          />
        ))}
        <div className="flex flex-col-reverse gap-4 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            {PATIENT_AI_COPY.editModalCancel}
          </Button>
          <Button type="submit" isLoading={save.isPending}>
            {PATIENT_AI_COPY.editModalSubmit}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
