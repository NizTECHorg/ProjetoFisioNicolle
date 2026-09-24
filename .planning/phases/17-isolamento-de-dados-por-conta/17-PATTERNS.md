# Fase 17: Isolamento de dados por conta — Mapa de padrões

**Mapeado:** 2026-09-23
**Arquivos analisados:** 5
**Análogos encontrados:** 5 / 5

## Restrições que o plano deve preservar

- **D-05:** Autônomo nunca vê dados de outro autônomo. `organization_id` nulo não é balde compartilhado. Ramo pessoal: `organization_id is null AND owner_id = (select auth.uid())`.
- **D-06:** Quem está na mesma empresa continua vendo os dados dessa organização. Quadro da empresa usa `organization_id = private.viewer_org_id()` (não nulo). A ficha não muda: não reescrever `private.can_read_patient` nem `private.can_write_patient`. A única alteração clínica é fechar o `OR created_by is null` de `patients_select`.
- SQL novo em `.planning/phases/17-isolamento-de-dados-por-conta/sql/`. O operador cola no **SQL Editor**. Nunca `supabase db push`.
- Não filtrar dono no React (`listBoard`, `listDueCards`, `listPatients`). O RLS é a fronteira (D-03).
- Não repetir o backfill “se `count(profiles) = 1`” da fase 3. UUID de backfill do quadro fica em comentário para o operador substituir.

## Classificação dos arquivos

| Arquivo novo/alterado | Papel | Fluxo | Análogo mais próximo | Qualidade |
|----------------------|-------|-------|----------------------|-----------|
| `.planning/phases/17-isolamento-de-dados-por-conta/sql/17-account-isolation.sql` | migration | CRUD (RLS) | `05-autonomo-finance.sql` (`owner_id` + `FORCE`) + `03-account-types-team.sql` (drop via `pg_policies`; quadro deixado de fora) + `03-fix-patients-select-insert-returning.sql` | exact |
| `src/services/board.service.ts` | service | CRUD | O próprio arquivo (select sem dono) + `src/services/finance.service.ts` `createPrice` (carimbo `owner_id`) | exact |
| `src/pages/KanbanPage.tsx` | component | request-response | O próprio estado vazio (trocar o texto que aponta para `supabase/board.sql`) | exact |
| `src/services/aiPhysicalEvaluation.service.ts` | service | request-response | O próprio `throw new Error` quando o Gemini falha; apagar o objeto fixo depois do `if (apiKey)` | exact |
| `src/components/patients/PatientPhysicalEvaluationPanel.tsx` | component | transform (localStorage) | O próprio `errorMessage` + hidratação de `fisio.evaluations.${patientId}` | exact |

## Atribuição de padrões

### `.planning/phases/17-isolamento-de-dados-por-conta/sql/17-account-isolation.sql` (migration, CRUD / RLS)

**Análogos:** `.planning/phases/05-financeiro-autonomo/sql/05-autonomo-finance.sql`, `.planning/phases/03-tipos-de-conta-e-equipe/sql/03-account-types-team.sql`, `.planning/phases/03-tipos-de-conta-e-equipe/sql/03-fix-patients-select-insert-returning.sql`

**Cabeçalho do SQL (fase 5, linhas 1–3; fase 3, linhas 1–6):** o arquivo nasce com o mesmo contrato — idempotente, cole no SQL Editor, sem `db push`. A fase 3 declara de propósito que o quadro ficou de fora; esta fase é o fechamento desse buraco, não uma reescrita dos helpers.

```sql
-- REQ-17 financeiro do autonomo. D-01 a D-10. Idempotente. Cole no SQL Editor.
-- Nao use supabase db push.
```

```sql
-- Idempotente. Cole no SQL Editor. Nao use supabase db push.
-- board_columns / board_cards ficam inalterados (fora de REQ-15).
```

**Dono pessoal (fase 5, linhas 82–119):** `ENABLE` + `FORCE ROW LEVEL SECURITY`, política `TO authenticated`, predicado `(select auth.uid())`. No quadro o ramo do autônomo é só `owner_id = (select auth.uid())` quando `organization_id is null`. Não copiar o `exists (… account_type = 'autonomo')` do financeiro para o quadro: empresa e fisioterapeuta também usam o quadro (D-06). O `account_type = 'autonomo'` do financeiro existe para empresa e fisio receberem 0 linhas nessas tabelas; no quadro isso fecharia a clínica.

```sql
alter table public.autonomo_prices enable row level security;
alter table public.autonomo_prices force row level security;

create policy autonomo_prices_select
  on public.autonomo_prices
  for select
  to authenticated
  using (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.account_type = 'autonomo'
    )
  );

create policy autonomo_prices_insert
  on public.autonomo_prices
  for insert
  to authenticated
  with check (
    owner_id = (select auth.uid())
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.account_type = 'autonomo'
    )
  );
```

O mesmo par `USING` + `WITH CHECK` vale para UPDATE (fase 5, linhas 121–142). DELETE do quadro precisa de política `USING` com o mesmo predicado (o financeiro não tem DELETE; o quadro tem `deleteCard` / `deleteColumn`).

**Trigger que não confia no cliente (fase 5, linhas 218–230 e 266–270):** o financeiro só preenche `owner_id` se vier nulo. No quadro o trigger `BEFORE INSERT` deve **forçar** `owner_id := (select auth.uid())` sempre (o cliente pode mentir). Se `private.viewer_org_id()` for nulo, forçar `organization_id := null`. Card herda o escopo da coluna-pai.

```sql
  if NEW.owner_id is null then
    NEW.owner_id := (select auth.uid());
  end if;
```

```sql
drop trigger if exists autonomo_session_charges_snapshot on public.autonomo_session_charges;
create trigger autonomo_session_charges_snapshot
  before insert or update on public.autonomo_session_charges
  for each row
  execute function public.snapshot_autonomo_session_charge();
```

**Organização da empresa, sem reescrever o helper (fase 3, linhas 159–181):** reutilizar `private.viewer_org_id()`. Ele já devolve a org do dono ou o membership `active`. Autônomo não tem organização: a função devolve null. Por isso o predicado do quadro **não** pode ser `organization_id IS NOT DISTINCT FROM viewer_org_id()` — dois nulls passariam (D-05).

```sql
create or replace function private.viewer_org_id()
returns uuid
language sql
security definer
set search_path = ''
stable
as $$
  select coalesce(
    (
      select o.id
      from public.organizations o
      where o.owner_id = (select auth.uid())
      limit 1
    ),
    (
      select m.organization_id
      from public.organization_memberships m
      where m.profile_id = (select auth.uid())
        and m.status = 'active'
      limit 1
    )
  );
$$;
```

**Não alterar `can_read_patient` (fase 3, linhas 206–240):** dono da empresa lê a ficha do fisioterapeuta com membership `therapist` + `active`. Fisioterapeuta não lê a ficha do colega. Pending/rejected não leem. O plano não edita este corpo. No `WITH CHECK` do card, `patient_id is null OR private.can_read_patient(patient_id)`.

```sql
  -- D-05 / D-06: criador ou dono da org com membership therapist/active do criador.
  -- Pending/rejected nao leem (T-03-06).
  select
    not exists (
      select 1
      from public.organization_memberships m
      where m.profile_id = (select auth.uid())
        and m.status in ('pending', 'rejected')
    )
    and exists (
      select 1
      from public.patients p
      where p.id = p_patient_id
        and (
          p.created_by = (select auth.uid())
          or exists (
            select 1
            from public.organizations o
            join public.organization_memberships tm
              on tm.organization_id = o.id
            where o.owner_id = (select auth.uid())
              and tm.profile_id = p.created_by
              and tm.role = 'therapist'
              and tm.status = 'active'
          )
        )
    );
```

**Derrubar políticas antigas pelo catálogo (fase 3, linhas 483–505):** nomes ao vivo de `board_*` não estão no git. Políticas permissivas se somam com OR; criar a nova ao lado de `USING (true)` não fecha o vazamento. Loop em `pg_policies` para `board_columns` e `board_cards`, depois `ENABLE` + `FORCE`.

```sql
do $$
declare
  r record;
begin
  for r in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'patients',
        'patient_goals',
        'patient_alerts',
        'patient_sessions',
        'patient_session_evolutions',
        'patient_evaluations',
        'patient_focus_areas',
        'patient_pain_logs'
      )
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end
$$;
```

Nesta fase o `IN` é só `'board_columns'` e `'board_cards'`. Não incluir `patients` nesse loop: dropar todas as políticas de `patients` de uma vez apagaria insert/update/delete. Para o furo do nulo, dropar só `patients_select` e recriar, como o fix da fase 3.

**Fechar `created_by is null` sem quebrar `INSERT … RETURNING` (fix, linhas 1–24; original, linhas 525–544):** remover apenas o terceiro OR. Manter o ramo `created_by = (select auth.uid())` com o bloqueio de pending/rejected, e o `or (select private.can_read_patient(id))`. Tabelas-filhas já usam só `can_read_patient(patient_id)` (fase 3, linhas 573–577) e não ganham o OR de nulo.

```sql
drop policy if exists patients_select on public.patients;

create policy patients_select
  on public.patients
  for select
  to authenticated
  using (
    (
      created_by = (select auth.uid())
      and not exists (
        select 1
        from public.organization_memberships m
        where m.profile_id = (select auth.uid())
          and m.status in ('pending', 'rejected')
      )
    )
    or (select private.can_read_patient(id))
    or (created_by is null and (select auth.uid()) is not null)
  );
```

O `or (created_by is null …)` é o trecho que sai. Antes do drop, o script deixa um `SELECT count(*)` comentado de pacientes com `created_by` nulo. Se a contagem for maior que zero, o operador atribui um dono conhecido ou aceita que as linhas sumam (fail closed).

**Backfill que não copiar (fase 3, linhas 95–97 e 124–136):** a condição `count(profiles) = 1` já não vale. Para o quadro, `UPDATE` comentado com um placeholder de UUID, nunca hardcoded.

```sql
-- Divida residual: se houver mais de um profile, created_by nulo fica
-- visivel a qualquer autenticado (SELECT transitorio na secao 9).
```

```sql
  if v_profile_count = 1 then
    select id into v_sole_id from public.profiles;
    update public.patients
    set created_by = v_sole_id
    where created_by is null;
  end if;
```

**Prova no Editor (fase 5, linhas 324–341, em comentário):** o editor ignora RLS até `set local role authenticated` + `set local request.jwt.claim.sub`. `SELECT` da linha do outro autônomo volta 0 linhas. `INSERT` recusado volta `42501`. Envolver em `begin` / `rollback`. Incluir: card de A invisível para B; paciente/sessão/nota de A invisíveis para B; dono da empresa ainda lê a ficha do fisioterapeuta ativo; insert de paciente com `created_by = uid` e `RETURNING` sucede.

```sql
-- Checagens no SQL Editor (apos Success)
-- 5. Empresa E: SELECT `autonomo_prices` → 0 rows; INSERT → 42501
```

**Trigger de paciente já existente (fase 3, linhas 105–122):** não recriar. Código novo já grava `created_by`. O trigger só preenche se vier nulo; a política de insert já exige `created_by = auth.uid()`.

---

### `src/services/board.service.ts` (service, CRUD)

**Análogo de leitura:** o próprio arquivo. **Análogo de carimbo:** `src/services/finance.service.ts` (`requireUserId` + `owner_id` no insert) e `src/services/patients.service.ts` `createPatient` (`created_by: user.id`).

**Imports (linhas 1–2):** alias `@/`. Sem cliente novo.

```typescript
import { supabase } from '@/lib/supabase/client'
import { signPatientPhotoUrls } from '@/services/patientPhoto.service'
```

**Leitura sem filtro de dono — manter (linhas 54–68 e 153–163):** `listBoard` e `listDueCards` continuam `select` sem `.eq('owner_id')`. Depois do SQL, o PostgREST devolve só o escopo da conta. Não adicionar filtro em memória.

```typescript
export async function listBoard() {
  const { data: columns, error: columnsError } = await supabase
    .from('board_columns')
    .select('id, title, sort_order')
    .order('sort_order', { ascending: true })

  throwIfError(columnsError)

  const { data: cards, error: cardsError } = await supabase
    .from('board_cards')
    .select(
      'id, column_id, title, description, patient_id, due_on, sort_order, patients(full_name, photo_tone, photo_path)',
    )
    .order('sort_order', { ascending: true })
```

**Erro (linhas 50–52):** `throw new Error(error.message)`. Não engolir 42501.

```typescript
function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}
```

**Insert hoje, sem dono (linhas 115–118 e 137–145):** o plano acrescenta o carimbo. O trigger do SQL continua sendo a autoridade.

```typescript
  const { error } = await supabase.from('board_columns').insert({
    title,
    sort_order: (last?.sort_order ?? -1) + 1,
  })
```

```typescript
  const { error } = await supabase.from('board_cards').insert({
    column_id: input.columnId,
    title: input.title,
    description: input.description || null,
    patient_id: input.patientId || null,
    due_on: input.dueOn || null,
    sort_order: (last?.sort_order ?? -1) + 1,
  })
```

**Carimbo a copiar do financeiro (linhas 60–64 e 120–128):** `getUser()` e mandar o id no insert. No quadro, `owner_id` no insert de coluna e de card. Não enviar `organization_id` inventado no cliente: o trigger decide org vs pessoal. Não copiar o `select` que devolve a linha (`createPrice` faz `.select().single()`); o quadro hoje só verifica `error`.

```typescript
async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  throwIfError(error)
  if (!data.user) throw new Error('Sessão expirada. Entre novamente.')
  return data.user.id
}

export async function createPrice(input: CreatePriceInput): Promise<AutonomoPrice> {
  const ownerId = await requireUserId()
  const { data, error } = await supabase
    .from('autonomo_prices')
    .insert({
      owner_id: ownerId,
      name: sanitizeText(input.name, 80),
      amount_brl: input.amountBrl,
    })
```

**Mesmo carimbo em paciente (linhas 546–576):** sessão expirada em português; `created_by: user.id`; insert sem `.select()` por causa do RETURNING. Comentário no código explica o 42501. Não mudar este arquivo nesta fase.

```typescript
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  throwIfError(userError)
  if (!user) throw new Error('Sessão expirada. Entre novamente.')
  // ...
    created_by: user.id,
  const { error } = await supabase.from('patients').insert(payload)
```

`updateCardDue`, `moveCard`, `deleteCard` e `deleteColumn` continuam sem predicado de dono no JS. O `USING`/`WITH CHECK` recusa a linha de outra conta.

---

### `src/pages/KanbanPage.tsx` (component, request-response)

**Análogo:** o próprio estado vazio. Trocar só o texto. Não criar seed.

**Estado de erro e lista vazia (linhas 120–133):** as duas frases citam `supabase/board.sql`, arquivo que não está no repositório. Lista vazia: “Nenhuma lista ainda.” Sem instrução de script. Erro de carga: mensagem de falha, sem seed global.

```tsx
      {isError ? (
        <article className="dash-in rounded-2xl border border-error/20 bg-error/5 px-6 py-8 text-sm text-error">
          Não foi possível carregar o quadro. Execute o script supabase/board.sql no Supabase.
        </article>
      ) : null}

          {columns.length === 0 ? (
            <p className="text-sm text-muted">Nenhuma lista ainda. Crie uma acima ou execute o script supabase/board.sql.</p>
          ) : null}
```

O placeholder `Ex.: Aguardando retorno` (linha 103) é dica de input, não registro. D-04 não pede removê-lo.

Hooks em `src/hooks/useClinic.ts` (`useBoard`, `useCreateColumn`, invalidação de `['board']` e `['board-dues']`, linhas 53–78) permanecem. O cache não ganha filtro de dono.

---

### `src/services/aiPhysicalEvaluation.service.ts` (service, request-response)

**Análogo:** o próprio ramo que já lança erro em português quando o Gemini responde falha (linhas 121 e 132–134). O objeto fixo depois do `if (apiKey)` é o mock que sai (D-04).

**Quando há chave, o erro já existe (linhas 115–134):**

```typescript
          throw new Error(`Falha no Google Gemini: ${lastErrorMsg}`)
        // ...
    if (lastErrorMsg) {
      throw new Error(`Falha na IA do Google Gemini: ${lastErrorMsg}`)
    }
```

**Simulação a apagar (linhas 137–163):** sem `VITE_GEMINI_API_KEY` o código espera 1,8s e devolve queixa lombar, Lasègue e o diagnóstico `Disfunção cinesiológica funcional da coluna lombossacra…`, com `id` `eval_${Date.now()}`. Substituir por `throw new Error('…')` em português. Não devolver esse objeto. Não gravar resultado inventado. O `id` com prefixo `eval_` é a marca para o painel descartar o que já está no `localStorage`.

```typescript
  // Simulação inteligente de desenvolvimento quando sem chave de API (para teste da UI)
  await new Promise((r) => setTimeout(r, 1800))

  return {
    id: `eval_${Date.now()}`,
    // ...
    mainComplaint: 'Dor lombar irradiada para membro inferior direito com piora ao sentar e permanecer em pé por longos períodos.',
    cinesiologicDiagnosis: 'Disfunção cinesiológica funcional da coluna lombossacra associada a radiculopatia L5-S1 e desequilíbrio muscular da cintura pélvica.',
```

O comentário do JSDoc (linha 26, “ou gera simulação de alta fidelidade para dev”) sai junto.

---

### `src/components/patients/PatientPhysicalEvaluationPanel.tsx` (component, transform / localStorage)

**Análogo:** o próprio painel. Não há linha no Postgres. O texto falso nasce no serviço e volta do `localStorage`.

**Hidratação (linhas 36–61):** na montagem, descartar entradas cujo `id` começa com `eval_` (simulação) ou limpar `fisio.evaluations.${patientId}` antes de reidratar. O `useEffect` que faz `setItem` não pode regravar o laudo descartado.

```tsx
  const storageKey = `fisio.evaluations.${patientId}`

  const [evaluations, setEvaluations] = useState<PhysicalEvaluationResult[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? (JSON.parse(saved) as PhysicalEvaluationResult[]) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(evaluations))
    } catch {
      /* ignore */
    }
  }, [evaluations, storageKey])
```

**Erro engolido (linhas 78–85 e 197–201):** o `catch` troca a mensagem do serviço por um texto genérico. Sem chave, mostrar o erro em português lançado pelo serviço (a UI já renderiza `errorMessage`). Não tratar a simulação como fallback.

```tsx
    try {
      const result = await analyzePhysicalEvaluationPdf(patientId, file)
      setEvaluations((prev) => [result, ...prev])
      setSelectedEvaluation(result)
    } catch (err) {
      console.error(err)
      setErrorMessage('Ocorreu um erro ao processar a avaliação física. Tente novamente.')
    }
```

```tsx
        {errorMessage ? (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        ) : null}
```

Lista vazia depois do descarte já é o estado vazio do painel. Não inventar paciente, queixa ou meta.

## Padrões compartilhados

### Fronteira no banco, não no React

**Fonte:** `src/services/finance.service.ts` `listActivePrices` (linhas 109–114) e `src/services/board.service.ts` `listBoard` (linhas 54–58).
**Aplicar a:** `listBoard`, `listDueCards`, e não tocar `listPatients` / `listSessionsInRange` / `getPatientById`.

```typescript
export async function listActivePrices(): Promise<AutonomoPrice[]> {
  const { data, error } = await supabase
    .from('autonomo_prices')
    .select(PRICE_COLUMNS)
    .is('archived_at', null)
    .order('created_at', { ascending: true })
```

O único predicado extra do catálogo é `archived_at`, não dono. O dono vem do RLS.

### SQL Editor

**Fonte:** cabeçalhos de `05-autonomo-finance.sql` e `03-account-types-team.sql`.
**Aplicar a:** `17-account-isolation.sql` inteiro.

Idempotente. `notify pgrst, 'reload schema';` no fim, como a fase 5 (linha 327). Prova com `set local role` dentro de `begin`/`rollback`, não `supabase test db`.

### Equipe intacta

**Fonte:** `private.can_read_patient` e `private.viewer_org_id` em `03-account-types-team.sql`.
**Aplicar a:** políticas do quadro e o `DROP`/`CREATE` de `patients_select`.

Não editar `join_code`, `handle_new_user`, nem o corpo de `can_read_patient` / `can_write_patient`. Quadro da empresa é lista compartilhada da organização. Ficha continua por criador + dono da empresa sobre terapeuta ativo.

### Cache do quadro

**Fonte:** `src/hooks/useClinic.ts` linhas 53–78.
**Aplicar a:** nenhum arquivo novo. Invalidar `['board']` e `['board-dues']` já acontece no `onSuccess`. Não colocar `ownerId` na query key.

## Sem análogo

Nenhum. Os cinco arquivos têm análogo no repositório.

## Não modificar nesta fase

| Arquivo | Motivo |
|---------|--------|
| `private.can_read_patient` / `can_write_patient` (SQL da fase 3) | D-06. Só fechar o OR de `created_by is null` em `patients_select`. |
| `src/services/patients.service.ts` | Já carimba `created_by`. Lista sem filtro de dono está correta com RLS. |
| `src/pages/CalendarPage.tsx` | Usa `listDueCards`. O vazamento some quando o RLS do quadro segurar. Sem filtro no JS. |
| `src/lib/accountAccess.ts` | Predicado de UX. Não é a parede entre contas. |
| `src/services/modules.service.ts` e páginas da confeitaria | Fora das rotas. Não reescrever o RLS delas. |
| `src/hooks/useClinic.ts` | Invalidação já cobre o quadro. |

## Metadados

**Escopo da busca:** `.planning/phases/05-financeiro-autonomo/sql/`, `.planning/phases/03-tipos-de-conta-e-equipe/sql/`, `src/services/board.service.ts`, `src/services/finance.service.ts`, `src/services/patients.service.ts`, `src/services/aiPhysicalEvaluation.service.ts`, `src/components/patients/PatientPhysicalEvaluationPanel.tsx`, `src/pages/KanbanPage.tsx`, `src/hooks/useClinic.ts`
**Arquivos lidos:** 9
**Data da extração:** 2026-09-23
