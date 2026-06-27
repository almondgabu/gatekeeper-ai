create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  activity_type text not null,
  title text not null,
  summary text,
  opportunity_id uuid,
  project_id uuid,
  source_table text,
  source_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.activities
  drop constraint if exists activities_opportunity_id_fkey;

alter table public.activities
  drop constraint if exists activities_project_id_fkey;

alter table public.activities
  drop constraint if exists activities_scope_check;

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'activities'
      and constraint_name = 'activities_opportunity_id_fkey'
  ) then
    alter table public.activities
      add constraint activities_opportunity_id_fkey
      foreign key (opportunity_id)
      references public.opportunities(id)
      on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'activities'
      and constraint_name = 'activities_project_id_fkey'
  ) then
    alter table public.activities
      add constraint activities_project_id_fkey
      foreign key (project_id)
      references public.projects(id)
      on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'activities'
      and constraint_name = 'activities_scope_check'
  ) then
    alter table public.activities
      add constraint activities_scope_check
      check (opportunity_id is not null or project_id is not null);
  end if;
end $$;

create index if not exists activities_opportunity_id_idx
  on public.activities (opportunity_id);

create index if not exists activities_project_id_idx
  on public.activities (project_id);

create index if not exists activities_activity_type_idx
  on public.activities (activity_type);

create index if not exists activities_created_at_idx
  on public.activities (created_at desc);