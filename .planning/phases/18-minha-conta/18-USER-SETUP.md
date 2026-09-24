# Phase 18: User Setup Required

**Generated:** 2026-09-24
**Phase:** 18-minha-conta
**Status:** Incomplete

Complete these items for the account photo and name update to function. The app does not apply SQL.

## Environment Variables

None.

## Dashboard Configuration

- [ ] **Paste the account script and run it once**
  - Location: Supabase Dashboard → SQL Editor
  - Set to: contents of `.planning/phases/18-minha-conta/sql/18-account.sql`
  - Notes: Do not use `supabase db push`. The script is idempotent. It creates the private bucket `account-avatars` (2097152 bytes, `image/jpeg`, `image/png`, `image/webp`), the path check `profiles_avatar_url_shape`, storage policies for the signed-in user's folder, and `GRANT UPDATE` only on `full_name` and `avatar_url`. If the DO block aborts because a legacy `avatar_url` is not a UUID path, inspect that row. Do not null `avatar_url` in bulk.

## Verification

After the SQL Editor reports Success, confirm:

- Bucket `account-avatars` is private, file size limit 2097152, MIME jpeg, png, and webp
- `profiles.avatar_url` is null or a path whose first segment is the profile id and whose extension is jpg, png, or webp
- Authenticated can update `full_name` and `avatar_url` on their own row
- Authenticated cannot update other profile columns through that grant
- Another account cannot read the object; there is no anon policy and no UPDATE policy on this bucket

---

**Once all items complete:** Mark status as "Complete" at top of file.
