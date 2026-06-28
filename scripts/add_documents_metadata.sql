begin;

alter table public.documents
  add column if not exists metadata jsonb;

alter table public.documents
  alter column metadata set default '{}'::jsonb;

update public.documents
set metadata = '{}'::jsonb
where metadata is null;

comment on column public.documents.metadata is
  'Structured Knowledge Vault metadata for documents and image AI analysis.';

commit;