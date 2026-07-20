import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  FileText,
  LayoutDashboard,
  Megaphone,
  PenLine,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import {
  addCoreWorkspaceMemberByEmail,
  approveWorkspaceJoinRequest,
  rejectWorkspaceJoinRequest,
} from "@/app/workspaces/core-actions";
import AppShell from "@/components/ui/sidebar/AppShell";
import {
  canManageWorkspaceMembers,
  getCoreMembership,
  getCoreWorkspace,
  SetupErrorScreen,
} from "@/lib/core-workspace";
import { getDocumentHref } from "@/lib/document-paths";
import { createClient } from "@/utils/supabase/server";

type WorkspacePageProps = {
  params: Promise<{ id: string }>;
};

type MemberProfile = {
  id: string;
  full_name: string;
  username: string;
  email?: string;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "Not updated";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function percent(done: number, total: number) {
  return total ? Math.round((done / total) * 100) : 0;
}

function displayName(profile: MemberProfile | undefined) {
  return profile?.full_name || profile?.username || profile?.email || "Unknown";
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
        {value}
      </p>
      <p className="mt-2 text-sm text-zinc-500">{detail}</p>
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-dashed border-zinc-300 p-5 text-sm text-zinc-500">
      {text}
    </p>
  );
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { workspace: coreWorkspace, setupError } =
    await getCoreWorkspace(supabase);

  if (setupError || !coreWorkspace) {
    return <SetupErrorScreen message={setupError ?? "Workspace missing."} />;
  }

  if (id !== coreWorkspace.id) {
    redirect(`/workspaces/${coreWorkspace.id}`);
  }

  const membership = await getCoreMembership(supabase, coreWorkspace.id, user.id);

  if (!membership) {
    redirect("/");
  }

  const { data: workspace, error } = await supabase
    .from("workspaces")
    .select("id, name, slug, icon, description, created_at, updated_at")
    .eq("id", id)
    .eq("is_deleted", false)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!workspace) {
    notFound();
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc(
    "is_workspace_admin",
    {
      p_workspace_id: workspace.id,
      p_user_id: user.id,
    },
  );

  if (adminError) {
    throw new Error(adminError.message);
  }

  const canManageMembers = await canManageWorkspaceMembers(
    supabase,
    workspace.id,
    user.id,
  );

  const { data: members, error: membersError } = await supabase
    .from("workspace_members")
    .select("workspace_id, user_id, role, created_at")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: true });

  if (membersError) {
    throw new Error(membersError.message);
  }

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, name, description, status, created_by, updated_at")
    .eq("workspace_id", workspace.id)
    .order("updated_at", { ascending: false })
    .limit(8);

  if (projectsError) {
    throw new Error(projectsError.message);
  }

  const { data: documents, error: documentsError } = await supabase
    .from("documents")
    .select("id, title, updated_at, author_id")
    .eq("workspace_id", workspace.id)
    .order("updated_at", { ascending: false })
    .limit(6);

  if (documentsError) {
    throw new Error(documentsError.message);
  }

  const { data: creativeCampaigns, error: creativeCampaignsError } =
    await supabase
      .from("creative_campaigns")
      .select("id, title, status, updated_at")
      .eq("workspace_id", workspace.id)
      .order("updated_at", { ascending: false })
      .limit(6);

  if (creativeCampaignsError) {
    throw new Error(creativeCampaignsError.message);
  }

  const { data: announcements, error: announcementsError } = await supabase
    .from("announcements")
    .select("id, title, message, created_by, created_at")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false })
    .limit(5);

  if (announcementsError) {
    throw new Error(announcementsError.message);
  }

  const { data: projectTasks, error: projectTasksError } = await supabase
    .from("project_tasks")
    .select("id, project_id, title, status, priority, due_date, updated_at")
    .eq("workspace_id", workspace.id)
    .order("updated_at", { ascending: false })
    .limit(80);

  if (projectTasksError) {
    throw new Error(projectTasksError.message);
  }

  const { data: joinRequests, error: joinRequestsError } = canManageMembers
    ? await supabase
        .from("workspace_join_requests")
        .select("id, workspace_id, user_id, status, requested_at, reviewed_at")
        .eq("workspace_id", workspace.id)
        .in("status", ["pending", "rejected"])
        .order("requested_at", { ascending: false })
    : { data: [], error: null };

  if (joinRequestsError) {
    throw new Error(joinRequestsError.message);
  }

  const creativeCampaignIds = creativeCampaigns.map((campaign) => campaign.id);
  const { data: creativePosts, error: creativePostsError } =
    creativeCampaignIds.length
      ? await supabase
          .from("creative_posts")
          .select("id, campaign_id, current_status")
          .in("campaign_id", creativeCampaignIds)
      : { data: [], error: null };

  if (creativePostsError) {
    throw new Error(creativePostsError.message);
  }

  const profileIds = Array.from(
    new Set([
      ...members.map((member) => member.user_id),
      ...joinRequests.map((request) => request.user_id),
      ...projects.map((project) => project.created_by),
      ...documents.map((document) => document.author_id),
      ...announcements.map((announcement) => announcement.created_by),
    ]),
  );
  const { data: profiles, error: profilesError } = profileIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, username, email")
        .in("id", profileIds)
    : { data: [], error: null };

  if (profilesError) {
    throw new Error(profilesError.message);
  }

  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const completedTasks = projectTasks.filter(
    (task) => task.status === "completed",
  ).length;
  const blockedTasks = projectTasks.filter((task) => task.status === "blocked").length;
  const activeProjects = projects.filter((project) => project.status === "active");
  const completedCreatives = creativePosts.filter((post) =>
    ["selected", "published", "rejected"].includes(post.current_status),
  ).length;
  const creativeProgress = percent(completedCreatives, creativePosts.length);
  const taskProgress = percent(completedTasks, projectTasks.length);
  const recentActivity = [
    ...documents.map((document) => ({
      id: `doc-${document.id}`,
      title: `Document updated: ${document.title}`,
      meta: `${displayName(profileMap.get(document.author_id))} · ${formatDate(document.updated_at)}`,
      href: getDocumentHref(document),
    })),
    ...projects.map((project) => ({
      id: `project-${project.id}`,
      title: `Project updated: ${project.name}`,
      meta: `${project.status} · ${formatDate(project.updated_at)}`,
      href: `/projects/${project.id}`,
    })),
    ...announcements.map((announcement) => ({
      id: `announcement-${announcement.id}`,
      title: `Announcement: ${announcement.title}`,
      meta: `${displayName(profileMap.get(announcement.created_by))} · ${formatDate(announcement.created_at)}`,
      href: "/announcements",
    })),
  ].slice(0, 8);

  return (
    <AppShell workspaceId={workspace.id}>
      <main className="min-h-screen px-6 py-10 text-zinc-950">
        <div className="mx-auto max-w-7xl space-y-6">
          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <Link
              href="/"
              aria-label="Back"
              className="inline-flex size-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-950"
            >
              <ArrowLeft className="size-4" />
            </Link>

            <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex gap-5">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-2xl font-semibold text-white">
                  {workspace.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-500">
                    {workspace.slug}
                  </p>
                  <h1 className="mt-1 text-4xl font-semibold tracking-tight">
                    {workspace.name}
                  </h1>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">
                    {workspace.description ||
                      "A central dashboard for projects, documents, creative assets, members, and team announcements."}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/workspaces/${workspace.id}/projects`}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  <LayoutDashboard className="size-4" />
                  Projects
                </Link>
                <Link
                  href={`/editor?workspaceId=${workspace.id}`}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-700 hover:border-zinc-300 hover:text-zinc-950"
                >
                  <Plus className="size-4" />
                  New doc
                </Link>
                {isAdmin ? (
                  <Link
                    href={`/workspaces/${workspace.id}/settings`}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-700 hover:border-zinc-300 hover:text-zinc-950"
                  >
                    <Settings className="size-4" />
                    Settings
                  </Link>
                ) : null}
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Members"
              value={members.length}
              detail={`${members.filter((member) => member.role === "admin" || member.role === "owner").length} admins`}
            />
            <StatCard
              label="Projects"
              value={projects.length}
              detail={`${activeProjects.length} active right now`}
            />
            <StatCard
              label="Tasks"
              value={`${taskProgress}%`}
              detail={`${completedTasks} / ${projectTasks.length} completed`}
            />
            <StatCard
              label="Creatives"
              value={`${creativeProgress}%`}
              detail={`${completedCreatives} / ${creativePosts.length} reviewed`}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
            <div className="space-y-6">
              <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">
                      Project command center
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      Workspace-level view of delivery progress and blockers.
                    </p>
                  </div>
                  <Link
                    href={`/workspaces/${workspace.id}/projects`}
                    className="text-sm font-semibold text-zinc-500 hover:text-zinc-950"
                  >
                    See all
                  </Link>
                </div>

                {projects.length ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {projects.slice(0, 4).map((project) => {
                      const projectTaskList = projectTasks.filter(
                        (task) => task.project_id === project.id,
                      );
                      const done = projectTaskList.filter(
                        (task) => task.status === "completed",
                      ).length;
                      const progress = percent(done, projectTaskList.length);

                      return (
                        <Link
                          key={project.id}
                          href={`/projects/${project.id}`}
                          className="rounded-2xl border border-zinc-200 p-4 transition hover:border-zinc-300 hover:bg-zinc-50"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="font-semibold text-zinc-950">
                                {project.name}
                              </h3>
                              <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                                {project.description || "No description"}
                              </p>
                            </div>
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              {project.status}
                            </span>
                          </div>
                          <div className="mt-4">
                            <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
                              <span>{done} / {projectTaskList.length} tasks</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-zinc-100">
                              <div
                                className="h-2 rounded-full bg-zinc-950"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyCard text="No projects yet. Create a project to start tracking delivery work." />
                )}
              </section>

              <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold tracking-tight">
                    Recent activity
                  </h2>
                  <span className="text-sm text-zinc-500">
                    {blockedTasks} blocked tasks
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {recentActivity.length ? (
                    recentActivity.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        className="block rounded-xl bg-zinc-50 px-3 py-3 transition hover:bg-zinc-100"
                      >
                        <p className="text-sm font-semibold text-zinc-950">
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">{item.meta}</p>
                      </Link>
                    ))
                  ) : (
                    <EmptyCard text="No recent activity yet." />
                  )}
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              {canManageMembers ? (
                <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold tracking-tight">
                        Access requests
                      </h2>
                      <p className="mt-1 text-sm text-zinc-500">
                        Approve new members or review rejected requests.
                      </p>
                    </div>
                    <Users className="size-5 text-zinc-400" />
                  </div>

                  <form
                    action={addCoreWorkspaceMemberByEmail}
                    className="mt-4 flex gap-2"
                  >
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="Add member by email"
                      className="h-10 min-w-0 flex-1 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-950"
                    />
                    <button className="h-10 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800">
                      Add
                    </button>
                  </form>

                  <div className="mt-5 space-y-2">
                    {joinRequests.length ? (
                      joinRequests.map((request) => {
                        const requestProfile = profileMap.get(request.user_id);
                        const isRejected = request.status === "rejected";

                        return (
                          <div
                            key={request.id}
                            className="rounded-xl bg-zinc-50 p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-zinc-950">
                                  {displayName(requestProfile)}
                                </p>
                                <p className="mt-1 text-xs text-zinc-500">
                                  @{requestProfile?.username ?? "unknown"} ·{" "}
                                  {formatDate(request.requested_at)}
                                </p>
                              </div>
                              <span
                                className={
                                  isRejected
                                    ? "rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700"
                                    : "rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700"
                                }
                              >
                                {request.status}
                              </span>
                            </div>
                            <div className="mt-3 flex gap-2">
                              <form action={approveWorkspaceJoinRequest}>
                                <input
                                  type="hidden"
                                  name="requestId"
                                  value={request.id}
                                />
                                <button className="h-9 rounded-lg bg-zinc-950 px-3 text-xs font-semibold text-white hover:bg-zinc-800">
                                  Approve
                                </button>
                              </form>
                              {!isRejected ? (
                                <form action={rejectWorkspaceJoinRequest}>
                                  <input
                                    type="hidden"
                                    name="requestId"
                                    value={request.id}
                                  />
                                  <button className="h-9 rounded-lg border border-zinc-200 px-3 text-xs font-semibold text-zinc-700 hover:border-red-200 hover:text-red-700">
                                    Reject
                                  </button>
                                </form>
                              ) : null}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <EmptyCard text="No pending or rejected access requests." />
                    )}
                  </div>
                </section>
              ) : null}

              <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-semibold tracking-tight">
                    Workspace options
                  </h2>
                  <Users className="size-5 text-zinc-400" />
                </div>
                <div className="mt-4 grid gap-2">
                  <Link
                    href={`/workspaces/${workspace.id}/docs`}
                    className="flex items-center gap-3 rounded-xl bg-zinc-50 px-3 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                  >
                    <FileText className="size-4" />
                    Documents
                  </Link>
                  <Link
                    href="/creatives"
                    className="flex items-center gap-3 rounded-xl bg-zinc-50 px-3 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                  >
                    <Megaphone className="size-4" />
                    Creative campaigns
                  </Link>
                  <Link
                    href="/announcements"
                    className="flex items-center gap-3 rounded-xl bg-zinc-50 px-3 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                  >
                    <Bell className="size-4" />
                    Announcements
                  </Link>
                  <Link
                    href={`/editor?workspaceId=${workspace.id}`}
                    className="flex items-center gap-3 rounded-xl bg-zinc-50 px-3 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                  >
                    <PenLine className="size-4" />
                    Create document
                  </Link>
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-semibold tracking-tight">
                    Members
                  </h2>
                  {isAdmin ? (
                    <Link
                      href={`/workspaces/${workspace.id}/settings`}
                      className="text-sm font-semibold text-zinc-500 hover:text-zinc-950"
                    >
                      Manage
                    </Link>
                  ) : null}
                </div>
                <div className="mt-4 space-y-2">
                  {members.slice(0, 6).map((member) => {
                    const profile = profileMap.get(member.user_id);
                    return (
                      <div
                        key={member.user_id}
                        className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-semibold text-zinc-950">
                            {displayName(profile)}
                          </p>
                          <p className="text-xs text-zinc-500">
                            @{profile?.username ?? "unknown"}
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-zinc-500 ring-1 ring-zinc-200">
                          {member.role}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-semibold tracking-tight">
                    Announcements
                  </h2>
                  <Link
                    href="/announcements"
                    className="text-sm font-semibold text-zinc-500 hover:text-zinc-950"
                  >
                    Open
                  </Link>
                </div>
                <div className="mt-4 space-y-3">
                  {announcements.length ? (
                    announcements.slice(0, 3).map((announcement) => (
                      <Link
                        key={announcement.id}
                        href="/announcements"
                        className="block rounded-xl bg-zinc-50 px-3 py-3 hover:bg-zinc-100"
                      >
                        <p className="text-sm font-semibold text-zinc-950">
                          {announcement.title}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">
                          {announcement.message}
                        </p>
                      </Link>
                    ))
                  ) : (
                    <EmptyCard text="No announcements yet." />
                  )}
                </div>
              </section>
            </aside>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
