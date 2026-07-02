# Erfar — Setup Guide

Erfar ("lessons learned") is a central, searchable knowledge base of lessons learned from
construction projects — built to help plan future projects better.

## 1. Supabase Setup

1. Go to https://supabase.com and create a new project
2. **Region: West EU (Ireland)** — GDPR-compliant EU data residency
3. Once the project is ready, go to **SQL Editor**
4. Copy and run the contents of `supabase/migrations/00001_initial_schema.sql`
5. Go to **Project Settings → API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key (keep private)

## 2. Web App (.env.local)

Create `apps/web/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 3. Mobile App (.env)

Create `apps/mobile/.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 4. Install & Run

```bash
# Install all dependencies (run from repo root)
pnpm install

# Run web app (http://localhost:3000)
pnpm dev:web

# Run mobile app (Expo Go / simulator)
pnpm dev:mobile
```

## 5. First Use — Workflow

1. **Client registers** at `/auth/signup` — creates a company account
2. **Client creates a project** at `/projects/new`
3. **Client invites people** from a project's `/projects/[id]/members` page (entrepreneur, or a
   spectator scoped to just that project), or from `/company/viewers` for a company-wide spectator
4. **Invitee accepts** via the emailed `/invite/[token]` link — creates an account or logs in, and
   is linked to the project (or the whole company, for a company-wide spectator)
5. **Client or entrepreneur logs lessons** on a project: a challenge (⚠️) or a success (✅), with a
   title, description, freeform tags, and optional photos
6. **Everyone with access searches the knowledge base** at `/knowledge-base` — across all of a
   company's past projects, filterable by type, tag, project, and free text
7. **Reports** are generated per project at `/reports/[projectId]` — export to PDF or Excel

## 6. Roles

| Role | Can do |
|------|--------|
| **Client** (Beställare) | Owns the company account, creates projects, invites entrepreneurs and spectators, logs lessons, reads reports |
| **Entrepreneur** (Entreprenör) | Invited to a specific project, logs lessons on that project, reads reports |
| **Spectator** (Åskådare) | Read-only. Either invited to a single project, or granted company-wide read access across all of a company's projects — cannot log lessons |

## 7. Lessons

Each lesson belongs to one project and is classified as either a **challenge** (⚠️, something that
went wrong) or a **success** (✅, something that went well). Lessons carry freeform tags — not a
fixed category list — so the knowledge base grows organically and stays searchable across every
past project, which is the core value of Erfar.

## 8. Mobile App — Publishing

Install Expo CLI and EAS:
```bash
npm install -g eas-cli
eas login
eas build --platform all
```

## 9. Email Invitations (Production)

Invitation links are currently copy-and-share (no email is sent automatically). To send them by
email, add a Supabase Edge Function under `supabase/functions/send-invitation/`:
- Use the `invitations.token` to build the URL: `https://your-domain.com/invite/[token]`
- Send via Resend, SendGrid, or Supabase's built-in email

---

**GDPR / Swedish regulations:**
- All data stored in EU West (Ireland) region
- Supabase is GDPR-compliant with a Data Processing Agreement (DPA) available
- Row Level Security (RLS) ensures companies can only access their own data
