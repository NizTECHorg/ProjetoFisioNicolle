---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: planning
stopped_at: Phase 25 UI-SPEC approved
last_updated: "2026-10-05T22:49:57.422Z"
progress:
  total_phases: 26
  completed_phases: 12
  total_plans: 105
  completed_plans: 88
  percent: 46
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-09-08)

**Core value:** Documentar cada atendimento e manter a base clínica do paciente.

**Current focus:** Phase 25 — mobilidade-palpacao-e-testes

## Current Position

Phase: 25 (mobilidade-palpacao-e-testes) — EXECUTING
Plan: 1 of 5

- Status: Phase complete — ready for verification
- Progress: 4/4 plans

**Progress:** [█████████░] 88%

## Accumulated Context

### Decisions

- Avaliação estruturada em `patient_evaluations` (Supabase) — Phase 1
- REQ-05 adiado: código existe; SQL/UAT ficam para depois
- Metas no Resumo; clique no card = concluído / em andamento — Phase 2
- Phase 3 não depende do SQL das fases anteriores
- [Phase 03]: Account types are autonomo | empresa | fisioterapeuta in account.ts, not EmployeeRole — Keep bakery Profile.role untouched; clinic gating uses AccountType
- [Phase 03]: canManageTeam / canWritePatient are UX-only; Plan 03-02 RLS is the authority — ASVS 4.1.1 — client predicates can be skipped; RLS must enforce D-05/D-07
- [Phase 03]: Org + membership interfaces (not extra columns only on profiles) — Accept/reject safety and join code live on org/membership, not a person-row
- [Phase 03]: Preserve bakery profiles.role='atendente' on handle_new_user; clinic type is account_type — Live dump inserts role; do not drop bakery column
- [Phase 03]: ALTER patients.created_by before private helpers (Postgres 42703) — CREATE FUNCTION validates body immediately; first Editor apply failed
- [Phase 03]: SQL Editor is the apply path; supabase/ copy is gitignored — Supabase CLI is not installed; hosted Editor is the only apply path
- [Phase 03]: Zod enum message covers empty Select so required_error stays without preprocess — Zod 3 forbids required_error + errorMap; preprocess broke zodResolver types
- [Phase 03]: Fisio stays on cadastro with pending copy; GuestRoute in 03-04 owns /aguardando — Plan 03-03 must not navigate; 03-04 owns pending session redirect
- [Phase 03]: team.service is the only org/membership client; no profiles.update — D-04 reject is RPC-only; T-03-03 no client membership insert
- [Phase 03]: Batch-resolve createdByName via one profiles select; do not JS-filter patients — RLS is the authority; empresa needs the name for Ficha de {nome} in 03-07
- [Phase 03]: Leave listActiveTherapists unchanged; RLS can_view_profile is the tenant scope — Plan 03-02 already scopes profiles SELECT to self or active org teammates
- [Phase 03]: Fisio + null membership is not authenticated; route that state to /aguardando — D-03 fail-closed: missing or failed membership must not grant clinic access
- [Phase 03]: isLoading stays true until profile AND membership fetches settle — Do not flip ready after profile alone; pending vs clinic depends on membership
- [Phase 03]: Waiting CTA is Sair da conta; rejected keeps Sair e voltar ao login — UI FLAG overrides UI-SPEC single-word Sair on waiting
- [Phase 03]: Equipe is drawer-only via clinicNavigationItems; mobileNavItems stays 4 items — UI-SPEC: Equipe is not on the bottom bar; empresa reaches it from the hamburger drawer
- [Phase 03]: FLAG CTAs Aceitar pedido, Recusar pedido, Voltar sem recusar; confirm Recusar e cancelar conta — UI FLAG overrides shorter Aceitar/Recusar/Voltar table copy
- [Phase 03]: Copiar código uses visible text plus aria-label; clipboard writes raw 8 characters — UI-SPEC primary persistent action plus FLAG aria-label; display is XXXX XXXX only
- [Phase 03]: Reject cancels through decide_membership RPC only; page never updates profiles — D-04 / T-03-12: RPC re-checks owner; TeamPage is UX only
- [Phase 03]: Forward canWrite through PatientEvaluationPanel because PhysicalEvaluationPanel is nested there, not PatientPage — PhysicalEvaluationPanel mounts inside EvaluationPanel; page-only canWrite would leave default true on exame físico.
- [Phase 03]: Hide write controls; do not disable buttons that look tappable — D-07 / UI-SPEC: disabled controls still look interactive and fail under RLS.
- [Phase 04]: Optional ToastAction on existing Zustand toast; 6000ms only when action present — D-03 Ver ficha without a second notification library
- [Phase 04]: writablePatients fail-closed when viewerId missing; canWritePatient UX-only — T-04-01; RLS remains authority
- [Phase 04]: Create-session/evaluation hooks take optional toastOptions; ficha callers unchanged — One success toast; TanStack hook onSuccess runs before mutate onSuccess
- [Phase 04]: PatientSessionEditorForm is the shared create/edit body; ficha Modal wraps it; dashboard will mount the form without the panel — REQ-16.2; dashboard mounts the form, not the list panel
- [Phase 04]: Ficha omits successAction/errorMessage so Plan 04-01 toast copy stays; shortcut chrome is prop-driven — D-03 one toast; D-02 cancel/submit labels as props
- [Phase 04]: PatientEvaluationEditorForm is the shared create/edit body; ficha wraps it inline; dashboard will mount the form without the panel — REQ-16.2; dashboard mounts the form, not the list panel
- [Phase 04]: Ficha omits successAction/errorMessage so Plan 04-01 toast copy stays; showInnerHeading and chrome labels are prop-driven — D-03 one toast; D-02 cancel/submit labels as props; Modal title owns Nova avaliação on the shortcut
- [Phase 04]: Optional draft prop preserves PDF import prefill after extract — draftFromPdf stays on the panel; form must accept create draft without fetching the evaluation list
- [Phase 04]: Shortcut wizard state lives in DashboardClinicalShortcut, not a URL query — D-01 stay on /painel until Ver ficha or Ir para pacientes
- [Phase 04]: Header click while overlay open resets to picker for that kind; editor cancel closes entirely — D-04 start from zero; D-02 cancel/X/Escape must not reopen picker
- [Phase 04]: Shortcut calls usePatients again on queryKey ['patients']; dashboard metrics stay unfiltered — Same cache as dashboard cards; empresa colleague rows remain in metrics
- [Phase 05]: Catalog form is name + positive BRL string, not two location-tied fees (D-02) — CONTEXT D-02 overrides ROADMAP two-fee wording
- [Phase 05]: canSeeFinance true only for autonomo; empresa and fisio are false; UX only (D-01) — ASVS 4.1.1 — client predicates can be skipped; Plan 05-02 RLS is the wall
- [Phase 05]: sessionFormSchema keeps place as optional clinical text and copies XOR/Pago superRefine (D-05, D-06, D-08) — Local stays clinical; catalog XOR avulso; Pago requires amount
- [Phase 05]: Boolean(priceId) treats a hidden archived catalog id as allocation; Pago without catalog or parseable avulso fails — Archived catalog snapshots must not become Avulso in Zod
- [Phase 05]: SQL Editor is the apply path; do not run supabase db push — Supabase CLI is not installed; hosted Editor is the only apply path (same as Phase 03)
- [Phase 05]: Dedicated autonomo_prices and autonomo_session_charges; no money columns on patient_sessions (T-05-01) — empresa already SELECTs patient_sessions via private.can_read_patient; money must not ride those rows
- [Phase 05]: Snapshot trigger preserve-not-recopy: same price_id UPDATE copies amount_brl and price_name from OLD without SELECT live catalog (D-04, D-07) — Catalog price edits must not rewrite existing charge snapshots or mark-paid updates
- [Phase 05]: FORCE RLS owner+autonomo; GRANT select/insert/update only; no DELETE policy (D-01, D-03) — Archive is UPDATE archived_at; empresa and fisio get 0 rows
- [Phase 05]: upsertSessionCharge omits client amount when priceId is set; skips write when both priceId and adHoc are empty (D-10 optional allocation) — Trigger copies catalog on INSERT; empty allocation must not insert a zero row
- [Phase 05]: markChargePaid is UPDATE is_paid only so the snapshot trigger preserve-not-recopy leaves amount_brl and price_name (D-04, D-07) — Same-price_id UPDATE must not recopy live catalog
- [Phase 05]: listFinanceRealizadas is realizadas only, no charge embed on the sessions query; empty array not fake rows (D-10, T-05-01) — empresa already SELECTs patient_sessions; money must not ride those rows
- [Phase 05]: invalidatePatient also invalidates queryKey ['finance'] so /financeiro does not stay stale (Pitfall 8) — Session writes would otherwise leave totals and realizadas cache stale
- [Phase 05]: createSession.mutate still accepts UpsertPatientSessionInput & { charge? }; update keeps { sessionId, input, evolutionId, charge? } so callers that omit charge compile — Locked 05-04 mutate API; Task 2 must not wrap as { input, charge }
- [Phase 05]: Archived priceId stays on a hidden input; Select is visual-only and never register('priceId') — Native Select omitting archived options would submit empty and rewrite snapshots as Avulso
- [Phase 05]: Skip upsert when both XOR fields are empty so an existing charge row is untouched — Clearing money is out of scope; empty allocation must not insert a zero row
- [Phase 05]: CalendarPage is unchanged; D-05 agenda money remains deferred — Allocate later from ficha, dashboard shortcut, or /financeiro
- [Phase 05]: Drawer-only Wallet Financeiro after clinic items; Equipe still empresa-only; mobileNavItems.length === 4 — D-01
- [Phase 05]: canSeeFinance Navigate to /pacientes silent, no toast; do not reuse FinancePage or canManageFinance — D-01
- [Phase 05]: Three totals from RPC formatCurrency; not derived from the realizadas list — D-08 D-09
- [Phase 05]: Catalog archives with ConfirmDialog; Completar valor XOR + Pago; Marcar como pago immediate — D-03 D-10
- [Phase 06]: FOCUS_REGION_KEYS is the locked UI-SPEC 30-key tuple; RESEARCH 38-key draft unused (D-08) — UI-SPEC catalog wins over RESEARCH 38-key table
- [Phase 06]: focusRegionKeySchema = z.enum(FOCUS_REGION_KEYS); keys are not duplicated in patient.schema.ts — Single tuple is the write-time catalog lock
- [Phase 06]: _l/_r map to the patient's left/right: front view mirrors, back view does not — Clinical body map convention
- [Phase 06]: SQL Editor is the apply path; do not run supabase db push — Supabase CLI is not installed; hosted Editor is the only apply path (same as Phase 03/05)
- [Phase 06]: region_key stays nullable; leftover label-only rows are not SET NOT NULL or backfilled (D-09, Pitfall 8) — Front/back share Portuguese labels; leftovers must stay readable
- [Phase 06]: Phase 3 patient_focus_areas_select/insert/update/delete policies left intact; no DROP/CREATE POLICY (D-09, D-10) — T-06-01: existing can_write_patient RLS remains the write wall
- [Phase 06]: Focus writes use throwIfFocusError + mapDbError; existing throwIfError stays for other patient CRUD — Pitfall 9, T-06-01
- [Phase 06]: Unmark DELETEs the patient_focus_areas row; empty state is focusAreas.length === 0 — D-06
- [Phase 06]: INSERT 23505 unique race returns marked without Já existe um registro — Pitfall 7
- [Phase 06]: useTogglePatientFocusArea closes over ficha patientId; mutate argument is regionKey only — T-06-02
- [Phase 06]: Chip is the only write control; path click never calls mutate (D-06)
- [Phase 06]: HOVER_OPEN_MS = 500 for fine hover; coarse/touch and prefers-reduced-motion open immediately (D-05)
- [Phase 06]: When !canWrite the chip is unmounted, paths omit tabIndex, cursor-default, no hover preview (D-10)
- [Phase 06]: Coarse pointerleave does not close the chip so a finger-lift cannot dismiss before the second tap
- [Phase 07]: MAX_BATCH_FILES is 10 so later lote UI can reject the surplus
- [Phase 07]: sessionRemoved is the D-07 flag; sessionId null alone does not distinguish avulsa-original vs órfã
- [Phase 07]: mapStorageError permission path reuses mapDbError with code 42501 so copy stays Você não tem permissão para esta ação.
- [Phase 07]: SQL Editor is the apply path; do not run supabase db push — Supabase CLI is not installed; hosted Editor is the only apply path (same as Phase 03/05/06)
- [Phase 07]: session_id ON DELETE SET NULL so deleting a sessão does not delete photos (D-06) — Photos remain on the ficha as avulsa; client must not CASCADE delete storage objects
- [Phase 07]: session_removed boolean default false; BEFORE DELETE on patient_sessions sets it true (D-07) — Do not use UPDATE OF session_id on patient_images; that would fight Editar avulsa
- [Phase 07]: Table and storage.objects policies call private.can_read_patient / can_write_patient; Phase 3 helpers are not rewritten (D-11) — ASVS 4.1.1 — RLS remains the write wall; empresa is not a writer
- [Phase 07]: Export invalidatePatient from usePatients so image mutations share the same key set as session delete — Plain helper, not a hook; usePatients.ts already has allowConstantExport
- [Phase 07]: Path is patientId/randomUUID.ext with upsert false; never user filenames — T-07-05: service builds the Storage path from the route patient id plus crypto.randomUUID
- [Phase 07]: Batch upload skips invalid MIME/size files and returns successes; throws first mapped message only if none succeed — D-04: one bad file must not abort the lote; Portuguese copy still surfaces when every file fails
- [Phase 07-galeria-de-imagens-na-ficha-do-paciente]: Fail-closed canWrite default false on PatientImagesPanel (Pitfall 6 — do not copy Evoluções default true) — A missed canWrite prop must not show write chrome; Evoluções default true is the analog pitfall.
- [Phase 07-galeria-de-imagens-na-ficha-do-paciente]: Empty/filter-empty states are heading-only this plan so copy never points at a missing Adicionar button — Adicionar imagem ships in 07-05; UI-SPEC empty body would instruct tapping a button that is not mounted.
- [Phase 07-galeria-de-imagens-na-ficha-do-paciente]: D-07: tile always Avulsa for null/orphan sessionId; lightbox shows Sessão removida. when sessionRemoved — CONTEXT wins over UI-SPEC; tile stays Avulsa including orphans until Editar save in 07-05.
- [Phase 07-galeria-de-imagens-na-ficha-do-paciente]: Tirar foto mounts only when matchMedia (max-width: 767px); Escolher arquivos is first focus and has multiple without capture — D-01: Tailwind md is 768px; CONTEXT < ~768px. Camera capture=environment must not sit on the gallery input.
- [Phase 07-galeria-de-imagens-na-ficha-do-paciente]: Compartilhar uses navigator.share with a File from the signed-URL blob and is hidden when share or canShare files is missing; never clipboard signed URL — D-10/D-12: share bytes, not a durable URL; AbortError from dismiss is silent.
- [Phase 07-galeria-de-imagens-na-ficha-do-paciente]: Empty and filter-empty bodies instruct Adicionar only when canWrite; ConfirmDialog cancelLabel is Voltar — D-11 hide-write; UI-SPEC empty body would mislead consult-only users; image ConfirmDialog must not ship Cancelar.
- [Phase 08]: Import GOOGLE_CALENDAR_COPY into mapGoogleCalendarError to avoid copy drift — Single source for UI-SPEC reconnect/network/export strings
- [Phase 08]: DEFAULT_EVENT_DURATION_MS = 60 minutes; timeZone America/Sao_Paulo — Claude discretion locked in plan interfaces
- [Phase 08]: Omit location when place is empty or em dash placeholder — CalendarSession uses — as empty place sentinel
- [Phase 08]: SQL Editor only for Google Calendar schema; never supabase db push — Supabase CLI not installed; /supabase/ gitignored; same dual-path as Phase 5/7
- [Phase 08]: google_calendar_secrets REVOKE ALL from authenticated with no GRANT — REQ-20.3 / T-08-04 — tokens only via Edge Function service_role
- [Phase 08]: session_links PK (user_id, session_id); no google_event_id on patient_sessions — D-09 / Pitfall 5 — per-user event links for idempotent re-export
- [Phase 15]: Runbook under docs/ops/; Gmail SMTP default, Brevo fallback; Invite out of scope
- [Phase 15]: emailRedirectTo origin is https://fluxofisio.vercel.app unless VITE_APP_URL is https and non-local — D-07 bug 1: localhost and http overrides are rejected on purpose
- [Phase 15]: flowType stays implicit so GoTrue verify confirms without a PKCE code verifier — D-07 bug 2: PKCE rolled confirmation back when the mail opened on another device
- [Phase 15]: Spent confirm links tell the user to enter with e-mail and senha — otp_expired and access_denied are an already-used link, not a dead error
- [Phase 15]: Confirm and reset CTAs are a bare ConfirmationURL, including a visible fallback line, so GoTrue verifies before any redirect — GoTrue confirms on /auth/v1/verify before the redirect, so the href must not be built from the Dashboard Site URL
- [Phase 15]: Site URL is https://fluxofisio.vercel.app and the allow-list is only that origin, the wildcard, and /auth/confirm — An unlisted redirect_to falls back to the Site URL; local entries would keep bug 1 alive
- [Phase 15]: Links mailed before this fix stay invalid; the operator must run a new cadastro — D-07: old confirm messages keep the broken href and must not be reused for UAT
- [Phase 16]: SQL Editor is the apply path for patient-avatars; do not run supabase db push — Hosted Editor is the only apply path; the script is not applied from the repo
- [Phase 16]: patientPhotoSchema is JPEG and PNG only; imageUploadSchema still allows WebP and PDF — D-04: avatar validation must not reuse the gallery allow-list
- [Phase 16]: patients.photo_path is nullable; storage policies exist only on bucket patient-avatars — Null keeps initials and photo_tone; patients_update already uses can_write_patient
- [Phase 16]: preparePatientPhoto accepts only JPEG FF D8 FF and PNG 89 50 4E 47; PNG stays image/png and JPEG uses quality 0.85 — Transparency must still show photo_tone; WebP, HEIC, and PDF are rejected before decode
- [Phase 16]: PatientAvatar paints a non-empty photoUrl with object-cover and falls back to initials on photo_tone — Missing and broken URLs keep D-01 initials; the component does not open a file dialog
- [Phase 16]: PatientAvatar lg stays h-16 w-16 — The live size map was kept so existing call sites do not shrink
- [Phase 16]: Photo invalidation uses exact query keys so the patients prefix does not refresh the gallery — TanStack Query prefix match would refetch patient images
- [Phase 16]: Patient mappers set photoUrl null until plan 16-04 signs photo_path — This plan exposes the field; signing stays in the read services
- [Phase 16]: photoUrl comes only from signPatientPhotoUrls and is never written back to Postgres — The signed URL expires in 3600 seconds and must not be stored on patients
- [Phase 16]: A missing photo_path leaves photoUrl null and keeps the existing photoTone — Initials stay when there is no stored path; photoTone mapping is unchanged
- [Phase 16]: Remover foto is PatientPhotoRemoveButton after the status pill — The avatar cell always passes showRemove false so the circle stays a label only
- [Phase 16]: Writable list rows keep the file control outside the link — Desktop stopPropagation on click and keydown so the picker does not open the ficha
- [Phase 16]: Calendar due cards copy photoUrl onto the view object so the sm avatar can show the signed URL — The day-view memo only copied photoTone, so the due-card avatar could not receive the signed URL.
- [Phase 16]: Quadro, agenda, painel, and the shortcut stay display-only; upload remains on the ficha and the list — A camera or file input on a draggable card or shortcut button would bypass the write surfaces from plan 16-05.
- [Phase 17]: SQL Editor is the apply path for account isolation; do not run supabase db push — Hosted Editor is the only apply path; the script is not applied from the repo
- [Phase 17]: Board personal branch is organization_id null plus owner_id = auth.uid(); company branch uses viewer_org_id() and does not rewrite can_read_patient — D-05 null org is not a shared bucket; D-06 keeps the phase 3 ficha model
- [Phase 17]: patients_select drops the null created_by branch and keeps created_by = auth.uid() for INSERT RETURNING — can_read_patient is STABLE and cannot see the new row
- [Phase 17]: Without VITE_GEMINI_API_KEY, analyzePhysicalEvaluationPdf throws and does not invent a report (D-04) — Empty state instead of a simulated lumbar report
- [Phase 17]: Saved simulated report is discarded only when cinesiologicDiagnosis FNV-1a 64 equals d7513069ba374c9f; eval_ ids with another diagnosis stay — Real Gemini results also use the eval_ prefix
- [Phase 17]: createColumn and createCard send owner_id from supabase.auth.getUser and omit organization_id; stamp_board_column_scope remains the authority (D-03, D-05) — The insert must satisfy WITH CHECK; the trigger still overwrites owner and organization
- [Phase 17]: listBoard and listDueCards do not filter by owner in the client; RLS returns zero rows for the other autonomo (D-01, D-05) — A client owner predicate would hide rows the policies already withhold
- [Phase 17]: Empty board copy is exactly Nenhuma lista ainda. and does not mention supabase/board.sql (D-04) — The missing seed script would push a shared board and reopen the leak
- [Phase 18]: SQL Editor is the apply path for account-avatars; do not run supabase db push — Hosted Editor is the only apply path; the script is not applied from the repo
- [Phase 18]: profiles.avatar_url stores a UUID path or null; a legacy value aborts the script instead of being nulled — Pitfall 5: ADD CONSTRAINT must not hide an http URL by mass-nulling the column
- [Phase 18]: authenticated UPDATE on profiles is limited to full_name and avatar_url — Pitfall 4 / T-18-01: profiles_update_own stays; service_role and the owner are not revoked
- [Phase 18]: Blank new password fails with Informe a nova senha. before passwordSchema, so an empty field does not show the 8-character rule — An empty field must not surface the minimum-of-8 line from passwordSchema
- [Phase 18]: mapAuthError branches on error.code before any message that contains password, so current_password_invalid is Senha atual incorreta. — GoTrue uses the same human text for a wrong current password and a missing one, and that text contains the word password
- [Phase 18]: Pin @supabase/supabase-js at exact 2.117.1 with no caret so UserAttributes.current_password stays typed — A caret could resolve to a 2.x without the field and force a cast
- [Phase 18]: Leave src/lib/supabase/client.ts on flowType implicit — The SDK pin types current_password; the app session stays implicit
- [Phase 18]: changePassword calls supabase.auth.updateUser with password and current_password together and does not sign in first — The password wall is one updateUser on the app client; a prior sign-in is not the server check
- [Phase 18]: profiles.avatar_url stores the account-avatars object path; signAccountAvatarUrl returns a 3600-second URL and does not write it back — Signed URLs expire; the column must keep the storage path
- [Phase 18]: reloadProfile calls fetchProfile outside onAuthStateChange and does not clear the query cache — Fetching inside the auth callback deadlocks the supabase-js lock; cache clear is only for login and logout
- [Phase 18]: Footer Minha conta is an icon-only NavLink to /conta immediately before Sair — Accessible name is exactly Minha conta; the item is not added to mobileNavItems
- [Phase 18]: Signed account avatar URLs stay in component state and are not written to profiles — profiles.avatar_url remains the storage path; the footer and AccountPage sign it at read time
- [Phase 18]: Password card stays off AccountPage until plan 18-06 — REQ-29 password verification is the next plan; this plan only ships photo and name
- [Phase 18]: Salvar senha calls changePassword only — The page does not call updateUser, signInWithPassword, reauthenticate, or signOut
- [Phase 18]: Wrong current password shows Senha atual incorreta. on that field — Clears only Senha atual, keeps the new-password fields, and stays on /conta
- [Phase 18]: Hosted password oracle was documented and was not executed — Second client persistSession false is a human check; the Dashboard flag was not applied via the Management API
- [Phase 19]: Retired the eight whole-limb keys; new parts use upper_arm, forearm, palm, hand, shin, foot, calf, and ankle — D-06 forbids reusing front.arm_l and the other seven keys
- [Phase 19]: Palm, hand, foot, and ankle are 28 viewBox units tall; shin and calf are only the y=206-212 band under the existing knee — Distal parts need a usable hit target without growing the viewBox or absorbing the knee
- [Phase 19]: Phase 13 patient-ai-summary Set mirrors the 42 keys; deploy stays on the Dashboard and the phase 11 twin is unchanged — The function cannot import src/; publishing is operator work
- [Phase 19]: Centroids of unchanged keys stay the current literals, including back.shoulder_l at x 96 — The plan forbids recalculating centers of regions that did not change
- [Phase 19]: SQL Editor is the apply path for the eight-key DELETE; do not run supabase db push — Operator confirmed applied and the eight-key count returned zero rows
- [Phase 20]: recoveryPasswordSchema uses password/confirmPassword field names (not newPassword) per plan interfaces
- [Phase 20]: mapRecoveryRequestError returns fixed UI-SPEC send failure string; rate-limit still via mapAuthError
- [Phase 20]: typesToTry(null) left without recovery (Pitfall 5 / T-20-05)
- [Phase 20]: Success state hides Lembrou a senha footer; Voltar ao login lives in the centered body
- [Phase 20]: Forgot link sits inside password space-y-2 under Mostrar senha, above Entrar
- [Phase 20]: Recovery ok sets status recovery without toast or clinic navigate (Pitfall 1 / T-20-02) — GuestRoute must not admit clinic with recovery session before setPasswordFromRecovery
- [Phase 20]: Kept UI-SPEC Senha atualizada toast; plan Senha atual substring assert was a false positive — UI-SPEC toast required; verified label Senha atual absent instead
- [Phase 22]: Zod schemas for the AI summary live in patientSummary.ts so node --test imports them without the @/ alias
- [Phase 22]: formatGeneratedAt uses hourCycle h23 so midnight in São Paulo renders 00:00
- [Phase 22]: REQ-33 stays open after 22-01; pack, prompt, and ResumoDoPaciente contract cases stay red until 22-04 and 22-05
- [Phase 22]: Patient summary jsonb CHECKs are explicit null-or-object and 20000 bytes; no new RLS policy — patients_update already covers new columns
- [Phase 22]: Paste 22-patient-summary-fields.sql before running the app after plan 22-03; publish patient-ai-summary only in the 22-07 UAT after plan 22-04 edits the phase 13 source
- [Phase 22]: REQ-33 stays open after 22-02; the SQL script and operator document do not complete the requirement
- [Phase 22]: One generation UPDATE writes ai_summary, ai_summary_fields, and summary_edits null — updatePatient payload stays string|number|null
- [Phase 22]: Summary save errors throw PATIENT_AI_COPY.editError or editForbidden — the hook shows error.message and does not call mapDbError
- [Phase 22]: A summary-only function response is accepted — optional texts stay absent and ai_summary_fields keeps generatedAt
- [Phase 22]: REQ-33 stays open after 22-03 — plans 22-04 through 22-07 still own the prompt, the UI, and the hosted UAT
- [Phase 22]: Resumo pack drops unread defaults; PatientRow stays so evolucao still reads program, EVA, and evolution columns — assembleEvolucaoContextPack casts the same interface
- [Phase 22]: Empty focusRegionKeys stays on the response because omitEmpty drops empty arrays — An empty catalog result must still include the key
- [Phase 22]: REQ-33 stays open after 22-04 — plans 22-05 through 22-07 still own the Resumo UI and the hosted UAT — This plan ships the phase 13 function source only; Dashboard publish stays in 22-USER-SETUP.md
- [Phase 22]: Form reset depends only on open; resolved text is read through a ref so a patient refetch does not wipe in-progress edits — A query refresh while the modal is open must not replace what the user typed
- [Phase 22]: EvaChart is unchanged and mounts only when painSeries has rows, so the empty-series message is not shown on Dor e limitações — The empty branch stays inside EvaChart; this card simply does not render it
- [Phase 22]: REQ-33 stays open after 22-05; plans 22-06 and 22-07 still own the Resumo IA tab, regenerate confirmation, goals typography, and hosted UAT — This plan covers the Resumo tab editor only; requirements.mark-complete was not called
- [Phase 22]: The Nova button on the goals card uses font-semibold because this phase forbids font-medium on these surfaces — Typography forbids font-medium on S1–S4; the card table named the seals, and the Nova button is part of the same card
- [Phase 22]: autoFocusCancel defaults to false so the other ConfirmDialog callers keep their previous focus — The dialog is shared; only the regenerate confirmation opts into cancel focus
- [Phase 22]: REQ-33 stays open after 22-06; plan 22-07 still owns the hosted UAT — This plan covers the Resumo IA block, regenerate confirmation, and goals typography; requirements.mark-complete was not called
- [Phase 23]: allowedFocusKeys matches a whole catalog label after NFD with a left boundary, and ignores a shorter label that only sits inside a longer one — antebraço must not mark braço, and Palma da mão esquerda must not mark Mão esquerda
- [Phase 23]: NÃO CONFIÁVEL now belongs to hintBlockFor; the seven prompt keys and the 42-key parity stay — REQ-34.4 will refuse the phrase inside buildPrompt; putting it back would hide the red contracts
- [Phase 23]: REQ-34 stays open after 23-01; plans 02-05 still own the Edge Function, inline editor, scroll, and UAT — requirements.mark-complete was not called because only the matcher and the still-red contracts shipped
- [Phase 23]: sessionsDone is the exact count of realizada sessions on the user client; a count error omits the key and never reads patients.sessions_done
- [Phase 23]: The resumo response replaces Gemini focusRegionKeys with allowedFocusKeys on untruncated chart text plus the description, and does not union saved focus areas
- [Phase 23]: buildPrompt treats the extra description as FONTE and states that it does not replace patient.sessionsDone; the evolucao hint stays untrusted
- [Phase 23]: Each Resumo text field edits inside its card with one editingKey; Salvar calls diffSummaryEdits on all six resolved keys — An UPDATE replaces the whole summary_edits column
- [Phase 23]: REQ-34 stays open after the inline editor — 34.1 is green; 34.5 scroll and composer label stay red for later plans
- [Phase 23]: Queixa and Diagnóstico scroll inside max-h 4.5rem; the article and the goal line-clamp-2 stay put — Overflow on the article would scroll metrics and goals with the complaint
- [Phase 23]: REQ-34 stays open after 23-04; 34.5 is green and plan 05 still owns UAT — requirements.mark-complete was not called because the phase requirement is not finished
- [Phase 24]: REQ-35 stays open after the capacity helper — Schema, page 03, and PDF still belong to plans 02-04
- [Phase 24]: New-form normalize keeps textoLegado — A second pass must not erase the legacy paragraph
- [Phase 24]: Free text such as 10 min is not parsed into a unit — Only minutos, km, and repeticoes are units
- [Phase 24]: REQ-35 stays open after schema and bloco B: detail, catalog, and PDF remain plan 03 — Acceptance item 4 is still plan 03
- [Phase 24]: Missing atividadesAfetadas keeps .default({}) outside preprocess so parse({}) stays equal to emptyEvaluationFicha() — Absent bloco B must still parse
- [Phase 24]: REQ-35 stays open after detail, catalog, and PDF: plan 04 owns the suite gate and UAT — Acceptance item 4 shipped in plan 03; plan 04 still lists REQ-35
- [Phase 24]: Name-only PDF activity lines use drawText; lines with a miolo use drawLabeledValue — drawOptionalField drops an empty value, so a checked activity with no measure would disappear
- [Phase 24]: REQ-35 closes after the green suite, phase gate, and approved hosted UAT — Plan 04 changed no source; the six bloco B steps were approved
- [Phase 24]: Task 1 stayed uncommitted because the REQ-35 suite was already green — A green file is not edited, and the UAT approval did not require a code commit

### Pending user action

- (adiado) Executar `supabase/patients-req05-evaluations.sql` no SQL Editor
- (adiado) Re-executar `supabase/patients-req14-goals.sql` se ainda não rodou a versão com em_andamento/concluido
- Paste `.planning/phases/16-foto-do-paciente/sql/16-patient-photo.sql` in the Supabase SQL Editor once. Do not use supabase db push.
- Paste `.planning/phases/17-isolamento-de-dados-por-conta/sql/17-account-isolation.sql` in the Supabase SQL Editor once. Do not use supabase db push. If board counts are above zero, uncomment only the owner backfill first.
- Paste `.planning/phases/18-minha-conta/sql/18-account.sql` in the Supabase SQL Editor once. Do not use supabase db push. If the DO block aborts on a legacy avatar_url, inspect the row and do not null it in bulk.
- (adiado) Oráculo de senha da fase 18: ligar `security_update_password_require_current_password`, deixar a reautenticação desligada e seguir `.planning/phases/18-minha-conta/18-USER-SETUP.md`. A prova fica em aberto.
- Paste `.planning/phases/22-resumo-paciente-ia/sql/22-patient-summary-fields.sql` in the Supabase SQL Editor before running the app after plan 22-03. Do not use supabase db push. Without those columns the patient chart fails to load. See `.planning/phases/22-resumo-paciente-ia/22-USER-SETUP.md`.
- Publish Edge Function patient-ai-summary only in the plan 22-07 UAT, from `.planning/phases/13-pdf-export-avaliacao-evolucao/functions/patient-ai-summary/index.ts` after plan 22-04 edits it. Do not publish the phase 11 twin or `supabase/functions/patient-ai-summary/index.ts`. Do not use `supabase functions deploy`. The phase 19 42-key publish waits for that same step.

### Roadmap Evolution

- Phase 2 added: Metas do tratamento (REQ-14)
- Phase 3 added: Tipos de conta e equipe (REQ-15)
- Phase 4 added: Atalhos no dashboard para criar evolução ou avaliação (REQ-16)
- Phase 5 added: Financeiro do autônomo — valores de consulta e arrecadação (REQ-17)
- Phase 6 added: Silhueta de áreas de foco — marcar partes do corpo na ficha (REQ-18)
- Phase 7 added: Galeria de imagens na ficha do paciente
- Phase 8 added: Integração Google Agenda — exportar sessões da agenda da aplicação para o Google Calendar
- Phase 16 added: Foto do paciente — hover com câmera e envio de PNG ou JPEG
- Phase 17 added: Isolamento de dados por conta — vazamento do quadro entre contas, auditoria de todo dado digitável e remoção de mocks
- Phase 18 added: Minha conta — ícone ao lado de Sair; trocar foto, nome e senha
- Phase 19 added: Boneco de área de foco — divisões nos braços, pés separados e seleção sem scroll na página
- Phase 20 added: Esqueci minha senha — link no login envia e-mail para redefinir a senha
- Phase 21 added: Agendar sessões em vários dias da semana com repetição
- Phase 22 added: Resumo do paciente editável e preenchido pela IA (REQ-33)
- Phase 23 added: Ajustes do resumo IA e rolagem do Entenda o caso (REQ-34)
- Phase 24 added: Atividades da avaliação com capacidade por item (REQ-35)
- Phase 25 added: Mobilidade por região, palpação estruturada e testes clínicos (REQ-36)

## Session Continuity

Last session: 2026-10-05T22:16:14.355Z
Stopped at: Phase 25 UI-SPEC approved
Resume file: .planning/phases/25-mobilidade-palpacao-e-testes/25-UI-SPEC.md

## Performance Metrics

| Phase | Plan | Duration | Notes |
|-------|------|----------|-------|
| Phase 04 P01 | 3min | 3 tasks | 5 files |
| Phase 04 P02 | 3min | 2 tasks | 2 files |
| Phase 04 P03 | 3min | 2 tasks | 2 files |
| Phase 04 P04 | 3min | 2 tasks | 2 files |
| Phase 05 P01 | 3min | 2 tasks | 4 files |
| Phase 05 P02 | 10min | 2 tasks | 1 files |
| Phase 05 P03 | 2min | 2 tasks | 3 files |
| Phase 05 P04 | 4min | 2 tasks | 3 files |
| Phase 05 P05 | 4min | 3 tasks | 3 files |
| Phase 06 P01 | 7min | 2 tasks | 4 files |
| Phase 06 P02 | 9min | 2 tasks | 1 files |
| Phase 06 P03 | 4min | 2 tasks | 2 files |
| Phase 06 P04 | 6min | 2 tasks | 2 files |
| Phase 07 P01 | 5min | 2 tasks | 3 files |
| Phase 07 P02 | 7min | 2 tasks | 1 files |
| Phase 07 P03 | 3min | 2 tasks | 3 files |
| Phase 07 P04 | 4min | 3 tasks | 4 files |
| Phase 07-galeria-de-imagens-na-ficha-do-paciente P05 | 5min | 2 tasks | 1 files |
| Phase 08 P01 | 5min | 2 tasks | 4 files |
| Phase 08 P02 | 6min | 2 tasks | 2 files |
| Phase 15 P01 | 2min | 2 tasks | 3 files |
| Phase 15 P02 | 3min | 2 tasks | 4 files |
| Phase 15 P03 | 3min | 2 tasks | 3 files |
| Phase 16 P01 | 3min | 2 tasks | 2 files |
| Phase 16 P02 | 2min | 2 tasks | 2 files |
| Phase 16 P03 | 3min | 2 tasks | 4 files |
| Phase 16 P04 | 2min | 2 tasks | 3 files |
| Phase 16 P05 | 4min | 2 tasks | 4 files |
| Phase 16 P06 | 2min | 2 tasks | 4 files |
| Phase 17 P01 | 5min | 2 tasks | 1 files |
| Phase 17 P02 | 3min | 2 tasks | 2 files |
| Phase 17 P03 | 3min | 2 tasks | 2 files |
| Phase 18 P01 | 4min | 2 tasks | 1 files |
| Phase 18 P03 | 5min | 2 tasks | 2 files |
| Phase 18 P02 | 1min | 2 tasks | 2 files |
| Phase 18 P04 | 4min | 3 tasks | 4 files |
| Phase 18 P05 | 4min | 2 tasks | 3 files |
| Phase 18 P06 | 4 min | 2 tasks | 2 files |
| Phase 19 P01 | 4min | 2 tasks | 3 files |
| Phase 19 P02 | 4min | 2 tasks | 1 files |
| Phase 20 P01 | 2min | 2 tasks | 4 files |
| Phase 20 P02 | 1min | 2 tasks | 3 files |
| Phase 20 P03 | 3min | 2 tasks | 1 files |
| Phase 21 P01 | 8min | 2 tasks | 2 files |
| Phase 21 P02 | 10min | 2 tasks | 1 files |
| Phase 22 P01 | 9min | 3 tasks | 3 files |
| Phase 22 P02 | 2min | 2 tasks | 2 files |
| Phase 22 P03 | 5min | 3 tasks | 5 files |
| Phase 22 P04 | 2min | 2 tasks | 1 files |
| Phase 22 P05 | 3min | 2 tasks | 2 files |
| Phase 22 P06 | 4min | 3 tasks | 4 files |
| Phase 23 P01 | 5min | 2 tasks | 3 files |
| Phase 23 P02 | 4min | 3 tasks | 2 files |
| Phase 23 P03 | 6min | 2 tasks | 2 files |
| Phase 23 P04 | 2min | 2 tasks | 3 files |
| Phase 24 P01 | 6min | 2 tasks | 2 files |
| Phase 24 P02 | 6min | 2 tasks | 4 files |
| Phase 24 P03 | 5min | 2 tasks | 4 files |
| Phase 24 P04 | 4min | 2 tasks | 0 files |
