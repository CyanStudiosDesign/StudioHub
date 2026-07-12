import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/ui/sidebar/AppShell";
import { createClient } from "@/utils/supabase/server";
import { updateMemberPermissions } from "./actions";

type WorkspaceSettingsPageProps = {
  params: Promise<{ id: string }>;
};

type PermissionRow = {
  workspace_id: string;
  user_id: string;
  can_view_documents: boolean;
  can_manage_documents: boolean;
  can_view_projects: boolean;
  can_manage_projects: boolean;
  can_manage_members: boolean;
  can_view_creatives: boolean;
  can_manage_creatives: boolean;
  can_upload_creatives: boolean;
  can_approve_creatives: boolean;
};

function Toggle({
  name,
  label,
  defaultChecked,
  disabled,
}: {
  name: keyof Omit<PermissionRow, "workspace_id" | "user_id">;
  label: string;
  defaultChecked: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 px-3 py-2 text-sm">
      <span className="text-zinc-700">{label}</span>
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        disabled={disabled}
        className="size-4 accent-zinc-950 disabled:cursor-not-allowed"
      />
    </label>
  );
}

export default async function WorkspaceSettingsPage({
  params,
}: WorkspaceSettingsPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id, name, icon")
    .eq("id", id)
    .maybeSingle();

  if (workspaceError) {
    throw new Error(workspaceError.message);
  }

  if (!workspace) {
    notFound();
  }

  const { data: isOwner, error: ownerError } = await supabase.rpc(
    "is_workspace_owner",
    {
      p_workspace_id: workspace.id,
      p_user_id: user.id,
    },
  );

  if (ownerError) {
    throw new Error(ownerError.message);
  }

  if (!isOwner) {
    redirect(`/workspaces/${workspace.id}`);
  }

  const { data: members, error: membersError } = await supabase
    .from("workspace_members")
    .select("workspace_id, user_id, role, created_at")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: true });

  if (membersError) {
    throw new Error(membersError.message);
  }

  const memberIds = members.map((member) => member.user_id);
  const { data: profiles, error: profilesError } = memberIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, username, email")
        .in("id", memberIds)
    : { data: [], error: null };

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const { data: permissions, error: permissionsError } = await supabase
    .from("workspace_member_permissions")
    .select(
      "workspace_id, user_id, can_view_documents, can_manage_documents, can_view_projects, can_manage_projects, can_manage_members, can_view_creatives, can_manage_creatives, can_upload_creatives, can_approve_creatives",
    )
    .eq("workspace_id", workspace.id);

  if (permissionsError) {
    throw new Error(permissionsError.message);
  }

  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const permissionMap = new Map(
    permissions.map((permission) => [permission.user_id, permission]),
  );

  return (
    <AppShell workspaceId={workspace.id}>
      <main className="min-h-screen px-6 py-10 text-zinc-950">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <Link
              href={`/workspaces/${workspace.id}`}
              className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-950"
            >
              Back to workspace
            </Link>
            <div className="mt-5 flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-zinc-950 text-lg font-semibold text-white">
                {workspace.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500">
                  Owner settings
                </p>
                <h1 className="text-3xl font-semibold tracking-tight">
                  {workspace.name} permissions
                </h1>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {members.map((member) => {
              const profile = profileMap.get(member.user_id);
              const permission = permissionMap.get(member.user_id);
              const isProtectedOwner = member.role === "owner";
              const isAdmin = member.role === "admin" || isProtectedOwner;
              const displayName =
                profile?.full_name || profile?.username || profile?.email;

              return (
                <section
                  key={member.user_id}
                  className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
                >
                  <form action={updateMemberPermissions}>
                    <input
                      type="hidden"
                      name="workspaceId"
                      value={workspace.id}
                    />
                    <input type="hidden" name="userId" value={member.user_id} />

                    <div className="grid gap-5 lg:grid-cols-[1fr_220px_1.4fr_auto] lg:items-start">
                      <div>
                        <p className="font-semibold text-zinc-950">
                          {displayName}
                        </p>
                        <p className="mt-1 text-sm text-zinc-500">
                          @{profile?.username ?? "unknown"} · {profile?.email}
                        </p>
                      </div>

                      <label className="space-y-2 text-sm font-medium text-zinc-700">
                        Role
                        <select
                          name="role"
                          defaultValue={isProtectedOwner ? "admin" : member.role}
                          disabled={isProtectedOwner}
                          className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-950 disabled:cursor-not-allowed disabled:bg-zinc-50"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Administrator</option>
                        </select>
                        {isProtectedOwner ? (
                          <span className="block text-xs text-zinc-400">
                            Workspace owner always has administrator access.
                          </span>
                        ) : null}
                      </label>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <Toggle
                          name="can_view_documents"
                          label="View documents"
                          defaultChecked={
                            isAdmin || (permission?.can_view_documents ?? true)
                          }
                          disabled={isAdmin}
                        />
                        <Toggle
                          name="can_manage_documents"
                          label="Create and edit documents"
                          defaultChecked={
                            isAdmin ||
                            (permission?.can_manage_documents ?? false)
                          }
                          disabled={isAdmin}
                        />
                        <Toggle
                          name="can_view_projects"
                          label="View projects"
                          defaultChecked={
                            isAdmin || (permission?.can_view_projects ?? true)
                          }
                          disabled={isAdmin}
                        />
                        <Toggle
                          name="can_manage_projects"
                          label="Create and assign projects"
                          defaultChecked={
                            isAdmin || (permission?.can_manage_projects ?? false)
                          }
                          disabled={isAdmin}
                        />
                        <Toggle
                          name="can_manage_members"
                          label="Manage members"
                          defaultChecked={
                            isAdmin || (permission?.can_manage_members ?? false)
                          }
                          disabled={isAdmin}
                        />
                        <Toggle
                          name="can_view_creatives"
                          label="View creatives"
                          defaultChecked={
                            isAdmin || (permission?.can_view_creatives ?? true)
                          }
                          disabled={isAdmin}
                        />
                        <Toggle
                          name="can_manage_creatives"
                          label="Manage campaigns"
                          defaultChecked={
                            isAdmin ||
                            (permission?.can_manage_creatives ?? false)
                          }
                          disabled={isAdmin}
                        />
                        <Toggle
                          name="can_upload_creatives"
                          label="Upload creative versions"
                          defaultChecked={
                            isAdmin ||
                            (permission?.can_upload_creatives ?? false)
                          }
                          disabled={isAdmin}
                        />
                        <Toggle
                          name="can_approve_creatives"
                          label="Approve creatives"
                          defaultChecked={
                            isAdmin ||
                            (permission?.can_approve_creatives ?? false)
                          }
                          disabled={isAdmin}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isProtectedOwner}
                        className="h-11 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                </section>
              );
            })}
          </div>
        </div>
      </main>
    </AppShell>
  );
}
