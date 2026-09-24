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

- [ ] **Require the current password when a password is updated**
  - Location: Supabase Dashboard → Authentication → Email
  - Set to: on for the option that persists `security_update_password_require_current_password` (`GOTRUE_SECURITY_UPDATE_PASSWORD_REQUIRE_CURRENT_PASSWORD`)
  - Notes: Leave Secure password change / reauthentication (`update_password_require_reauthentication`) off. The app does not call `reauthenticate`. This plan does not turn the flag on through the Management API.

## Verification

After the SQL Editor reports Success, confirm:

- Bucket `account-avatars` is private, file size limit 2097152, MIME jpeg, png, and webp
- `profiles.avatar_url` is null or a path whose first segment is the profile id and whose extension is jpg, png, or webp
- Authenticated can update `full_name` and `avatar_url` on their own row
- Authenticated cannot update other profile columns through that grant
- Another account cannot read the object; there is no anon policy and no UPDATE policy on this bucket

### Password reset verification rule

This hosted Auth oracle has not been run. Do not treat the card or `npm run typecheck` as that proof.

Use a second `createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })`. Do not reuse the app client. Do not call `signInWithEmail`. `OLD` and `NEW` pass `passwordSchema`, differ from each other, and `NEW` is not the weak string `errada-nao-e-a-atual`.

1. `signInWithPassword` with `OLD` creates a session (`error === null` and `data.session` set).
2. `updateUser({ password: NEW })` without `current_password` returns `error.code === 'current_password_required'`, and `OLD` still creates a session. If this call stores `NEW`, stop: the hosted flag is off and D-05 is not met.
3. `updateUser({ password: NEW, current_password: 'errada-nao-e-a-atual' })` returns `error.code === 'current_password_invalid'`. `OLD` still creates a session. `NEW` returns `invalid_credentials`. In the UI, a wrong current password shows exactly `Senha atual incorreta.` and the saved password stays.
4. Only if the earlier steps did not store `NEW`: `updateUser({ password: NEW, current_password: OLD })`. Then `OLD` returns `invalid_credentials` with no session, and `NEW` creates a session. The app session stays on `/conta`. Success toast in the app is `Senha atualizada.`

---

**Once all items complete:** Mark status as "Complete" at top of file.
