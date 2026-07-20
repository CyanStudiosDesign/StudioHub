alter table public.workspaces
add column if not exists is_deleted boolean not null default false,
add column if not exists deleted_at timestamptz,
add column if not exists deleted_by uuid references public.profiles(id) on delete set null;

alter table public.workspaces
drop constraint if exists workspaces_slug_key;

create unique index if not exists workspaces_slug_active_key
on public.workspaces (slug)
where is_deleted = false;

drop index if exists workspaces_active_updated_at_idx;
create index workspaces_active_updated_at_idx
on public.workspaces(updated_at desc)
where is_deleted = false;

drop policy if exists "workspaces_select_members" on public.workspaces;
create policy "workspaces_select_members"
on public.workspaces
for select
to authenticated
using (
  is_deleted = false
  and public.is_workspace_member(id)
);

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

notify pgrst, 'reload schema';
