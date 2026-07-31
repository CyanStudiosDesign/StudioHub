alter table public.documents
  add column if not exists content_json jsonb;

comment on column public.documents.content_json is
  'Canonical TipTap/ProseMirror JSON document. NULL means the legacy content_md fallback has not been migrated yet.';

comment on column public.documents.content_md is
  'Legacy Markdown fallback and generated export mirror. New edits are authored from content_json.';

alter table public.documents
  drop constraint if exists documents_content_json_shape_check;

alter table public.documents
  add constraint documents_content_json_shape_check
  check (
    content_json is null
    or (
      jsonb_typeof(content_json) = 'object'
      and content_json ->> 'type' = 'doc'
      and coalesce(jsonb_typeof(content_json -> 'content') = 'array', false)
    )
  );

notify pgrst, 'reload schema';
