alter table public.documents
  add column if not exists visibility text not null default 'workspace';

alter table public.documents
  drop constraint if exists documents_visibility_check;

alter table public.documents
  add constraint documents_visibility_check
  check (visibility in ('public', 'private', 'workspace'));

create index if not exists documents_visibility_updated_at_idx
  on public.documents(visibility, updated_at desc);

drop policy if exists "documents_select_workspace_members" on public.documents;
drop policy if exists "documents_select_by_visibility" on public.documents;
create policy "documents_select_by_visibility"
on public.documents
for select
to authenticated
using (
  visibility = 'public'
  or author_id = auth.uid()
  or (
    visibility = 'workspace'
    and public.has_workspace_permission(workspace_id, 'documents.view')
  )
);

drop policy if exists "profiles_select_workspace_members" on public.profiles;
drop policy if exists "profiles_select_workspace_or_public_authors" on public.profiles;
create policy "profiles_select_workspace_or_public_authors"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.workspace_members current_member
    join public.workspace_members profile_member
      on profile_member.workspace_id = current_member.workspace_id
    where current_member.user_id = auth.uid()
      and profile_member.user_id = profiles.id
  )
  or exists (
    select 1
    from public.documents public_document
    where public_document.author_id = profiles.id
      and public_document.visibility = 'public'
  )
);

notify pgrst, 'reload schema';
