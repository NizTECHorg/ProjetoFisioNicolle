export function plannedCount(value: number | '' | undefined) {
  if (value === '' || value == null) return 0
  return value
}

export function AttendanceCounts({ done, planned }: { done: number; planned: number }) {
  return (
    <div className="rounded-xl border border-line bg-canvas px-3 py-2.5">
      <p className="text-[11px] text-muted">Atendimentos</p>
      <div className="mt-1.5 flex items-end gap-3">
        <Count value={done} label="Feitos" />
        {planned > 0 ? (
          <>
            <span className="mb-0.5 h-8 w-px bg-line" aria-hidden />
            <Count value={planned} label="Planejados" />
          </>
        ) : null}
      </div>
    </div>
  )
}

function Count({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-lg font-semibold leading-none text-ink">{value}</p>
      <p className="mt-1 text-[11px] text-muted">{label}</p>
    </div>
  )
}
