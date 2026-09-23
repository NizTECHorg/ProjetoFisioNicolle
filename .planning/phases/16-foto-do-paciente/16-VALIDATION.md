---
phase: 16
slug: foto-do-paciente
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-09-23
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — do not add Vitest |
| **Config file** | none |
| **Quick run command** | `npm run lint && npm run typecheck` |
| **Full suite command** | `npm run lint && npm run typecheck` |
| **Estimated runtime** | ~40 seconds |

---

## Sampling Rate

- **After every task commit:** `npm run lint && npm run typecheck`
- **After every plan wave:** `npm run lint && npm run typecheck`
- **Before `/gsd-verify-work`:** Both commands green, plus the SQL Editor checks in Wave 0
- **Max feedback latency:** 40 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 16-01-T1 | 16-01 | 1 | D-04 | T-16-01, T-16-02, T-16-03 | Private bucket patient-avatars, jpeg/png only, photo_path CHECK, no UPDATE policy | sql script | `npm run lint && npm run typecheck` | ✅ script planned | ⬜ pending |
| 16-01-T2 | 16-01 | 1 | D-04 | T-16-03 | patientPhotoSchema is PNG/JPEG only; gallery schema still allows WebP and PDF | static | `npm run lint && npm run typecheck` | ✅ schema file | ⬜ pending |
| 16-02-T1 | 16-02 | 1 | D-04 | T-16-04, T-16-05 | Magic-byte sniff and 8 MiB cap before decode; PNG stays PNG | static | `npm run lint && npm run typecheck` | ✅ crop file planned | ⬜ pending |
| 16-02-T2 | 16-02 | 1 | D-01 | T-16-06 | photoUrl renders object-cover; onError and null keep initials on photo_tone | static | `npm run lint && npm run typecheck` | ✅ PatientAvatar | ⬜ pending |
| 16-03-T1 | 16-03 | 2 | D-04 | T-16-07, T-16-08, T-16-09 | New path, upsert false, mapDbError, sign 3600s, no gallery row | static | `npm run lint && npm run typecheck` | ✅ service planned | ⬜ pending |
| 16-03-T2 | 16-03 | 2 | D-01 | T-16-07 | photoUrl on patient DTOs; mutations skip the images query | static | `npm run lint && npm run typecheck` | ✅ hooks | ⬜ pending |
| 16-04-T1 | 16-04 | 3 | D-01 | T-16-07 | Patient selects include photo_path and map photoUrl | static | `npm run lint && npm run typecheck` | ✅ patients.service | ⬜ pending |
| 16-04-T2 | 16-04 | 3 | D-01 | T-16-07 | Calendar and board embeds include photo_path and photoUrl | static | `npm run lint && npm run typecheck` | ✅ calendar and board | ⬜ pending |
| 16-05-T1 | 16-05 | 4 | D-02, D-03, D-04 | T-16-04, T-16-08 | Camera overlay, PNG/JPEG accept, sr-only input, Voltar on confirm | static | `npm run lint && npm run typecheck` | ✅ control planned | ⬜ pending |
| 16-05-T2 | 16-05 | 4 | D-02, D-03 | T-16-11, T-16-12 | Edit on ficha and list only; list click does not navigate; consulta has no control | static | `npm run lint && npm run typecheck` | ✅ header and list | ⬜ pending |
| 16-06-T1 | 16-06 | 4 | D-01 | T-16-12 | Kanban and calendar display photoUrl and do not mount the picker | static | `npm run lint && npm run typecheck` | ✅ pages | ⬜ pending |
| 16-06-T2 | 16-06 | 4 | D-01 | T-16-12 | Dashboard and shortcut display photoUrl and do not mount the picker | static | `npm run lint && npm run typecheck` | ✅ pages | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

The planner replaces the TBD rows with real task ids. Do not add a test runner.

---

## Wave 0 Requirements

Existing lint and typecheck cover the code tasks. No test files.

Human SQL Editor checks, recorded at verification:

- [ ] Bucket `patient-avatars` is private, 2097152 bytes, mime jpeg/png only
- [ ] `patients.photo_path` is nullable; existing rows stay null
- [ ] Author INSERT object and UPDATE `photo_path` succeed
- [ ] Author DELETE object after nulling `photo_path` succeeds
- [ ] Empresa SELECT / signed URL succeeds; INSERT and UPDATE fail
- [ ] Upload of `image/webp` or `image/heic` to this bucket fails
- [ ] `patient_images` policies, gallery MIME, and `can_*` helpers stay unchanged

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Initials when there is no photo; image when there is | D-01 | No test runner | Open a patient with and without a photo |
| Camera on hover and focus only when the user can edit | D-02 | Pointer and focus | Hover the ficha and the list; open as consulta |
| File picker does not navigate the list | D-03 | Click routing | Click the avatar on the list and on the kanban |
| PNG and JPEG save; other types do not | D-04 | Storage MIME | Try png, jpeg, webp |
| Remove photo restores initials everywhere | Discretion | Cross-screen | Remove on the ficha; check list, kanban, calendar, dashboard |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 40s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
