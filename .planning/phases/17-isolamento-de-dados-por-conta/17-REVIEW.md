---
phase: 17-isolamento-de-dados-por-conta
reviewed: 2026-09-24T02:34:35Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - .planning/phases/17-isolamento-de-dados-por-conta/sql/17-account-isolation.sql
  - src/services/aiPhysicalEvaluation.service.ts
  - src/components/patients/PatientPhysicalEvaluationPanel.tsx
  - src/services/board.service.ts
  - src/pages/KanbanPage.tsx
findings:
  critical: 1
  warning: 3
  info: 0
  total: 4
status: issues_found
---

# Phase 17: Code Review Report

**Reviewed:** 2026-09-24T02:34:35Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

O SQL do quadro fecha o vazamento entre autônomos: `organization_id` nulo só passa com `owner_id = auth.uid()`, e a mesma empresa continua no ramo `organization_id = private.viewer_org_id()`. O card copia o escopo da coluna pai, `patients_select` perde o ramo de dono nulo, e o digest FNV-1a 64 `d7513069ba374c9f` confere com o diagnóstico simulado que saiu do serviço. O isolamento ainda falha no cliente: o cache do quadro não está amarrado ao usuário, então a conta seguinte pode ver as tarefas da anterior sem uma leitura nova no Postgres. Texto clínico inventado ainda pode ser gravado quando o modelo omite um campo, e a hidratação do `localStorage` não troca de paciente.

## Critical Issues

### CR-01: O cache do quadro mostra as tarefas da conta anterior

**File:** `src/pages/KanbanPage.tsx:37`
**Issue:** `KanbanPage` renderiza o retorno de `useBoard()`. Em `src/hooks/useClinic.ts` a chave é `['board']`, sem o uid. Em `src/main.tsx` o `staleTime` é 60 segundos e `refetchOnWindowFocus` está desligado. `signOut` em `src/providers/AuthProvider.tsx` não limpa o `QueryClient`. Enquanto o cache está fresco, abrir `/quadro` na conta seguinte não chama `listBoard`: o React Query entrega as colunas e os cards da conta anterior e o RLS não chega a rodar. `isLoading` fica falso porque já existe `data`, então a tela trata esse cache como o quadro da sessão atual. O mesmo vale para `['board-dues', fromDate, toDate]`, usado pela agenda. `listBoard` e `listDueCards` em `src/services/board.service.ts` continuam sem predicado de dono, o que é o contrato do banco, mas o cache fica na frente dessa fronteira.
**Fix:**

```ts
// src/providers/AuthProvider.tsx — no signOut, antes de zerar a sessão
queryClient.clear()

// src/hooks/useClinic.ts
export function useBoard(userId: string | undefined) {
  return useQuery({
    queryKey: ['board', userId],
    queryFn: listBoard,
    enabled: Boolean(userId),
  })
}
```

Incluir o mesmo `userId` em `['board-dues', userId, fromDate, toDate]`. Em `KanbanPage`, passar `user?.id` e não desenhar `data` de uma chave sem esse id.

## Warnings

### WR-01: Campo omitido pelo Gemini vira laudo e vai para o prontuário

**File:** `src/services/aiPhysicalEvaluation.service.ts:107-112`
**Issue:** Sem `VITE_GEMINI_API_KEY` a função lança erro e o painel não acrescenta item à lista. Com chave, JSON válido que não traz um campo recebe frase clínica fixa: `Testes padrão realizados.`, `Avaliação fisioterapêutica completa.` e `Seguir plano recomendado.`. `PatientPhysicalEvaluationPanel` grava esse objeto em `fisio.evaluations.${patientId}` e `handleApplyToProfile` copia queixa e diagnóstico para o paciente. O filtro FNV-1a só descarta o diagnóstico simulado antigo; esses fallbacks permanecem.
**Fix:**

```ts
if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
  throw new Error('Falha na IA do Google Gemini: a resposta não trouxe o laudo.')
}
const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '')
const summary = text(parsed.summary)
const mainComplaint = text(parsed.mainComplaint)
const cinesiologicDiagnosis = text(parsed.cinesiologicDiagnosis)
if (!summary || !mainComplaint || !cinesiologicDiagnosis) {
  throw new Error('Falha na IA do Google Gemini: a resposta não trouxe o laudo.')
}
```

Não preencher diagnóstico, testes nem plano com frase pronta. Só persistir o que o modelo devolveu.

### WR-02: Trocar o paciente regrava a avaliação na chave errada

**File:** `src/components/patients/PatientPhysicalEvaluationPanel.tsx:70-88`
**Issue:** O estado inicial lê `fisio.evaluations.${patientId}` uma vez. O `useEffect` grava `evaluations` sempre que `storageKey` muda e não volta a ler a chave nova. A rota `/pacientes/:id` reutiliza a página. Se o painel continuar montado com `?aba=avaliacoes` e o id mudar, o laudo do paciente anterior entra no `localStorage` do próximo e continua na tela. `handleApplyToProfile` usa o `patientId` novo com o diagnóstico antigo. A chave também não leva o uid: depois do logout o texto clínico continua no navegador, legível por outra conta no mesmo origem. A lista de pacientes hoje navega sem `aba` e o painel desmonta; o efeito continua errado para qualquer navegação que preserve a aba.
**Fix:**

```tsx
const storageKey = `fisio.evaluations.${userId}.${patientId}`
const hydratedKey = useRef(storageKey)

useEffect(() => {
  if (hydratedKey.current !== storageKey) {
    hydratedKey.current = storageKey
    setEvaluations(readStoredEvaluations(storageKey))
    setSelectedEvaluation(null)
    return
  }
  localStorage.setItem(storageKey, JSON.stringify(evaluations))
}, [evaluations, storageKey])
```

No logout, apagar as chaves `fisio.evaluations.`.

### WR-03: Arrastar o card copia o escopo da coluna e pode tirá-lo da empresa

**File:** `.planning/phases/17-isolamento-de-dados-por-conta/sql/17-account-isolation.sql:119-130`
**Issue:** `stamp_board_card_scope` em todo `UPDATE` copia `owner_id` e `organization_id` da coluna de destino. `moveCard` em `src/services/board.service.ts` só manda `column_id` e `sort_order`. Quem já tem coluna pessoal (`organization_id` nulo, de quando `viewer_org_id()` era nulo) e depois passa a ter coluna da empresa vê as duas. Soltar um card da empresa na coluna pessoal grava `organization_id` nulo: a equipe deixa de ver a tarefa. O caminho inverso publica um card pessoal para a organização. Entre duas colunas da mesma empresa o ramo de `viewer_org_id()` mantém o compartilhamento; o furo é a mistura dos dois ramos.
**Fix:**

```sql
-- No UPDATE, recusar coluna cujo par (owner_id, organization_id)
-- não é o mesmo do card. Trocar de lista não troca de conta.
if TG_OP = 'UPDATE'
   and (v_owner is distinct from OLD.owner_id
     or v_org is distinct from OLD.organization_id) then
  raise insufficient_privilege using message = 'Coluna fora do escopo do card';
end if;
NEW.owner_id := OLD.owner_id;
NEW.organization_id := OLD.organization_id;
```

No `INSERT`, manter a cópia da coluna pai.

---

_Reviewed: 2026-09-24T02:34:35Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
