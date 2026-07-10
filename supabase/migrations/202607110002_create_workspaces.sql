create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;

do $$
begin
  create type public.workspace_role as enum ('owner', 'admin', 'member');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.workspaces (
  id uuid primary key default extensions.gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug extensions.citext not null unique,
  icon text not null default 'W',
  description text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint workspaces_name_length_check
    check (char_length(btrim(name)) between 2 and 120),
  constraint workspaces_icon_length_check
    check (char_length(btrim(icon)) between 1 and 32),
  constraint workspaces_slug_format_check
    check (slug::text ~ '^[a-z0-9][a-z0-9-]{2,62}$')
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.workspace_role not null default 'member',
  invited_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (workspace_id, user_id)
);

create index if not exists workspaces_owner_id_idx
  on public.workspaces(owner_id);

create index if not exists workspaces_updated_at_idx
  on public.workspaces(updated_at desc);

create index if not exists workspace_members_user_id_idx
  on public.workspace_members(user_id);

create index if not exists workspace_members_workspace_role_idx
  on public.workspace_members(workspace_id, role);

drop trigger if exists set_workspaces_updated_at on public.workspaces;
create trigger set_workspaces_updated_at
before update on public.workspaces
for each row
execute function public.set_updated_at();

drop trigger if exists set_workspace_members_updated_at on public.workspace_members;
create trigger set_workspace_members_updated_at
before update on public.workspace_members
for each row
execute function public.set_updated_at();

create or replace function public.is_workspace_member(
  p_workspace_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = p_user_id
  );
$$;

create or replace function public.is_workspace_admin(
  p_workspace_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = p_user_id
      and wm.role in ('owner', 'admin')
  );
$$;

create or replace function public.is_workspace_owner(
  p_workspace_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = p_user_id
      and wm.role = 'owner'
  );
$$;

create or replace function public.add_workspace_owner_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.workspace_members (
    workspace_id,
    user_id,
    role,
    invited_by
  )
  values (
    new.id,
    new.owner_id,
    'owner',
    new.owner_id
  )
  on conflict (workspace_id, user_id)
  do update set role = 'owner';

  return new;
end;
$$;

drop trigger if exists on_workspace_created_add_owner on public.workspaces;
create trigger on_workspace_created_add_owner
after insert on public.workspaces
for each row
execute function public.add_workspace_owner_member();

create or replace function public.prevent_workspace_owner_change()
returns trigger
language plpgsql
as $$
begin
  if old.owner_id is distinct from new.owner_id then
    raise exception 'Workspace owner cannot be changed';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_workspace_owner_change on public.workspaces;
create trigger prevent_workspace_owner_change
before update on public.workspaces
for each row
execute function public.prevent_workspace_owner_change();

create or replace function public.prevent_last_workspace_owner_removal()
returns trigger
language plpgsql
as $$
begin
  if old.role = 'owner' then
    raise exception 'Workspace owner membership cannot be removed or demoted';
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists prevent_owner_member_update on public.workspace_members;
create trigger prevent_owner_member_update
before update on public.workspace_members
for each row
when (old.role = 'owner' and new.role is distinct from old.role)
execute function public.prevent_last_workspace_owner_removal();

drop trigger if exists prevent_owner_member_delete on public.workspace_members;
create trigger prevent_owner_member_delete
before delete on public.workspace_members
for each row
when (old.role = 'owner')
execute function public.prevent_last_workspace_owner_removal();

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
  if not public.is_workspace_admin(p_workspace_id, auth.uid()) then
    raise exception 'Only workspace admins can add members';
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

create or replace function public.create_workspace(
  p_name text,
  p_slug text,
  p_icon text default 'W'
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  current_user_id uuid := auth.uid();
  created_workspace_id uuid;
begin
  if current_user_id is null then
    raise exception 'You must be logged in to create a workspace';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = current_user_id
  ) then
    raise exception 'A profile is required before creating a workspace';
  end if;

  insert into public.workspaces (
    owner_id,
    name,
    slug,
    icon
  )
  values (
    current_user_id,
    btrim(p_name),
    p_slug::extensions.citext,
    coalesce(nullif(btrim(p_icon), ''), 'W')
  )
  returning id into created_workspace_id;

  return created_workspace_id;
end;
$$;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

drop policy if exists "workspaces_select_members" on public.workspaces;
create policy "workspaces_select_members"
on public.workspaces
for select
to authenticated
using (public.is_workspace_member(id));

drop policy if exists "workspaces_insert_owner" on public.workspaces;
create policy "workspaces_insert_owner"
on public.workspaces
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "workspaces_update_admins" on public.workspaces;
create policy "workspaces_update_admins"
on public.workspaces
for update
to authenticated
using (public.is_workspace_admin(id))
with check (public.is_workspace_admin(id));

drop policy if exists "workspaces_delete_owners" on public.workspaces;
create policy "workspaces_delete_owners"
on public.workspaces
for delete
to authenticated
using (public.is_workspace_owner(id));

drop policy if exists "workspace_members_select_members" on public.workspace_members;
create policy "workspace_members_select_members"
on public.workspace_members
for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "workspace_members_insert_admins" on public.workspace_members;
create policy "workspace_members_insert_admins"
on public.workspace_members
for insert
to authenticated
with check (
  public.is_workspace_admin(workspace_id)
  and role in ('admin', 'member')
);

drop policy if exists "workspace_members_update_admins" on public.workspace_members;
create policy "workspace_members_update_admins"
on public.workspace_members
for update
to authenticated
using (
  public.is_workspace_admin(workspace_id)
  and role in ('admin', 'member')
)
with check (
  public.is_workspace_admin(workspace_id)
  and role in ('admin', 'member')
);

drop policy if exists "workspace_members_delete_admins" on public.workspace_members;
create policy "workspace_members_delete_admins"
on public.workspace_members
for delete
to authenticated
using (
  public.is_workspace_admin(workspace_id)
  and role in ('admin', 'member')
);

grant execute on function public.is_workspace_member(uuid, uuid) to authenticated;
grant execute on function public.is_workspace_admin(uuid, uuid) to authenticated;
grant execute on function public.is_workspace_owner(uuid, uuid) to authenticated;
grant execute on function public.add_workspace_member_by_email(uuid, text, public.workspace_role) to authenticated;
grant execute on function public.create_workspace(text, text, text) to authenticated;

notify pgrst, 'reload schema';
