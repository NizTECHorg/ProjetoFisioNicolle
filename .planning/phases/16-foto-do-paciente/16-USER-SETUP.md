# Phase 16: User Setup Required

**Generated:** 2026-09-24
**Phase:** 16-foto-do-paciente
**Status:** Incomplete

Complete these items for the patient photo to function. The app cannot create the bucket from the client.

## Environment Variables

None.

## Dashboard Configuration

- [ ] **Paste the patient photo script and run it once**
  - Location: Supabase Dashboard → SQL Editor
  - Set to: contents of `.planning/phases/16-foto-do-paciente/sql/16-patient-photo.sql`
  - Notes: Do not use `supabase db push`. The script is idempotent. It creates the private bucket `patient-avatars` (2097152 bytes, `image/jpeg` and `image/png` only) and nullable `patients.photo_path`. A public leftover with this bucket id is fixed in the Dashboard, not by UPDATE.

## Verification

After the SQL Editor reports Success, confirm:

- Bucket `patient-avatars` is private, file size limit 2097152, MIME jpeg and png only
- `patients.photo_path` is nullable and existing rows stay null
- Author INSERT of an object and UPDATE of `photo_path` succeed
- Author DELETE of the object after nulling `photo_path` succeeds
- Empresa SELECT and signed URL succeed; INSERT and UPDATE fail
- WebP and HEIC uploads fail
- Gallery storage policies and `can_read_patient` / `can_write_patient` stay unchanged

---

**Once all items complete:** Mark status as "Complete" at top of file.
