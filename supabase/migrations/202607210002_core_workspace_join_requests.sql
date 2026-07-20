create table if not exists public.workspace_join_requests (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  requested_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists workspace_join_requests_workspace_status_idx
  on public.workspace_join_requests(workspace_id, status, requested_at desc);

create index if not exists workspace_join_requests_user_idx
  on public.workspace_join_requests(user_id, requested_at desc);

create unique index if not exists workspace_join_requests_one_pending_idx
  on public.workspace_join_requests(workspace_id, user_id)
  where status = 'pending';

drop trigger if exists set_workspace_join_requests_updated_at
  on public.workspace_join_requests;
create trigger set_workspace_join_requests_updated_at
before update on public.workspace_join_requests
for each row
execute function public.set_updated_at();

create or replace function public.get_workspace_by_slug(p_slug text)
returns table (
  id uuid,
  name text,
  slug text,
  icon text,
  description text
)
language sql
security definer
set search_path = public, extensions
stable
as $$
  select
    w.id,
    w.name,
    w.slug::text,
    w.icon,
    w.description
  from public.workspaces w
  where w.slug = p_slug::extensions.citext
    and w.is_deleted = false
  limit 1;
$$;

create or replace function public.request_workspace_join(p_workspace_slug text)
returns public.workspace_join_requests
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  current_user_id uuid := auth.uid();
  target_workspace public.workspaces;
  existing_member public.workspace_members;
  created_request public.workspace_join_requests;
begin
  if current_user_id is null then
    raise exception 'You must be logged in to request workspace access';
  end if;

  select *
  into target_workspace
  from public.workspaces w
  where w.slug = p_workspace_slug::extensions.citext
    and w.is_deleted = false
  limit 1;

  if target_workspace.id is null then
    raise exception 'Core workspace was not found';
  end if;

  select *
  into existing_member
  from public.workspace_members wm
  where wm.workspace_id = target_workspace.id
    and wm.user_id = current_user_id
  limit 1;

  if existing_member.user_id is not null then
    raise exception 'You are already a member of this workspace';
  end if;

  insert into public.workspace_join_requests (
    workspace_id,
    user_id,
    status
  )
  values (
    target_workspace.id,
    current_user_id,
    'pending'
  )
  on conflict (workspace_id, user_id) where status = 'pending'
  do update set
    requested_at = timezone('utc', now()),
    updated_at = timezone('utc', now())
  returning * into created_request;

  return created_request;
end;
$$;

alter table public.workspace_join_requests enable row level security;

drop policy if exists "workspace_join_requests_select" on public.workspace_join_requests;
create policy "workspace_join_requests_select"
on public.workspace_join_requests
for select
to authenticated
using (
  user_id = auth.uid()
  or public.has_workspace_permission(workspace_id, 'members.manage')
);

drop policy if exists "workspace_join_requests_insert_own" on public.workspace_join_requests;
create policy "workspace_join_requests_insert_own"
on public.workspace_join_requests
for insert
to authenticated
with check (
  user_id = auth.uid()
);

drop policy if exists "workspace_join_requests_update_managers" on public.workspace_join_requests;
create policy "workspace_join_requests_update_managers"
on public.workspace_join_requests
for update
to authenticated
using (
  public.has_workspace_permission(workspace_id, 'members.manage')
  or user_id = auth.uid()
)
with check (
  public.has_workspace_permission(workspace_id, 'members.manage')
  or user_id = auth.uid()
);

grant execute on function public.get_workspace_by_slug(text) to authenticated;
grant execute on function public.request_workspace_join(text) to authenticated;

notify pgrst, 'reload schema';
