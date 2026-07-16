create extension if not exists pgcrypto with schema extensions;

do $$
begin
  create type public.project_task_status as enum (
    'backlog',
    'todo',
    'in_progress',
    'blocked',
    'in_review',
    'completed',
    'cancelled'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.project_task_priority as enum (
    'low',
    'medium',
    'high',
    'critical'
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.project_activity_type as enum (
    'project_updated',
    'goal_created',
    'goal_completed',
    'task_created',
    'task_updated',
    'status_changed',
    'member_assigned',
    'deadline_changed',
    'comment_added',
    'attachment_uploaded',
    'subtask_completed',
    'financial_entry_added'
  );
exception when duplicate_object then null;
end $$;

alter table public.projects
  add column if not exists client_name text,
  add column if not exists estimated_deadline date;

alter table public.project_members
  add column if not exists role text not null default 'member',
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

create table if not exists public.project_goals (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text,
  deadline date,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint project_goals_name_length_check
    check (char_length(btrim(name)) between 2 and 180)
);

create table if not exists public.project_tasks (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  goal_id uuid references public.project_goals(id) on delete set null,
  parent_task_id uuid references public.project_tasks(id) on delete cascade,
  title text not null,
  description text,
  status public.project_task_status not null default 'todo',
  priority public.project_task_priority not null default 'medium',
  reporter_id uuid references public.profiles(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  start_date date,
  due_date date,
  estimated_hours numeric(8, 2),
  actual_hours numeric(8, 2),
  labels text[] not null default '{}'::text[],
  block_completion_on_dependencies boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint project_tasks_title_length_check
    check (char_length(btrim(title)) between 2 and 220)
);

create table if not exists public.project_task_assignees (
  task_id uuid not null references public.project_tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (task_id, user_id)
);

create table if not exists public.project_subtasks (
  id uuid primary key default extensions.gen_random_uuid(),
  task_id uuid not null references public.project_tasks(id) on delete cascade,
  title text not null,
  is_completed boolean not null default false,
  completed_by uuid references public.profiles(id) on delete set null,
  completed_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint project_subtasks_title_length_check
    check (char_length(btrim(title)) between 1 and 220)
);

create table if not exists public.project_task_dependencies (
  task_id uuid not null references public.project_tasks(id) on delete cascade,
  depends_on_task_id uuid not null references public.project_tasks(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (task_id, depends_on_task_id),
  constraint project_task_dependencies_no_self_check
    check (task_id <> depends_on_task_id)
);

create table if not exists public.project_comments (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  task_id uuid references public.project_tasks(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint project_comments_message_length_check
    check (char_length(btrim(message)) between 1 and 4000)
);

create table if not exists public.project_attachments (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  task_id uuid references public.project_tasks(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,
  preview_url text,
  file_name text not null,
  file_size bigint,
  mime_type text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.project_financial_entries (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  category text not null,
  amount numeric(12, 2) not null,
  is_revenue boolean not null default false,
  notes text,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint project_financial_entries_title_length_check
    check (char_length(btrim(title)) between 2 and 180)
);

create table if not exists public.project_activity (
  id uuid primary key default extensions.gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  task_id uuid references public.project_tasks(id) on delete cascade,
  goal_id uuid references public.project_goals(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type public.project_activity_type not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists project_goals_project_updated_idx
  on public.project_goals(project_id, updated_at desc);
create index if not exists project_tasks_project_status_idx
  on public.project_tasks(project_id, status, updated_at desc);
create index if not exists project_tasks_goal_idx
  on public.project_tasks(goal_id);
create index if not exists project_tasks_due_date_idx
  on public.project_tasks(project_id, due_date);
create index if not exists project_task_assignees_user_idx
  on public.project_task_assignees(user_id);
create index if not exists project_subtasks_task_idx
  on public.project_subtasks(task_id);
create index if not exists project_comments_task_created_idx
  on public.project_comments(task_id, created_at asc);
create index if not exists project_attachments_task_created_idx
  on public.project_attachments(task_id, created_at desc);
create index if not exists project_financial_entries_project_idx
  on public.project_financial_entries(project_id, created_at desc);
create index if not exists project_activity_project_created_idx
  on public.project_activity(project_id, created_at desc);

drop trigger if exists set_project_goals_updated_at on public.project_goals;
create trigger set_project_goals_updated_at
before update on public.project_goals
for each row execute function public.set_updated_at();

drop trigger if exists set_project_tasks_updated_at on public.project_tasks;
create trigger set_project_tasks_updated_at
before update on public.project_tasks
for each row execute function public.set_updated_at();

drop trigger if exists set_project_subtasks_updated_at on public.project_subtasks;
create trigger set_project_subtasks_updated_at
before update on public.project_subtasks
for each row execute function public.set_updated_at();

drop trigger if exists set_project_financial_entries_updated_at on public.project_financial_entries;
create trigger set_project_financial_entries_updated_at
before update on public.project_financial_entries
for each row execute function public.set_updated_at();

create or replace function public.can_manage_project(p_project_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (
      select
        p.created_by = p_user_id
        or public.is_workspace_admin(p.workspace_id, p_user_id)
        or public.has_workspace_permission(p.workspace_id, 'projects.manage', p_user_id)
      from public.projects p
      where p.id = p_project_id
      limit 1
    ),
    false
  );
$$;

create or replace function public.can_view_project_financials(p_project_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (
      select public.is_workspace_admin(p.workspace_id, p_user_id)
      from public.projects p
      where p.id = p_project_id
      limit 1
    ),
    false
  );
$$;

alter table public.project_goals enable row level security;
alter table public.project_tasks enable row level security;
alter table public.project_task_assignees enable row level security;
alter table public.project_subtasks enable row level security;
alter table public.project_task_dependencies enable row level security;
alter table public.project_comments enable row level security;
alter table public.project_attachments enable row level security;
alter table public.project_financial_entries enable row level security;
alter table public.project_activity enable row level security;

create policy "project_goals_select" on public.project_goals
for select to authenticated
using (public.can_access_project(project_id));
create policy "project_goals_write" on public.project_goals
for all to authenticated
using (public.can_manage_project(project_id))
with check (public.can_manage_project(project_id));

create policy "project_tasks_select" on public.project_tasks
for select to authenticated
using (public.can_access_project(project_id));
create policy "project_tasks_insert" on public.project_tasks
for insert to authenticated
with check (created_by = auth.uid() and public.can_access_project(project_id));
create policy "project_tasks_update" on public.project_tasks
for update to authenticated
using (
  public.can_manage_project(project_id)
  or exists (
    select 1 from public.project_task_assignees pta
    where pta.task_id = id and pta.user_id = auth.uid()
  )
)
with check (
  public.can_manage_project(project_id)
  or exists (
    select 1 from public.project_task_assignees pta
    where pta.task_id = id and pta.user_id = auth.uid()
  )
);

create policy "project_task_assignees_select" on public.project_task_assignees
for select to authenticated
using (exists (select 1 from public.project_tasks t where t.id = task_id and public.can_access_project(t.project_id)));
create policy "project_task_assignees_write" on public.project_task_assignees
for all to authenticated
using (exists (select 1 from public.project_tasks t where t.id = task_id and public.can_manage_project(t.project_id)))
with check (exists (select 1 from public.project_tasks t where t.id = task_id and public.can_manage_project(t.project_id)));

create policy "project_subtasks_select" on public.project_subtasks
for select to authenticated
using (exists (select 1 from public.project_tasks t where t.id = task_id and public.can_access_project(t.project_id)));
create policy "project_subtasks_write" on public.project_subtasks
for all to authenticated
using (exists (select 1 from public.project_tasks t where t.id = task_id and public.can_access_project(t.project_id)))
with check (exists (select 1 from public.project_tasks t where t.id = task_id and public.can_access_project(t.project_id)));

create policy "project_task_dependencies_select" on public.project_task_dependencies
for select to authenticated
using (exists (select 1 from public.project_tasks t where t.id = task_id and public.can_access_project(t.project_id)));
create policy "project_task_dependencies_write" on public.project_task_dependencies
for all to authenticated
using (exists (select 1 from public.project_tasks t where t.id = task_id and public.can_manage_project(t.project_id)))
with check (exists (select 1 from public.project_tasks t where t.id = task_id and public.can_manage_project(t.project_id)));

create policy "project_comments_select" on public.project_comments
for select to authenticated
using (public.can_access_project(project_id));
create policy "project_comments_insert" on public.project_comments
for insert to authenticated
with check (author_id = auth.uid() and public.can_access_project(project_id));

create policy "project_attachments_select" on public.project_attachments
for select to authenticated
using (public.can_access_project(project_id));
create policy "project_attachments_insert" on public.project_attachments
for insert to authenticated
with check (uploaded_by = auth.uid() and public.can_access_project(project_id));

create policy "project_financial_entries_select" on public.project_financial_entries
for select to authenticated
using (public.can_view_project_financials(project_id));
create policy "project_financial_entries_write" on public.project_financial_entries
for all to authenticated
using (public.can_view_project_financials(project_id))
with check (public.can_view_project_financials(project_id));

create policy "project_activity_select" on public.project_activity
for select to authenticated
using (public.can_access_project(project_id));
create policy "project_activity_insert" on public.project_activity
for insert to authenticated
with check (public.can_access_project(project_id));

insert into storage.buckets (id, name, public)
values ('project-attachments', 'project-attachments', true)
on conflict (id) do nothing;

drop policy if exists "project_attachments_read" on storage.objects;
create policy "project_attachments_read" on storage.objects
for select to authenticated
using (bucket_id = 'project-attachments');

drop policy if exists "project_attachments_upload" on storage.objects;
create policy "project_attachments_upload" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'project-attachments'
  and public.can_access_project((storage.foldername(name))[1]::uuid)
);

grant execute on function public.can_manage_project(uuid, uuid) to authenticated;
grant execute on function public.can_view_project_financials(uuid, uuid) to authenticated;

notify pgrst, 'reload schema';
