---
phase: 07-galeria-de-imagens-na-ficha-do-paciente
verified: 2026-09-15T03:15:00Z
status: human_needed
score: 14/14 must-haves verified
overrides_applied: 0
human_verification:
  - test: "No SQL Editor, confirmar bucket patient-images Private (8 MiB, jpeg/png/webp), tabela patient_images com session_removed, e a matriz do rodapé (creator CRUD, colega INSERT 42501, empresa SELECT, D-07 ao apagar sessão)."
    expected: "Bucket privado; session_id SET NULL e session_removed true nas órfãs; avulsa-original permanece false; Phase 3 can_* intactos. SQL já foi colado (humano confirmou applied)."
    why_human: "Não dá para consultar o projeto hosted daqui. O human-check do 07-02 ficou no Editor."
  - test: "Na ficha, aba Imagens em 375px: o quinto tab aparece (scroll horizontal). Abrir Adicionar; Tirar foto (câmera traseira) e Escolher arquivos; várias no lote; X remove; Voltar descarta."
    expected: "Viewport estreito mostra os dois botões; largo só Escolher arquivos. Um Adicionar envia o lote com a mesma descrição/sessão."
    why_human: "capture=environment e matchMedia só se confirmam em dispositivo/DevTools real."
  - test: "Enviar HEIC (ou MIME inválido) misturado com JPEG válido no mesmo lote; um arquivo > 8 MB."
    expected: "Toast em português no inválido; o JPEG sobe; o inválido não."
    why_human: "Zod está no código; o toast e o lote misto são UI."
  - test: "Ligar foto a uma sessão, excluir a sessão em Evoluções, reabrir a foto."
    expected: "Confirm inclui 'As fotos dessa sessão ficam na ficha como avulsas.' Tile: Avulsa. Lightbox: Sessão removida. até Salvar alterações em Editar."
    why_human: "Trigger + cache só se provam no banco e na ficha ao vivo."
  - test: "Conta empresa em consulta de ficha de colega: abrir Imagens, grid e lightbox."
    expected: "Galeria e lightbox visíveis; Adicionar / Editar / Excluir / Compartilhar e inputs de arquivo ausentes (não disabled)."
    why_human: "Dois logins; hide-write é UX."
  - test: "No lightbox, Compartilhar (quem escreve, se navigator.share existir). Confirmar que não há Baixar nem copiar URL."
    expected: "Share sheet com o arquivo; AbortError silencioso; sem download e sem link público."
    why_human: "Web Share API é do browser."
---

# Phase 7: Galeria de imagens na ficha do paciente Verification Report

**Phase Goal:** Na ficha do paciente, a aba Imagens mostra uma galeria persistida (sem mock). Cada foto é avulsa ou ligada a uma sessão, com descrição opcional. No viewport estreito o envio inclui câmera traseira; várias fotos sobem no mesmo lote. Excluir a sessão não apaga as fotos — elas ficam avulsas, com aviso Sessão removida. no lightbox até o profissional salvar Editar. Quem não pode escrever vê a galeria e o lightbox; Adicionar / Editar / Excluir / Compartilhar ficam ocultos.
**Verified:** 2026-09-15T03:15:00Z
**Status:** human_needed
**Re-verification:** No — initial verification
**Mode:** not MVP (`mode: null`)

Code-level must-haves from ROADMAP success criteria + unique PLAN `must_haves` are present, substantive, wired, and fed by `patient_images` + Storage signed URLs (not mocks). Visual, two-account, camera, share-sheet, and live RLS matrix remain human.

## Goal Achievement

### Observable Truths

Merged from ROADMAP success criteria (contract) and PLAN frontmatter that does not merely restate an SC.

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | A aba Imagens (`?aba=imagens`) lista fotos reais do Supabase, sem mock | ✓ VERIFIED | `PatientTab` includes `imagens`; `PatientPage` parses/writes `aba=imagens` and mounts `PatientImagesPanel`. List path is `usePatientImages` → `listPatientImages` → `from('patient_images')` + `createSignedUrls`. Empty is `[]` + heading **Nenhuma imagem nesta ficha.** No mock tiles in `src/`. |
| 2 | Cada foto é avulsa ou ligada a uma sessão, com descrição opcional | ✓ VERIFIED | `PatientImage.sessionId: string \| null`, `description` via `optionalText(500)`. Upload/edit Select **Avulsa (sem sessão)** vs session labels. Grid shows description or **Sem descrição.** |
| 3 | Viewport estreito: Tirar foto (câmera traseira) e Escolher arquivos; várias no mesmo lote, mesma descrição/sessão | ✓ VERIFIED | `NARROW_MEDIA = '(max-width: 767px)'`. **Tirar foto** + `capture="environment"` (no `multiple`) only when narrow. **Escolher arquivos** has `multiple`, no capture. Lote is `File[]`; one form description/session; `useUploadPatientImages.mutate({ files: valids, sessionId, description })`. |
| 4 | Arquivo inválido (HEIC, MIME, > 8 MB) gera toast em português e não sobe; as válidas do lote sobem | ✓ VERIFIED | `imageUploadSchema` enum jpeg/png/webp with locked HEIC copy; `byteSize` max 8 MiB **A imagem deve ter no máximo 8 MB.** Panel `safeParse` per file toasts and excludes; service skips Zod failures. Spot-check of the same Zod contract: HEIC/oversize fail; jpeg 100 bytes passes. |
| 5 | Excluir a sessão não apaga as fotos (`ON DELETE SET NULL`); o lightbox mostra Sessão removida. até salvar Editar; o tile mostra Avulsa | ✓ VERIFIED | SQL FK `on delete set null`; BEFORE DELETE trigger sets `session_removed = true`. `tileAllocation` returns **Avulsa** when `sessionId` is null (never the orphan sentence). `lightboxAllocation` returns **Sessão removida.** when `sessionRemoved`. `updatePatientImage` writes `session_removed: false`. `useDeletePatientSession` already calls `invalidatePatient` (images key included). |
| 6 | O confirm de excluir sessão em Evoluções avisa: As fotos dessa sessão ficam na ficha como avulsas. | ✓ VERIFIED | `PatientEvolutionsPanel.tsx` ConfirmDialog description concatenates the locked sentence after the existing undo warning. |
| 7 | Empresa em consulta vê grid e lightbox; Adicionar / Editar / Excluir / Compartilhar ficam ocultos; RLS `can_read_patient` / `can_write_patient` é a parede | ✓ VERIFIED | `canWrite` default `false` (fail-closed). Page passes `canWritePatient(...)`. Write chrome (`Adicionar`, Pencil/Trash, edit/delete/share modals, file inputs) is `{canWrite ? … : null}` — unmounted, not disabled. SQL table + `storage.objects` policies call `private.can_read_patient` / `can_write_patient`. Live empresa JWT still needs human. |
| 8 | Lightbox tem Compartilhar (`navigator.share` com o arquivo) para quem escreve; sem baixar e sem link público | ✓ VERIFIED | `showShare = canWrite && canShareImageFiles()`. `shareImage` fetches blob from signed URL, wraps `File`, `navigator.share({ files })`. No `download`, no **Baixar**, no `clipboard`/`getPublicUrl`. Bucket `public` is `false`. Button hidden when Share API / `canShare({ files })` is missing. |
| 9 | PatientImage DTO includes sessionId, description, sessionRemoved, and signedUrl that is never a table column | ✓ VERIFIED | `src/types/patient.ts` exports `PatientImage` / `UpdatePatientImageInput` / `PatientImageMime`. SQL has no `signed_url` column. `signedUrl` attached only after `createSignedUrls`. |
| 10 | mapStorageError never returns raw English Storage text; MAX_BATCH_FILES is 10 | ✓ VERIFIED | `mapStorageError` always returns locked PT strings (size / MIME / `mapDbError` permission / fallback **Não foi possível salvar…**). `MAX_BATCH_FILES = 10`; surplus toast **Envie no máximo 10 fotos por vez.** |
| 11 | Bucket `patient-images` is private (jpeg/png/webp, 8 MiB); policies call Phase 3 helpers; schema applied in SQL Editor | ✓ VERIFIED | Committed SQL + `supabase/07-patient-images.sql` are byte-identical. `public` is `false`, `file_size_limit 8388608`, mime jpeg/png/webp only. No `public = true`, `image/*`, `service_role`, `DELETE FROM storage.objects`, or `supabase db push` in non-comment SQL. Human + 07-02-SUMMARY resume-signal `applied`. |
| 12 | Upload writes Storage then INSERT (INSERT failure removes object); delete is `storage.remove` then row DELETE; `invalidatePatient` includes images | ✓ VERIFIED | `uploadPatientImage` upload then `insertImageRow`; on INSERT error `storage.remove([path])`. `deletePatientImage` `remove` then `DELETE`. `invalidatePatient` invalidates `['patients', patientId, 'images']`. |
| 13 | Resumo **Documentos · Em breve** is unchanged | ✓ VERIFIED | `PatientPage` shortcuts still have `{ label: 'Documentos', detail: 'Em breve' }`. Stub route `PatientModuleStubPage` still titles Documentos / Em breve. Gallery did not hijack that card. |
| 14 | Upload is fluxo direto: no LGPD checkbox, no second consent modal, no extra privacy line (D-09) | ✓ VERIFIED | `PatientImagesPanel` has no checkbox, LGPD, privacidade, or extra consent modal. Upload modal copy is JPEG/PNG/WebP only. |

**Score:** 14/14 truths verified (code). Status is `human_needed` because Step 8 items are non-empty.

### CONTEXT D-01–D-12 (code)

| ID | Lock | Status | Evidence |
| --- | --- | --- | --- |
| D-01 | Tirar foto (traseira) só no estreito; largo só Escolher arquivos | ✓ | `narrowViewport` gates button + `capture="environment"` input |
| D-02 | Foto da câmera entra no lote; persist só em Adicionar | ✓ | `onCameraChange` → `appendToLote`; persist in `onUploadSubmit` |
| D-03 | Várias no mesmo Adicionar; descrição/sessão iguais | ✓ | `uploadPatientImages` loop with shared `input` |
| D-04 | Inválido: toast + skip; válidas sobem | ✓ | per-file `safeParse` + toast |
| D-05 | X na miniatura; Voltar descarta o lote | ✓ | `aria-label="Remover do envio"`; `closeUpload` clears lote. See WR-02 warning (Escape while pending). |
| D-06 | Excluir sessão não apaga foto; SET NULL | ✓ | SQL FK + photos remain |
| D-07 | Lightbox **Sessão removida.**; tile **Avulsa**; Editar limpa flag | ✓ | helpers + `session_removed: false` on update |
| D-08 | Extra no confirm de Evoluções | ✓ | exact sentence present |
| D-09 | Sem checkbox/modal/linha LGPD | ✓ | no matches |
| D-10 | Sem Baixar | ✓ | no download / Baixar |
| D-11 | Empresa consulta vê; writes ocultos; RLS é parede | ✓ | unmount + SQL `can_*` |
| D-12 | Compartilhar via `navigator.share`; sem URL pública | ✓ | share File; hide if API missing |

### Required Artifacts

gsd-sdk `verify.artifacts` on all five PLANs: **13/13 passed**. Manual L2/L3/L4 below.

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `src/types/patient.ts` | PatientImage + UpdatePatientImageInput | ✓ VERIFIED | Named exports; `sessionRemoved`; `signedUrl` DTO-only. Wired by service + panel. |
| `src/schemas/patient.schema.ts` | MIME/size/description/session Zod + batch cap | ✓ VERIFIED | `PATIENT_IMAGE_MIMES`, `MAX_IMAGE_BYTES`, `MAX_BATCH_FILES`, `imageUploadSchema`, `imageMetadataFormSchema`. Reuses `optionalText(500)`. |
| `src/lib/security/index.ts` | mapStorageError PT mapping | ✓ VERIFIED | Permission path wraps `mapDbError`. Never returns `error.message` raw. |
| `.planning/phases/07-galeria-de-imagens-na-ficha-do-paciente/sql/07-patient-images.sql` | Idempotent bucket + table + RLS + trigger | ✓ VERIFIED | 218 lines; `session_removed`; SET NULL; `can_*`. |
| `supabase/07-patient-images.sql` | SQL Editor paste copy | ✓ VERIFIED | `cmp` identical to committed file. |
| `src/services/patientImages.service.ts` | list/upload/update/delete | ✓ VERIFIED | 242 lines; exports all five functions; `IMAGE_BUCKET = 'patient-images'`. |
| `src/hooks/usePatientImages.ts` | queryKey images + mutations | ✓ VERIFIED | All four hooks; `onSuccess` → `invalidatePatient`. |
| `src/hooks/usePatients.ts` | images key on invalidatePatient | ✓ VERIFIED | `['patients', patientId, 'images']`. |
| `src/components/patients/PatientImagesPanel.tsx` | Gallery + lote/camera/edit/delete/share | ✓ VERIFIED | 659 lines; contains **Tirar foto**; default `canWrite = false`. |
| `src/components/patients/PatientProfileHeader.tsx` | PatientTab imagens + overflow-x-auto | ✓ VERIFIED | Fifth tab **Imagens**; nav `overflow-x-auto` (not `overflow-hidden`). |
| `src/pages/PatientPage.tsx` | aba=imagens mount with canWrite | ✓ VERIFIED | Imports and mounts panel; `canWritePatient`. |
| `src/components/patients/PatientEvolutionsPanel.tsx` | D-08 sentence | ✓ VERIFIED | Exact copy present. |

`src/types/database.types.ts` has no `patient_images` (as planned: local `ImageRow` in the service).

### Key Link Verification

gsd-sdk `verify.key-links`: 07-01, 07-03, 07-04, 07-05 all verified. 07-02 SDK reported `Source file not found` because `from` is a SQL identifier, not a `.ts` path — **manual grep WIRED**.

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| `patient.schema.ts` | `patient.ts` | PATIENT_IMAGE_MIMES vs PatientImageMime | WIRED | jpeg/png/webp both sides |
| `security/index.ts` | `mapDbError` | mapStorageError permission branch | WIRED | 42501/403 → `mapDbError` |
| `public.patient_images` | `private.can_write_patient` | INSERT/UPDATE/DELETE policies | WIRED | SQL USING/WITH CHECK (SDK false-negative) |
| `storage.objects` | `private.can_read_patient` | SELECT + bucket_id patient-images | WIRED | folder UUID regex then `can_read_patient` |
| `patient_sessions` | `session_removed` | BEFORE DELETE trigger | WIRED | `private.patient_images_on_session_delete` |
| `patientImages.service.ts` | `storage.from('patient-images')` | upload / createSignedUrls / remove | WIRED | |
| `usePatientImages.ts` | `invalidatePatient` | mutation onSuccess | WIRED | |
| `usePatients.ts` | queryKey images | invalidateQueries | WIRED | |
| `PatientPage.tsx` | `PatientImagesPanel` | `tab === 'imagens'` + canWrite | WIRED | |
| `PatientImagesPanel.tsx` | `usePatientImages` | list query | WIRED | |
| `PatientImagesPanel.tsx` | sessionRemoved | lightbox **Sessão removida.** | WIRED | |
| `PatientImagesPanel.tsx` | `useUploadPatientImages` | mutate files + metadata | WIRED | |
| `PatientImagesPanel.tsx` | `navigator.share` | File from signed URL blob | WIRED | |
| `PatientImagesPanel.tsx` | `canWrite` | unmount write chrome | WIRED | |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `PatientImagesPanel` | `images` (`usePatientImages`) | `listPatientImages` → PostgREST `patient_images` + Storage `createSignedUrls` | Yes (empty table → `[]`, not mocks) | ✓ FLOWING |
| `PatientImagesPanel` | `sessions` (chips / Select) | `usePatientSessions` | Yes, existing sessions list | ✓ FLOWING |
| `PatientImagesPanel` | `canWrite` | `PatientPage` `canWritePatient(user.id, createdBy)` | Yes, auth + ficha owner | ✓ FLOWING |
| `PatientImagesPanel` | `lote` | `File[]` from inputs until submit | User files; not persisted until mutate | ✓ FLOWING |
| `SignedPhoto` | `src` | `image.signedUrl` from list | Signed URL or well **Não foi possível mostrar a imagem.** | ✓ FLOWING |

No hollow props (`images={[]}` at the call site). Panel is mounted with `patientId={dashboard.id}`.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| HEIC rejected with locked PT copy; jpeg ok; >8 MiB rejected | Node + Zod mirroring `imageUploadSchema` (alias-import of the TS file blocked) | heicMsg locked iPhone copy; bigMsg 8 MB; jpegOk true; `image/jpg` and `""` fail | ✓ PASS (contract); ⚠️ camera MIME alias not normalized |
| Committed SQL == Editor copy | `cmp` both `07-patient-images.sql` paths | identical | ✓ PASS |
| SQL anti-patterns (public true / db push / delete storage.objects / service_role / image/\*) | grep non-comment SQL | 0 matches | ✓ PASS |
| Named gallery exports present | grep | service/hooks/panel exports found | ✓ PASS |
| Live Storage/PostgREST | — | would need hosted JWT | ? SKIP |

### Probe Execution

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| — | — | No `scripts/**/tests/probe-*.sh`; PLANs/SUMMARYs do not declare probes | SKIP |

### Requirements Coverage

REQUIREMENTS.md is still unlocked and has **no REQ-19**. Plans claim proposed IDs from `07-RESEARCH.md`. Not ORPHANED (nothing in REQUIREMENTS maps to Phase 7 that a plan omitted).

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| REQ-19 *(proposed)* | 07-01–07-05 | Galeria na ficha, avulsa ou sessão, descrição | ✓ SATISFIED (code) | Tab + persist + UI; UAT remaining |
| REQ-19.1 | 07-04 | Aba Imagens / `?aba=imagens` | ✓ SATISFIED | Header + PatientPage |
| REQ-19.2 | 07-03, 07-04 | Grid + lightbox, no mock | ✓ SATISFIED | list + signed URLs + empty copy |
| REQ-19.3 | 07-02–07-05 | Avulsa XOR uma sessão; filter; SET NULL | ✓ SATISFIED | FK + chips + Select |
| REQ-19.4 | 07-01, 07-03, 07-05 | Description max 500; edit | ✓ SATISFIED | Zod + sanitizeText(500) + Editar modal |
| REQ-19.5 | 07-02, 07-03 | Persist table + Storage | ✓ SATISFIED | SQL + service upload/INSERT |
| REQ-19.6 | 07-02, 07-04, 07-05 | Empresa consulta read-only | ✓ SATISFIED (code) | hide-write + RLS; two-account UAT remaining |

### Anti-Patterns Found

No `TBD` / `FIXME` / `XXX` in phase-touched gallery files (debt-marker gate clean). No React stub `return null` gallery. Review findings are **not** failed must-haves; they are residual risk.

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `sql/07-patient-images.sql` | 56–57, 94–127 | `storage_path` CHECK is two UUIDs, not `split_part = patient_id`; table GRANT UPDATE is wide (CR-01) | ⚠️ Warning | Writer on A who can read B could file B’s object onto A’s row. Does not break empresa hide-write. Review suggested a follow-up Editor paste. No later phase covers this. |
| `patientImages.service.ts` | 201–202 | `uploadPatientImages` returns successes and drops later Storage/DB failures (CR-02) | ⚠️ Warning | D-04 invalid-file path is intact; mixed Storage failures can toast success and close the modal. |
| `PatientImagesPanel.tsx` | 515–519 | Upload `Modal onClose={closeUpload}` not gated on `isPending` (WR-02) | ⚠️ Warning | Voltar **button** is disabled while pending; Escape/backdrop still clears lote while upload continues. |
| `security/index.ts` | 254–261 | MIME branch matches `'not allowed'` before 403 (WR-03) | ⚠️ Warning | Some RLS Storage errors may show the HEIC copy. Still Portuguese — truth 10 holds. |
| `patient.schema.ts` + panel | 223–228, 290–296 | `file.type` enum only; `image/jpg` / empty type fail (WR-04) | ⚠️ Warning | Some camera WebViews may toast HEIC copy on a JPEG. Human camera test should catch this. |
| `PatientImagesPanel.tsx` | 482–512, 599–655 | Edit/delete from lightbox leave lightbox open (WR-01) | ⚠️ Warning | Stacked Modals; Escape/scroll-lock. Visual UAT. |

**Inversion:** (1) mocks — none found; (2) session delete CASCADE — FK is SET NULL; (3) `canWrite` default true like Evoluções — images panel defaults **false**.

**Confirmation bias:** (1) D-04 is only MIME/size, not Storage partial failure (CR-02); (2) no unit test file — Zod was re-run in Node, not Vitest; (3) `mapStorageError` permission vs MIME overlap is an untested error path.

### Human Verification Required

Harvested from 07-02 `<human-check>` plus visual/device locks grep cannot prove.

### 1. SQL Editor live matrix

**Test:** Confirm bucket Private, `session_removed`, and the footer allow/deny/D-07 checks.
**Expected:** Creator CRUD works; colleague INSERT 42501; empresa SELECT ok; delete sessão leaves orphan flag.
**Why human:** Hosted SQL/Storage is outside this process. Human already signaled `applied`; matrix still needs a person.

### 2. Narrow viewport camera + lote

**Test:** 375px ficha → Imagens → Adicionar → Tirar foto + Escolher arquivos; X; Voltar.
**Expected:** Rear camera on narrow only; files join one lote; Voltar does not persist.
**Why human:** `capture` and `matchMedia` are device behavior.

### 3. Invalid file in a mixed lote

**Test:** HEIC (or wrong MIME) + valid JPEG; one file over 8 MB.
**Expected:** PT toast; valids persist.
**Why human:** Toast + network upload.

### 4. Session delete → orphan copy

**Test:** Attach photo to a session, delete session in Evoluções, open lightbox, then Editar → Salvar.
**Expected:** D-08 sentence; tile Avulsa; lightbox **Sessão removida.** until save.
**Why human:** Trigger + refetch.

### 5. Empresa consult hide-write

**Test:** Colleague ficha as empresa owner.
**Expected:** Grid + lightbox; no Adicionar/Editar/Excluir/Compartilhar/file inputs.
**Why human:** Two accounts.

### 6. Compartilhar

**Test:** Writer lightbox Compartilhar on a browser that supports files; confirm no Baixar / copied signed URL.
**Expected:** Share sheet with the file; dismiss is silent.
**Why human:** Web Share API.

### Gaps Summary

No blocking gaps against the phase goal or merged must-haves. Implementation is not a stub: tab, service, SQL, lote, D-07 copy, and hide-write are wired to real Supabase reads/writes.

Unfixed code-review items (CR-01 path/patient_id, CR-02 silent lote Storage failures, camera MIME alias) are warnings, not FAILED truths. They do not match a later ROADMAP phase, so they stay as residual risk for UAT / a possible follow-up paste — not `gaps:` for `/gsd-plan-phase --gaps`.

---

_Verified: 2026-09-15T03:15:00Z_
_Verifier: Claude (gsd-verifier)_
