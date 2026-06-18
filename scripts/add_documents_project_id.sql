create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists projects_name_idx
  on public.projects (name);

alter table public.documents
  drop constraint if exists documents_project_id_fkey;

drop index if exists documents_project_id_idx;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'documents'
      and column_name = 'project_id'
      and data_type = 'bigint'
  ) then
    alter table public.documents
      rename column project_id to legacy_project_bigint;
  end if;
end $$;

alter table public.documents
  add column if not exists project_id uuid;

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'documents'
      and constraint_name = 'documents_project_id_fkey'
  ) then
    alter table public.documents
      add constraint documents_project_id_fkey
      foreign key (project_id)
      references public.projects(id)
      on delete set null;
  end if;
end $$;

create index if not exists documents_project_id_idx
  on public.documents (project_id);