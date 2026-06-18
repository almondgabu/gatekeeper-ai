create table if not exists public.project_memories (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  memory_type text not null,
  title text not null,
  content text not null,
  source_conversation_id bigint,
  importance integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.project_memories
  drop constraint if exists project_memories_project_id_fkey;

alter table public.project_memories
  drop constraint if exists project_memories_source_conversation_id_fkey;

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'project_memories'
      and constraint_name = 'project_memories_project_id_fkey'
  ) then
    alter table public.project_memories
      add constraint project_memories_project_id_fkey
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
      and table_name = 'project_memories'
      and constraint_name = 'project_memories_source_conversation_id_fkey'
  ) then
    alter table public.project_memories
      add constraint project_memories_source_conversation_id_fkey
      foreign key (source_conversation_id)
      references public.conversations(id)
      on delete set null;
  end if;
end $$;

create index if not exists project_memories_project_id_idx
  on public.project_memories (project_id);

create index if not exists project_memories_memory_type_idx
  on public.project_memories (memory_type);

create index if not exists project_memories_source_conversation_id_idx
  on public.project_memories (source_conversation_id);

create index if not exists project_memories_created_at_idx
  on public.project_memories (created_at desc);