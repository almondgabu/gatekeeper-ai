create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  opportunity_type text not null,
  stage text not null default 'new',
  contact_name text,
  location_summary text,
  description text,
  estimated_value numeric,
  estimated_commission numeric,
  urgency text not null default 'medium',
  next_action text,
  follow_up_date date,
  qualification_notes text,
  checklist_completed text[] not null default '{}'::text[],
  converted_project_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.opportunities
  drop constraint if exists opportunities_converted_project_id_fkey;

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_schema = 'public'
      and table_name = 'opportunities'
      and constraint_name = 'opportunities_converted_project_id_fkey'
  ) then
    alter table public.opportunities
      add constraint opportunities_converted_project_id_fkey
      foreign key (converted_project_id)
      references public.projects(id)
      on delete set null;
  end if;
end $$;

create index if not exists opportunities_stage_idx
  on public.opportunities (stage);

create index if not exists opportunities_type_idx
  on public.opportunities (opportunity_type);

create index if not exists opportunities_follow_up_date_idx
  on public.opportunities (follow_up_date);

create index if not exists opportunities_converted_project_id_idx
  on public.opportunities (converted_project_id);

create index if not exists opportunities_updated_at_idx
  on public.opportunities (updated_at desc);