# Tandsmart — Setup

Tandsmart is an independent second-opinion service for dental patients: they
upload a prisförslag / vårdplan from their clinic, get an instant comparison
against TLV's referenspriser and their tandvårdsstöd, and Sylvia (leg.
tandläkare) personally reviews the case — price, treatment plan and clinic
(economy, IVO, reputation) — and answers in writing.

It lives in this monorepo for convenience but shares **nothing** with Erfar at
runtime: own Supabase project, own deploy, own env.

## 1. Supabase (separate project, Stockholm region)

1. Create a new Supabase project, region **North EU (Stockholm), `eu-north-1`** — this app stores
   health data, and the Vercel functions run in Stockholm (`arn1`) too, so data stays in Sweden.
2. SQL Editor → run `apps/tandsmart/supabase/migrations/00001_tandsmart_schema.sql`.
   It creates tables, RLS, the private `case-files` storage bucket and a verified
   subset of 2026 referenspriser.
3. Auth → URL configuration: set the site URL to the deployed domain.

## 2. Environment

`cp apps/tandsmart/.env.example apps/tandsmart/.env.local` and fill in. Only the
three Supabase values are required; email, AI and company lookup are optional.

## 3. Run

```bash
pnpm install
pnpm --filter tandsmart dev          # http://localhost:3040
pnpm --filter tandsmart test         # pricing / tandvårdsstöd unit tests
```

## 4. Deploy (Vercel)

The Vercel project `tandsmart` (team Aurumo Consultants) builds this app from the same repo:
root directory `apps/tandsmart`, function region **Stockholm (`arn1`)**, unaffected-project builds
skipped, so Erfar and Tandsmart only rebuild when their own code changes. Add the variables from
`.env.example` under Settings → Environment Variables before the first production deploy —
`NEXT_PUBLIC_*` values are inlined at build time.

## 5. First-time data

```bash
# Sylvia's reviewer account
pnpm --filter tandsmart create-dentist sylvia@example.se 'lösenord' 'Sylvia Efternamn'

# Full TLV referensprislista (download the xlsx from tlv.se/tandvard/referenspriser.html)
pnpm --filter tandsmart import-referenspriser ~/Downloads/referenspriser-2026.xlsx 2026
```

Re-import every January when TLV publishes the new list.

## 6. How it works

| Who | Where | What |
|---|---|---|
| Anyone | `/snabbkoll` | Free price check: codes + prices → comparison with referenspris and estimated högkostnadsskydd / tiotandvård. No account. |
| Patient | `/arenden/nytt` | Creates a case: services (pris / vårdplan / klinik), situation, questions, clinic + org.nr, uploads, line items. |
| Patient | `/arenden/[id]` | Status, automatic price comparison, Sylvia's published answer, message thread. |
| Sylvia | `/granskning` | Queue of open cases, oldest first, red after 3 days. |
| Sylvia | `/granskning/[id]` | AI pre-analysis (optional), review form, publish, clinic review with source links, messages. |
| Sylvia | `/granskning/referenspriser` | Edit the reference price table. |

- **Pricing** (`src/lib/pricing.ts`): the subsidy is computed on min(clinic price, referenspris);
  högkostnadsskydd pays 50 % between 3 000–15 000 kr and 85 % above; 67+ pays 10 % of the
  referenspris (tiotandvården 2026). Thresholds are constants — check them every January.
- **AI pre-analysis** (`src/lib/ai/draftReview.ts`): Claude reads the uploaded PDFs/photos and the
  case, and returns a structured draft (verdict, price assessment, plan suggestions, questions,
  uncertainties, extracted line items). Only Sylvia sees it; nothing reaches the patient until she
  publishes. Off unless `TANDSMART_AI_ENABLED=true`.
- **Clinic reviews** are stored per org number and reused across every case at that clinic.
  Patients see a clinic review only on their own answered cases.
- **Security**: RLS everywhere; triggers stop patients editing review fields, editing a case after
  review has started, or promoting themselves; every case view is written to `case_access_log`.

## 7. Before launch — not code, but required

- **Vårdgivare**: giving second opinions as leg. tandläkare is hälso- och sjukvård → register the
  business in IVO's vårdgivarregister, take out patientförsäkring, and keep journals under
  patientdatalagen (this app's case + answer + access log is a start, not a certified journal system).
- **GDPR**: health data needs explicit consent (collected at signup), a DPIA, and DPAs with Supabase,
  Resend and — if AI is enabled — Anthropic. Have `/integritet` reviewed.
- **Login**: consider BankID before scaling — stronger identity for health data, and lets you
  journal under personnummer.
- **Payment**: not implemented (Stripe / Swish per case, or subscription).
