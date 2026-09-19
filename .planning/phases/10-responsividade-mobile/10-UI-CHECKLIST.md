# Phase 10 — Mobile UAT Checklist

Wave 0 / Wave 4 human verification matrix for REQ-22. Fill pass/fail in plan 04 — leave cells empty until then.

**How to use:** Chrome DevTools device mode (or physical phone). Set width to each viewport column. Mark `P` / `F` (or ✓ / ✗). Note real iOS safe-area may need a phone/Simulator for non-zero `env(safe-area-inset-*)`.

**Prerequisites:** `viewport-fit=cover` in `index.html`; Wave 1–3 patches applied.

## Viewports

| Label | Width (CSS px) | Notes |
|-------|----------------|-------|
| 360 | 360 | Small Android / compact |
| 390 | 390 | iPhone 12/13/14 class |
| 430 | 430 | Large phone |
| lg | ≥1024 (`lg`) | Desktop shell regression |

## Cross-cutting checks

| Check | 360 | 390 | 430 | lg |
|-------|-----|-----|-----|----|
| No page-level horizontal pan (`document`/`main` scrollWidth ≈ clientWidth) | | | | |
| Primary CTAs clear of bottom nav + home indicator / safe-area | | | | N/A (no bottom nav) |
| Toast appears above bottom nav (`bottom-24` clearance) | | | | N/A (`lg:bottom-4`) |
| Modal bottom sheet clears safe-area; backdrop/close usable (`z-[100]` above nav) | | | | centered dialog OK |
| ConfirmDialog actions stack / no horizontal overflow on long PT labels | | | | row layout OK |
| `lg` sidebar + rounded panel intact (`lg:translate-x-0`, `lg:pb-4`) | N/A | N/A | N/A | |

## Auth (no bottom nav — no `pb-24` required)

| Route / surface | 360 | 390 | 430 | lg |
|-----------------|-----|-----|-----|----|
| Login (`/login`) — form usable, no page pan | | | | |
| Cadastro (`/cadastro`) — form usable, no page pan | | | | |
| Aguardando aprovação — readable, no page pan | | | | |
| Auth marketing pane hidden on narrow / visible at `lg` | | | | |

## Clinical routes

| Route / surface | 360 | 390 | 430 | lg |
|-----------------|-----|-----|-----|----|
| Painel (`/painel`) | | | | |
| Pacientes — list | | | | |
| Pacientes — open ficha | | | | |
| Agenda — month grid tappable | | | | |
| Agenda — day list | | | | |
| Agenda — Google connection strip wraps | | | | |
| Quadro (Kanban) — contained horizontal scroll + affordance | | | | |
| Equipe — pending + active lists usable | | | | |
| Financeiro — catalog / lists usable | | | | |

## Ficha tabs

| Surface | 360 | 390 | 430 | lg |
|---------|-----|-----|-----|----|
| Tab strip scroll contained; tabs tappable | | | | |
| Resumo / shortcuts | | | | |
| Silhueta — mark region usable | | | | |
| Galeria — upload / lightbox | | | | |
| Evolução — list + modal | | | | |
| Exame físico / forms | | | | |
| Cadastro / metas / alertas | | | | |

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
