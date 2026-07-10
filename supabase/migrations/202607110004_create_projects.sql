create extension if not exists pgcrypto with schema extensions;

do $$
begin
  create type public.project_status as enum ('active', 'completed', 'archived');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.projects (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  status public.project_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint projects_name_length_check
    check (char_length(btrim(name)) between 2 and 140)
);

create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (project_id, user_id)
);

create index if not exists projects_workspace_updated_at_idx
  on public.projects(workspace_id, updated_at desc);

create index if not exists project_members_user_id_idx
  on public.project_members(user_id);

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

create or replace function public.can_access_project(p_project_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = p_project_id
      and public.is_workspace_member(p.workspace_id, auth.uid())
  );
$$;

create or replace function public.is_project_workspace_member(
  p_project_id uuid,
  p_user_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.projects p
    where p.id = p_project_id
      and public.is_workspace_member(p.workspace_id, p_user_id)
  );
$$;

alter table public.projects enable row level security;
alter table public.project_members enable row level security;

drop policy if exists "projects_select_workspace_members" on public.projects;
create policy "projects_select_workspace_members"
on public.projects
for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "projects_insert_workspace_members" on public.projects;
create policy "projects_insert_workspace_members"
on public.projects
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.is_workspace_member(workspace_id)
);

drop policy if exists "projects_update_creators_or_admins" on public.projects;
create policy "projects_update_creators_or_admins"
on public.projects
for update
to authenticated
using (
  created_by = auth.uid()
  or public.is_workspace_admin(workspace_id)
)
with check (
  created_by = auth.uid()
  or public.is_workspace_admin(workspace_id)
);

drop policy if exists "projects_delete_creators_or_admins" on public.projects;
create policy "projects_delete_creators_or_admins"
on public.projects
for delete
to authenticated
using (
  created_by = auth.uid()
  or public.is_workspace_admin(workspace_id)
);

drop policy if exists "project_members_select_workspace_members" on public.project_members;
create policy "project_members_select_workspace_members"
on public.project_members
for select
to authenticated
using (public.can_access_project(project_id));

drop policy if exists "project_members_insert_workspace_members" on public.project_members;
create policy "project_members_insert_workspace_members"
on public.project_members
for insert
to authenticated
with check (
  public.can_access_project(project_id)
  and public.is_project_workspace_member(project_id, user_id)
);

drop policy if exists "project_members_delete_workspace_members" on public.project_members;
create policy "project_members_delete_workspace_members"
on public.project_members
for delete
to authenticated
using (public.can_access_project(project_id));

grant execute on function public.can_access_project(uuid) to authenticated;
grant execute on function public.is_project_workspace_member(uuid, uuid) to authenticated;

notify pgrst, 'reload schema';
