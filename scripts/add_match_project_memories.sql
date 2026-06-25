create or replace function public.match_project_memories(
  query_embedding vector,
  match_project_id uuid,
  match_count int
)
returns table (
  id uuid,
  memory_type text,
  title text,
  content text,
  importance integer,
  similarity float,
  created_at timestamptz
)
language sql
stable
as $$
  select
    pm.id,
    pm.memory_type,
    pm.title,
    pm.content,
    pm.importance,
    1 - (pm.embedding <=> query_embedding) as similarity,
    pm.created_at
  from public.project_memories as pm
  where pm.project_id = match_project_id
    and pm.embedding is not null
  order by pm.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;