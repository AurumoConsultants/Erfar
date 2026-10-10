-- ============================================================
-- TANDSMART — RLS hardening & performance (Supabase advisors)
--
-- - Policies are scoped `to authenticated` (only reference_prices is
--   readable by anon), so the security-definer helpers never need to be
--   executable by anon.
-- - auth.uid() / helper calls are wrapped in (select …) so Postgres
--   evaluates them once per statement instead of once per row.
-- - One permissive policy per table and action instead of overlapping ones.
-- - Fixed search_path on trigger functions, indexes on foreign keys.
-- ============================================================

-- ---------- functions ----------
alter function public.guard_profile_update() set search_path = public;
alter function public.guard_case_update()    set search_path = public;
alter function public.guard_case_insert()    set search_path = public;

-- Trigger-only: nobody calls it over the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Used inside RLS policies, so signed-in users must be able to execute them.
revoke execute on function public.is_dentist()            from public, anon;
revoke execute on function public.owns_case(uuid)         from public, anon;
revoke execute on function public.case_is_open(uuid)      from public, anon;
grant  execute on function public.is_dentist()            to authenticated;
grant  execute on function public.owns_case(uuid)         to authenticated;
grant  execute on function public.case_is_open(uuid)      to authenticated;

-- ---------- drop the original policies ----------
drop policy "profiles: read own or dentist"             on public.profiles;
drop policy "profiles: update own"                      on public.profiles;
drop policy "reference_prices: public read"             on public.reference_prices;
drop policy "reference_prices: dentist write"           on public.reference_prices;
drop policy "clinic_reviews: dentist all"               on public.clinic_reviews;
drop policy "clinic_reviews: patient reads own clinics" on public.clinic_reviews;
drop policy "cases: patient reads own"                  on public.cases;
drop policy "cases: patient creates own"                on public.cases;
drop policy "cases: patient updates own"                on public.cases;
drop policy "cases: dentist reads all"                  on public.cases;
drop policy "cases: dentist updates all"                on public.cases;
drop policy "case_items: read"                          on public.case_items;
drop policy "case_items: patient writes while open"     on public.case_items;
drop policy "case_items: dentist writes"                on public.case_items;
drop policy "case_files: read"                          on public.case_files;
drop policy "case_files: patient adds while open"       on public.case_files;
drop policy "case_files: patient deletes while open"    on public.case_files;
drop policy "case_messages: read"                       on public.case_messages;
drop policy "case_messages: write"                      on public.case_messages;
drop policy "case_access_log: dentist reads"            on public.case_access_log;
drop policy "case_access_log: append"                   on public.case_access_log;
drop policy "case-files: patient uploads to own folder" on storage.objects;
drop policy "case-files: patient reads own folder"      on storage.objects;
drop policy "case-files: patient deletes own folder"    on storage.objects;
drop policy "case-files: dentist reads all"             on storage.objects;

-- ---------- profiles ----------
create policy "profiles: select" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_dentist()));
create policy "profiles: update own" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- ---------- reference_prices: public read, dentist write ----------
create policy "reference_prices: select" on public.reference_prices for select to anon, authenticated
  using (true);
create policy "reference_prices: insert" on public.reference_prices for insert to authenticated
  with check ((select public.is_dentist()));
create policy "reference_prices: update" on public.reference_prices for update to authenticated
  using ((select public.is_dentist())) with check ((select public.is_dentist()));
create policy "reference_prices: delete" on public.reference_prices for delete to authenticated
  using ((select public.is_dentist()));

-- ---------- clinic_reviews ----------
create policy "clinic_reviews: select" on public.clinic_reviews for select to authenticated
  using (
    (select public.is_dentist())
    or exists (
      select 1 from public.cases c
      where c.patient_id = (select auth.uid())
        and c.clinic_org_number = clinic_reviews.org_number
        and c.status in ('besvarat', 'avslutat')
    )
  );
create policy "clinic_reviews: insert" on public.clinic_reviews for insert to authenticated
  with check ((select public.is_dentist()));
create policy "clinic_reviews: update" on public.clinic_reviews for update to authenticated
  using ((select public.is_dentist())) with check ((select public.is_dentist()));
create policy "clinic_reviews: delete" on public.clinic_reviews for delete to authenticated
  using ((select public.is_dentist()));

-- ---------- cases ----------
create policy "cases: select" on public.cases for select to authenticated
  using (patient_id = (select auth.uid()) or (select public.is_dentist()));
create policy "cases: insert own" on public.cases for insert to authenticated
  with check (patient_id = (select auth.uid()));
create policy "cases: update" on public.cases for update to authenticated
  using (patient_id = (select auth.uid()) or (select public.is_dentist()))
  with check (patient_id = (select auth.uid()) or (select public.is_dentist()));

-- ---------- case_items ----------
create policy "case_items: select" on public.case_items for select to authenticated
  using (public.owns_case(case_id) or (select public.is_dentist()));
create policy "case_items: insert" on public.case_items for insert to authenticated
  with check ((select public.is_dentist()) or (public.owns_case(case_id) and public.case_is_open(case_id)));
create policy "case_items: update" on public.case_items for update to authenticated
  using ((select public.is_dentist()) or (public.owns_case(case_id) and public.case_is_open(case_id)))
  with check ((select public.is_dentist()) or (public.owns_case(case_id) and public.case_is_open(case_id)));
create policy "case_items: delete" on public.case_items for delete to authenticated
  using ((select public.is_dentist()) or (public.owns_case(case_id) and public.case_is_open(case_id)));

-- ---------- case_files ----------
create policy "case_files: select" on public.case_files for select to authenticated
  using (public.owns_case(case_id) or (select public.is_dentist()));
create policy "case_files: insert while open" on public.case_files for insert to authenticated
  with check (public.owns_case(case_id) and public.case_is_open(case_id));
create policy "case_files: delete while open" on public.case_files for delete to authenticated
  using (public.owns_case(case_id) and public.case_is_open(case_id));

-- ---------- case_messages ----------
create policy "case_messages: select" on public.case_messages for select to authenticated
  using (public.owns_case(case_id) or (select public.is_dentist()));
create policy "case_messages: insert" on public.case_messages for insert to authenticated
  with check (author_id = (select auth.uid()) and (public.owns_case(case_id) or (select public.is_dentist())));

-- ---------- case_access_log ----------
create policy "case_access_log: select" on public.case_access_log for select to authenticated
  using ((select public.is_dentist()));
create policy "case_access_log: insert" on public.case_access_log for insert to authenticated
  with check (profile_id = (select auth.uid()) and (public.owns_case(case_id) or (select public.is_dentist())));

-- ---------- storage: bucket case-files, folder {patient_id}/{case_id}/file ----------
create policy "case-files: select" on storage.objects for select to authenticated
  using (
    bucket_id = 'case-files'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_dentist()))
  );
create policy "case-files: insert own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'case-files' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "case-files: delete own folder" on storage.objects for delete to authenticated
  using (bucket_id = 'case-files' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ---------- indexes on foreign keys ----------
create index if not exists case_access_log_case_idx    on public.case_access_log(case_id);
create index if not exists case_access_log_profile_idx on public.case_access_log(profile_id);
create index if not exists case_files_case_idx         on public.case_files(case_id);
create index if not exists case_messages_author_idx    on public.case_messages(author_id);
create index if not exists cases_reviewed_by_idx       on public.cases(reviewed_by);
create index if not exists clinic_reviews_reviewed_by_idx on public.clinic_reviews(reviewed_by);
