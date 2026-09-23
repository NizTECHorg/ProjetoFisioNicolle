---
phase: 16
slug: foto-do-paciente
status: draft
nyquist_compliant: false
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
| D-01 | TBD | TBD | D-01 | — | No photo keeps initials and photo_tone | manual | `npm run typecheck` | ❌ | ⬜ pending |
| D-02 | TBD | TBD | D-02 | — | Camera only on an editable avatar | manual | `npm run lint` | ❌ | ⬜ pending |
| D-03 | TBD | TBD | D-03 | — | Click opens the picker and does not navigate the list | manual | `npm run typecheck` | ❌ | ⬜ pending |
| D-04 | TBD | TBD | D-04 | V5 | PNG and JPEG only; gallery MIME unchanged | manual | `npm run typecheck` | ❌ | ⬜ pending |
| RLS | TBD | TBD | — | V4 | Write only with can_write_patient; signed URL for readers | manual | SQL Editor | ❌ | ⬜ pending |

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

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 40s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
