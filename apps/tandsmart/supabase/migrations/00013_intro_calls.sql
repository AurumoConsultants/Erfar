-- ============================================================
-- TANDSMART — Free 5-minute intro calls ("startsamtal")
--
-- Doktor Sylvia opens bookable times (Mon–Fri 08–17); a patient books one
-- and gets a Whereby room. All reads and writes go through server routes
-- with the service role (RLS on, no policies), so room links and other
-- patients' bookings are never exposed to clients.
-- ============================================================

create table public.intro_call_slots (
  id                   uuid primary key default gen_random_uuid(),
  starts_at            timestamptz not null unique,
  duration_minutes     int not null default 5,
  created_by           uuid not null references public.profiles(id),
  booked_by            uuid references public.profiles(id) on delete set null,
  booked_at            timestamptz,
  whereby_meeting_id   text,
  room_url             text,
  host_room_url        text,
  created_at           timestamptz not null default now()
);
create index intro_call_slots_booked_by_idx on public.intro_call_slots(booked_by);
-- At most one booking per patient at a time is enforced in the booking route.

alter table public.intro_call_slots enable row level security;
