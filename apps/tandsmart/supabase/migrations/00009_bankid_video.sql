-- ============================================================
-- TANDSMART — BankID identity and video consultations
--
-- profiles get a BankID-verified personnummer. Only the server (service
-- role, after verifying the e-ID broker's signed ID token) may set it.
--
-- video_meetings: a consultation the dentist books on a case, hosted by
-- Whereby (EU). Patients join only when signed in with BankID and after
-- consenting to the recording. video_recordings lists the recordings, which
-- stay in Whereby's EU storage and are streamed through short-lived links.
-- ============================================================

alter table public.profiles
  add column personnummer        text,
  add column bankid_name         text,
  add column bankid_verified_at  timestamptz;
create unique index profiles_personnummer_key on public.profiles(personnummer) where personnummer is not null;

-- Users may edit their own name/phone/birth year, never their role or identity.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;
  if new.role is distinct from old.role then
    raise exception 'role can only be changed by an administrator';
  end if;
  if new.personnummer is distinct from old.personnummer
     or new.bankid_name is distinct from old.bankid_name
     or new.bankid_verified_at is distinct from old.bankid_verified_at then
    raise exception 'identity fields are set by BankID verification only';
  end if;
  return new;
end;
$$;

create table public.video_meetings (
  id                    uuid primary key default gen_random_uuid(),
  case_id               uuid not null references public.cases(id) on delete cascade,
  patient_id            uuid not null references public.profiles(id) on delete cascade,
  created_by            uuid not null references public.profiles(id),
  scheduled_at          timestamptz not null,
  duration_minutes      int not null default 20 check (duration_minutes between 5 and 120),
  status                text not null default 'bokad' check (status in ('bokad', 'genomford', 'avbokad')),
  whereby_meeting_id    text not null,
  room_name             text not null,
  room_url              text not null,       -- patient's link
  host_room_url         text not null,       -- dentist's link (can start recording)
  recording_consent_at  timestamptz,         -- patient agreed to the recording
  created_at            timestamptz not null default now()
);
create index video_meetings_case_idx on public.video_meetings(case_id);
create index video_meetings_patient_idx on public.video_meetings(patient_id);
create index video_meetings_created_by_idx on public.video_meetings(created_by);

create table public.video_recordings (
  id                     uuid primary key default gen_random_uuid(),
  meeting_id             uuid not null references public.video_meetings(id) on delete cascade,
  whereby_recording_id   text not null unique,
  started_at             timestamptz,
  ended_at               timestamptz,
  created_at             timestamptz not null default now()
);
create index video_recordings_meeting_idx on public.video_recordings(meeting_id);

alter table public.video_meetings   enable row level security;
alter table public.video_recordings enable row level security;

-- Read-only for clients; all writes go through server routes that check the
-- caller (dentist booking, patient consent) and use the service role.
create policy "video_meetings: select" on public.video_meetings for select to authenticated
  using (patient_id = (select auth.uid()) or (select public.is_dentist()));
create policy "video_recordings: select" on public.video_recordings for select to authenticated
  using (exists (
    select 1 from public.video_meetings m
    where m.id = meeting_id and (m.patient_id = (select auth.uid()) or (select public.is_dentist()))
  ));
