---
status: partial
phase: 16-foto-do-paciente
source: [16-VERIFICATION.md]
started: 2026-09-24T00:55:00Z
updated: 2026-09-24T00:55:00Z
---

## Current Test

Apply the patient photo SQL, then check the camera, the picker, and the other screens.

## Tests

### 1. Apply the patient photo SQL
expected: Private bucket `patient-avatars` (2097152 bytes, JPEG and PNG only), nullable `patients.photo_path`, SELECT via `can_read_patient`, INSERT and DELETE via `can_write_patient`, no UPDATE policy.
result: pending

### 2. Hover, picker, and initials
expected: On the ficha and the patient list, hover shows a camera and click opens a PNG/JPEG chooser. A saved photo replaces the initials. No photo keeps the initials. Consulta has no camera. Remover foto is only on the ficha, after the status pill, and Voltar cancels.
result: pending

### 3. Same photo on the other screens
expected: After a successful upload, quadro, agenda, próximas sessões, and the clinical shortcut show the same photo, with no camera and no file picker.
result: pending

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
