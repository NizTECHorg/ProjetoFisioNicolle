import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { PatientPicker } from '@/components/patients/PatientPicker'
import { TermCard } from '@/components/terms/TermCard'
import { TermsHistory } from '@/components/terms/TermsHistory'
import { TermsNav } from '@/components/terms/TermsNav'
import { TERMS_SECTION_IDS, termDomId } from '@/components/terms/termsSections'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/hooks/useAuth'
import { invalidatePatient, usePatient, useUpdatePatient } from '@/hooks/usePatients'
import { usePatientTerms } from '@/hooks/usePatientTerms'
import { CONSENT_TERMS, type TermKey, type TermValues } from '@/lib/consentTerms'
import { formatCpf, isValidCpf, maskCpf, normalizeCpf } from '@/lib/cpf'
import { updateOwnCrefito } from '@/services/auth.service'
import { toast } from '@/stores/toast.store'
import type { PatientListItem } from '@/types/patient'

const checkLabel = 'flex min-h-11 items-center gap-3 text-sm font-medium text-ink'
const CPF_ERROR = 'CPF inválido. Confira os números.'
const WIDE_MEDIA = '(min-width: 768px)'

/** Tablet/desktop: navegação lateral. Os termos são recolhíveis em todas as larguras. */
function useWideViewport() {
  const [wide, setWide] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(WIDE_MEDIA).matches : false,
  )
  useEffect(() => {
    const media = window.matchMedia(WIDE_MEDIA)
    const sync = () => setWide(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])
  return wide
}

export function TermsPage() {
  const { user, profile, reloadProfile } = useAuth()
  const qc = useQueryClient()
  const updatePatient = useUpdatePatient()
  const [patient, setPatient] = useState<PatientListItem | null>(null)
  const detail = usePatient(patient?.id).data
  const [cpfInput, setCpfInput] = useState('')
  const [nameEdit, setNameEdit] = useState<string | null>(null)
  const [crefitoEdit, setCrefitoEdit] = useState<string | null>(null)
  const [saveCrefito, setSaveCrefito] = useState(true)
  const [guardianOn, setGuardianOn] = useState(false)
  const [guardianName, setGuardianName] = useState('')
  const [guardianCpf, setGuardianCpf] = useState('')
  const wide = useWideViewport()
  const [collapsed, setCollapsed] = useState<ReadonlySet<TermKey>>(() => new Set())
  const patientTerms = usePatientTerms(patient?.id).data
  const savedKeys = useMemo(
    () => new Set<TermKey>(patient ? (patientTerms ?? []).map((t) => t.termType) : []),
    [patient, patientTerms],
  )

  function toggleCollapsed(key: TermKey) {
    setCollapsed((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function expand(key: TermKey) {
    setCollapsed((current) => {
      if (!current.has(key)) return current
      const next = new Set(current)
      next.delete(key)
      return next
    })
  }

  const therapistName = nameEdit ?? profile?.fullName ?? ''
  const crefito = crefitoEdit ?? profile?.crefito ?? ''
  const profileCrefitoEmpty = !profile?.crefito

  function changePatient(next: PatientListItem | null) {
    setPatient(next)
    setCpfInput('')
    setGuardianOn(false)
    setGuardianName('')
    setGuardianCpf('')
  }

  function saveCpf() {
    if (!patient || detail?.cpf || !isValidCpf(cpfInput)) return
    const id = patient.id
    updatePatient.mutate(
      { id, input: { cpf: normalizeCpf(cpfInput) } },
      {
        onSuccess: () => {
          invalidatePatient(qc, id)
          toast('CPF salvo no cadastro do paciente.', 'success')
        },
      },
    )
  }

  async function saveCrefitoToProfile() {
    if (!user || !profileCrefitoEmpty || !saveCrefito || !crefito.trim()) return
    try {
      await updateOwnCrefito(user.id, crefito)
      await reloadProfile()
      toast('CREFITO salvo.', 'success')
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Não foi possível salvar o CREFITO.', 'error')
    }
  }

  const cpfDigits = normalizeCpf(cpfInput)
  const guardianDigits = normalizeCpf(guardianCpf)

  const values: TermValues = {
    patientName: patient?.name ?? '',
    patientCpf: detail?.cpf || cpfDigits,
    therapistName,
    crefito,
    guardian: guardianOn ? { name: guardianName, cpf: guardianDigits } : null,
  }
  const resetKey = `${patient?.id ?? 'none'}|${guardianOn ? 'resp' : 'pac'}`

  return (
    <section className="mx-auto w-full max-w-2xl space-y-6 md:max-w-5xl">
      <PageHeader className="dash-in" title="Termos" info="Termos para o paciente assinar no app. Escolha o paciente, revise o texto, colete a assinatura e salve; o PDF fica guardado na ficha." description="Termos de consentimento assinados pelo paciente." />

      <div className="md:grid md:grid-cols-[minmax(0,1fr)_13rem] md:gap-6 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-8">
      <div className="min-w-0 space-y-6">
      <div id={TERMS_SECTION_IDS.signer} className="scroll-mt-4 space-y-4 rounded-2xl border border-line bg-surface p-4 md:p-6">
        <h2 className="text-xl font-semibold text-ink">Quem assina</h2>
        <PatientPicker value={patient} onChange={changePatient} />

        {patient ? (
          detail?.cpf ? (
            <p className="text-sm text-muted">{`CPF: ${maskCpf(detail.cpf)}`}</p>
          ) : (
            <Input
              label="CPF do paciente"
              inputMode="numeric"
              placeholder="000.000.000-00"
              maxLength={14}
              value={formatCpf(cpfInput)}
              onChange={(e) => setCpfInput(e.target.value)}
              onBlur={saveCpf}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveCpf()
              }}
              hint="Será salvo no cadastro do paciente e usado em todos os termos."
              error={cpfDigits.length === 11 && !isValidCpf(cpfInput) ? CPF_ERROR : undefined}
            />
          )
        ) : null}

        <Input
          label="Fisioterapeuta"
          value={therapistName}
          maxLength={120}
          onChange={(e) => setNameEdit(e.target.value)}
        />
        <Input
          label="CREFITO"
          value={crefito}
          maxLength={40}
          placeholder="Ex.: CREFITO-3/123456-F"
          onChange={(e) => setCrefitoEdit(e.target.value)}
          onBlur={() => void saveCrefitoToProfile()}
        />
        {profileCrefitoEmpty && crefito.trim() ? (
          <label className={checkLabel}>
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={saveCrefito}
              onChange={(e) => setSaveCrefito(e.target.checked)}
            />
            Salvar CREFITO no meu perfil
          </label>
        ) : null}

        <label className={checkLabel}>
          <input
            type="checkbox"
            className="h-5 w-5"
            checked={guardianOn}
            onChange={(e) => setGuardianOn(e.target.checked)}
          />
          Assinado por responsável legal
        </label>
        {guardianOn ? (
          <div className="space-y-4">
            <Input
              label="Nome do responsável"
              maxLength={120}
              value={guardianName}
              onChange={(e) => setGuardianName(e.target.value)}
            />
            <Input
              label="CPF do responsável"
              inputMode="numeric"
              placeholder="000.000.000-00"
              maxLength={14}
              value={formatCpf(guardianCpf)}
              onChange={(e) => setGuardianCpf(e.target.value)}
              error={guardianDigits.length === 11 && !isValidCpf(guardianCpf) ? CPF_ERROR : undefined}
            />
          </div>
        ) : null}
      </div>

      {CONSENT_TERMS.map((term) => (
        <TermCard
          key={term.key}
          term={term}
          values={values}
          patientId={patient?.id ?? null}
          resetKey={resetKey}
          createdByName={profile?.fullName ?? null}
          domId={termDomId(term.key)}
          collapsible
          collapsed={collapsed.has(term.key)}
          onToggleCollapsed={() => toggleCollapsed(term.key)}
        />
      ))}

      <div id={TERMS_SECTION_IDS.history} className="scroll-mt-4 pt-8">
        <TermsHistory patientId={patient?.id ?? null} />
      </div>
      </div>

      {wide ? (
        <TermsNav
          collapsed={collapsed}
          onToggle={toggleCollapsed}
          onExpand={expand}
          onSetAll={(all) => setCollapsed(all ? new Set(CONSENT_TERMS.map((t) => t.key)) : new Set())}
          saved={savedKeys}
        />
      ) : null}
      </div>
    </section>
  )
}
