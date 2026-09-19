# Phase 10 — Responsividade mobile 100%

**Source:** User request via `/gsd-plan-phase` (2026-09-19)  
**Status:** Locked for planning (discuss-phase skipped — intent explicit: full mobile)

## Problem

O site já tem **partes** responsivas (AppShell com drawer + bottom nav, alguns `sm:`/`lg:` grids), mas **não está 100%**. Em viewport estreito ainda há telas/componentes que quebram, forçam scroll horizontal, escondem ações ou ficam ilegíveis. Meta: experiência clínica **plena no mobile**, sem regressão no desktop.

## Locked Decisions

### D-01 — Escopo: produto clínico (não bakery stubs)
Priorizar rotas/componentes **clínicos** em uso: AppShell, auth (login/cadastro/aguardando), Painel, Pacientes, Ficha (+ abas/módulos), Agenda, Equipe, Financeiro autônomo, Settings. Páginas bakery legadas (`OrdersPage`, `RecipesPage`, etc.) só se ainda forem alcançáveis nas rotas ativas; caso contrário, fora de escopo ou fix mínimo.

### D-02 — Breakpoints existentes
Manter Tailwind atual: mobile-first; `lg:` = desktop shell (sidebar). Não introduzir framework novo nem redesign visual (cores/tipografia/brand).

### D-03 — Sem pan horizontal no fluxo principal
Em ~360–430px, o fluxo principal não exige scroll horizontal. Tabelas densas podem usar `overflow-x-auto` **contido** com indicação visual, não empurrar a página inteira.

### D-04 — Bottom nav + safe-area
CTAs primários, sticky footers e modais respeitam `pb` do bottom nav e `env(safe-area-inset-*)`. Nada crítico fica atrás da barra inferior.

### D-05 — Desktop não regride
Em `lg+`, sidebar + painel arredondado e layouts multi-coluna atuais permanecem; mudanças são progressive enhancement / stack no mobile.

### D-06 — Fora de escopo
- Redesign de marca / nova identidade
- PWA / install prompt
- Mudança de navegação IA (itens do bottom nav) salvo se bloquear usabilidade
- Phase 8 Google / Phase 9 therapist (podem rodar em paralelo; não editar esses planos)

## Success Criteria (from ROADMAP)

1. Shell + páginas clínicas sem pan horizontal obrigatório em ~360px
2. Formulários / tabelas / modais / abas da ficha usáveis no mobile
3. Agenda, Painel, Pacientes, Ficha, Equipe, Financeiro, auth no checklist
4. Desktop ≥lg sem regressão
5. Safe-area / bottom nav não cobrem CTAs

## Requirements

- REQ-22

## Notes for planner / researcher

- Inventariar overflows: `min-w-`, fixed widths, grids sem `minmax(0,1fr)`, DataTable, Calendar grid, Patient tabs, silhueta, galeria lightbox, finance charts/tables, TeamPage.
- Preferir stack (`flex-col` / single column) abaixo de `lg` / `sm` conforme padrão existente.
- UI-SPEC desta fase pode ser checklist + padrões de spacing tocável (mín. 44px targets onde faltarem).
