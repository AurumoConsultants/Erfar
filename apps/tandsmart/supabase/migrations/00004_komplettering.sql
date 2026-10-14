-- ============================================================
-- TANDSMART — Requests for more material (komplettering)
--
-- The dentist can ask the patient for more material (röntgen, journal
-- extracts, photos). The case moves to status 'komplettering', the patient
-- may upload files while it is there, and submit_complement() hands the
-- case back to the dentist as 'under_granskning'.
--
-- New enum values can't be used as literals in the same transaction they
-- are added in, so everything below compares status::text.
-- ============================================================

alter type public.case_status    add value if not exists 'komplettering' after 'under_granskning';
alter type public.case_file_kind add value if not exists 'journal' after 'rontgen';

alter table public.cases
  add column info_request       text,
  add column info_requested_at  timestamptz,
  add column info_answered_at   timestamptz;

-- Patients may add files while the case is new or awaiting their complement.
create or replace function public.case_accepts_uploads(p_case_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.cases
    where id = p_case_id and status::text in ('inskickat', 'komplettering')
  )
$$;
revoke execute on function public.case_accepts_uploads(uuid) from public, anon;
grant  execute on function public.case_accepts_uploads(uuid) to authenticated;

drop policy "case_files: insert while open" on public.case_files;
create policy "case_files: insert while open" on public.case_files for insert to authenticated
  with check (public.owns_case(case_id) and public.case_accepts_uploads(case_id));

-- The guard trigger stops patients changing status or info_* columns;
-- submit_complement() is the one sanctioned path and flags itself.
create or replace function public.guard_case_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  if auth.role() = 'service_role'
     or public.is_dentist()
     or current_setting('tandsmart.complement', true) = 'on' then
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
     or new.answered_at    is distinct from old.answered_at
     or new.info_request   is distinct from old.info_request
     or new.info_requested_at is distinct from old.info_requested_at
     or new.info_answered_at  is distinct from old.info_answered_at then
    raise exception 'only the reviewing dentist can change these fields';
  end if;
  return new;
end;
$$;

create or replace function public.guard_case_insert()
returns trigger
language plpgsql
set search_path = public
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
    new.info_request := null;
    new.info_requested_at := null;
    new.info_answered_at := null;
  end if;
  return new;
end;
$$;

-- Patient hands the case back after uploading. An optional comment is
-- stored as a case message so it shows up in the dialogue.
create or replace function public.submit_complement(p_case_id uuid, p_comment text default null)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not exists (
    select 1 from public.cases
    where id = p_case_id and patient_id = auth.uid() and status::text = 'komplettering'
  ) then
    raise exception 'no pending request for more material on this case';
  end if;

  perform set_config('tandsmart.complement', 'on', true);
  update public.cases
     set status = 'under_granskning', info_answered_at = now()
   where id = p_case_id;

  if nullif(trim(coalesce(p_comment, '')), '') is not null then
    insert into public.case_messages (case_id, author_id, body)
    values (p_case_id, auth.uid(), left(trim(p_comment), 5000));
  end if;
end;
$$;
revoke execute on function public.submit_complement(uuid, text) from public, anon;
grant  execute on function public.submit_complement(uuid, text) to authenticated;
