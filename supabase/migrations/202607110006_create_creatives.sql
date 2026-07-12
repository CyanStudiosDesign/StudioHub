create extension if not exists pgcrypto with schema extensions;

do $$
begin
  create type public.creative_campaign_status as enum ('active', 'completed', 'archived');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.creative_post_status as enum (
    'draft',
    'improvement_required',
    'selected',
    'rejected',
    'published',
    'archived'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.creative_media_type as enum ('image', 'video', 'pdf', 'other');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.creative_activity_type as enum (
    'campaign_created',
    'post_created',
    'version_uploaded',
    'status_changed',
    'comment_added',
    'creative_selected',
    'creative_rejected',
    'creative_published',
    'assignee_changed'
  );
exception when duplicate_object then null;
end $$;

alter table public.workspace_member_permissions
  add column if not exists can_view_creatives boolean not null default true,
  add column if not exists can_manage_creatives boolean not null default false,
  add column if not exists can_upload_creatives boolean not null default false,
  add column if not exists can_approve_creatives boolean not null default false;

update public.workspace_member_permissions wmp
set
  can_manage_creatives = true,
  can_upload_creatives = true,
  can_approve_creatives = true
from public.workspace_members wm
where wm.workspace_id = wmp.workspace_id
  and wm.user_id = wmp.user_id
  and wm.role in ('owner', 'admin');

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
          when p_permission = 'creatives.view' then wmp.can_view_creatives
          when p_permission = 'creatives.manage' then wmp.can_manage_creatives
          when p_permission = 'creatives.upload' then wmp.can_upload_creatives
          when p_permission = 'creatives.approve' then wmp.can_approve_creatives
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

create table if not exists public.creative_campaigns (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  description text,
  status public.creative_campaign_status not null default 'active',
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint creative_campaigns_title_length_check
    check (char_length(btrim(title)) between 2 and 180)
);

create table if not exists public.creative_posts (
  id uuid primary key default extensions.gen_random_uuid(),
  campaign_id uuid not null references public.creative_campaigns(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  description text,
  owner_id uuid references public.profiles(id) on delete set null,
  current_status public.creative_post_status not null default 'draft',
  current_version_id uuid,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint creative_posts_title_length_check
    check (char_length(btrim(title)) between 2 and 180)
);

create table if not exists public.creative_versions (
  id uuid primary key default extensions.gen_random_uuid(),
  post_id uuid not null references public.creative_posts(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  version_number integer not null,
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,
  preview_url text,
  file_name text not null,
  file_size bigint,
  mime_type text,
  media_type public.creative_media_type not null default 'other',
  notes text,
  is_active_draft boolean not null default true,
  is_approved boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  unique (post_id, version_number)
);

alter table public.creative_posts
  drop constraint if exists creative_posts_current_version_id_fkey;
alter table public.creative_posts
  add constraint creative_posts_current_version_id_fkey
  foreign key (current_version_id)
  references public.creative_versions(id)
  on delete set null;

create unique index if not exists creative_versions_one_approved_idx
  on public.creative_versions(post_id)
  where is_approved;

create table if not exists public.creative_comments (
  id uuid primary key default extensions.gen_random_uuid(),
  version_id uuid not null references public.creative_versions(id) on delete cascade,
  post_id uuid not null references public.creative_posts(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint creative_comments_message_length_check
    check (char_length(btrim(message)) between 1 and 4000)
);

create table if not exists public.creative_tags (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  color text not null default '#18181b',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, name)
);

create table if not exists public.creative_post_tags (
  post_id uuid not null references public.creative_posts(id) on delete cascade,
  tag_id uuid not null references public.creative_tags(id) on delete cascade,
  primary key (post_id, tag_id)
);

create table if not exists public.creative_post_assignees (
  post_id uuid not null references public.creative_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (post_id, user_id)
);

create table if not exists public.creative_activity (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  campaign_id uuid references public.creative_campaigns(id) on delete cascade,
  post_id uuid references public.creative_posts(id) on delete cascade,
  version_id uuid references public.creative_versions(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type public.creative_activity_type not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists creative_campaigns_workspace_updated_idx
  on public.creative_campaigns(workspace_id, updated_at desc);
create index if not exists creative_posts_campaign_updated_idx
  on public.creative_posts(campaign_id, updated_at desc);
create index if not exists creative_posts_workspace_status_idx
  on public.creative_posts(workspace_id, current_status);
create index if not exists creative_versions_post_created_idx
  on public.creative_versions(post_id, created_at desc);
create index if not exists creative_comments_version_created_idx
  on public.creative_comments(version_id, created_at asc);
create index if not exists creative_activity_campaign_created_idx
  on public.creative_activity(campaign_id, created_at desc);

drop trigger if exists set_creative_campaigns_updated_at on public.creative_campaigns;
create trigger set_creative_campaigns_updated_at
before update on public.creative_campaigns
for each row execute function public.set_updated_at();

drop trigger if exists set_creative_posts_updated_at on public.creative_posts;
create trigger set_creative_posts_updated_at
before update on public.creative_posts
for each row execute function public.set_updated_at();

create or replace function public.set_creative_version_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  has_approved boolean;
begin
  if new.version_number is null or new.version_number < 1 then
    select coalesce(max(version_number), 0) + 1
    into new.version_number
    from public.creative_versions
    where post_id = new.post_id;
  end if;

  select exists (
    select 1 from public.creative_versions
    where post_id = new.post_id and is_approved
  ) into has_approved;

  if not has_approved then
    update public.creative_versions
    set is_active_draft = false
    where post_id = new.post_id;
    new.is_active_draft = true;
  end if;

  return new;
end;
$$;

drop trigger if exists set_creative_version_number on public.creative_versions;
create trigger set_creative_version_number
before insert on public.creative_versions
for each row execute function public.set_creative_version_number();

alter table public.creative_campaigns enable row level security;
alter table public.creative_posts enable row level security;
alter table public.creative_versions enable row level security;
alter table public.creative_comments enable row level security;
alter table public.creative_tags enable row level security;
alter table public.creative_post_tags enable row level security;
alter table public.creative_post_assignees enable row level security;
alter table public.creative_activity enable row level security;

create policy "creative_campaigns_select" on public.creative_campaigns
for select to authenticated
using (public.has_workspace_permission(workspace_id, 'creatives.view'));
create policy "creative_campaigns_insert" on public.creative_campaigns
for insert to authenticated
with check (created_by = auth.uid() and public.has_workspace_permission(workspace_id, 'creatives.manage'));
create policy "creative_campaigns_update" on public.creative_campaigns
for update to authenticated
using (public.has_workspace_permission(workspace_id, 'creatives.manage'))
with check (public.has_workspace_permission(workspace_id, 'creatives.manage'));

create policy "creative_posts_select" on public.creative_posts
for select to authenticated
using (public.has_workspace_permission(workspace_id, 'creatives.view'));
create policy "creative_posts_insert" on public.creative_posts
for insert to authenticated
with check (created_by = auth.uid() and public.has_workspace_permission(workspace_id, 'creatives.manage'));
create policy "creative_posts_update" on public.creative_posts
for update to authenticated
using (public.has_workspace_permission(workspace_id, 'creatives.manage') or public.has_workspace_permission(workspace_id, 'creatives.approve'))
with check (public.has_workspace_permission(workspace_id, 'creatives.manage') or public.has_workspace_permission(workspace_id, 'creatives.approve'));

create policy "creative_versions_select" on public.creative_versions
for select to authenticated
using (public.has_workspace_permission(workspace_id, 'creatives.view'));
create policy "creative_versions_insert" on public.creative_versions
for insert to authenticated
with check (uploaded_by = auth.uid() and public.has_workspace_permission(workspace_id, 'creatives.upload'));
create policy "creative_versions_update" on public.creative_versions
for update to authenticated
using (public.has_workspace_permission(workspace_id, 'creatives.approve'))
with check (public.has_workspace_permission(workspace_id, 'creatives.approve'));

create policy "creative_comments_select" on public.creative_comments
for select to authenticated
using (public.has_workspace_permission(workspace_id, 'creatives.view'));
create policy "creative_comments_insert" on public.creative_comments
for insert to authenticated
with check (author_id = auth.uid() and public.has_workspace_permission(workspace_id, 'creatives.view'));

create policy "creative_tags_all" on public.creative_tags
for all to authenticated
using (public.has_workspace_permission(workspace_id, 'creatives.view'))
with check (public.has_workspace_permission(workspace_id, 'creatives.manage'));

create policy "creative_post_tags_all" on public.creative_post_tags
for all to authenticated
using (
  exists (
    select 1 from public.creative_posts p
    where p.id = post_id and public.has_workspace_permission(p.workspace_id, 'creatives.view')
  )
)
with check (
  exists (
    select 1 from public.creative_posts p
    where p.id = post_id and public.has_workspace_permission(p.workspace_id, 'creatives.manage')
  )
);

create policy "creative_post_assignees_all" on public.creative_post_assignees
for all to authenticated
using (
  exists (
    select 1 from public.creative_posts p
    where p.id = post_id and public.has_workspace_permission(p.workspace_id, 'creatives.view')
  )
)
with check (
  exists (
    select 1 from public.creative_posts p
    where p.id = post_id and public.has_workspace_permission(p.workspace_id, 'creatives.manage')
  )
);

create policy "creative_activity_select" on public.creative_activity
for select to authenticated
using (public.has_workspace_permission(workspace_id, 'creatives.view'));
create policy "creative_activity_insert" on public.creative_activity
for insert to authenticated
with check (public.has_workspace_permission(workspace_id, 'creatives.view'));

insert into storage.buckets (id, name, public)
values ('creative-assets', 'creative-assets', true)
on conflict (id) do nothing;

drop policy if exists "creative_assets_read" on storage.objects;
create policy "creative_assets_read" on storage.objects
for select to authenticated
using (bucket_id = 'creative-assets');

drop policy if exists "creative_assets_upload" on storage.objects;
create policy "creative_assets_upload" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'creative-assets'
  and public.has_workspace_permission((storage.foldername(name))[1]::uuid, 'creatives.upload')
);

notify pgrst, 'reload schema';
