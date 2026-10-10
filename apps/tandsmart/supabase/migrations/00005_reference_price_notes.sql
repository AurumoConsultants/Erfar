-- ============================================================
-- TANDSMART — Plain-language explanation per åtgärdskod
-- Written by the reviewing dentist in the Referenspriser editor and shown
-- on the public price pages (/priser/[kod]). Optional.
-- ============================================================
alter table public.reference_prices add column if not exists patient_note text;
