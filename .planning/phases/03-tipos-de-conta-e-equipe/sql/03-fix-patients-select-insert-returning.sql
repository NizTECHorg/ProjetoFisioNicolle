-- Fix INSERT de paciente: "new row violates row-level security policy for table patients"
-- Causa: INSERT ... RETURNING aplica a policy SELECT na linha nova.
-- private.can_read_patient e STABLE e nao enxerga a linha do comando atual.
-- Cole no SQL Editor (idempotente). Nao use supabase db push.

drop policy if exists patients_select on public.patients;

create policy patients_select
  on public.patients
  for select
  to authenticated
  using (
    (
      created_by = (select auth.uid())
      and not exists (
        select 1
        from public.organization_memberships m
        where m.profile_id = (select auth.uid())
          and m.status in ('pending', 'rejected')
      )
    )
    or (select private.can_read_patient(id))
    or (created_by is null and (select auth.uid()) is not null)
  );
