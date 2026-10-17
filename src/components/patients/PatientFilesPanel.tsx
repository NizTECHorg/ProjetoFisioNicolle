import { useState } from 'react'
import { PatientImagesPanel } from '@/components/patients/PatientImagesPanel'
import { PatientTermsPanel } from '@/components/patients/PatientTermsPanel'

interface PatientFilesPanelProps {
  patientId: string
  canWrite: boolean
}

type FilesTab = 'imagens' | 'termos'

export function PatientFilesPanel({ patientId, canWrite }: PatientFilesPanelProps) {
  const [tab, setTab] = useState<FilesTab>('imagens')
  const tabs: { key: FilesTab; label: string }[] = [
    { key: 'imagens', label: 'Imagens' },
    { key: 'termos', label: 'Termos' },
  ]
  return (
    <div className="space-y-6">
      <div role="tablist" className="flex gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={[
              'shrink-0 rounded-full border px-4 text-sm min-h-11',
              tab === t.key ? 'border-accent bg-accent-soft font-semibold text-forest' : 'border-line bg-surface text-muted',
            ].join(' ')}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'imagens' ? (
        <PatientImagesPanel patientId={patientId} canWrite={canWrite} />
      ) : (
        <PatientTermsPanel patientId={patientId} canWrite={canWrite} />
      )}
    </div>
  )
}
