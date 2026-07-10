# Supabase Schema

Run the files in `supabase/migrations` in timestamp order through your Supabase SQL editor or the Supabase CLI.

The schema keeps authentication data in Supabase Auth and app profile data in `public.profiles`:

- `auth.users` stores credentials and sessions.
- `public.profiles` stores one profile row per auth user.
- `profiles.id` is a foreign key to `auth.users.id`.
- `email` and `username` use `citext` so uniqueness is case-insensitive.
- Row level security only allows signed-in users to read and update their own profile.
- `lookup_profile_by_email` and `username_exists` support the email-first login UI without exposing broad table reads.

The workspace schema is normalized into separate entities:

- `public.workspaces` stores the workspace/server itself, including `name`, `slug`, and `icon`.
- `public.workspace_members` stores membership, role, inviter, and timestamps.
- Workspace owners are automatically added as members when a workspace is created.
- Admins can add members by email with `add_workspace_member_by_email`.
- Row level security lets users read workspaces they belong to, while admins manage workspace metadata and members.

Workspace documentation is stored separately:

- `public.documents` stores markdown documents.
- Each document belongs to one workspace and one author profile.
- Workspace members can read and update workspace documents.
- Authors or workspace admins can delete documents.

Project tracking is also normalized:

- `public.projects` stores workspace projects.
- `public.project_members` stores many-to-many assignments between projects and profiles.
- Workspace members can belong to one project, many projects, or no projects.
- Workspace members can view project assignments for their workspace.

Workspace permissions are stored separately:

- `public.workspace_member_permissions` stores Discord-style tool permissions per member.
- Workspace owners can promote members to administrator or toggle document, project, and member-management permissions.
- Administrators bypass individual tool toggles.
- Document/project/member RLS checks these permissions before allowing access or mutations.

To remove the mandatory verification step, open Supabase Dashboard -> Authentication -> Providers -> Email and turn off "Confirm email". The signup action will then sign users in immediately after account creation.
