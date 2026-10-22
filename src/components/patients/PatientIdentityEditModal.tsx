import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { useUpdatePatient } from '@/hooks/usePatients'
import {
  identityPatientSchema,
  patientStatusOptions,
  type IdentityPatientFormData,
} from '@/schemas/patient.schema'
import type { Patient } from '@/types/patient'

function dash(value: string) {
  return value === '—' ? '' : value
}

type PatientIdentityEditModalProps = {
  patient: Patient
  open: boolean
  onClose: () => void
}

/** "Dados iniciais" (nome, contato, nascimento, status). Aberto pelo lápis ao lado do nome, em qualquer aba. */
export function PatientIdentityEditModal({ patient, open, onClose }: PatientIdentityEditModalProps) {
  const update = useUpdatePatient()
  const form = useForm<IdentityPatientFormData>({
    resolver: zodResolver(identityPatientSchema),
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      fullName: patient.name,
      phone: dash(patient.phone),
      email: dash(patient.email),
      birthDate: patient.birthDateRaw ?? '',
      status: patient.status,
    })
  }, [open, patient, form])

  return (
    <Modal open={open} title="Dados iniciais" description="Nome, contato e identificação do paciente." onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit((values) =>
          update.mutate(
            {
              id: patient.id,
              input: {
                fullName: values.fullName,
                phone: values.phone,
                email: values.email,
                birthDate: values.birthDate,
                status: values.status,
              },
            },
            { onSuccess: onClose },
          ),
        )}
      >
        <Input
          label="Nome completo"
          error={form.formState.errors.fullName?.message}
          {...form.register('fullName')}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Telefone"
            type="tel"
            error={form.formState.errors.phone?.message}
            {...form.register('phone')}
          />
          <Input
            label="E-mail"
            type="email"
            error={form.formState.errors.email?.message}
            {...form.register('email')}
          />
          <Input
            label="Nascimento"
            type="date"
            error={form.formState.errors.birthDate?.message}
            {...form.register('birthDate')}
          />
        </div>
        <Select
          label="Status"
          options={patientStatusOptions}
          error={form.formState.errors.status?.message}
          {...form.register('status')}
        />
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={update.isPending}>
            Salvar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
