-- ============================================================
-- TANDSMART — Clinic requests require BankID
--
-- A clinic may only be asked to release journal/röntgen when the patient
-- is signed in with BankID. The request records when and as whom, and the
-- clinic's link page shows it. Patients can no longer insert requests
-- directly: the server route checks the BankID session and inserts with
-- the service role, so the BankID fields can't be forged.
-- ============================================================

alter table public.clinic_requests
  add column bankid_verified_at  timestamptz,
  add column bankid_name         text;

drop policy "clinic_requests: patient creates" on public.clinic_requests;
