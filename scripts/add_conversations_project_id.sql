alter table public.conversations
  add column if not exists project_id uuid;

alter table public.conversations
  drop constraint if exists conversations_project_id_fkey;

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'conversations'
      and constraint_name = 'conversations_project_id_fkey'
  ) then
    alter table public.conversations
      add constraint conversations_project_id_fkey
      foreign key (project_id)
      references public.projects(id)
      on delete set null;
  end if;
end $$;

create index if not exists conversations_project_id_idx
  on public.conversations (project_id);