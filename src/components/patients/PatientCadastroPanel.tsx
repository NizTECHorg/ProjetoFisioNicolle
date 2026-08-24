import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { useUpdatePatient } from '@/hooks/usePatients'
import {
  adminSectionSchema,
  emergencySectionSchema,
  identityPatientSchema,
  patientStatusOptions,
  personalSectionSchema,
  treatmentSectionSchema,
  type AdminSectionFormData,
  type EmergencySectionFormData,
  type IdentityPatientFormData,
  type PersonalSectionFormData,
  type TreatmentSectionFormData,
} from '@/schemas/patient.schema'
import type { Patient, UpdatePatientInput } from '@/types/patient'

type EditSection = 'identity' | 'personal' | 'emergency' | 'admin' | 'treatment' | null

function displayValue(value: string) {
  return value && value !== '—' ? value : '—'
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-sm font-medium text-ink">{displayValue(value)}</p>
    </div>
  )
}

function EditableCard({
  title,
  onEdit,
  children,
  className = '',
  style,
}: {
  title: string
  onEdit: () => void
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  return (
    <article
      className={`group relative rounded-2xl border border-line bg-surface p-4 ${className}`}
      style={style}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{title}</p>
        <button
          type="button"
          aria-label={`Editar ${title}`}
          onClick={onEdit}
          className="rounded-lg p-1.5 text-muted opacity-100 transition hover:bg-accent-soft hover:text-forest md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
        >
          <Pencil size={14} />
        </button>
      </div>
      <div className="mt-3 space-y-3">{children}</div>
    </article>
  )
}

function dash(value: string) {
  return value === '—' ? '' : value
}

function FormActions({ onClose, isLoading }: { onClose: () => void; isLoading: boolean }) {
  return (
    <div className="flex justify-end gap-3 pt-2">
      <Button type="button" variant="secondary" onClick={onClose}>
        Cancelar
      </Button>
      <Button type="submit" isLoading={isLoading}>
        Salvar
      </Button>
    </div>
  )
}

type PatientCadastroPanelProps = {
  patient: Patient
  onRequestIdentityEdit?: (open: () => void) => void
}

export function PatientCadastroPanel({ patient, onRequestIdentityEdit }: PatientCadastroPanelProps) {
  const update = useUpdatePatient()
  const [section, setSection] = useState<EditSection>(null)

  const identityForm = useForm<IdentityPatientFormData>({
    resolver: zodResolver(identityPatientSchema),
  })
  const personalForm = useForm<PersonalSectionFormData>({
    resolver: zodResolver(personalSectionSchema),
  })
  const emergencyForm = useForm<EmergencySectionFormData>({
    resolver: zodResolver(emergencySectionSchema),
  })
  const adminForm = useForm<AdminSectionFormData>({
    resolver: zodResolver(adminSectionSchema),
  })
  const treatmentForm = useForm<TreatmentSectionFormData>({
    resolver: zodResolver(treatmentSectionSchema),
  })

  useEffect(() => {
    onRequestIdentityEdit?.(() => setSection('identity'))
  }, [onRequestIdentityEdit])

  useEffect(() => {
    if (!section) return
    if (section === 'identity') {
      identityForm.reset({
        fullName: patient.name,
        phone: dash(patient.phone),
        email: dash(patient.email),
        birthDate: patient.birthDateRaw ?? '',
        code: patient.code,
        status: patient.status,
      })
    }
    if (section === 'personal') {
      personalForm.reset({
        profession: dash(patient.profession),
        email: dash(patient.email),
      })
    }
    if (section === 'emergency') {
      emergencyForm.reset({
        emergencyName: dash(patient.emergencyName),
        emergencyPhone: dash(patient.emergencyPhone),
        emergencyRelation: dash(patient.emergencyRelation),
      })
    }
    if (section === 'admin') {
      adminForm.reset({
        therapistName: dash(patient.therapist),
        referralSource: dash(patient.referralSource),
        adminNotes: patient.adminNotes,
      })
    }
    if (section === 'treatment') {
      treatmentForm.reset({
        treatmentStartedOn: patient.startDateRaw ?? '',
        sessionsDone: patient.sessionsDone,
        sessionsTotal: patient.sessionsTotal,
        frequency: dash(patient.frequency),
      })
    }
  }, [patient, section, identityForm, personalForm, emergencyForm, adminForm, treatmentForm])

  function save(input: UpdatePatientInput) {
    update.mutate({ id: patient.id, input }, { onSuccess: () => setSection(null) })
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <EditableCard title="Pessoais" onEdit={() => setSection('personal')}>
          <Field label="Profissão" value={patient.profession} />
          <Field label="E-mail" value={patient.email} />
        </EditableCard>
        <EditableCard title="Emergência" onEdit={() => setSection('emergency')}>
          <Field label="Nome" value={patient.emergencyName} />
          <Field label="Telefone" value={patient.emergencyPhone} />
          <Field label="Parentesco" value={patient.emergencyRelation} />
        </EditableCard>
        <EditableCard title="Administrativo" onEdit={() => setSection('admin')}>
          <Field label="Fisioterapeuta" value={patient.therapist} />
          <Field label="Origem" value={patient.referralSource} />
        </EditableCard>
        <EditableCard title="Tratamento" onEdit={() => setSection('treatment')}>
          <Field label="Início" value={patient.startDate} />
          <Field label="Sessões" value={`${patient.sessionsDone} / ${patient.sessionsTotal}`} />
          <Field label="Frequência" value={patient.frequency} />
        </EditableCard>
      </div>

      <EditableCard title="Observações administrativas" onEdit={() => setSection('admin')} className="mt-4">
        <p className="whitespace-pre-wrap text-sm leading-6 text-ink">
          {patient.adminNotes || 'Nenhuma observação ainda.'}
        </p>
      </EditableCard>

      <Modal
        open={section === 'identity'}
        title="Dados iniciais"
        description="Nome, contato e identificação do paciente."
        onClose={() => setSection(null)}
      >
        <form
          className="space-y-4"
          onSubmit={identityForm.handleSubmit((values) =>
            save({
              fullName: values.fullName,
              phone: values.phone,
              email: values.email,
              birthDate: values.birthDate,
              code: values.code,
              status: values.status,
            }),
          )}
        >
          <Input
            label="Nome completo"
            error={identityForm.formState.errors.fullName?.message}
            {...identityForm.register('fullName')}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Telefone"
              type="tel"
              error={identityForm.formState.errors.phone?.message}
              {...identityForm.register('phone')}
            />
            <Input
              label="E-mail"
              type="email"
              error={identityForm.formState.errors.email?.message}
              {...identityForm.register('email')}
            />
            <Input
              label="Nascimento"
              type="date"
              error={identityForm.formState.errors.birthDate?.message}
              {...identityForm.register('birthDate')}
            />
            <Input
              label="Código"
              error={identityForm.formState.errors.code?.message}
              {...identityForm.register('code')}
            />
          </div>
          <Select
            label="Status"
            options={patientStatusOptions}
            error={identityForm.formState.errors.status?.message}
            {...identityForm.register('status')}
          />
          <FormActions onClose={() => setSection(null)} isLoading={update.isPending} />
        </form>
      </Modal>

      <Modal
        open={section === 'personal'}
        title="Dados pessoais"
        description="Profissão e e-mail deste card."
        onClose={() => setSection(null)}
      >
        <form
          className="space-y-4"
          onSubmit={personalForm.handleSubmit((values) =>
            save({ profession: values.profession, email: values.email }),
          )}
        >
          <Input
            label="Profissão"
            error={personalForm.formState.errors.profession?.message}
            {...personalForm.register('profession')}
          />
          <Input
            label="E-mail"
            type="email"
            error={personalForm.formState.errors.email?.message}
            {...personalForm.register('email')}
          />
          <FormActions onClose={() => setSection(null)} isLoading={update.isPending} />
        </form>
      </Modal>

      <Modal
        open={section === 'emergency'}
        title="Contato de emergência"
        description="Quem acionar em caso de urgência."
        onClose={() => setSection(null)}
      >
        <form
          className="space-y-4"
          onSubmit={emergencyForm.handleSubmit((values) =>
            save({
              emergencyName: values.emergencyName,
              emergencyPhone: values.emergencyPhone,
              emergencyRelation: values.emergencyRelation,
            }),
          )}
        >
          <Input
            label="Nome"
            error={emergencyForm.formState.errors.emergencyName?.message}
            {...emergencyForm.register('emergencyName')}
          />
          <Input
            label="Telefone"
            type="tel"
            error={emergencyForm.formState.errors.emergencyPhone?.message}
            {...emergencyForm.register('emergencyPhone')}
          />
          <Input
            label="Parentesco"
            error={emergencyForm.formState.errors.emergencyRelation?.message}
            {...emergencyForm.register('emergencyRelation')}
          />
          <FormActions onClose={() => setSection(null)} isLoading={update.isPending} />
        </form>
      </Modal>

      <Modal
        open={section === 'admin'}
        title="Administrativo"
        description="Fisioterapeuta, origem e observações."
        onClose={() => setSection(null)}
      >
        <form
          className="space-y-4"
          onSubmit={adminForm.handleSubmit((values) =>
            save({
              therapistName: values.therapistName,
              referralSource: values.referralSource,
              adminNotes: values.adminNotes,
            }),
          )}
        >
          <Input
            label="Fisioterapeuta"
            error={adminForm.formState.errors.therapistName?.message}
            {...adminForm.register('therapistName')}
          />
          <Input
            label="Origem / indicação"
            error={adminForm.formState.errors.referralSource?.message}
            {...adminForm.register('referralSource')}
          />
          <Textarea
            label="Observações administrativas"
            error={adminForm.formState.errors.adminNotes?.message}
            {...adminForm.register('adminNotes')}
          />
          <FormActions onClose={() => setSection(null)} isLoading={update.isPending} />
        </form>
      </Modal>

      <Modal
        open={section === 'treatment'}
        title="Tratamento"
        description="Início, sessões e frequência."
        onClose={() => setSection(null)}
      >
        <form
          className="space-y-4"
          onSubmit={treatmentForm.handleSubmit((values) =>
            save({
              treatmentStartedOn: values.treatmentStartedOn,
              sessionsDone: values.sessionsDone,
              sessionsTotal: values.sessionsTotal,
              frequency: values.frequency,
            }),
          )}
        >
          <Input
            label="Início do tratamento"
            type="date"
            error={treatmentForm.formState.errors.treatmentStartedOn?.message}
            {...treatmentForm.register('treatmentStartedOn')}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Sessões feitas"
              type="number"
              min={0}
              error={treatmentForm.formState.errors.sessionsDone?.message}
              {...treatmentForm.register('sessionsDone')}
            />
            <Input
              label="Sessões planejadas"
              type="number"
              min={0}
              error={treatmentForm.formState.errors.sessionsTotal?.message}
              {...treatmentForm.register('sessionsTotal')}
            />
          </div>
          <Input
            label="Frequência"
            error={treatmentForm.formState.errors.frequency?.message}
            {...treatmentForm.register('frequency')}
          />
          <FormActions onClose={() => setSection(null)} isLoading={update.isPending} />
        </form>
      </Modal>
    </>
  )
}
