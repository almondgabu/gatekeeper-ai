alter table public.project_memories
  add column if not exists embedding vector(1536);

create index if not exists project_memories_embedding_idx
  on public.project_memories
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);