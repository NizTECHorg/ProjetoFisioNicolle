import { useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { PdfFieldItem } from '@/lib/pdfFieldCatalog'
import { PATIENT_AI_COPY } from '@/schemas/patientAi.schema'
import { toast } from '@/stores/toast.store'

export type PatientAiFieldPickerProps = {
  open: boolean
  items: PdfFieldItem[]
  selectedIds: Set<string>
  onChange: (next: Set<string>) => void
  onConfirm: () => void
  onBack: () => void
  confirming?: boolean
}

/**
 * Modal checklist for selective PDF export (D-02).
 * Groups filled catalog items; defaults to all selected when parent opens.
 */
export function PatientAiFieldPicker({
  open,
  items,
  selectedIds,
  onChange,
  onConfirm,
  onBack,
  confirming = false,
}: PatientAiFieldPickerProps) {
  const groups = useMemo(() => {
    const map = new Map<string, PdfFieldItem[]>()
    for (const item of items) {
      const list = map.get(item.groupLabel) ?? []
      list.push(item)
      map.set(item.groupLabel, list)
    }
    return Array.from(map.entries())
  }, [items])

  const confirmDisabled = confirming || items.length === 0 || selectedIds.size === 0

  function selectAll() {
    onChange(new Set(items.map((item) => item.id)))
  }

  function clearSensitive() {
    const next = new Set(selectedIds)
    for (const item of items) {
      if (item.sensitive) next.delete(item.id)
    }
    onChange(next)
  }

  function toggle(id: string) {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange(next)
  }

  function handleConfirm() {
    if (items.length === 0 || selectedIds.size === 0) {
      toast(PATIENT_AI_COPY.needFields, 'error')
      return
    }
    onConfirm()
  }

  return (
    <Modal
      open={open}
      title={PATIENT_AI_COPY.pickerTitle}
      description={PATIENT_AI_COPY.pickerHelper}
      onClose={onBack}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" disabled={confirming || items.length === 0} onClick={selectAll}>
            {PATIENT_AI_COPY.pickerSelectAll}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={confirming || items.length === 0}
            onClick={clearSensitive}
          >
            {PATIENT_AI_COPY.pickerClearSensitive}
          </Button>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-muted">{PATIENT_AI_COPY.needFields}</p>
        ) : (
          <div className="max-h-[50vh] space-y-4 overflow-y-auto pr-1">
            {groups.map(([groupLabel, groupItems]) => (
              <section key={groupLabel} className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{groupLabel}</h3>
                <ul className="space-y-1">
                  {groupItems.map((item) => {
                    const checked = selectedIds.has(item.id)
                    return (
                      <li key={item.id}>
                        <label className="inline-flex min-h-11 w-full cursor-pointer items-start gap-2 rounded-xl px-1 py-1 text-sm text-ink hover:bg-canvas">
                          <input
                            type="checkbox"
                            className="mt-1 accent-forest"
                            checked={checked}
                            disabled={confirming}
                            onChange={() => toggle(item.id)}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block font-medium">{item.label}</span>
                            {item.preview ? (
                              <span className="mt-0.5 block truncate text-xs text-muted">{item.preview}</span>
                            ) : null}
                            {item.sensitive ? (
                              <span className="mt-0.5 block text-xs text-muted">Sensível</span>
                            ) : null}
                          </span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" disabled={confirming} onClick={onBack}>
            {PATIENT_AI_COPY.pickerBack}
          </Button>
          <Button
            type="button"
            isLoading={confirming}
            disabled={confirmDisabled}
            onClick={handleConfirm}
          >
            {PATIENT_AI_COPY.pickerConfirm}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
