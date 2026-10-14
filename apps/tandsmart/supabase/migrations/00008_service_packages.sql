-- ============================================================
-- TANDSMART — Service packages
--
-- The patient now picks one package plus optional add-ons:
--   Prisbedömning              → {pris}
--   Second opinion             → {pris, vardplan}
--   Second opinion, omfattande → {pris, vardplan, omfattande}
--   + Klinikkoll               → klinik
--   + Videosamtal              → video
-- Existing values keep their meaning, so reviews and old cases are unaffected.
-- ============================================================

alter type public.case_service add value if not exists 'omfattande';
alter type public.case_service add value if not exists 'video';
