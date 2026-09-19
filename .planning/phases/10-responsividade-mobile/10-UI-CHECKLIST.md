# Phase 10 — Mobile UAT Checklist

Wave 4 human verification matrix for REQ-22 (plan 04). Mark `P` / `F` (or ✓ / ✗) in empty cells — do not redesign rows.

**How to use:** Chrome DevTools device mode (or physical phone). Set width to each viewport column. Prefer Chrome device mode; real iOS safe-area may need a phone/Simulator for non-zero `env(safe-area-inset-*)`.

**Prerequisites:** `viewport-fit=cover` in `index.html`; Waves 1–3 applied. Routes allowlist only (no bakery): `/`, `/cadastro`, `/aguardando`, `/painel`, `/pacientes`, `/pacientes/:id`, `/agenda`, `/quadro`, `/equipe`, `/financeiro`.

**Accounts:** autônomo for Financeiro; empresa for Equipe.

## Viewports

| Label | Width (CSS px) | Notes |
|-------|----------------|-------|
| 360 | 360 | Small Android / compact |
| 390 | 390 | iPhone 12/13/14 class |
| 430 | 430 | Large phone |
| lg | ≥1024 (`lg`) | Desktop shell regression (D-05) |

## Cross-cutting checks (REQ-22.4, D-03, D-04)

| Check | 360 | 390 | 430 | lg |
|-------|-----|-----|-----|----|
| No page-level horizontal pan (`document.documentElement.scrollWidth` ≤ viewport) | | | | |
| Primary CTAs clear of bottom nav + home indicator / safe-area | | | | N/A (no bottom nav) |
| Toast appears above bottom nav (`bottom-24` clearance) | | | | N/A (`lg:bottom-4`) |
| Modal bottom sheet clears safe-area; backdrop/close usable (`z-[100]` above nav) | | | | centered dialog OK |
| ConfirmDialog actions stack / no horizontal overflow on long PT labels | | | | row layout OK |
| `lg` sidebar + rounded panel intact (`lg:translate-x-0`, `lg:pb-4`) | N/A | N/A | N/A | |

## Auth (no bottom nav — no `pb-24` required)

| Route / surface | 360 | 390 | 430 | lg |
|-----------------|-----|-----|-----|----|
| Login (`/` or `/login`) — form usable, no page pan | | | | |
| Cadastro (`/cadastro`) — form usable, no page pan | | | | |
| Aguardando (`/aguardando`) — readable, no page pan | | | | |
| Auth marketing pane hidden on narrow / visible at `lg` | | | | |

## Clinical routes

| Route / surface | 360 | 390 | 430 | lg |
|-----------------|-----|-----|-----|----|
| Painel (`/painel`) — usable; multi-col intact at `lg` | | | | |
| Pacientes (`/pacientes`) — list usable (cards below md where present) | | | | |
| Pacientes — open ficha (`/pacientes/:id`) | | | | |
| Agenda (`/agenda`) — month grid tappable; chevrons ≥ ~44px | | | | |
| Agenda — day list | | | | |
| Agenda — Google connection strip wraps | | | | |
| Agenda — `lg` two-column layout intact | N/A | N/A | N/A | |
| Quadro (`/quadro`) — contained horizontal board scroll + edge affordance | | | | |
| Quadro — list delete control tappable (~44px) | | | | |
| Equipe (`/equipe`, empresa) — pending list usable | | | | |
| Equipe — active therapists: cards below md / DataTable at md+ | | | | |
| Financeiro (`/financeiro`, autônomo) — catalog cards below md / DataTable at md+ | | | | |
| Financeiro — other lists / actions usable | | | | |

## Ficha tabs (`/pacientes/:id`)

| Surface | 360 | 390 | 430 | lg |
|---------|-----|-----|-----|----|
| Tab strip scroll contained; tabs ≥ ~44px | | | | |
| Identity edit control ≥ ~44px | | | | |
| Resumo / shortcuts (no truncate clipping critical text) | | | | |
| Resumo — `lg` multi-column grids intact | N/A | N/A | N/A | |
| Silhueta — mark region usable | | | | |
| Silhueta — front/back stack below `sm`; side-by-side at `sm+` | | | | |
| Galeria — upload / lightbox | | | | |
| Evolução — list + modal (thumbs denser on narrow) | | | | |
| Evolução / editors — FormActions stack on narrow; clear of nav | | | | |
| Exame físico — forms usable; Excluir visible without hover on narrow | | | | |
| Cadastro / metas / alertas — forms + stacked actions usable | | | | |

## Shell chrome

| Control | 360 | 390 | 430 | lg |
|---------|-----|-----|-----|----|
| Hamburger / close ≥ ~44px hit target | | | | N/A (sidebar always open) |
| Bottom nav items ≥ ~44px hit target; IA unchanged | | | | N/A |
| Drawer IA matches clinic nav (no bakery orphans) | | | | |

## Sign-off (plan 04)

| Field | Value |
|-------|-------|
| Tester | |
| Date | |
| Device / browser | |
| Result | □ approved · □ failures listed below |
| Failure notes | |
