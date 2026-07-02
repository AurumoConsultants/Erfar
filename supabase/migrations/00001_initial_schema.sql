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
create type public.user_role as enum ('client', 'entrepreneur', 'spectator');
create type public.project_status as enum ('active', 'completed', 'archived');
create type public.lesson_type as enum ('challenge', 'success');
create type public.invite_role as enum ('entrepreneur', 'spectator_project', 'spectator_company');
create type public.member_role as enum ('entrepreneur', 'spectator');
create type public.project_category_type as enum ('nybyggnation', 'renovering', 'service');
-- Same four subtypes apply under every category_type.
create type public.project_category_subtype as enum ('bostader', 'kontor', 'lokaler', 'ovrigt');
-- "Var i byggprocessen" — which phase of the construction process a lesson relates to.
create type public.construction_phase as enum ('idea_stage', 'early_stages', 'design', 'execution', 'management');

-- ============================================================
-- COMPANIES (tenants, owned by a client)
-- ============================================================
create table public.companies (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  org_number  text,
  created_at  timestamptz not null default now()
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
    (role = 'spectator_company' and project_id is null)
    or (role in ('entrepreneur', 'spectator_project') and project_id is not null)
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
  created_by  uuid not null references public.profiles(id) on delete set null,
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
-- TAGS — freeform, namespaced per company
-- ============================================================
create table public.tags (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now(),
  unique (company_id, name)
);

create table public.lesson_tags (
  lesson_id   uuid not null references public.lessons(id) on delete cascade,
  tag_id      uuid not null references public.tags(id) on delete cascade,
  primary key (lesson_id, tag_id)
);
create index lesson_tags_tag_id_idx on public.lesson_tags(tag_id);

-- ============================================================
-- LESSON IMAGES
-- ============================================================
create table public.lesson_images (
  id            uuid primary key default gen_random_uuid(),
  lesson_id     uuid not null references public.lessons(id) on delete cascade,
  storage_path  text not null,
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

-- does the current user have company-wide viewer access to this company?
create or replace function public.is_company_viewer(p_company_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.company_viewers
    where company_id = p_company_id and profile_id = auth.uid()
  );
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
      or public.is_project_entrepreneur(project_id)
    )
  ); -- spectators have no insert path

create policy "lessons_update" on public.lessons
  for update using (created_by = auth.uid());

create policy "lessons_delete" on public.lessons
  for delete using (
    created_by = auth.uid()
    or exists (select 1 from public.projects p where p.id = project_id and p.company_id = public.my_company_id())
  );

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
      where p.company_id = tags.company_id and pm.profile_id = auth.uid() and pm.role = 'entrepreneur'
    )
  ); -- clients and entrepreneurs can introduce new freeform tags; spectators cannot

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
      exists (select 1 from public.projects p where p.id = ((storage.foldername(name))[1])::uuid and p.company_id = public.my_company_id())
      or public.is_project_entrepreneur(((storage.foldername(name))[1])::uuid)
    )
  );

create policy "lesson_images_storage_delete" on storage.objects
  for delete using (
    bucket_id = 'lesson-images'
    and public.can_read_project(((storage.foldername(name))[1])::uuid)
  );
