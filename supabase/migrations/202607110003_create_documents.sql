create extension if not exists pgcrypto with schema extensions;

create table if not exists public.documents (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'untitled',
  content_md text not null default '',
  folder_path text not null default '/',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint documents_title_length_check
    check (char_length(btrim(title)) between 1 and 180),
  constraint documents_folder_path_check
    check (folder_path ~ '^/([A-Za-z0-9._ -]+/)*$')
);

create index if not exists documents_workspace_updated_at_idx
  on public.documents(workspace_id, updated_at desc);

create index if not exists documents_author_id_idx
  on public.documents(author_id);

drop policy if exists "profiles_select_workspace_members" on public.profiles;
create policy "profiles_select_workspace_members"
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
);

drop trigger if exists set_documents_updated_at on public.documents;
create trigger set_documents_updated_at
before update on public.documents
for each row
execute function public.set_updated_at();

alter table public.documents enable row level security;

drop policy if exists "documents_select_workspace_members" on public.documents;
create policy "documents_select_workspace_members"
on public.documents
for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "documents_insert_workspace_members" on public.documents;
create policy "documents_insert_workspace_members"
on public.documents
for insert
to authenticated
with check (
  author_id = auth.uid()
  and public.is_workspace_member(workspace_id)
);

drop policy if exists "documents_update_workspace_members" on public.documents;
create policy "documents_update_workspace_members"
on public.documents
for update
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

drop policy if exists "documents_delete_admins_or_authors" on public.documents;
create policy "documents_delete_admins_or_authors"
on public.documents
for delete
to authenticated
using (
  author_id = auth.uid()
  or public.is_workspace_admin(workspace_id)
);

notify pgrst, 'reload schema';
