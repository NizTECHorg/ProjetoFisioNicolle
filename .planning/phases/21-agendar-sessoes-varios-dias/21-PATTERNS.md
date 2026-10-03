# Phase 21: Agendar sessões em vários dias da semana - Pattern Map

**Mapped:** 2026-10-03
**Files analyzed:** 5 (2 new, 1 modified with heavy edits, 2 unchanged-but-consumed)
**Analogs found:** 4 / 5 (o teste `node:test` não tem analog — repo não possui nenhum teste)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/sessionSeries.ts` (NOVO) | utility (puro, datas) | transform | `src/lib/dashboardShortcut.ts` + `weeklyAt`/`clampWeeks`/`monthGrid` em `CalendarPage.tsx` L38-L58 | role-match + código movido (exato) |
| `src/lib/sessionSeries.test.ts` (NOVO) | test | transform | — (nenhum `*.test.ts` no repo) | none (usar RESEARCH) |
| `src/pages/CalendarPage.tsx` (EDITAR) | component/page (modal form) | request-response (form → mutation) | ele mesmo (modal "Nova sessão" L601-L722) | exact |
| `src/pages/CalendarPage.tsx` — chips Seg→Dom (trecho novo) | component (toggle group) | event-driven (UI state) | `src/components/patients/PatientAiComposer.tsx` L363-L388 e `evaluation/BodyMapPicker.tsx` L185-L211 | role-match |
| `src/services/calendar.service.ts` / `src/hooks/useClinic.ts` | service / hook | CRUD (batch insert) | — | SEM MUDANÇA (apenas consumidos) |

## Pattern Assignments

### `src/lib/sessionSeries.ts` (utility, transform)

**Analog 1 (convenção de módulo lib):** `src/lib/dashboardShortcut.ts` — funções puras exportadas, JSDoc curto, constantes nomeadas em UPPER_SNAKE.

**Convenção** (`dashboardShortcut.ts` L10-L11, L26-L35):
```typescript
/** Search Input only when writable count is at least 8 (UI-SPEC). */
export const PATIENT_SEARCH_THRESHOLD = 8

export function filterPatientsByName(patients: PatientListItem[], query: string): PatientListItem[] {
  const needle = query.trim().toLocaleLowerCase('pt-BR')
  if (!needle) return patients
  return patients.filter(/* ... */)
}
```
Nota: `dashboardShortcut.ts` importa via alias `@/`. **O helper novo NÃO pode usar `@/`** (rodará sob `node --test`); sem imports, ou só relativos com extensão `.ts`.

**Analog 2 (código a MOVER, não reescrever):** `src/pages/CalendarPage.tsx` L38-L58

`weeklyAt` (L47-L52) — será **removido** (substituído por `buildWeeklySeries`):
```typescript
function weeklyAt(start: Date, weeks: number): Date[] {
  return Array.from({ length: weeks }, (_, index) => {
    const next = new Date(start)
    next.setDate(start.getDate() + index * 7)
    return next
  })
}
```

`clampWeeks` (L54-L58) — **mover verbatim** para o lib e exportar; trocar o literal 24 por `MAX_SERIES_WEEKS`:
```typescript
function clampWeeks(value: string) {
  const count = Number(value)
  if (!Number.isFinite(count)) return 1
  return Math.min(24, Math.max(1, Math.trunc(count)))
}
```
Atenção: `''` → `Number('')` = 0 → clamp 1 ✓; `'2.7'` → 2 ✓; `'99'` → 24 ✓.

**Core pattern a escrever** (RESEARCH Pattern 1; constrói por componentes locais, como `weeklyAt`/`monthGrid` — nunca somar ms):
```typescript
export const MAX_SERIES_WEEKS = 24

export function buildWeeklySeries(start: Date, weekdays: readonly number[], cycles: number): Date[] {
  const days = new Set(weekdays) // 0=Dom..6=Sáb (Date.getDay)
  const out: Date[] = []
  for (let k = 0; k < cycles; k += 1) {
    for (let o = 0; o < 7; o += 1) {
      const d = new Date(
        start.getFullYear(), start.getMonth(), start.getDate() + k * 7 + o,
        start.getHours(), start.getMinutes(), 0, 0,
      )
      if (days.has(d.getDay())) out.push(d)
    }
  }
  return out
}
```
Mapeamento Seg-first ↔ JS day: o repo já usa `(first.getDay() + 6) % 7` em `monthGrid` (CalendarPage L36). Para os chips, preferir tabela `{ label, ariaLabel, day }` (Seg=1 … Sáb=6, Dom=0) — pode viver no lib (`SERIES_WEEKDAYS`) ou na página.

---

### `src/lib/sessionSeries.test.ts` (test, transform)

**Analog:** nenhum. `Glob src/**/*.test.ts*` → 0 arquivos; `package.json` scripts = `dev/build/lint/preview/typecheck` (sem `test`). Seguir RESEARCH L220-L234 (`node:test` + `node:assert/strict`, import relativo `./sessionSeries.ts`).

Pontos de compatibilidade verificados:
- `tsconfig.json` L9 `allowImportingTsExtensions: true` e `include: ["src"]` → o teste entra em `tsc --noEmit`; extensão `.ts` no import é permitida.
- Rodar: `TZ=America/Sao_Paulo node --test src/lib/sessionSeries.test.ts` (não adicionar script/pacote; opcional: nada em `package.json`).
- Casos mínimos: RESEARCH L300 (8 casos). Datas fixas: sexta = `new Date(2026, 9, 2, 9, 0)`.

---

### `src/pages/CalendarPage.tsx` (page, form → mutation)

**Analog:** o próprio arquivo. Todos os pontos de edição abaixo com linhas atuais.

**Imports** (L1-L21) — adicionar apenas:
```typescript
import { buildWeeklySeries, clampWeeks, /* SERIES_WEEKDAYS */ } from '@/lib/sessionSeries'
```
Convenção: alias `@/lib/...` já usado em L19 (`import { filterPatientsByName } from '@/lib/dashboardShortcut'`). `useMemo, useState, type FormEvent` já importados (L1).

**Remover** `weeklyAt` e `clampWeeks` locais (L47-L58). Manter `WEEKDAYS` (L23, usado também no cabeçalho do mini-calendário L423 e picker L672) e `monthGrid`.

**Estado** (L66-L79) — padrão `useState` simples; adicionar junto de `repeatWeeks` (L76):
```typescript
const [repeatWeeks, setRepeatWeeks] = useState('1')   // existente
// novos:
const [weekdays, setWeekdays] = useState<number[]>([today.getDay()])
const [weekdaysTouched, setWeekdaysTouched] = useState(false)
```

**Reset em `openComposer`** (L169-L177) — acrescentar:
```typescript
function openComposer() {
  setPatientId('')
  setPatientQuery('')
  setPatientMenuOpen(false)
  setSessionDate(selected)
  setPickerCursor(new Date(selected.getFullYear(), selected.getMonth(), 1))
  setRepeatWeeks('1')
  // novos: setWeekdays([selected.getDay()]); setWeekdaysTouched(false)
  setOpen(true)
}
```

**Seguir a data em `chooseSessionDate`** (L191-L197):
```typescript
function chooseSessionDate(date: Date) {
  const next = startOfDay(date)
  setSessionDate(next)
  // novo: if (!weekdaysTouched) setWeekdays([next.getDay()])
  setPickerCursor(new Date(next.getFullYear(), next.getMonth(), 1))
  setSelected(next)
  setCursor(new Date(next.getFullYear(), next.getMonth(), 1))
}
```

**Botão "Agendar sessão neste dia"** (L555-L563): hoje `onClick={() => setOpen(true)}` (L559) → trocar por `onClick={openComposer}` (RESEARCH Pitfall 6 / UI-SPEC Estados).

**Submit — padrão atual** (L199-L224), a alterar apenas as linhas de série:
```typescript
function submit(event: FormEvent) {
  event.preventDefault()
  if (!patientId) return
  const [hours = 9, minutes = 0] = time.split(':').map(Number)
  const when = new Date(sessionDate)
  when.setHours(hours, minutes, 0, 0)
  const weeks = clampWeeks(repeatWeeks)
  const scheduledAts = weeklyAt(when, weeks).map((date) => date.toISOString())   // ← trocar por buildWeeklySeries(when, weekdays, weeks)
  create.mutate(
    { patientId, scheduledAt: scheduledAts[0] ?? when.toISOString(), scheduledAts, type, place },
    { onSuccess: () => { setOpen(false); setPatientId(''); setPatientQuery(''); setPatientMenuOpen(false) } },
  )
}
```
Manter o `?? when.toISOString()` (necessário por `noUncheckedIndexedAccess`) e `if (dates.length === 0) return`. Não alterar `onSuccess`/toast.

**Preview — derivar com `useMemo`/const antes do `return`** (padrão do arquivo: `useMemo` para `counts`/`dueCards`, e `new Intl.DateTimeFormat('pt-BR', {...}).format(...)` para datas, ex.: L150, L521). Usar `buildWeeklySeries(previewStart, weekdays, clampWeeks(repeatWeeks))` para total/primeira/última data — nunca recalcular `D×S` à mão (UI-SPEC). Formato `dd/MM`:
```typescript
new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date)
```
(variação do `formatDueLabel` L162-L168, que usa `{ day:'2-digit', month:'2-digit', year:'numeric' }`; incluir ano só se primeira/última em anos diferentes.) Horário vazio → omitir ", às HH:mm". `previewStart` = `sessionDate` com `time` aplicado (mesma lógica `split(':')`/`setHours` do `submit`; extrair função local compartilhada para não duplicar).

**Rótulo de grupo — copiar exatamente do "Data"** (L645):
```tsx
<p className="mb-2 text-sm font-medium text-ink">Data</p>
```
Para o grupo novo: `<p id="dias-semana-label" className="mb-2 text-sm font-medium text-ink">Dias da semana</p>`.

**Chips — grade e estilo** (UI-SPEC; grade 7 colunas já usada em L430/L679 `grid grid-cols-7 gap-0.5`, aqui `gap-1`). Cores de selecionado copiadas de L691 (`isChosen ? 'bg-forest text-white' : ... 'hover:bg-surface'`) e de `BodyMapPicker`/`PatientAiComposer` para `aria-pressed` + `min-h-11`:

Analog de toggle com `aria-pressed` (`PatientAiComposer.tsx` L363-L376):
```tsx
<button
  type="button"
  aria-pressed={mode === 'resumo'}
  onClick={() => setMode('resumo')}
  className={[
    'min-h-11 rounded-lg px-3 text-sm font-medium transition',
    mode === 'resumo' ? 'bg-forest text-white' : 'text-muted hover:text-ink',
  ].join(' ')}
>
```
Analog de grupo semântico (`BodyMapPicker.tsx` L185): `<div className="space-y-4" role="group" aria-label="Mapa corporal da avaliação">` → no chips usar `role="group" aria-labelledby="dias-semana-label"`.

Esqueleto a produzir:
```tsx
<div>
  <p id="dias-semana-label" className="mb-2 text-sm font-medium text-ink">Dias da semana</p>
  <div role="group" aria-labelledby="dias-semana-label" className="grid grid-cols-7 gap-1">
    {SERIES_WEEKDAYS.map(({ label, ariaLabel, day }) => {
      const marked = weekdays.includes(day)
      const onlyOne = marked && weekdays.length === 1
      return (
        <button
          key={day}
          type="button"
          aria-pressed={marked}
          aria-label={ariaLabel}
          aria-disabled={onlyOne || undefined}
          onClick={() => toggleWeekday(day)}
          className={[
            'min-h-11 rounded-xl border text-sm font-medium transition',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25',
            marked ? 'border-forest bg-forest text-white' : 'border-line bg-canvas text-ink hover:bg-surface',
          ].join(' ')}
        >
          {label}
        </button>
      )
    })}
  </div>
  <p className="mt-2 text-xs text-muted">Marque um ou mais dias. Pelo menos um dia precisa ficar marcado.</p>
</div>
```
`toggleWeekday`: `setWeekdaysTouched(true)`; ignora se for o último marcado; senão alterna. (Evitar `Array#toSorted`/`with` se `lib` do tsconfig não cobrir — usar `filter`/spread.)

**Campo de semanas — substituir o `Input` "Horário fixo"** (L702-L715), mantendo o componente e props:
```tsx
<Input
  label="Horário fixo"            // → "Repetir por quantas semanas"
  type="number"
  min={1}
  max={24}                        // → MAX_SERIES_WEEKS
  inputMode="numeric"
  value={repeatWeeks}
  hint={ /* ternário dinâmico atual */ }   // → string fixa do UI-SPEC
  onChange={(event) => setRepeatWeeks(event.target.value)}
/>
```
Atenção: `Input` deriva `id` do `label` (`label.toLowerCase().replace(/\s+/g, '-')`, `Input.tsx` L11) — o novo rótulo gera id `repetir-por-quantas-semanas`; sem colisão com outros ids.

**Preview box — copiar classes do aviso existente** (L304-L306):
```tsx
<p className="rounded-2xl border border-accent/30 bg-accent-soft p-3 text-sm text-forest">
```
adicionar `role="status" aria-live="polite"` (analog de `role="status"`: `ToastViewport.tsx` L26).

**Botão de envio** (L718-L720): hoje
```tsx
<Button type="submit" fullWidth isLoading={create.isPending} disabled={!patientId}>
  Agendar
</Button>
```
→ filho condicional `total > 1 ? \`Agendar ${total} sessões\` : 'Agendar'`.

**Ordem no `<form className="space-y-4">`** (L602): Paciente → Data → Horário (L701) → **Dias da semana** → **Semanas** → **Preview** → Tipo (L716) → Sala (L717) → Botão. Ou seja: inserir chips/semanas/preview entre L701 e L716 (o `Input` "Horário fixo" já está nessa posição).

**Error handling:** nenhum novo. Erros de servidor tratados por `onError` em `useCreateSession` (`useClinic.ts` L40) → toast; `createSession` faz único `insert` atômico.

---

### `src/services/calendar.service.ts` e `src/hooks/useClinic.ts` (SEM MUDANÇA)

Contrato consumido (`calendar.service.ts` L80-L102):
```typescript
export async function createSession(input: {
  patientId: string; scheduledAt: string; scheduledAts?: string[]
  type: string; place: string; therapistId?: string; therapistName?: string
}) {
  const times = input.scheduledAts?.length ? input.scheduledAts : [input.scheduledAt]
  const { error } = await supabase.from('patient_sessions').insert(
    times.map((scheduledAt) => ({
      patient_id: input.patientId, scheduled_at: scheduledAt,
      session_type: input.type, place: input.place,
      status: 'agendada' as const,
      therapist_id: input.therapistId ?? null, therapist_name: input.therapistName ?? null,
    })),
  )
  throwIfError(error)
}
```
Hook (`useClinic.ts` L30-L42): `count = input.scheduledAts?.length ?? 1` → toast plural já pronto; invalida `['calendar-sessions']` e `['patients']`.

---

## Shared Patterns

### Datas locais (nunca ms, nunca UTC)
**Source:** `CalendarPage.tsx` L30-L45 (`startOfDay`, `sameDay`, `monthGrid`), L60-L63 (`toLocalInput`)
**Apply to:** `sessionSeries.ts`, cálculo de `previewStart`
```typescript
function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}
```
Serializar com `toISOString()` somente no `submit` (como L208).

### Estilos / tokens Tailwind reutilizados
**Source:** `CalendarPage.tsx` L645 (rótulo), L691 (selecionado `bg-forest text-white`), L304 (aviso `border-accent/30 bg-accent-soft p-3 text-sm text-forest`), `Input.tsx` L22-L27 (foco `focus:ring-2 focus:ring-accent/25`, hint `text-xs text-muted`)
**Apply to:** chips, preview, hint do campo de semanas

### Copy PT-BR + plural
**Source:** UI-SPEC "Copywriting Contract"; no código, plural sem helper (`CalendarPage.tsx` L472-L473 usa `"sessão(ões)"` — **não** copiar esse estilo; UI-SPEC exige `1 sessão`/`N sessões`, `1 semana`/`S semanas`, `1 dia`/`D dias`). Criar helper local `plural(n, singular, plural)` (não existe um no repo).
**Apply to:** preview e rótulo do botão

### Convenções TS do repo
- `strict` + índice possivelmente `undefined` (padrão `scheduledAts[0] ?? when.toISOString()`, L210; `const [hours = 9, minutes = 0] = ...`, L202).
- Sem `date-fns`/`dayjs` — só `Date` + `Intl.DateTimeFormat('pt-BR')`.
- Funções puras em `src/lib/*.ts`, componentes/páginas com estado local `useState` (sem form lib neste modal).

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/lib/sessionSeries.test.ts` | test | transform | Repo não tem nenhum teste automatizado nem script `test`; usar `node:test` conforme RESEARCH L220-L234 e comando `TZ=America/Sao_Paulo node --test src/lib/sessionSeries.test.ts` |
| Helper de plural pt-BR | utility | transform | Nenhum helper existente (só `"sessão(ões)"` inline na L472) |

## Metadata

**Analog search scope:** `src/lib/`, `src/pages/CalendarPage.tsx`, `src/services/calendar.service.ts`, `src/hooks/useClinic.ts`, `src/components/ui/Input.tsx`, `src/components/patients/{PatientAiComposer,evaluation/BodyMapPicker}.tsx`; Grep por `aria-pressed|role="group"|role="status"` em `src/`; Glob `src/**/*.test.ts*`
**Files scanned:** ~10 lidos integralmente/parcialmente
**Pattern extraction date:** 2026-10-03
