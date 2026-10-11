-- ============================================================
-- TANDSMART — BankID switched off for now
--
-- Everyone signs in with e-mail while NEXT_PUBLIC_BANKID_ENABLED is unset,
-- so dentist access no longer requires a recent BankID login. To switch
-- BankID back on: set NEXT_PUBLIC_BANKID_ENABLED=true in Vercel, redeploy,
-- and re-apply 00011_dentist_bankid.sql.
-- ============================================================

create or replace function public.is_dentist()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'tandlakare')
$$;
