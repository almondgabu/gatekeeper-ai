create index if not exists document_chunks_document_id_idx
  on public.document_chunks (document_id);

create or replace function public.match_project_document_chunks(
  query_embedding vector,
  match_count int,
  target_project_id uuid
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  filename text,
  similarity float
)
language sql
stable
as $$
  select
    dc.id,
    dc.document_id,
    dc.content,
    d.filename,
    1 - (dc.embedding <=> query_embedding) as similarity
  from public.document_chunks as dc
  join public.documents as d
    on d.id = dc.document_id
  where d.project_id = target_project_id
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;