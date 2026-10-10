-- ============================================================
-- TANDSMART — Unread messages
--
-- Each viewer's "read up to" mark per case. A message is unread for a
-- viewer when someone else wrote it after that mark. The dentist's case
-- page moves the mark when it is opened; the review queue badges and
-- filters cases with unread messages.
-- ============================================================

create table public.case_message_reads (
  case_id       uuid not null references public.cases(id) on delete cascade,
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  last_read_at  timestamptz not null default now(),
  primary key (case_id, profile_id)
);
create index case_message_reads_profile_idx on public.case_message_reads(profile_id);

alter table public.case_message_reads enable row level security;

create policy "case_message_reads: select own" on public.case_message_reads for select to authenticated
  using (profile_id = (select auth.uid()));
create policy "case_message_reads: insert own" on public.case_message_reads for insert to authenticated
  with check (profile_id = (select auth.uid()) and (public.owns_case(case_id) or (select public.is_dentist())));
create policy "case_message_reads: update own" on public.case_message_reads for update to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()) and (public.owns_case(case_id) or (select public.is_dentist())));

-- Unread message count per case for the calling user. Security invoker,
-- so RLS on case_messages limits it to cases the caller may see.
create or replace function public.unread_message_counts()
returns table (case_id uuid, unread int)
language sql stable security invoker set search_path = public
as $$
  select m.case_id, count(*)::int
  from public.case_messages m
  left join public.case_message_reads r
    on r.case_id = m.case_id and r.profile_id = (select auth.uid())
  where m.author_id <> (select auth.uid())
    and m.created_at > coalesce(r.last_read_at, '-infinity'::timestamptz)
  group by m.case_id
$$;
revoke execute on function public.unread_message_counts() from public, anon;
grant  execute on function public.unread_message_counts() to authenticated;

-- Start the dentist's marks at their last recorded view of each case, so
-- messages they have already seen don't all show up as unread.
insert into public.case_message_reads (case_id, profile_id, last_read_at)
select l.case_id, l.profile_id, max(l.created_at)
from public.case_access_log l
join public.profiles p on p.id = l.profile_id and p.role = 'tandlakare'
group by l.case_id, l.profile_id
on conflict do nothing;
