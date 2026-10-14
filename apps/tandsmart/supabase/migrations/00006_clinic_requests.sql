-- ============================================================
-- TANDSMART — Patient-authorised requests to the patient's own clinic
--
-- The patient consents to their clinic sending journal extracts and
-- röntgen straight to Tandsmart. The clinic gets a single-use-per-case,
-- time-limited upload link; only the SHA-256 of its token is stored.
-- The link page and its uploads go through server routes using the
-- service role, so the table needs no anon access at all.
-- ============================================================

create table public.clinic_requests (
  id                    uuid primary key default gen_random_uuid(),
  case_id               uuid not null references public.cases(id) on delete cascade,
  created_by            uuid not null references public.profiles(id) on delete cascade,
  clinic_name           text not null,
  clinic_email          text not null,
  patient_name          text not null,
  patient_personnummer  text not null,      -- so the clinic finds the right journal
  requested_items       text[] not null,    -- e.g. {journal, rontgen, vardplan}
  period                text,
  consent_text          text not null,      -- exactly what the patient agreed to
  consented_at          timestamptz not null,
  token_hash            text not null unique,
  expires_at            timestamptz not null,
  status                text not null default 'skickad'
                        check (status in ('skickad', 'uppladdad', 'aterkallad')),
  email_sent            boolean not null default false,
  uploaded_at           timestamptz,
  uploaded_files        int not null default 0,
  uploaded_by_name      text,
  created_at            timestamptz not null default now()
);
create index clinic_requests_case_idx on public.clinic_requests(case_id);
create index clinic_requests_created_by_idx on public.clinic_requests(created_by);

alter table public.clinic_requests enable row level security;

create policy "clinic_requests: select" on public.clinic_requests for select to authenticated
  using (public.owns_case(case_id) or (select public.is_dentist()));
create policy "clinic_requests: patient creates" on public.clinic_requests for insert to authenticated
  with check (created_by = (select auth.uid()) and public.owns_case(case_id));
-- No update/delete policies: revoking and recording uploads happen in
-- server routes that verify ownership / the token first.

-- Files uploaded by a clinic are tagged so the dentist can tell them apart.
alter table public.case_files add column if not exists source text not null default 'patient'
  check (source in ('patient', 'klinik'));
