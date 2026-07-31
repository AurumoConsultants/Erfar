-- ============================================================
-- ERFAR — Procere integration (push-only): a lesson pushed in via the
-- new /api/integrations/procere/lessons route has no real Erfar user to
-- attribute it to. Rather than fabricate a fake account, created_by
-- becomes nullable and two provenance columns record where it came from.
-- ============================================================

alter table public.lessons alter column created_by drop not null;

alter table public.lessons add column external_source text
  check (external_source is null or external_source = 'procere');

-- Free-text name/email of whoever triggered the send on the source
-- system's side — display-only, not a real profiles reference.
alter table public.lessons add column external_submitted_by text;
