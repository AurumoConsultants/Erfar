-- ============================================================
-- TANDSMART — Dentists need a recent BankID login
--
-- Dentists read every patient's health data, so their database access
-- requires a BankID login within the last 12 hours (the same window as the
-- app's BankID session). A password-only dentist session sees nothing.
-- bankid_verified_at is set only by the server after verifying BankID.
-- ============================================================

create or replace function public.is_dentist()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'tandlakare'
      and bankid_verified_at > now() - interval '12 hours'
  )
$$;
