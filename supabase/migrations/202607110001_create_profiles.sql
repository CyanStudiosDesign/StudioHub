create extension if not exists citext with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email extensions.citext not null unique,
  username extensions.citext not null unique,
  full_name text not null,
  date_of_birth date not null,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_username_format_check
    check (username::text ~ '^[a-zA-Z0-9_]{3,24}$'),
  constraint profiles_full_name_length_check
    check (char_length(btrim(full_name)) between 2 and 120),
  constraint profiles_date_of_birth_check
    check (date_of_birth <= current_date)
);

create index if not exists profiles_updated_at_idx
  on public.profiles(updated_at desc);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create or replace function public.lookup_profile_by_email(p_email text)
returns table(username text, full_name text)
language sql
security definer
set search_path = public, extensions
stable
as $$
  select p.username::text, p.full_name
  from public.profiles p
  where p.email = p_email::extensions.citext
  limit 1;
$$;

create or replace function public.username_exists(p_username text)
returns boolean
language sql
security definer
set search_path = public, extensions
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.username = p_username::extensions.citext
  );
$$;

grant execute on function public.lookup_profile_by_email(text) to anon, authenticated;
grant execute on function public.username_exists(text) to anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (
    id,
    email,
    username,
    full_name,
    date_of_birth
  )
  values (
    new.id,
    new.email::extensions.citext,
    nullif(btrim(metadata->>'username'), '')::extensions.citext,
    nullif(btrim(metadata->>'full_name'), ''),
    (metadata->>'dob')::date
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  update public.profiles
  set email = new.email::extensions.citext
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
after update of email on auth.users
for each row
when (old.email is distinct from new.email)
execute function public.sync_profile_email();

notify pgrst, 'reload schema';
