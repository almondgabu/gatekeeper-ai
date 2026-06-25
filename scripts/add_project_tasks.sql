create table if not exists public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  title text not null,
  description text,
  status text not null default 'open',
  due_date date,
  source_conversation_id bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.project_tasks
  drop constraint if exists project_tasks_project_id_fkey;

alter table public.project_tasks
  drop constraint if exists project_tasks_source_conversation_id_fkey;

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'project_tasks'
      and constraint_name = 'project_tasks_project_id_fkey'
  ) then
    alter table public.project_tasks
      add constraint project_tasks_project_id_fkey
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
      and table_name = 'project_tasks'
      and constraint_name = 'project_tasks_source_conversation_id_fkey'
  ) then
    alter table public.project_tasks
      add constraint project_tasks_source_conversation_id_fkey
      foreign key (source_conversation_id)
      references public.conversations(id)
      on delete set null;
  end if;
end $$;

create index if not exists project_tasks_project_id_idx
  on public.project_tasks (project_id);

create index if not exists project_tasks_status_idx
  on public.project_tasks (status);

create index if not exists project_tasks_due_date_idx
  on public.project_tasks (due_date);

create index if not exists project_tasks_source_conversation_id_idx
  on public.project_tasks (source_conversation_id);

create index if not exists project_tasks_created_at_idx
  on public.project_tasks (created_at desc);

create index if not exists project_tasks_updated_at_idx
  on public.project_tasks (updated_at desc);