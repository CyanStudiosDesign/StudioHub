create extension if not exists pgcrypto with schema extensions;

create table if not exists public.announcements (
  id uuid primary key default extensions.gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  message text not null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint announcements_title_length_check
    check (char_length(btrim(title)) between 2 and 180),
  constraint announcements_message_length_check
    check (char_length(btrim(message)) between 1 and 5000)
);

create table if not exists public.announcement_reads (
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default timezone('utc', now()),
  primary key (announcement_id, user_id)
);

create index if not exists announcements_workspace_created_idx
  on public.announcements(workspace_id, created_at desc);

create index if not exists announcement_reads_user_idx
  on public.announcement_reads(user_id);

drop trigger if exists set_announcements_updated_at on public.announcements;
create trigger set_announcements_updated_at
before update on public.announcements
for each row execute function public.set_updated_at();

alter table public.announcements enable row level security;
alter table public.announcement_reads enable row level security;

drop policy if exists "announcements_select_workspace_members" on public.announcements;
create policy "announcements_select_workspace_members"
on public.announcements
for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "announcements_insert_admins" on public.announcements;
create policy "announcements_insert_admins"
on public.announcements
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.is_workspace_admin(workspace_id)
);

drop policy if exists "announcements_update_admins" on public.announcements;
create policy "announcements_update_admins"
on public.announcements
for update
to authenticated
using (public.is_workspace_admin(workspace_id))
with check (public.is_workspace_admin(workspace_id));

drop policy if exists "announcements_delete_admins" on public.announcements;
create policy "announcements_delete_admins"
on public.announcements
for delete
to authenticated
using (public.is_workspace_admin(workspace_id));

drop policy if exists "announcement_reads_select_own" on public.announcement_reads;
create policy "announcement_reads_select_own"
on public.announcement_reads
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "announcement_reads_insert_own" on public.announcement_reads;
create policy "announcement_reads_insert_own"
on public.announcement_reads
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.announcements a
    where a.id = announcement_id
      and public.is_workspace_member(a.workspace_id)
  )
);

drop policy if exists "announcement_reads_update_own" on public.announcement_reads;
create policy "announcement_reads_update_own"
on public.announcement_reads
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

notify pgrst, 'reload schema';
