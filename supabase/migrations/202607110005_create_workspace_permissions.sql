create table if not exists public.workspace_member_permissions (
  workspace_id uuid not null,
  user_id uuid not null,
  can_view_documents boolean not null default true,
  can_manage_documents boolean not null default false,
  can_view_projects boolean not null default true,
  can_manage_projects boolean not null default false,
  can_manage_members boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (workspace_id, user_id),
  foreign key (workspace_id, user_id)
    references public.workspace_members(workspace_id, user_id)
    on delete cascade
);

create index if not exists workspace_member_permissions_user_id_idx
  on public.workspace_member_permissions(user_id);

drop trigger if exists set_workspace_member_permissions_updated_at
  on public.workspace_member_permissions;
create trigger set_workspace_member_permissions_updated_at
before update on public.workspace_member_permissions
for each row
execute function public.set_updated_at();

create or replace function public.add_default_workspace_member_permissions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.workspace_member_permissions (
    workspace_id,
    user_id,
    can_view_documents,
    can_manage_documents,
    can_view_projects,
    can_manage_projects,
    can_manage_members
  )
  values (
    new.workspace_id,
    new.user_id,
    true,
    new.role in ('owner', 'admin'),
    true,
    new.role in ('owner', 'admin'),
    new.role in ('owner', 'admin')
  )
  on conflict (workspace_id, user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_workspace_member_created_add_permissions
  on public.workspace_members;
create trigger on_workspace_member_created_add_permissions
after insert on public.workspace_members
for each row
execute function public.add_default_workspace_member_permissions();

insert into public.workspace_member_permissions (
  workspace_id,
  user_id,
  can_view_documents,
  can_manage_documents,
  can_view_projects,
  can_manage_projects,
  can_manage_members
)
select
  wm.workspace_id,
  wm.user_id,
  true,
  wm.role in ('owner', 'admin'),
  true,
  wm.role in ('owner', 'admin'),
  wm.role in ('owner', 'admin')
from public.workspace_members wm
on conflict (workspace_id, user_id) do nothing;

create or replace function public.has_workspace_permission(
  p_workspace_id uuid,
  p_permission text,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (
      select
        case
          when wm.role in ('owner', 'admin') then true
          when p_permission = 'documents.view' then wmp.can_view_documents
          when p_permission = 'documents.manage' then wmp.can_manage_documents
          when p_permission = 'projects.view' then wmp.can_view_projects
          when p_permission = 'projects.manage' then wmp.can_manage_projects
          when p_permission = 'members.manage' then wmp.can_manage_members
          else false
        end
      from public.workspace_members wm
      left join public.workspace_member_permissions wmp
        on wmp.workspace_id = wm.workspace_id
       and wmp.user_id = wm.user_id
      where wm.workspace_id = p_workspace_id
        and wm.user_id = p_user_id
      limit 1
    ),
    false
  );
$$;

create or replace function public.add_workspace_member_by_email(
  p_workspace_id uuid,
  p_email text,
  p_role public.workspace_role default 'member'
)
returns public.workspace_members
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  target_profile public.profiles;
  inserted_member public.workspace_members;
begin
  if not public.has_workspace_permission(p_workspace_id, 'members.manage') then
    raise exception 'Only members with member-management permission can add members';
  end if;

  if p_role = 'owner' then
    raise exception 'Owner role cannot be assigned through member invites';
  end if;

  select *
  into target_profile
  from public.profiles
  where email = p_email::extensions.citext;

  if target_profile.id is null then
    raise exception 'No user exists for that email';
  end if;

  insert into public.workspace_members (
    workspace_id,
    user_id,
    role,
    invited_by
  )
  values (
    p_workspace_id,
    target_profile.id,
    p_role,
    auth.uid()
  )
  on conflict (workspace_id, user_id)
  do update set
    role = excluded.role,
    invited_by = excluded.invited_by
  returning * into inserted_member;

  return inserted_member;
end;
$$;

alter table public.workspace_member_permissions enable row level security;

drop policy if exists "workspace_permissions_select_members" on public.workspace_member_permissions;
create policy "workspace_permissions_select_members"
on public.workspace_member_permissions
for select
to authenticated
using (
  public.is_workspace_owner(workspace_id)
  or user_id = auth.uid()
);

drop policy if exists "workspace_permissions_insert_owners" on public.workspace_member_permissions;
create policy "workspace_permissions_insert_owners"
on public.workspace_member_permissions
for insert
to authenticated
with check (public.is_workspace_owner(workspace_id));

drop policy if exists "workspace_permissions_update_owners" on public.workspace_member_permissions;
create policy "workspace_permissions_update_owners"
on public.workspace_member_permissions
for update
to authenticated
using (public.is_workspace_owner(workspace_id))
with check (public.is_workspace_owner(workspace_id));

drop policy if exists "workspace_members_insert_admins" on public.workspace_members;
create policy "workspace_members_insert_admins"
on public.workspace_members
for insert
to authenticated
with check (
  public.has_workspace_permission(workspace_id, 'members.manage')
  and role in ('admin', 'member')
);

drop policy if exists "workspace_members_update_admins" on public.workspace_members;
create policy "workspace_members_update_admins"
on public.workspace_members
for update
to authenticated
using (
  public.has_workspace_permission(workspace_id, 'members.manage')
  and role in ('admin', 'member')
)
with check (
  public.has_workspace_permission(workspace_id, 'members.manage')
  and role in ('admin', 'member')
);

drop policy if exists "workspace_members_delete_admins" on public.workspace_members;
create policy "workspace_members_delete_admins"
on public.workspace_members
for delete
to authenticated
using (
  public.has_workspace_permission(workspace_id, 'members.manage')
  and role in ('admin', 'member')
);

drop policy if exists "documents_select_workspace_members" on public.documents;
create policy "documents_select_workspace_members"
on public.documents
for select
to authenticated
using (public.has_workspace_permission(workspace_id, 'documents.view'));

drop policy if exists "documents_insert_workspace_members" on public.documents;
create policy "documents_insert_workspace_members"
on public.documents
for insert
to authenticated
with check (
  author_id = auth.uid()
  and public.has_workspace_permission(workspace_id, 'documents.manage')
);

drop policy if exists "documents_update_workspace_members" on public.documents;
create policy "documents_update_workspace_members"
on public.documents
for update
to authenticated
using (public.has_workspace_permission(workspace_id, 'documents.manage'))
with check (public.has_workspace_permission(workspace_id, 'documents.manage'));

drop policy if exists "projects_select_workspace_members" on public.projects;
create policy "projects_select_workspace_members"
on public.projects
for select
to authenticated
using (public.has_workspace_permission(workspace_id, 'projects.view'));

drop policy if exists "projects_insert_workspace_members" on public.projects;
create policy "projects_insert_workspace_members"
on public.projects
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.has_workspace_permission(workspace_id, 'projects.manage')
);

drop policy if exists "projects_update_creators_or_admins" on public.projects;
create policy "projects_update_creators_or_admins"
on public.projects
for update
to authenticated
using (public.has_workspace_permission(workspace_id, 'projects.manage'))
with check (public.has_workspace_permission(workspace_id, 'projects.manage'));

drop policy if exists "projects_delete_creators_or_admins" on public.projects;
create policy "projects_delete_creators_or_admins"
on public.projects
for delete
to authenticated
using (public.has_workspace_permission(workspace_id, 'projects.manage'));

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
      and public.has_workspace_permission(p.workspace_id, 'projects.view')
  );
$$;

drop policy if exists "project_members_insert_workspace_members" on public.project_members;
create policy "project_members_insert_workspace_members"
on public.project_members
for insert
to authenticated
with check (
  public.is_project_workspace_member(project_id, user_id)
  and exists (
    select 1
    from public.projects p
    where p.id = project_id
      and public.has_workspace_permission(p.workspace_id, 'projects.manage')
  )
);

drop policy if exists "project_members_delete_workspace_members" on public.project_members;
create policy "project_members_delete_workspace_members"
on public.project_members
for delete
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_id
      and public.has_workspace_permission(p.workspace_id, 'projects.manage')
  )
);

grant execute on function public.has_workspace_permission(uuid, text, uuid)
  to authenticated;

notify pgrst, 'reload schema';
