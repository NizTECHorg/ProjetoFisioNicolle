# Phase 21: Agendar sessões em vários dias da semana com repetição - Research

**Researched:** 2026-10-03
**Domain:** Agenda (React 19 + TanStack Query + Supabase) — geração de série de datas e insert em lote em `patient_sessions`
**Confidence:** HIGH (código lido na íntegra; sem mudança de schema; sem dependências novas)

## Summary

Hoje o modal "Nova sessão" de `CalendarPage.tsx` recebe uma data (`sessionDate`), um horário e um campo numérico chamado "Horário fixo" (`repeatWeeks`, 1–24). `submit` chama `weeklyAt(when, weeks)`, que devolve `weeks` datas espaçadas de 7 dias a partir da data escolhida, e envia o array `scheduledAts` para `useCreateSession` → `createSession` em `calendar.service.ts`, que faz **um único** `supabase.from('patient_sessions').insert([...])` com N linhas, todas `status: 'agendada'`. [VERIFIED: codebase — `src/pages/CalendarPage.tsx` L47-L58, L199-L223; `src/services/calendar.service.ts` L80-L102]

O backend já suporta tudo que a fase precisa: `createSession` aceita `scheduledAts: string[]` de tamanho arbitrário, o insert é uma única instrução (atômica), a RLS `patient_sessions_insert` só exige `can_write_patient(patient_id)`, não há constraint de unicidade em data/hora, e cada ocorrência é uma linha individual (a exportação Google Calendar e a leitura da agenda já tratam linhas individuais). **A fase é 100% frontend**: um helper puro que gera as datas a partir de (data inicial, conjunto de dias da semana, nº de repetições) + UI de seleção de dias no modal. Sem SQL, sem Edge Function, sem pacote novo. [VERIFIED: codebase — `supabase/03-account-types-team.sql` L629-L633; `supabase/functions/google-calendar-export/index.ts` L283-L289]

Não existe framework de teste (sem Vitest/Jest); as fases anteriores (ex.: 20) validam com `npm run typecheck`. Para esta fase a lógica de datas é o único ponto com risco real de regressão, e Node 26 executa `.ts` diretamente com `node --test`, então um teste unitário do helper puro roda **sem instalar nada**. [VERIFIED: probe local — `node --test a.test.ts` passou com Node v26.4.0]

**Primary recommendation:** Extrair um helper puro `buildWeeklySeries(start, weekdays, cycles)` em `src/lib/sessionSeries.ts` (sem imports `@/`), onde "quantas vezes" = **número de semanas (ciclos de 7 dias a partir da data inicial)**; cada dia marcado ocorre exatamente uma vez por ciclo. Com 1 dia marcado o resultado é idêntico ao `weeklyAt` de hoje. Adicionar chips de dias da semana (pré-marcado o dia da data escolhida) ao modal, preview "Serão criadas N sessões" e reaproveitar `createSession` sem alterar o service.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Escolha de dias da semana + nº de repetições | Browser / Client | — | Estado do formulário em `CalendarPage` (modal) |
| Geração das datas da série | Browser / Client | — | Função pura de data local; fuso do navegador define "mesmo horário" (já é assim hoje com `setHours`) |
| Persistência das N sessões | API / Backend (Supabase PostgREST) | Database / Storage | Um insert em lote já existente; RLS decide acesso |
| Autorização de escrita | Database / Storage (RLS) | — | `can_write_patient(patient_id)` já cobre insert |
| Exibição na agenda / contadores | Browser / Client | API | `useCalendarSessions` + `invalidateQueries` já refrescam |
| Exportação Google Calendar | API / Backend (Edge Function) | — | Lê linhas individuais; **não muda** |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | ^19.1.0 | Estado do modal (dias marcados, repetições) | Já em uso [VERIFIED: package.json] |
| @tanstack/react-query | ^5.76.1 | `useCreateSession` (mutation + invalidate) | Já em uso, sem alteração [VERIFIED: `src/hooks/useClinic.ts` L30-L41] |
| @supabase/supabase-js | 2.117.1 | Insert em lote em `patient_sessions` | Já em uso [VERIFIED: `calendar.service.ts`] |
| `Date` nativo | — | Cálculo de datas locais | O projeto não tem `date-fns`/`dayjs` [VERIFIED: rg em package.json]; `weeklyAt`, `startOfDay`, `monthGrid` já usam `Date` nativo |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `node:test` + `node:assert` (built-in, Node 26) | — | Teste unitário do helper puro | Wave 0 / task do helper; sem instalar pacote |
| lucide-react | ^1.25.0 | Ícones, se necessário | Só se o preview precisar de ícone |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `Date` nativo | `date-fns` / `rrule` | Proibido pela restrição (sem pacote novo, "prefer existing date helpers"); a regra de recorrência é trivial |
| Vitest | `node --test` | Vitest = pacote novo (proibido); `node --test` já funciona |
| N inserts por ocorrência | Um insert em lote | Lote já é o padrão e é atômico — não mudar |

**Installation:** nenhuma. `npm install` não é necessário.

## Package Legitimacy Audit

Nenhum pacote externo é instalado nesta fase.

**Packages removed due to slopcheck [SLOP] verdict:** none (n/a)
**Packages flagged as suspicious [SUS]:** none (n/a)

## Architecture Patterns

### System Architecture Diagram

```
Profissional abre "Nova sessão"
        │
        ▼
 Modal (CalendarPage)
   paciente ─ data inicial (picker) ─ horário ─ [chips Seg..Dom] ─ nº de semanas ─ tipo ─ sala
        │                                   │
        │         (muda data inicial) ──────┘ auto-ajusta chip se usuário ainda não mexeu nos chips
        ▼
 submit()
   when = data inicial + horário (setHours local)
   dates = buildWeeklySeries(when, weekdays, cycles)      ← função pura (src/lib/sessionSeries.ts)
   scheduledAts = dates.map(toISOString)
        │
        ▼
 useCreateSession.mutate({ patientId, scheduledAt: scheduledAts[0], scheduledAts, type, place })
        │
        ▼
 createSession() ── 1× supabase.from('patient_sessions').insert([N linhas, status 'agendada'])
        │                                         │
        │                                         ▼
        │                           RLS patient_sessions_insert → can_write_patient
        ▼
 onSuccess: invalidate ['calendar-sessions'], ['patients']; toast "N sessões agendadas"
        │
        ▼
 Agenda re-renderiza; Google export (Edge Function) lê linhas individuais — inalterado
```

### Recommended Project Structure
```
src/
├── lib/
│   ├── sessionSeries.ts        # NOVO: buildWeeklySeries + clamp/constantes (puro, sem imports '@/')
│   └── sessionSeries.test.ts   # NOVO: node --test (imports relativos com extensão .ts)
├── pages/
│   └── CalendarPage.tsx        # EDITAR: remover weeklyAt/clampWeeks locais; chips + preview; submit
├── services/calendar.service.ts  # SEM MUDANÇA (scheduledAts já suportado)
└── hooks/useClinic.ts            # SEM MUDANÇA (toast já pluraliza com count)
```

### Pattern 1: Série por ciclos de 7 dias a partir da data inicial (RECOMENDADO)
**What:** Para `k` de `0` a `cycles-1` e `o` de `0` a `6`, o candidato é `start + 7k + o` dias; entra na série se o `getDay()` do candidato está no conjunto de dias marcados. Resultado: cada dia marcado ocorre **exatamente uma vez por ciclo**, em ordem cronológica, sem pular dias nem gerar semanas parciais.
**When to use:** Sempre que a série for gerada. Com 1 dia marcado (= dia da data inicial) é idêntico a `weeklyAt` atual.
**Example:**
```typescript
// Validado localmente (Node 26, TZ=America/Sao_Paulo): sexta 2026-10-02, dias [seg, qua, sáb], 2 ciclos
// → sáb 03/10, seg 05/10, qua 07/10, sáb 10/10, seg 12/10, qua 14/10 (todas 09:00)
// Só sexta, 3 ciclos → 02/10, 09/10, 16/10 (igual ao weeklyAt de hoje)
export function buildWeeklySeries(start: Date, weekdays: readonly number[], cycles: number): Date[] {
  const days = new Set(weekdays) // 0=Dom..6=Sáb (Date.getDay)
  const out: Date[] = []
  for (let k = 0; k < cycles; k += 1) {
    for (let o = 0; o < 7; o += 1) {
      // Construir por componentes locais preserva a hora local (sem somar 86_400_000 ms)
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
[VERIFIED: protótipo executado localmente nesta sessão]

### Pattern 2: Chips de dias da semana
**What:** 7 botões `type="button"` com `aria-pressed`, rótulos `Seg Ter Qua Qui Sex Sáb Dom` (reusar `WEEKDAYS` já existente em `CalendarPage.tsx`, ordem Seg→Dom). **Cuidado de mapeamento:** `WEEKDAYS` começa em Segunda (índice 0 = Seg) e `Date.getDay()` começa em Domingo (0 = Dom). Converter com `(getDay() + 6) % 7` (mesma fórmula de `monthGrid`) ou manter um array `{ label, jsDay }`.
**When to use:** Seletor de dias no modal. Estilo: reaproveitar classes dos botões do date picker (`bg-forest text-white` marcado, `hover:bg-surface` desmarcado; alvo mínimo ≥ 44px como os botões `min-h-11` do projeto).

### Pattern 3: Pré-seleção que segue a data
**What:** Estado `weekdays: number[]` + flag `weekdaysTouched: boolean`. Ao abrir (`openComposer`) e ao escolher outra data (`chooseSessionDate`), se `!weekdaysTouched`, `weekdays = [data.getDay()]`. Quando o usuário clica num chip, `weekdaysTouched = true` e a data passa a ser apenas "início da série". Resetar ambos em `openComposer`.
**Why:** Mantém o comportamento de hoje sem nenhum clique extra (requisito 4) e evita série sem o dia pretendido.

### Anti-Patterns to Avoid
- **Somar `7 * 86_400_000` ms:** quebra em troca de horário de verão (mesmo que o Brasil hoje não tenha, o código roda no fuso do navegador). Usar componentes locais (`setDate` / construtor com dia somado), como `weeklyAt` já faz.
- **Gerar por "semana calendário" (seg–dom) a partir do dia 1 da semana:** descarta dias anteriores à data inicial na 1ª semana e dá contagens irregulares (ex.: sexta + seg/qua daria 0 sessões na semana 0). Usar ciclos de 7 dias a partir da data inicial.
- **Múltiplos `mutate` (um por dia):** perde atomicidade e dispara N toasts/invalidações. Manter um único `createSession` com `scheduledAts`.
- **Mudar `calendar.service.ts` ou o schema:** desnecessário.
- **Permitir submit com zero dias marcados:** `disabled` no botão e/ou erro inline.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Insert em lote atômico | Loop de inserts / RPC nova | `createSession` com `scheduledAts` | Já faz 1 insert com N linhas; RLS já cobre |
| Toast plural | Novo toast | `useCreateSession.onSuccess` | Já mostra "N sessões agendadas" quando `count > 1` |
| Biblioteca de recorrência | `rrule`, `date-fns` | `Date` nativo + helper de ~10 linhas | Proibido pacote novo; regra simples |
| Máscara/validação de número | Componente novo | `clampWeeks` existente (mover para o lib) | Já normaliza NaN/limites |
| Botões toggle | Biblioteca de UI | Botões Tailwind como no picker | Consistência visual |

**Key insight:** o custo da fase está em (a) uma função de datas correta e (b) UI clara em PT-BR. Tudo a jusante já existe.

## Runtime State Inventory

Não é fase de rename/refactor/migração — **seção omitida**. (Verificação: nenhuma string/ID renomeado; sem dados armazenados, serviços, registros de SO, secrets ou artefatos de build afetados.)

## Common Pitfalls

### Pitfall 1: Índice de dia da semana (Seg-first vs Dom-first)
**What goes wrong:** Marcar "Seg" e criar sessões na terça/domingo.
**Why it happens:** `WEEKDAYS` da página começa em Seg; `Date.getDay()` começa em Dom (0).
**How to avoid:** Estruturar chips como `[{label:'Seg', day:1}, …, {label:'Dom', day:0}]` e passar `day` (JS) ao helper. Testar no helper com dia explícito (ex.: 1=segunda).
**Warning signs:** Teste com 02/10/2026 (sexta) e dias [1,3,6] não gera 03/10 (sáb), 05/10 (seg), 07/10 (qua).

### Pitfall 2: Horário e fuso
**What goes wrong:** Horário muda entre ocorrências (DST) ou data cai no dia errado ao serializar.
**Why it happens:** Somar milissegundos; ou montar a data em UTC.
**How to avoid:** Construir cada ocorrência por componentes locais com `getHours()/getMinutes()` da data inicial; serializar com `toISOString()` só no final (como hoje). Testes com `TZ=America/Sao_Paulo`.
**Warning signs:** `getHours()` diferente entre elementos do array.

### Pitfall 3: Data inicial não está nos dias marcados
**What goes wrong:** Usuário escolhe sexta, marca só Seg/Qua e estranha que a sexta não é agendada.
**Why it happens:** Data inicial vira só "a partir de quando".
**How to avoid:** Pré-marcar o dia da data; rótulo "Começa em {data}"; no preview listar a 1ª e a última data ("De 03/10 a 14/10"). Não forçar inclusão da data inicial (a série pode legitimamente começar no dia seguinte).

### Pitfall 4: Série enorme / mutate lento
**What goes wrong:** 24 ciclos × 7 dias = 168 linhas num insert.
**How to avoid:** Manter teto de 24 ciclos (comportamento atual) e mostrar contagem no preview antes de enviar. 168 linhas num insert PostgREST é aceitável. Se o planner quiser teto adicional (ex.: 100 sessões totais), é decisão de produto — ver Open Questions.

### Pitfall 5: Campo "Horário fixo" confuso
**What goes wrong:** O rótulo atual "Horário fixo" (na verdade conta de repetições) fica incoerente com vários dias.
**How to avoid:** Renomear (copy PT-BR) para algo como "Repetir por quantas semanas" com hint dinâmico; mantém `type="number"`, `min=1`, `max=24`.

### Pitfall 6: Estado antigo no modal
**What goes wrong:** Chips/contagem do uso anterior permanecem ao reabrir.
**How to avoid:** `openComposer` reseta `repeatWeeks`, `weekdays`, `weekdaysTouched`. Atenção: o botão "Agendar sessão neste dia" faz `setOpen(true)` **sem** `openComposer()` (L558-L560) — já é um bug latente (não reseta paciente/data). Planejar trocar para `openComposer` nesse botão para que a pré-seleção de dias funcione também por esse caminho.

## Code Examples

### Submit refatorado (esboço)
```typescript
// Source: adaptação de src/pages/CalendarPage.tsx submit() atual
const when = new Date(sessionDate)
when.setHours(hours, minutes, 0, 0)
const cycles = clampWeeks(repeatWeeks)
const dates = buildWeeklySeries(when, weekdays, cycles)
if (dates.length === 0) return
const scheduledAts = dates.map((d) => d.toISOString())
create.mutate({
  patientId,
  scheduledAt: scheduledAts[0] as string,
  scheduledAts,
  type,
  place,
}, { onSuccess: /* igual a hoje */ })
```

### Hint dinâmico (PT-BR)
```typescript
const total = buildWeeklySeries(previewStart, weekdays, cycles).length
// 1 sessão:  'Marca só esta data, como agendada.'
// N sessões: `Serão criadas ${total} sessões agendadas no mesmo horário (${weekdaysLabel}, por ${cycles} semana(s)).`
```

### Teste do helper (node:test, sem pacote)
```typescript
// src/lib/sessionSeries.test.ts — rodar: TZ=America/Sao_Paulo node --test src/lib/sessionSeries.test.ts
import test from 'node:test'
import assert from 'node:assert/strict'
import { buildWeeklySeries } from './sessionSeries.ts'

test('um dia, 3 semanas = comportamento antigo (weeklyAt)', () => {
  const r = buildWeeklySeries(new Date(2026, 9, 2, 9, 0), [5], 3)
  assert.deepEqual(r.map((d) => d.getDate()), [2, 9, 16])
})
test('sex + seg/qua/sáb, 2 ciclos = 6 datas, mesmo horário', () => {
  const r = buildWeeklySeries(new Date(2026, 9, 2, 9, 0), [1, 3, 6], 2)
  assert.deepEqual(r.map((d) => d.getDate()), [3, 5, 7, 10, 12, 14])
  assert.ok(r.every((d) => d.getHours() === 9 && d.getMinutes() === 0))
})
```
Observação: imports relativos com `.ts` são aceitos por `tsconfig` (`allowImportingTsExtensions: true`) e exigidos pelo Node. O arquivo `.test.ts` dentro de `src/` entra em `tsc --noEmit` e no `eslint`; `@types/node` já está instalado. O helper **não** pode importar via alias `@/`. [VERIFIED: tsconfig.json; package.json]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `weeklyAt(start, weeks)` — 1 dia, N semanas | `buildWeeklySeries(start, weekdays, cycles)` | Esta fase | `weeklyAt` vira caso particular (`weekdays=[dia da start]`) |
| Campo "Horário fixo" numérico | Chips de dias + "semanas" com preview | Esta fase | Copy/UX mais claro |

**Deprecated/outdated:** `weeklyAt` local em `CalendarPage.tsx` deve ser removido (sem outros usos — grep confirma) em favor do helper no lib. `clampWeeks` pode migrar junto.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | "Quantas vezes" significa **semanas/ciclos** (cada dia marcado ocorre N vezes), conforme o texto de REQ-32 ("quantas vezes essa combinação se repete") | Summary / Open Questions | Se o usuário queria "N sessões no total", a contagem muda (ex.: seg/qua/sáb × 4 = 12 vs 4) — troca localizada no helper e no hint |
| A2 | Manter teto de 24 repetições (comportamento atual) sem teto adicional de sessões totais | Pitfall 4 | Séries de até 168 linhas; se a clínica achar excessivo, adicionar teto |
| A3 | A série pode começar num dia diferente da data inicial (data inicial não é obrigatoriamente marcada) | Pitfall 3 | Se o produto exigir incluir sempre a data escolhida, adicionar regra/validação |
| A4 | Sessões em data/hora já passada (ex.: hoje de manhã) continuam sendo criadas, como hoje | Pitfalls | Se quiserem pular passadas, adicionar filtro (mudança de comportamento, não pedida) |
| A5 | Sem checagem de conflito de horário/duplicidade (hoje não existe e o schema não tem unique) | Summary | Duplicatas possíveis se o usuário reenviar; fora do escopo |

## Open Questions

1. **"Quantas vezes" = N semanas ou N sessões no total?** *(NÃO é decisão travada pelo usuário.)*
   - What we know: REQ-32 diz "quantas vezes essa combinação se repete"; ROADMAP diz "quantas vezes a série se repete"; hoje, com 1 dia, N semanas = N sessões (indistinguível).
   - What's unclear: com 3 dias, o usuário espera 3×N (ciclos) ou N (total)?
   - **Recomendação (default do planner se o usuário não decidir): N = número de semanas/ciclos.** Rationale: (a) é a leitura literal de "a combinação se repete"; (b) é previsível — cada dia marcado aparece exatamente N vezes, sem semana parcial; (c) coerente com o caso de 1 dia de hoje; (d) "N total" produz resultados estranhos (ex.: 4 sessões com seg/qua/sáb termina no meio de uma semana). Mitigar ambiguidade com o preview "Serão criadas X sessões" e o rótulo "semanas". Alternativa (N total) só exigiria trocar o loop por "gerar até atingir N".
2. **Teto de sessões totais?** Recomendação: manter 24 semanas (sem teto extra) e confiar no preview; planner pode decidir cap (ex.: 100) se preferir.
3. **Devem ser puladas ocorrências em data/hora passada?** Recomendação: não (mantém comportamento atual).
4. **Atualizar `docs`/README?** Não há docs sobre `scheduledAts` (grep em `docs`/`.planning` não retornou usos fora do código).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | `node --test` do helper, `npm run typecheck/build/lint` | ✓ | v26.4.0 | — |
| npm | scripts | ✓ | 12.0.2 | — |
| TypeScript (local) | `npm run typecheck` | ✓ | ~5.8.3 | — |
| Supabase hospedado | UAT manual (criar série real) | ? (não sondado; depende do `.env` do usuário) | — | Validar contagem/datas no helper + checagem manual na agenda |
| Vitest/Jest | — | ✗ | — | `node --test` (built-in); **não instalar** |

**Missing dependencies with no fallback:** nenhuma.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | TypeScript (`tsc --noEmit`) + `node:test` built-in (Node 26) para o helper puro. Sem Vitest (não instalar). |
| Config file | `tsconfig.json`; `eslint.config.js` |
| Quick run command | `TZ=America/Sao_Paulo node --test src/lib/sessionSeries.test.ts && npm run typecheck` |
| Full suite command | `TZ=America/Sao_Paulo node --test src/lib/sessionSeries.test.ts && npm run typecheck && npm run lint && npm run build` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-32 (AC1) | Vários dias marcados geram ocorrências nesses dias (seg/qua/sáb) | unit | `TZ=America/Sao_Paulo node --test src/lib/sessionSeries.test.ts` | ❌ Wave 0 |
| REQ-32 (AC2) | Nº de repetições multiplica a série (N ciclos → N×|dias| datas) | unit | idem | ❌ Wave 0 |
| REQ-32 (AC3) | Mesmo horário em todas; `agendada` via `createSession` | unit (hora local) + typecheck + grep `status: 'agendada'` | idem + `npm run typecheck` | ❌ Wave 0 |
| REQ-32 (AC4) | 1 dia (dia da data) = resultado idêntico ao `weeklyAt` antigo | unit | idem | ❌ Wave 0 |
| UI | Chips renderizam, toggle, ≥1 dia exigido, preview, reset ao abrir | typecheck + grep + UAT manual | `npm run typecheck` | ✅ (CalendarPage existe) |
| Persistência | Sessões aparecem na agenda nas datas certas | manual UAT (hospedado/dev) | — | manual |

Casos mínimos do helper: (1) 1 dia/N semanas = weeklyAt; (2) sex + [seg,qua,sáb] × 2 → `[3,5,7,10,12,14]` out/2026; (3) dia da data inicial marcado junto de outros (ex.: sex + [sex,seg]) → ordem cronológica; (4) conjunto vazio → `[]`; (5) duplicatas no array de dias não duplicam; (6) cruzamento de mês/ano (ex.: 28/12/2026 + [seg,qua] × 2); (7) hora/minuto idênticos em todas; (8) `cycles` já clampado 1–24 (testar `clampWeeks`: `''`→1, `'0'`→1, `'99'`→24, `'2.7'`→2).

### Sampling Rate
- **Per task commit:** `npm run typecheck` (+ `node --test` do helper quando existir)
- **Per wave merge:** comando full suite acima
- **Phase gate:** full suite verde + UAT manual (série seg/qua/sáb × 2 e 1 dia × 3 na agenda real)

### Wave 0 Gaps
- [ ] `src/lib/sessionSeries.ts` — helper puro (`buildWeeklySeries`, `clampWeeks`, constante `MAX_SERIES_WEEKS = 24`)
- [ ] `src/lib/sessionSeries.test.ts` — casos acima (cobre REQ-32 AC1–AC4)
- [ ] Framework install: **nenhum** (usar `node --test`)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | yes (inalterado) | RLS `patient_sessions_insert` → `can_write_patient(patient_id)` [VERIFIED: `supabase/03-account-types-team.sql` L629-L633] |
| V5 Input Validation | yes | `clampWeeks` (1–24), dias restritos a 0–6, `patientId` obrigatório; tipo/sala já são strings livres como hoje |
| V6 Cryptography | no | — |

### Known Threat Patterns for React + Supabase (RLS)

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Criar sessões para paciente de outra conta (IDOR) | Elevation/Tampering | RLS `can_write_patient`; não confiar no front (já garantido) |
| Flood de linhas via contagem alta | DoS | Teto 24 semanas × ≤7 dias = 168 no client; servidor depende de RLS/limites do Supabase — não há rate-limit novo nesta fase (aceito) |
| Dado clínico em logs/toast | Info disclosure | Toast só mostra contagem; não incluir nome do paciente |

## Sources

### Primary (HIGH confidence)
- Codebase: `src/pages/CalendarPage.tsx`, `src/services/calendar.service.ts`, `src/hooks/useClinic.ts`, `src/components/ui/Input.tsx`, `package.json`, `tsconfig.json`, `eslint.config.js`
- `supabase/03-account-types-team.sql` (RLS `patient_sessions_*`), `supabase/functions/google-calendar-export/index.ts` (leitura de linhas individuais)
- `.planning/REQUIREMENTS.md` (REQ-32), `.planning/ROADMAP.md` (Phase 21), `.planning/phases/20-esqueci-minha-senha/20-VALIDATION.md` (padrão de validação do projeto)
- Probes locais: protótipo do helper (TZ=America/Sao_Paulo) e `node --test` em TS (Node v26.4.0)

### Secondary (MEDIUM confidence)
- Nenhuma fonte web necessária (nenhuma biblioteca externa envolvida).

### Tertiary (LOW confidence)
- Nenhuma.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — nenhuma dependência nova; tudo lido no código
- Architecture: HIGH — fluxo de criação em lote existente e verificado
- Pitfalls: HIGH — mapeamento Seg/Dom e DST verificados por leitura e protótipo
- Semântica de "quantas vezes": MEDIUM — recomendação baseada no texto do REQ, **não** travada pelo usuário

**Research date:** 2026-10-03
**Valid until:** 2026-11-02 (stack estável)
