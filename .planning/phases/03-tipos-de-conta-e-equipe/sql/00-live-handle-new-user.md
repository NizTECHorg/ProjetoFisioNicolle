# Live handle_new_user dump

Dumped from hosted Supabase SQL Editor (same project the app uses). 2026-09-08.

Function exists. Trigger exists. Do not add a second `on_auth_user_created` trigger.

## Function body

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
declare
  v_name text;
begin
  v_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1));
  v_name := regexp_replace(v_name, '[[:cntrl:]]', '', 'g');
  v_name := left(v_name, 100);

  insert into public.profiles (id, full_name, email, role, is_active)
  values (
    new.id,
    v_name,
    new.email,
    'atendente',
    true
  );
  return new;
end;
$function$
```

- `search_path` today: `pg_catalog`, `public`, `pg_temp`
- Default `role` today: `'atendente'` (bakery leftover — preserve the role column; do not drop it)

## Trigger name(s)

| event_object_table | trigger_name | action_statement |
| --- | --- | --- |
| users | on_auth_user_created | EXECUTE FUNCTION handle_new_user() |

One row. Trigger is `on_auth_user_created` on `auth.users`.

## Current patient/profile policies

Leave `board_*` unchanged.

### profiles

- `profiles_select_active_colleagues` SELECT (`is_active = true`)
- `profiles_select_own` SELECT (`(id = auth.uid()) AND (is_active = true)`)
- `profiles_update_own` UPDATE (`id = auth.uid()`) / with_check (`id = auth.uid()`)

### patients

- `patients_insert_authenticated` INSERT with_check `true`
- `patients_select_authenticated` SELECT `true`
- `patients_update_authenticated` UPDATE `true` / with_check `true`

### patient_goals

- `patient_goals_authenticated_all` ALL `true` / with_check `true`
- `patient_goals_select_authenticated` SELECT `true`

### patient_evaluations

- `patient_evaluations_authenticated_all` ALL `true` / with_check `true`

### patient_alerts

- delete / insert / select / update `*_authenticated` all using / with_check `true`

### patient_sessions

- delete / insert / select / update `*_authenticated` all using / with_check `true`

### patient_session_evolutions

- delete / insert / select / update `*_authenticated` all using / with_check `true`

### patient_focus_areas

- `patient_focus_select_authenticated` SELECT `true`

### patient_pain_logs

- `patient_pain_select_authenticated` SELECT `true`

## Live insert column list

`id`, `full_name`, `email`, `role`, `is_active`

CREATE OR REPLACE of `handle_new_user` must keep inserting these five columns. Do not drop `role`.
