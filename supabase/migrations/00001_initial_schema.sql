-- ============================================================
-- ERFAR — Initial Schema
-- Lessons-learned knowledge base for construction projects
-- GDPR-compliant, EU West (Ireland) region
-- ============================================================

-- Enable UUID / crypto extension
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
create type public.user_role as enum ('client', 'entrepreneur', 'spectator', 'konsult', 'mobil_anvandare');
create type public.project_status as enum ('active', 'completed', 'archived');
create type public.lesson_type as enum ('challenge', 'success');
create type public.invite_role as enum ('entrepreneur', 'spectator_project', 'spectator_company', 'konsult', 'mobil_anvandare');
create type public.member_role as enum ('entrepreneur', 'spectator', 'konsult');
create type public.project_category_type as enum ('nybyggnation', 'renovering', 'service');
-- Same four subtypes apply under every category_type.
create type public.project_category_subtype as enum ('bostader', 'kontor', 'lokaler', 'ovrigt');
-- "Upphandlingsform" — how the contract work is split between entrepreneurs.
create type public.procurement_form as enum ('generalentreprenad', 'delad_entreprenad');
-- "Entreprenadform" — which standard contract the project is run under.
create type public.contract_form as enum ('totalentreprenad_abt06', 'utforandeentreprenad_ab04', 'partnering');
-- "Var i byggprocessen" — which phase of the construction process a lesson relates to.
create type public.construction_phase as enum ('idea_stage', 'early_stages', 'design', 'execution', 'management');
-- 'entreprenor' companies are created automatically the first time someone
-- accepts an 'entrepreneur' invite as a brand-new user — a persistent,
-- reusable organization that later invited mobila användare join by company_id.
create type public.account_type as enum ('private_company', 'kommun', 'entreprenor');

-- ============================================================
-- COMPANIES (tenants, owned by a client)
-- For account_type 'kommun', `name`/`org_number` describe the kommunala
-- bolaget being registered, and `kommun` records which municipality it
-- belongs to.
-- ============================================================
create table public.companies (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  org_number   text,
  account_type public.account_type not null default 'private_company',
  kommun       text,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- PROFILES (one per auth.users row)
-- For 'client' role, company_id is the company they own.
-- For 'entrepreneur'/'spectator', company_id is null — their
-- access comes entirely from project_members / company_viewers rows.
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  company_id  uuid references public.companies(id) on delete set null,
  full_name   text not null,
  email       text not null,
  role        public.user_role not null default 'client',
  -- Orthogonal to `role`: grants access to /admin regardless of company/role.
  -- Admin accounts have no company and bypass RLS via the service-role client.
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- PROJECTS — always owned by exactly one client company
-- ============================================================
create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  name        text not null,
  description text,
  location    text,
  start_date  date,
  end_date    date,
  status      public.project_status not null default 'active',
  category_type    public.project_category_type not null,
  category_subtype public.project_category_subtype not null,
  procurement_form public.procurement_form not null,
  contract_form    public.contract_form not null,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- PROJECT MEMBERS — project-scoped access
-- (entrepreneurs, and spectators invited to a single project)
-- ============================================================
create table public.project_members (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  role        public.member_role not null,
  created_at  timestamptz not null default now(),
  unique (project_id, profile_id)
);

-- ============================================================
-- COMPANY VIEWERS — company-wide read access
-- (spectators granted access to all of a company's projects)
-- ============================================================
create table public.company_viewers (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (company_id, profile_id)
);

-- ============================================================
-- INVITATIONS — token-based, covers entrepreneur, project-scoped
-- spectator, and company-wide spectator invites
-- ============================================================
create table public.invitations (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  project_id  uuid references public.projects(id) on delete cascade, -- null for company-wide spectator invites
  email       text not null,
  role        public.invite_role not null,
  token       text not null unique default encode(gen_random_bytes(32), 'hex'),
  invited_by  uuid references public.profiles(id) on delete set null,
  accepted_at timestamptz,
  expires_at  timestamptz not null default (now() + interval '14 days'),
  created_at  timestamptz not null default now(),
  constraint invitations_project_role_check check (
    (role in ('spectator_company', 'mobil_anvandare') and project_id is null)
    or (role in ('entrepreneur', 'spectator_project', 'konsult') and project_id is not null)
  )
);

-- ============================================================
-- LESSONS (core entity)
-- ============================================================
create table public.lessons (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  type        public.lesson_type not null,
  construction_phase public.construction_phase not null,
  title       text not null,
  description text,
  -- Optional contact info so a future reader of the lesson can follow up.
  contact_phone text,
  contact_email text,
  created_by  uuid not null references public.profiles(id) on delete set null,
  -- Set together, only via public.submit_lesson_review() — filled in during the
  -- periodic review meeting, not at logging time. `solution` is only meaningful
  -- for type='challenge' lessons; left null for 'success'.
  reviewed_at   timestamptz,
  reviewed_by   uuid references public.profiles(id) on delete set null,
  review_notes  text,
  solution      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index lessons_project_id_idx on public.lessons(project_id);
create index lessons_type_idx on public.lessons(type);
create index lessons_created_at_idx on public.lessons(created_at desc);

-- Full text search across title + description for the knowledge-base free-text search
alter table public.lessons add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('swedish', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('swedish', coalesce(description, '')), 'B')
  ) stored;
create index lessons_search_idx on public.lessons using gin(search_vector);

-- ============================================================
-- TAGS — freeform, namespaced per company.
-- `kind` distinguishes plain freeform tags from the two structured
-- lesson-logging taxonomies (byggmoment / byggdel), which reuse this same
-- extensible-per-company table rather than duplicating it three times.
-- ============================================================
create type public.tag_kind as enum ('tag', 'work_type', 'building_part');

create table public.tags (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  kind        public.tag_kind not null default 'tag',
  name        text not null,
  created_at  timestamptz not null default now(),
  unique (company_id, kind, name)
);

-- Structured 2-level category (byggmoment / byggdel) for a lesson, each a
-- public.tags row with the matching `kind`. Added here (after `tags` exists)
-- rather than inline on the lessons table above, to avoid a forward
-- reference on fresh installs. Nullable so the simpler mobile-app logging
-- flow (which doesn't collect these) keeps working.
alter table public.lessons add column work_type_id uuid references public.tags(id) on delete set null;
alter table public.lessons add column building_part_id uuid references public.tags(id) on delete set null;

create table public.lesson_tags (
  lesson_id   uuid not null references public.lessons(id) on delete cascade,
  tag_id      uuid not null references public.tags(id) on delete cascade,
  primary key (lesson_id, tag_id)
);
create index lesson_tags_tag_id_idx on public.lesson_tags(tag_id);

-- Freeform tags describing what a project is about (set at creation, editable
-- after). This — not category_type/category_subtype/procurement_form/
-- contract_form — is the primary matching key for "Liknande lärdomar"; those
-- other fields are general information, only used to filter results.
create table public.project_tags (
  project_id  uuid not null references public.projects(id) on delete cascade,
  tag_id      uuid not null references public.tags(id) on delete cascade,
  primary key (project_id, tag_id)
);
create index project_tags_tag_id_idx on public.project_tags(tag_id);

-- ============================================================
-- LESSON IMAGES (photos and videos — name kept for historical continuity
-- with the storage bucket / RLS policies below, which are path-based and
-- agnostic to file type)
-- ============================================================
create table public.lesson_images (
  id            uuid primary key default gen_random_uuid(),
  lesson_id     uuid not null references public.lessons(id) on delete cascade,
  storage_path  text not null,
  media_type    text not null default 'image' check (media_type in ('image', 'video')),
  created_at    timestamptz not null default now()
);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.handle_updated_at();

create trigger lessons_updated_at
  before update on public.lessons
  for each row execute function public.handle_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.companies        enable row level security;
alter table public.profiles         enable row level security;
alter table public.projects         enable row level security;
alter table public.project_members  enable row level security;
alter table public.company_viewers  enable row level security;
alter table public.invitations      enable row level security;
alter table public.lessons          enable row level security;
alter table public.tags             enable row level security;
alter table public.lesson_tags      enable row level security;
alter table public.lesson_images    enable row level security;

-- ------------------------------------------------------------
-- Security-definer helper functions.
-- All are security definer from the start to avoid the RLS
-- recursion issues a naive version would hit when a policy on
-- `profiles` queries `profiles` again inside these helpers.
-- ------------------------------------------------------------
create or replace function public.my_profile_id()
returns uuid language sql stable security definer as $$
  select id from public.profiles where id = auth.uid();
$$;

create or replace function public.my_company_id()
returns uuid language sql stable security definer as $$
  select company_id from public.profiles where id = auth.uid();
$$;

-- does the current user have ANY membership row on this project?
-- (entrepreneur or project-scoped spectator)
create or replace function public.is_project_member(p_project_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.project_members
    where project_id = p_project_id and profile_id = auth.uid()
  );
$$;

-- is the current user specifically an entrepreneur (write access) on this project?
create or replace function public.is_project_entrepreneur(p_project_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.project_members
    where project_id = p_project_id and profile_id = auth.uid() and role = 'entrepreneur'
  );
$$;

-- Entreprenör organizations are persistent: a mobil_anvandare invited by an
-- entrepreneur joins that entrepreneur's company_id directly and gets no
-- project_members row of their own. Access instead derives from sharing a
-- company_id with SOME profile that does hold an 'entrepreneur' membership
-- on the project — covers both the original entrepreneur and any mobila
-- användare added to their org afterward.
create or replace function public.is_entreprenor_org_on_project(p_project_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.project_members pm
    join public.profiles pr on pr.id = pm.profile_id
    where pm.project_id = p_project_id
      and pm.role = 'entrepreneur'
      and pr.company_id is not null
      and pr.company_id = public.my_company_id()
  );
$$;

-- does the current user have lesson-logging write access on this project?
-- (entrepreneur or konsult — both can log lessons; konsult is additionally
-- restricted client-side to early-phase "Var i byggprocessen" values)
create or replace function public.is_project_contributor(p_project_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.project_members
    where project_id = p_project_id and profile_id = auth.uid() and role in ('entrepreneur', 'konsult')
  ) or public.is_entreprenor_org_on_project(p_project_id);
$$;

-- does the current user have company-wide viewer access to this company?
create or replace function public.is_company_viewer(p_company_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.company_viewers
    where company_id = p_company_id and profile_id = auth.uid()
  );
$$;

-- can the current user run the review meeting for this project? Either the
-- client who owns it, or one of its entrepreneur team members — matches who
-- would actually be in the room (konsult and spectators cannot review).
create or replace function public.can_review_project(p_project_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.projects p where p.id = p_project_id and p.company_id = public.my_company_id()
  ) or public.is_project_entrepreneur(p_project_id);
$$;

-- Surfaces official lessons from OTHER projects that share at least one tag
-- with p_project_id — tags are the sole matching key. category_type /
-- category_subtype / procurement_form / contract_form are deliberately NOT
-- part of the match; they're general information the client can filter the
-- result list by afterward (returned here for exactly that purpose).
-- p_scope = 'internal' restricts to the caller's own company (like the
-- existing knowledge base); 'national' searches every company's official
-- lessons. For national results from a company other than the caller's own,
-- company identity is withheld — this is a first cut at cross-company
-- knowledge sharing, ahead of any subscription/consent model, so results
-- outside the caller's own company stay anonymous.
create or replace function public.search_lessons_for_project(
  p_project_id uuid,
  p_scope text
)
returns table (
  lesson_id uuid,
  project_id uuid,
  type public.lesson_type,
  title text,
  description text,
  construction_phase public.construction_phase,
  created_at timestamptz,
  relevance int,
  is_own_company boolean,
  company_name text,
  review_notes text,
  solution text,
  tags text[],
  category_type public.project_category_type,
  category_subtype public.project_category_subtype,
  procurement_form public.procurement_form,
  contract_form public.contract_form
)
language sql stable security definer as $$
  select
    l.id,
    l.project_id,
    l.type,
    l.title,
    l.description,
    l.construction_phase,
    l.created_at,
    count(distinct lt.tag_id)::int as relevance,
    p.company_id = public.my_company_id() as is_own_company,
    case when p.company_id = public.my_company_id() then c.name else null end as company_name,
    l.review_notes,
    l.solution,
    (select array_agg(t2.name order by t2.name)
       from public.lesson_tags lt2 join public.tags t2 on t2.id = lt2.tag_id
       where lt2.lesson_id = l.id) as tags,
    p.category_type,
    p.category_subtype,
    p.procurement_form,
    p.contract_form
  from public.lessons l
  join public.projects p on p.id = l.project_id
  join public.companies c on c.id = p.company_id
  join public.lesson_tags lt on lt.lesson_id = l.id
    and lt.tag_id in (select tag_id from public.project_tags where project_id = p_project_id)
  where l.reviewed_at is not null
    and l.project_id <> p_project_id
    and (p_scope = 'national' or p.company_id = public.my_company_id())
  group by l.id, l.project_id, p.company_id, c.name, p.category_type, p.category_subtype, p.procurement_form, p.contract_form
  order by relevance desc, l.created_at desc
  limit 30;
$$;

-- unified: can the current user read this project at all (any access path)?
-- Composed here once and reused by every downstream policy (lessons,
-- lesson_tags, lesson_images) instead of repeating the union per table.
create or replace function public.can_read_project(p_project_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.projects p
    where p.id = p_project_id
      and (
        p.company_id = public.my_company_id()
        or public.is_project_member(p.id)
        or public.is_company_viewer(p.company_id)
        or public.is_entreprenor_org_on_project(p.id)
      )
  );
$$;

-- ------------------------------------------------------------
-- COMPANIES
-- ------------------------------------------------------------
create policy "companies_select" on public.companies
  for select using (
    id = public.my_company_id()
    or exists (
      select 1 from public.project_members pm
      join public.projects p on p.id = pm.project_id
      where p.company_id = companies.id and pm.profile_id = auth.uid()
    )
    or public.is_company_viewer(id)
  );

create policy "companies_insert" on public.companies
  for insert with check (auth.uid() is not null); -- client signup creates the company

create policy "companies_update" on public.companies
  for update using (id = public.my_company_id());

-- ------------------------------------------------------------
-- PROFILES
-- ------------------------------------------------------------
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());

create policy "profiles_insert_own" on public.profiles
  for insert with check (id = auth.uid());

create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- Client can see profiles of people attached to their company's projects/company
create policy "profiles_select_by_client" on public.profiles
  for select using (
    exists (
      select 1 from public.project_members pm
      join public.projects p on p.id = pm.project_id
      where pm.profile_id = profiles.id and p.company_id = public.my_company_id()
    )
    or exists (
      select 1 from public.company_viewers cv
      where cv.profile_id = profiles.id and cv.company_id = public.my_company_id()
    )
  );

-- Members of the same organization can see each other. mobila användare have
-- no project_members/company_viewers row (they're not scoped to a project),
-- so client/entrepreneur org admins need this to list and manage them —
-- also lets entrepreneurs see peers added to their own persistent org.
create policy "profiles_select_same_company" on public.profiles
  for select using (
    company_id is not null and company_id = public.my_company_id()
  );

-- ------------------------------------------------------------
-- PROJECTS
-- ------------------------------------------------------------
-- Deliberately NOT using can_read_project(id) here: that helper re-queries
-- `projects`, and Postgres RLS can't see a row inserted earlier in the same
-- command (e.g. INSERT ... RETURNING) when a policy re-queries its own
-- table. Checking the row's own columns directly avoids that self-reference.
create policy "projects_select" on public.projects
  for select using (
    company_id = public.my_company_id()
    or public.is_project_member(id)
    or public.is_company_viewer(company_id)
    or public.is_entreprenor_org_on_project(id)
  );

create policy "projects_insert" on public.projects
  for insert with check (
    auth.uid() is not null
    and company_id = public.my_company_id()
  );

create policy "projects_update" on public.projects
  for update using (company_id = public.my_company_id());

-- ------------------------------------------------------------
-- PROJECT_MEMBERS
-- ------------------------------------------------------------
create policy "project_members_select" on public.project_members
  for select using (public.can_read_project(project_id));

create policy "project_members_insert" on public.project_members
  for insert with check (
    exists (select 1 from public.projects p where p.id = project_id and p.company_id = public.my_company_id())
  );

create policy "project_members_delete" on public.project_members
  for delete using (
    exists (select 1 from public.projects p where p.id = project_id and p.company_id = public.my_company_id())
  );

-- ------------------------------------------------------------
-- COMPANY_VIEWERS
-- ------------------------------------------------------------
create policy "company_viewers_select" on public.company_viewers
  for select using (
    company_id = public.my_company_id()
    or profile_id = auth.uid()
  );

create policy "company_viewers_insert" on public.company_viewers
  for insert with check (company_id = public.my_company_id());

create policy "company_viewers_delete" on public.company_viewers
  for delete using (company_id = public.my_company_id());

-- ------------------------------------------------------------
-- INVITATIONS
-- ------------------------------------------------------------
create policy "invitations_select" on public.invitations
  for select using (company_id = public.my_company_id());

create policy "invitations_insert" on public.invitations
  for insert with check (company_id = public.my_company_id());

create policy "invitations_update" on public.invitations
  for update using (true); -- token-based acceptance handled server-side via service role

-- ------------------------------------------------------------
-- LESSONS
-- ------------------------------------------------------------
create policy "lessons_select" on public.lessons
  for select using (public.can_read_project(project_id));

create policy "lessons_insert" on public.lessons
  for insert with check (
    created_by = auth.uid()
    and (
      exists (select 1 from public.projects p where p.id = project_id and p.company_id = public.my_company_id())
      or public.is_project_contributor(project_id)
    )
  ); -- spectators have no insert path

create policy "lessons_update" on public.lessons
  for update using (created_by = auth.uid());

create policy "lessons_delete" on public.lessons
  for delete using (
    created_by = auth.uid()
    or exists (select 1 from public.projects p where p.id = project_id and p.company_id = public.my_company_id())
  );

-- Records the outcome of the periodic review meeting for one lesson. A
-- dedicated RPC (rather than an RLS update policy) so reviewers — who did not
-- necessarily write the lesson — can only ever touch these four review
-- columns, never the original title/description/etc.
create or replace function public.submit_lesson_review(
  p_lesson_id uuid,
  p_review_notes text,
  p_solution text
)
returns void language plpgsql security definer as $$
declare
  v_project_id uuid;
begin
  select project_id into v_project_id from public.lessons where id = p_lesson_id;
  if v_project_id is null then
    raise exception 'Lesson not found';
  end if;

  if not public.can_review_project(v_project_id) then
    raise exception 'Not authorized to review this lesson';
  end if;

  update public.lessons
  set reviewed_at = now(),
      reviewed_by = auth.uid(),
      review_notes = p_review_notes,
      solution = p_solution
  where id = p_lesson_id;
end;
$$;

-- ------------------------------------------------------------
-- TAGS
-- ------------------------------------------------------------
create policy "tags_select" on public.tags
  for select using (
    company_id = public.my_company_id()
    or public.is_company_viewer(company_id)
  );

create policy "tags_insert" on public.tags
  for insert with check (
    company_id = public.my_company_id()
    or exists (
      select 1 from public.project_members pm
      join public.projects p on p.id = pm.project_id
      where p.company_id = tags.company_id
        and (
          (pm.profile_id = auth.uid() and pm.role in ('entrepreneur', 'konsult'))
          or public.is_entreprenor_org_on_project(p.id)
        )
    )
  ); -- clients, entrepreneurs (incl. their org's mobila användare) and konsults can introduce new freeform tags; spectators cannot

-- Needed for upsert(..., {onConflict: 'company_id,kind,name'}) to work once a
-- tag already exists — that path is an UPDATE, which has no effect on the
-- row's actual values but still requires a matching RLS policy to execute.
-- Mirrors tags_insert exactly.
create policy "tags_update" on public.tags
  for update using (
    company_id = public.my_company_id()
    or exists (
      select 1 from public.project_members pm
      join public.projects p on p.id = pm.project_id
      where p.company_id = tags.company_id
        and (
          (pm.profile_id = auth.uid() and pm.role in ('entrepreneur', 'konsult'))
          or public.is_entreprenor_org_on_project(p.id)
        )
    )
  );

-- ------------------------------------------------------------
-- LESSON_TAGS
-- ------------------------------------------------------------
create policy "lesson_tags_select" on public.lesson_tags
  for select using (
    exists (select 1 from public.lessons l where l.id = lesson_id and public.can_read_project(l.project_id))
  );

create policy "lesson_tags_insert" on public.lesson_tags
  for insert with check (
    exists (select 1 from public.lessons l where l.id = lesson_id and l.created_by = auth.uid())
  );

create policy "lesson_tags_delete" on public.lesson_tags
  for delete using (
    exists (select 1 from public.lessons l where l.id = lesson_id and l.created_by = auth.uid())
  );

-- Same reasoning as tags_update: upsert(..., {onConflict: 'lesson_id,tag_id'})
-- takes the UPDATE path once the pair already exists.
create policy "lesson_tags_update" on public.lesson_tags
  for update using (
    exists (select 1 from public.lessons l where l.id = lesson_id and l.created_by = auth.uid())
  );

-- ------------------------------------------------------------
-- PROJECT_TAGS
-- ------------------------------------------------------------
create policy "project_tags_select" on public.project_tags
  for select using (public.can_read_project(project_id));

create policy "project_tags_insert" on public.project_tags
  for insert with check (
    exists (select 1 from public.projects p where p.id = project_id and p.company_id = public.my_company_id())
  );

create policy "project_tags_delete" on public.project_tags
  for delete using (
    exists (select 1 from public.projects p where p.id = project_id and p.company_id = public.my_company_id())
  );

-- Same reasoning as tags_update: upsert(..., {onConflict: 'project_id,tag_id'})
-- takes the UPDATE path once the pair already exists.
create policy "project_tags_update" on public.project_tags
  for update using (
    exists (select 1 from public.projects p where p.id = project_id and p.company_id = public.my_company_id())
  );

-- ------------------------------------------------------------
-- LESSON_IMAGES
-- ------------------------------------------------------------
create policy "lesson_images_select" on public.lesson_images
  for select using (
    exists (select 1 from public.lessons l where l.id = lesson_id and public.can_read_project(l.project_id))
  );

create policy "lesson_images_insert" on public.lesson_images
  for insert with check (
    exists (select 1 from public.lessons l where l.id = lesson_id and l.created_by = auth.uid())
  );

create policy "lesson_images_delete" on public.lesson_images
  for delete using (
    exists (select 1 from public.lessons l where l.id = lesson_id and l.created_by = auth.uid())
  );

-- ============================================================
-- STORAGE BUCKET FOR LESSON IMAGES
-- Path convention: {project_id}/{lesson_id}/{filename}
-- ============================================================
insert into storage.buckets (id, name, public)
values ('lesson-images', 'lesson-images', false)
on conflict do nothing;

create policy "lesson_images_storage_select" on storage.objects
  for select using (
    bucket_id = 'lesson-images'
    and public.can_read_project(((storage.foldername(name))[1])::uuid)
  );

create policy "lesson_images_storage_insert" on storage.objects
  for insert with check (
    bucket_id = 'lesson-images'
    and auth.role() = 'authenticated'
    and (
      -- storage.objects.name must be qualified here: inside this subquery,
      -- `name` would otherwise resolve to projects.name (also a `name` column)
      -- instead of the uploaded file's path, silently breaking this check.
      exists (
        select 1 from public.projects p
        where p.id = ((storage.foldername(storage.objects.name))[1])::uuid
          and p.company_id = public.my_company_id()
      )
      or public.is_project_contributor(((storage.foldername(storage.objects.name))[1])::uuid)
    )
  );

create policy "lesson_images_storage_delete" on storage.objects
  for delete using (
    bucket_id = 'lesson-images'
    and public.can_read_project(((storage.foldername(name))[1])::uuid)
  );

-- ============================================================
-- TAXONOMY — the building-part hierarchy driving the project Tag-guide
-- (Vilken del av byggnaden? → attribute group → concrete value, e.g.
-- Tak → Typ av yttertak → Plåt). Global, not per-company: every client sees
-- the same tree, which keeps tag names consistent enough for cross-company
-- ("Nationellt") matching to be meaningful. Admin-managed via /admin/taxonomy
-- (service-role writes, same pattern as companies/projects/lessons); every
-- authenticated user can read it since the Tag-guide needs it. Renaming or
-- deleting a node here has no retroactive effect on tags already created
-- from it — public.tags rows are plain text, decoupled once created.
-- ============================================================
create table public.taxonomy_nodes (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid references public.taxonomy_nodes(id) on delete cascade,
  label       text not null,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index taxonomy_nodes_parent_id_idx on public.taxonomy_nodes(parent_id);

create trigger taxonomy_nodes_updated_at
  before update on public.taxonomy_nodes
  for each row execute function public.handle_updated_at();

alter table public.taxonomy_nodes enable row level security;

create policy "taxonomy_nodes_select" on public.taxonomy_nodes
  for select using (auth.role() = 'authenticated');

-- Seed with the taxonomy previously hardcoded in
-- packages/shared/src/constants/buildingTaxonomy.ts, so switching to the
-- database preserves today's Tag-guide exactly. One-off helper, dropped
-- immediately after use.
create or replace function public._seed_taxonomy_tree(p_parent_id uuid, p_nodes jsonb)
returns void language plpgsql as $$
declare
  node jsonb;
  new_id uuid;
  idx int := 0;
begin
  for node in select * from jsonb_array_elements(p_nodes)
  loop
    insert into public.taxonomy_nodes (parent_id, label, sort_order)
    values (p_parent_id, node->>'label', idx)
    returning id into new_id;

    if node ? 'children' then
      perform public._seed_taxonomy_tree(new_id, node->'children');
    end if;

    idx := idx + 1;
  end loop;
end;
$$;

select public._seed_taxonomy_tree(null, '[
  {"label": "Tak", "children": [
    {"label": "Typ av yttertak", "children": [
      {"label": "Plåt"}, {"label": "Tegel"}, {"label": "Papp"}, {"label": "Shingel"}, {"label": "Betongpannor"}
    ]},
    {"label": "Takkonstruktion", "children": [
      {"label": "Sadeltak"}, {"label": "Pulpettak"}, {"label": "Platt tak"}, {"label": "Valmat tak"}
    ]},
    {"label": "Takavvattning", "children": [
      {"label": "Hängrännor"}, {"label": "Stuprör"}, {"label": "Takbrunnar"}
    ]}
  ]},
  {"label": "Fasad", "children": [
    {"label": "Fasadmaterial", "children": [
      {"label": "Puts"}, {"label": "Tegel"}, {"label": "Trä"}, {"label": "Plåt"}, {"label": "Skiffer"}
    ]},
    {"label": "Fasadisolering", "children": [
      {"label": "Tilläggsisolering"}, {"label": "Ventilerad fasad"}
    ]},
    {"label": "Fasaddetaljer", "children": [
      {"label": "Vindskivor"}, {"label": "Fönsterbleck"}, {"label": "Sockelplåt"}
    ]}
  ]},
  {"label": "Fönster", "children": [
    {"label": "Fönstertyp", "children": [
      {"label": "Träfönster"}, {"label": "Aluminiumfönster"}, {"label": "PVC-fönster"}, {"label": "Kompositfönster"}
    ]},
    {"label": "Glastyp", "children": [
      {"label": "Enkelglas"}, {"label": "Tvåglas"}, {"label": "Treglas"}, {"label": "Energiglas"}
    ]},
    {"label": "Fönsterfunktion", "children": [
      {"label": "Vridfönster"}, {"label": "Fasta fönster"}, {"label": "Skjutfönster"}
    ]}
  ]},
  {"label": "Balkonger", "children": [
    {"label": "Balkongtyp", "children": [
      {"label": "Inglasad balkong"}, {"label": "Öppen balkong"}, {"label": "Fransk balkong"}
    ]},
    {"label": "Balkongkonstruktion", "children": [
      {"label": "Utkragad balkong"}, {"label": "Balkong på pelare"}, {"label": "Indragen balkong"}
    ]},
    {"label": "Räcke", "children": [
      {"label": "Glasräcke"}, {"label": "Smidesräcke"}, {"label": "Plåträcke"}
    ]}
  ]},
  {"label": "Sockel", "children": [
    {"label": "Sockelmaterial", "children": [
      {"label": "Betong"}, {"label": "Puts"}, {"label": "Natursten"}, {"label": "Klinker"}
    ]},
    {"label": "Sockelisolering", "children": [
      {"label": "Markisolering"}, {"label": "Cellplast"}, {"label": "Mineralull"}
    ]},
    {"label": "Sockeldetaljer", "children": [
      {"label": "Sockelplåt"}, {"label": "Dränering vid sockel"}
    ]}
  ]},
  {"label": "Dörrar", "children": [
    {"label": "Dörrtyp", "children": [
      {"label": "Entrédörr"}, {"label": "Innerdörr"}, {"label": "Altandörr"}, {"label": "Garageport"}
    ]},
    {"label": "Dörrmaterial", "children": [
      {"label": "Trä"}, {"label": "Stål"}, {"label": "Aluminium"}, {"label": "Komposit"}
    ]},
    {"label": "Dörrfunktion", "children": [
      {"label": "Slagdörr"}, {"label": "Skjutdörr"}, {"label": "Karuselldörr"}
    ]}
  ]},
  {"label": "Husgrund", "children": [
    {"label": "Grundtyp", "children": [
      {"label": "Platta på mark"}, {"label": "Krypgrund"}, {"label": "Källare"}, {"label": "Plintgrund"}
    ]},
    {"label": "Grundmaterial", "children": [
      {"label": "Betong"}, {"label": "Lättklinkerblock"}
    ]},
    {"label": "Dränering och skydd", "children": [
      {"label": "Dräneringsledning"}, {"label": "Fuktisolering"}, {"label": "Radonskydd"}
    ]}
  ]},
  {"label": "Markarbeten", "children": [
    {"label": "Schaktning", "children": [
      {"label": "Schakt för grund"}, {"label": "Schakt för ledningar"}, {"label": "Massutbyte"}
    ]},
    {"label": "Markbeläggning", "children": [
      {"label": "Asfalt"}, {"label": "Betongplattor"}, {"label": "Grus"}, {"label": "Gräsyta"}
    ]},
    {"label": "VA-arbeten", "children": [
      {"label": "Dagvatten"}, {"label": "Spillvatten"}, {"label": "Dricksvatten"}
    ]}
  ]},
  {"label": "Installationer", "children": [
    {"label": "VVS", "children": [
      {"label": "Värme"}, {"label": "Ventilation"}, {"label": "Sanitet"}
    ]},
    {"label": "El", "children": [
      {"label": "Elcentral"}, {"label": "Belysning"}, {"label": "Starkström"}, {"label": "Svagström"}
    ]},
    {"label": "Styr och övervakning", "children": [
      {"label": "Fastighetsautomation"}, {"label": "Brandlarm"}
    ]}
  ]},
  {"label": "Inre utrymmen", "children": [
    {"label": "Golv", "children": [
      {"label": "Parkett"}, {"label": "Klinker"}, {"label": "Matta"}, {"label": "Betonggolv"}
    ]},
    {"label": "Innerväggar", "children": [
      {"label": "Gips"}, {"label": "Tegel"}, {"label": "Lättbetong"}
    ]},
    {"label": "Innertak", "children": [
      {"label": "Undertak"}, {"label": "Målat tak"}, {"label": "Akustikplattor"}
    ]}
  ]}
]'::jsonb);

drop function public._seed_taxonomy_tree(uuid, jsonb);
