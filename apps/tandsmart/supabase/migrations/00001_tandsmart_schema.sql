-- ============================================================
-- TANDSMART — Initial Schema
-- Second-opinion service for dental cost estimates (prisförslag),
-- treatment plans (vårdplaner) and clinics, reviewed by a licensed
-- dentist. Runs in its OWN Supabase project (EU region) — never in
-- Erfar's database: this one holds health data (känsliga
-- personuppgifter, GDPR art. 9).
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
create type public.user_role as enum ('patient', 'tandlakare');
create type public.case_status as enum ('inskickat', 'under_granskning', 'besvarat', 'avslutat');
-- Which parts of the service the patient asked for on a case.
create type public.case_service as enum ('pris', 'vardplan', 'klinik');
create type public.case_file_kind as enum ('prisforslag', 'vardplan', 'rontgen', 'foto', 'ovrigt');
-- The dentist's overall verdict on a case.
create type public.case_verdict as enum ('rimligt', 'delvis_rimligt', 'ifragasatt');
-- Traffic-light rating for each clinic dimension.
create type public.clinic_rating as enum ('ok', 'observera', 'varning', 'okand');

-- ============================================================
-- PROFILES (one per auth.users row)
-- `role` is set to 'tandlakare' only via scripts/create-dentist.mjs
-- (service role) — a guard trigger stops users promoting themselves.
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  email       text not null,
  phone       text,
  -- Drives the tandvårdsstöd calculation (ATB brackets, 67+ "tiotandvård").
  birth_year  int check (birth_year between 1900 and 2100),
  role        public.user_role not null default 'patient',
  -- Explicit consent to processing health data (GDPR art. 9.2a), captured at signup.
  consent_at  timestamptz,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- REFERENCE PRICES — TLV's referenspriser per åtgärdskod.
-- Seeded below with a verified subset; load the full yearly list with
-- `pnpm --filter tandsmart import-referenspriser <TLV.xlsx>`.
-- ============================================================
create table public.reference_prices (
  code               text primary key,
  description        text not null,
  price_general      numeric(10,2),  -- allmäntandvård
  price_specialist   numeric(10,2),  -- specialisttandvård
  valid_year         int not null,
  updated_at         timestamptz not null default now()
);

-- ============================================================
-- CLINIC REVIEWS — the dentist's assessment of a clinic, keyed by org
-- number so one review is reused across every case at that clinic.
-- ============================================================
create table public.clinic_reviews (
  org_number          text primary key,
  name                text not null,
  finance_rating      public.clinic_rating not null default 'okand',
  finance_note        text,
  ivo_rating          public.clinic_rating not null default 'okand',
  ivo_note            text,
  reputation_rating   public.clinic_rating not null default 'okand',
  reputation_note     text,
  reviewed_by         uuid references public.profiles(id) on delete set null,
  reviewed_at         timestamptz not null default now()
);

-- ============================================================
-- CASES (ärenden) — one per patient question.
-- Patient-owned columns are editable by the patient while the case is
-- 'inskickat'; review_* / status / ai_* columns are dentist-only (see
-- guard_case_update below).
-- ============================================================
create table public.cases (
  id                    uuid primary key default gen_random_uuid(),
  patient_id            uuid not null references public.profiles(id) on delete cascade,
  services              public.case_service[] not null check (cardinality(services) > 0),
  status                public.case_status not null default 'inskickat',
  title                 text not null,
  patient_description   text,
  patient_questions     text,
  clinic_name           text,
  clinic_org_number     text,
  clinic_city           text,
  treating_dentist      text,
  is_specialist         boolean not null default false,
  -- Referenspris-based costs already paid in the current 12-month
  -- högkostnadsskydd period, so the subsidy estimate starts at the right step.
  prior_period_costs    numeric(10,2) not null default 0 check (prior_period_costs >= 0),

  -- AI pre-analysis — visible to the dentist only, never to the patient.
  ai_draft              jsonb,
  ai_draft_at           timestamptz,

  -- The dentist's published answer.
  review_verdict        public.case_verdict,
  review_summary        text,
  review_price          text,
  review_plan           text,
  review_clinic         text,
  review_questions      text,  -- questions the patient should ask their clinic
  reviewed_by           uuid references public.profiles(id) on delete set null,
  answered_at           timestamptz,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index cases_patient_idx on public.cases(patient_id, created_at desc);
create index cases_status_idx on public.cases(status, created_at);

-- Line items from the prisförslag / vårdplan (åtgärdskoder).
create table public.case_items (
  id           uuid primary key default gen_random_uuid(),
  case_id      uuid not null references public.cases(id) on delete cascade,
  code         text,
  description  text,
  tooth        text,
  quantity     int not null default 1 check (quantity > 0),
  unit_price   numeric(10,2) not null check (unit_price >= 0),
  sort         int not null default 0
);
create index case_items_case_idx on public.case_items(case_id, sort);

-- Uploaded documents (prisförslag, vårdplan, röntgen, photos).
create table public.case_files (
  id          uuid primary key default gen_random_uuid(),
  case_id     uuid not null references public.cases(id) on delete cascade,
  path        text not null unique,   -- storage path in bucket 'case-files'
  file_name   text not null,
  mime_type   text not null,
  kind        public.case_file_kind not null default 'ovrigt',
  created_at  timestamptz not null default now()
);

-- Follow-up dialogue between patient and dentist on a case.
create table public.case_messages (
  id          uuid primary key default gen_random_uuid(),
  case_id     uuid not null references public.cases(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  body        text not null check (length(body) between 1 and 5000),
  created_at  timestamptz not null default now()
);
create index case_messages_case_idx on public.case_messages(case_id, created_at);

-- Access log — who opened which case, for the dentist's
-- journalföring/loggkontroll obligations under patientdatalagen.
create table public.case_access_log (
  id          bigint generated always as identity primary key,
  case_id     uuid not null references public.cases(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  action      text not null,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- HELPERS
-- ============================================================
create or replace function public.is_dentist()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'tandlakare')
$$;

create or replace function public.owns_case(p_case_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.cases where id = p_case_id and patient_id = auth.uid())
$$;

create or replace function public.case_is_open(p_case_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.cases where id = p_case_id and status = 'inskickat')
$$;

-- New auth user → profile, from the signup form's user metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, birth_year, consent_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    nullif(new.raw_user_meta_data->>'birth_year', '')::int,
    nullif(new.raw_user_meta_data->>'consent_at', '')::timestamptz
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users may edit their own name/phone/birth year, never their role.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role and auth.role() <> 'service_role' then
    raise exception 'role can only be changed by an administrator';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

-- Patients may only touch their own descriptive columns, and only while
-- the case is still 'inskickat'. Everything else is dentist-only.
create or replace function public.guard_case_update()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  if auth.role() = 'service_role' or public.is_dentist() then
    return new;
  end if;
  if old.status <> 'inskickat' then
    raise exception 'case is locked once review has started';
  end if;
  if new.patient_id      is distinct from old.patient_id
     or new.status         is distinct from old.status
     or new.ai_draft       is distinct from old.ai_draft
     or new.ai_draft_at    is distinct from old.ai_draft_at
     or new.review_verdict is distinct from old.review_verdict
     or new.review_summary is distinct from old.review_summary
     or new.review_price   is distinct from old.review_price
     or new.review_plan    is distinct from old.review_plan
     or new.review_clinic  is distinct from old.review_clinic
     or new.review_questions is distinct from old.review_questions
     or new.reviewed_by    is distinct from old.reviewed_by
     or new.answered_at    is distinct from old.answered_at then
    raise exception 'only the reviewing dentist can change these fields';
  end if;
  return new;
end;
$$;

create trigger cases_guard_update
  before update on public.cases
  for each row execute function public.guard_case_update();

-- New cases always start unreviewed, whatever the client sent.
create or replace function public.guard_case_insert()
returns trigger
language plpgsql
as $$
begin
  if auth.role() <> 'service_role' then
    new.status := 'inskickat';
    new.ai_draft := null;
    new.ai_draft_at := null;
    new.review_verdict := null;
    new.review_summary := null;
    new.review_price := null;
    new.review_plan := null;
    new.review_clinic := null;
    new.review_questions := null;
    new.reviewed_by := null;
    new.answered_at := null;
  end if;
  return new;
end;
$$;

create trigger cases_guard_insert
  before insert on public.cases
  for each row execute function public.guard_case_insert();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles         enable row level security;
alter table public.reference_prices enable row level security;
alter table public.clinic_reviews   enable row level security;
alter table public.cases            enable row level security;
alter table public.case_items       enable row level security;
alter table public.case_files       enable row level security;
alter table public.case_messages    enable row level security;
alter table public.case_access_log  enable row level security;

-- profiles
create policy "profiles: read own or dentist" on public.profiles
  for select using (id = auth.uid() or public.is_dentist());
create policy "profiles: update own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- reference_prices: public read (the open price checker uses it), dentist write
create policy "reference_prices: public read" on public.reference_prices
  for select using (true);
create policy "reference_prices: dentist write" on public.reference_prices
  for all using (public.is_dentist()) with check (public.is_dentist());

-- clinic_reviews: dentist manages; patients see reviews of clinics on their own cases
create policy "clinic_reviews: dentist all" on public.clinic_reviews
  for all using (public.is_dentist()) with check (public.is_dentist());
create policy "clinic_reviews: patient reads own clinics" on public.clinic_reviews
  for select using (
    exists (
      select 1 from public.cases c
      where c.patient_id = auth.uid()
        and c.clinic_org_number = clinic_reviews.org_number
        and c.status in ('besvarat', 'avslutat')
    )
  );

-- cases
create policy "cases: patient reads own" on public.cases
  for select using (patient_id = auth.uid());
create policy "cases: patient creates own" on public.cases
  for insert with check (patient_id = auth.uid());
create policy "cases: patient updates own" on public.cases
  for update using (patient_id = auth.uid()) with check (patient_id = auth.uid());
create policy "cases: dentist reads all" on public.cases
  for select using (public.is_dentist());
create policy "cases: dentist updates all" on public.cases
  for update using (public.is_dentist()) with check (public.is_dentist());

-- case_items
create policy "case_items: read" on public.case_items
  for select using (public.owns_case(case_id) or public.is_dentist());
create policy "case_items: patient writes while open" on public.case_items
  for all using (public.owns_case(case_id) and public.case_is_open(case_id))
  with check (public.owns_case(case_id) and public.case_is_open(case_id));
create policy "case_items: dentist writes" on public.case_items
  for all using (public.is_dentist()) with check (public.is_dentist());

-- case_files
create policy "case_files: read" on public.case_files
  for select using (public.owns_case(case_id) or public.is_dentist());
create policy "case_files: patient adds while open" on public.case_files
  for insert with check (public.owns_case(case_id) and public.case_is_open(case_id));
create policy "case_files: patient deletes while open" on public.case_files
  for delete using (public.owns_case(case_id) and public.case_is_open(case_id));

-- case_messages
create policy "case_messages: read" on public.case_messages
  for select using (public.owns_case(case_id) or public.is_dentist());
create policy "case_messages: write" on public.case_messages
  for insert with check (
    author_id = auth.uid() and (public.owns_case(case_id) or public.is_dentist())
  );

-- case_access_log: dentist reads; anyone with access to the case can append
create policy "case_access_log: dentist reads" on public.case_access_log
  for select using (public.is_dentist());
create policy "case_access_log: append" on public.case_access_log
  for insert with check (
    profile_id = auth.uid() and (public.owns_case(case_id) or public.is_dentist())
  );

-- ============================================================
-- STORAGE — private bucket, one folder per patient: {patient_id}/{case_id}/file
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit)
values ('case-files', 'case-files', false, 20971520)
on conflict (id) do nothing;

create policy "case-files: patient uploads to own folder" on storage.objects
  for insert with check (
    bucket_id = 'case-files' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "case-files: patient reads own folder" on storage.objects
  for select using (
    bucket_id = 'case-files' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "case-files: patient deletes own folder" on storage.objects
  for delete using (
    bucket_id = 'case-files' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "case-files: dentist reads all" on storage.objects
  for select using (bucket_id = 'case-files' and public.is_dentist());

-- ============================================================
-- SEED — TLV referenspriser 2026 (allmän / specialist), the subset
-- verified against TLV's list and regional taxa when this migration was
-- written. Import the full list before launch (see SETUP.md).
-- ============================================================
insert into public.reference_prices (code, description, price_general, price_specialist, valid_year) values
  ('101', 'Basundersökning, utförd av tandläkare',                                   1100, 1100, 2026),
  ('103', 'Kvalificerat rådgivande samtal vid sjukdoms- eller smärttillstånd, video',   480,  480, 2026),
  ('301', 'Sjukdomsbehandlande åtgärd, mindre omfattande',                             450, null, 2026),
  ('302', 'Sjukdomsbehandlande åtgärd',                                                840, null, 2026),
  ('303', 'Sjukdomsbehandlande åtgärd, mer omfattande',                               1245, null, 2026),
  ('362', 'Sedering med lustgas, per behandlingstillfälle',                           1025, null, 2026),
  ('401', 'Tanduttagning, en tand',                                                   1280, 1670, 2026),
  ('402', 'Tanduttagning när separation eller friläggning krävs, en tand',            1820, 2380, 2026),
  ('403', 'Tanduttagning, enkel',                                                      510,  660, 2026),
  ('501', 'Rensning och rotfyllning, en rotkanal',                                    4105, null, 2026),
  ('800', 'Permanent tandstödd krona, en per käke',                                   6825, null, 2026);
