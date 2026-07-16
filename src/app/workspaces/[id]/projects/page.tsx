import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import AppShell from "@/components/ui/sidebar/AppShell";
import { createClient } from "@/utils/supabase/server";
import {
  assignProjectMember,
  createProject,
  removeProjectMember,
} from "./actions";

type WorkspaceProjectsPageProps = {
  params: Promise<{ id: string }>;
};

type MemberProfile = {
  id: string;
  full_name: string;
  username: string;
  email: string;
};

type ProjectAssignment = {
  project_id: string;
  user_id: string;
  assigned_by: string | null;
  created_at: string;
};

function displayName(member: MemberProfile | undefined) {
  if (!member) return "Unknown member";
  return member.full_name || member.username || member.email;
}

export default async function WorkspaceProjectsPage({
  params,
}: WorkspaceProjectsPageProps) {
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

  const { data: workspaceMembers, error: workspaceMembersError } =
    await supabase
      .from("workspace_members")
      .select("user_id, role")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: true });

  if (workspaceMembersError) {
    throw new Error(workspaceMembersError.message);
  }

  const memberIds = workspaceMembers.map((member) => member.user_id);
  const { data: profiles, error: profilesError } = memberIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, username, email")
        .in("id", memberIds)
    : { data: [], error: null };

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, name, description, status, created_by, updated_at")
    .eq("workspace_id", workspace.id)
    .order("updated_at", { ascending: false });

  if (projectsError) {
    throw new Error(projectsError.message);
  }

  const projectIds = projects.map((project) => project.id);
  const { data: projectMembersData, error: projectMembersError } = projectIds.length
    ? await supabase
        .from("project_members")
        .select("project_id, user_id, assigned_by, created_at")
        .in("project_id", projectIds)
    : { data: [], error: null };

  if (projectMembersError) {
    throw new Error(projectMembersError.message);
  }

  const projectMembers: ProjectAssignment[] = projectMembersData ?? [];
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const projectMembersByProject = projectMembers.reduce<
    Record<string, ProjectAssignment[]>
  >((groups, member) => {
    groups[member.project_id] = groups[member.project_id] ?? [];
    groups[member.project_id].push(member);
    return groups;
  }, {});

  return (
    <AppShell workspaceId={workspace.id}>
      <main className="min-h-screen px-6 py-10 text-zinc-950">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link
                href={`/workspaces/${workspace.id}`}
                aria-label="Back"
                className="inline-flex size-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-950"
              >
                <ArrowLeft className="size-4" />
              </Link>
              <div className="mt-5 flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-zinc-950 text-lg font-semibold text-white">
                  {workspace.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-500">
                    Project tracking
                  </p>
                  <h1 className="text-3xl font-semibold tracking-tight">
                    {workspace.name}
                  </h1>
                </div>
              </div>
            </div>

            <form
              action={createProject}
              className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_1.2fr_auto]"
            >
              <input type="hidden" name="workspaceId" value={workspace.id} />
              <input
                name="name"
                required
                minLength={2}
                maxLength={140}
                placeholder="Project name"
                className="h-11 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-950"
              />
              <input
                name="description"
                placeholder="Short description"
                className="h-11 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-950"
              />
              <button
                type="submit"
                className="h-11 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Create project
              </button>
            </form>
          </div>

          <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold tracking-tight">
              Workspace members
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {workspaceMembers.map((member) => (
                <span
                  key={member.user_id}
                  className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-700"
                >
                  {displayName(profileMap.get(member.user_id))} · {member.role}
                </span>
              ))}
            </div>
          </section>

          {projects.length ? (
            <div className="grid gap-4">
              {projects.map((project) => {
                const assignedMembers =
                  projectMembersByProject[project.id] ?? [];
                const assignedIds = new Set(
                  assignedMembers.map((member) => member.user_id),
                );
                const unassignedMembers = workspaceMembers.filter(
                  (member) => !assignedIds.has(member.user_id),
                );

                return (
                  <section
                    key={project.id}
                    className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl font-semibold tracking-tight">
                            {project.name}
                          </h2>
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            {project.status}
                          </span>
                        </div>
                        {project.description ? (
                          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
                            {project.description}
                          </p>
                        ) : null}
                        <p className="mt-3 text-sm text-zinc-500">
                          Created by {displayName(profileMap.get(project.created_by))}
                        </p>
                        <Link
                          href={`/projects/${project.id}`}
                          className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-700 hover:border-zinc-300 hover:text-zinc-950"
                        >
                          <LayoutDashboard className="size-4" />
                          Open dashboard
                        </Link>
                      </div>

                      <form
                        action={assignProjectMember}
                        className="flex flex-col gap-2 sm:flex-row"
                      >
                        <input
                          type="hidden"
                          name="workspaceId"
                          value={workspace.id}
                        />
                        <input
                          type="hidden"
                          name="projectId"
                          value={project.id}
                        />
                        <select
                          name="userId"
                          required
                          disabled={!unassignedMembers.length}
                          className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <option value="">
                            {unassignedMembers.length
                              ? "Assign member"
                              : "All members assigned"}
                          </option>
                          {unassignedMembers.map((member) => (
                            <option key={member.user_id} value={member.user_id}>
                              {displayName(profileMap.get(member.user_id))}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          disabled={!unassignedMembers.length}
                          className="h-10 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Assign
                        </button>
                      </form>
                    </div>

                    <div className="mt-5">
                      <p className="text-sm font-semibold text-zinc-500">
                        Assigned members
                      </p>
                      {assignedMembers.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {assignedMembers.map((member) => (
                            <form
                              key={member.user_id}
                              action={removeProjectMember}
                            >
                              <input
                                type="hidden"
                                name="workspaceId"
                                value={workspace.id}
                              />
                              <input
                                type="hidden"
                                name="projectId"
                                value={project.id}
                              />
                              <input
                                type="hidden"
                                name="userId"
                                value={member.user_id}
                              />
                              <button
                                type="submit"
                                className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                              >
                                {displayName(profileMap.get(member.user_id))} x
                              </button>
                            </form>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">
                          No members assigned to this project yet.
                        </p>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <section className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
              <h2 className="text-xl font-semibold tracking-tight">
                No projects yet
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-600">
                Create projects to track which workspace members are working on
                each initiative.
              </p>
            </section>
          )}
        </div>
      </main>
    </AppShell>
  );
}
