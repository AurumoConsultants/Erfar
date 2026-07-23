# Design language

Shared with Procere, Windowa, and Reditus — same component shapes,
different accent color per product (Erfar = orange, the primary CTA
color; navy/blue-* is used for nav-active-state text and secondary
emphasis, not buttons).

- **Tokens**: `apps/web/src/app/globals.css` — full `orange-*` and
  `blue-*` scales, plus an `accent-*` alias pointing at `orange-*`. Shared
  components use `accent-*` only, so the exact same component code works
  unmodified in the other three repos.
- **Primitives**: `apps/web/src/components/ui/` — `Button`, `Card`,
  `Badge`, `Field`, `Toast`, plus `TagWizard`/`TagTree` (Erfar-specific,
  not shared — the DB-backed taxonomy picker).
- **Reference page**: `(app)/dashboard/page.tsx` shows the pattern — stat
  tiles and project list as `Card`.
- Most existing pages haven't been migrated yet — do it opportunistically
  when touching a page for other reasons, not as a dedicated pass.
