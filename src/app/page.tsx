import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  FilePlus,
  FileText,
  LayoutDashboard,
  Megaphone,
  Sparkles,
} from "lucide-react";
import { requestCoreWorkspaceAccess } from "@/app/workspaces/core-actions";
import AppShell from "@/components/ui/sidebar/AppShell";
import {
  getCoreMembership,
  getCoreWorkspace,
  SetupErrorScreen,
} from "@/lib/core-workspace";
import { getDocumentHref } from "@/lib/document-paths";
import { createClient } from "@/utils/supabase/server";

function formatDate(value: string | null | undefined) {
  if (!value) return "Not updated";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-500">
      {text}
    </div>
  );
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

function QuickLink({
  href,
  icon: Icon,
  title,
  description,
  dark,
  hasDot,
}: {
  href: string;
  icon: typeof LayoutDashboard;
  title: string;
  description: string;
  dark?: boolean;
  hasDot?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        dark
          ? "group rounded-2xl bg-zinc-950 p-5 text-white shadow-sm transition hover:bg-zinc-800"
          : "group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className={
            dark
              ? "relative flex size-11 items-center justify-center rounded-xl bg-white/10"
              : "relative flex size-11 items-center justify-center rounded-xl bg-zinc-950 text-white"
          }
        >
          <Icon className="size-5" />
          {hasDot ? (
            <span className="absolute -right-1 -top-1 size-3 rounded-full bg-red-500 ring-2 ring-white" />
          ) : null}
        </div>
        <ArrowUpRight
          className={
            dark
              ? "size-4 text-white/50 transition group-hover:text-white"
              : "size-4 text-zinc-400 transition group-hover:text-zinc-950"
          }
        />
      </div>
      <h2 className="mt-4 text-lg font-semibold tracking-tight">{title}</h2>
      <p
        className={
          dark ? "mt-2 text-sm text-zinc-300" : "mt-2 text-sm text-zinc-500"
        }
      >
        {description}
      </p>
    </Link>
  );
}

function JoinWorkspaceScreen({
  workspace,
  fullName,
  joinStatus,
}: {
  workspace: { id: string; name: string; slug: string; icon: string };
  fullName: string;
  joinStatus?: string;
}) {
  const isPending = joinStatus === "pending";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f7fb] px-6 py-12 text-zinc-950">
      <section className="w-full max-w-3xl rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-zinc-950 text-2xl font-semibold text-white">
          {workspace.icon}
        </div>
        <p className="mt-6 text-sm font-medium text-zinc-500">
          Welcome {fullName}
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          {workspace.name}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-zinc-600">
          This Studio Hub is private. Request access and an administrator with
          member-management permission can approve you.
        </p>

        {isPending ? (
          <div className="mx-auto mt-8 max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
            Your request is waiting for approval.
          </div>
        ) : (
          <form action={requestCoreWorkspaceAccess} className="mt-8">
            <button className="h-12 rounded-xl bg-zinc-950 px-6 text-sm font-semibold text-white transition-colors hover:bg-zinc-800">
              Request to join
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const fullName =
    profile?.full_name ?? user.user_metadata.full_name ?? user.email ?? "there";

  const { workspace, setupError } = await getCoreWorkspace(supabase);

  if (setupError || !workspace) {
    return <SetupErrorScreen message={setupError ?? "Workspace missing."} />;
  }

  const membership = await getCoreMembership(supabase, workspace.id, user.id);

  if (!membership) {
    const { data: joinRequest } = await supabase
      .from("workspace_join_requests")
      .select("status")
      .eq("workspace_id", workspace.id)
      .eq("user_id", user.id)
      .order("requested_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return (
      <JoinWorkspaceScreen
        workspace={workspace}
        fullName={fullName}
        joinStatus={joinRequest?.status}
      />
    );
  }

  const workspaceId = workspace.id;

  const { data: documents } = await supabase
    .from("documents")
    .select("id, title, workspace_id, author_id, updated_at")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false })
    .limit(5);

  const { data: projects } = await supabase
    .from("projects")
    .select("id, workspace_id, name, status, updated_at")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false })
    .limit(5);

  const { data: creativeCampaigns } = await supabase
    .from("creative_campaigns")
    .select("id, workspace_id, title, status, updated_at")
    .eq("workspace_id", workspaceId)
    .order("updated_at", { ascending: false })
    .limit(5);

  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, workspace_id, title, message, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(6);

  const announcementIds =
    announcements?.map((announcement) => announcement.id) ?? [];
  const { data: reads } = announcementIds.length
    ? await supabase
        .from("announcement_reads")
        .select("announcement_id")
        .eq("user_id", user.id)
        .in("announcement_id", announcementIds)
    : { data: [] };
  const readIds = new Set((reads ?? []).map((read) => read.announcement_id));
  const hasUnreadAnnouncements = announcementIds.some((id) => !readIds.has(id));

  return (
    <AppShell workspaceId={workspaceId}>
      <main className="min-h-screen px-6 py-10 text-zinc-950">
        <div className="mx-auto max-w-7xl space-y-6">
          <nav className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
            <Link
              href="/"
              className="flex items-center gap-2 text-base font-semibold tracking-tight"
            >
              <Sparkles className="size-4" />
              Studio Hub
            </Link>

            <Link
              href="/announcements"
              aria-label="Announcements"
              className="relative inline-flex size-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-950"
            >
              <Bell className="size-5" />
              {hasUnreadAnnouncements ? (
                <span className="absolute -right-1 -top-1 size-3 rounded-full bg-red-500 ring-2 ring-white" />
              ) : null}
            </Link>
          </nav>

          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">
                  {workspace.name}
                </p>
                <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                  Hello {fullName}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
                  Open documents, manage projects, review creative work, and
                  read team updates for the core workspace.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[360px]">
                <Link
                  href={`/workspaces/${workspaceId}/projects`}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  <BriefcaseBusiness className="size-4" />
                  Projects
                </Link>
                <Link
                  href={`/editor?workspaceId=${workspaceId}`}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-700 hover:border-zinc-300 hover:text-zinc-950"
                >
                  <FilePlus className="size-4" />
                  New document
                </Link>
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Workspace" value={workspace.name} detail={workspace.slug} />
            <StatCard
              label="Projects"
              value={projects?.length ?? 0}
              detail={`${projects?.filter((project) => project.status === "active").length ?? 0} active recently`}
            />
            <StatCard
              label="Documents"
              value={documents?.length ?? 0}
              detail="Recently updated docs"
            />
            <StatCard
              label="Creative campaigns"
              value={creativeCampaigns?.length ?? 0}
              detail={`${creativeCampaigns?.filter((campaign) => campaign.status === "active").length ?? 0} active campaigns`}
            />
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <QuickLink
              href={`/workspaces/${workspaceId}`}
              icon={LayoutDashboard}
              title="Open workspace"
              description="Go to the core workspace command center."
              dark
            />
            <QuickLink
              href="/announcements"
              icon={Bell}
              title="Announcements"
              description="Read team updates and admin notices."
              hasDot={hasUnreadAnnouncements}
            />
            <QuickLink
              href="/documents"
              icon={FileText}
              title="Documents"
              description="Browse docs or continue writing."
            />
            <QuickLink
              href="/creatives"
              icon={Megaphone}
              title="Creatives"
              description="Review campaigns and asset versions."
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-semibold tracking-tight">
                    Recently updated documents
                  </h2>
                  <Link
                    href="/documents"
                    className="text-sm font-semibold text-zinc-500 hover:text-zinc-950"
                  >
                    Open docs
                  </Link>
                </div>
                <div className="mt-4 space-y-2">
                  {documents?.length ? (
                    documents.map((document) => (
                      <Link
                        key={document.id}
                        href={getDocumentHref(document)}
                        className="flex items-center justify-between gap-4 rounded-xl bg-zinc-50 px-3 py-3 transition hover:bg-zinc-100"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-zinc-950">
                            {document.title}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {workspace.name} · {formatDate(document.updated_at)}
                          </p>
                        </div>
                        <FileText className="size-4 shrink-0 text-zinc-400" />
                      </Link>
                    ))
                  ) : (
                    <EmptyState text="No recent documents yet." />
                  )}
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-semibold tracking-tight">
                    Project shortcuts
                  </h2>
                  <BriefcaseBusiness className="size-5 text-zinc-400" />
                </div>
                <div className="mt-4 space-y-2">
                  {projects?.length ? (
                    projects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="block rounded-xl bg-zinc-50 px-3 py-3 transition hover:bg-zinc-100"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-semibold text-zinc-950">
                            {project.name}
                          </p>
                          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-zinc-500 ring-1 ring-zinc-200">
                            {project.status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">
                          {workspace.name} · {formatDate(project.updated_at)}
                        </p>
                      </Link>
                    ))
                  ) : (
                    <EmptyState text="No project shortcuts yet." />
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-semibold tracking-tight">
                    Announcements
                  </h2>
                  <Link
                    href="/announcements"
                    className="relative text-sm font-semibold text-zinc-500 hover:text-zinc-950"
                  >
                    Open
                    {hasUnreadAnnouncements ? (
                      <span className="absolute -right-2 -top-1 size-2 rounded-full bg-red-500" />
                    ) : null}
                  </Link>
                </div>
                <div className="mt-4 space-y-2">
                  {announcements?.length ? (
                    announcements.slice(0, 4).map((announcement) => {
                      const unread = !readIds.has(announcement.id);
                      return (
                        <Link
                          key={announcement.id}
                          href="/announcements"
                          className="block rounded-xl bg-zinc-50 px-3 py-3 transition hover:bg-zinc-100"
                        >
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-zinc-950">
                              {announcement.title}
                            </p>
                            {unread ? (
                              <span className="size-2 rounded-full bg-red-500" />
                            ) : null}
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">
                            {announcement.message}
                          </p>
                        </Link>
                      );
                    })
                  ) : (
                    <EmptyState text="No announcements yet." />
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-semibold tracking-tight">
                    Creative shortcuts
                  </h2>
                  <Megaphone className="size-5 text-zinc-400" />
                </div>
                <div className="mt-4 space-y-2">
                  {creativeCampaigns?.length ? (
                    creativeCampaigns.map((campaign) => (
                      <Link
                        key={campaign.id}
                        href={`/creatives/${campaign.id}`}
                        className="block rounded-xl bg-zinc-50 px-3 py-3 transition hover:bg-zinc-100"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-semibold text-zinc-950">
                            {campaign.title}
                          </p>
                          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-zinc-500 ring-1 ring-zinc-200">
                            {campaign.status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">
                          {workspace.name} · {formatDate(campaign.updated_at)}
                        </p>
                      </Link>
                    ))
                  ) : (
                    <EmptyState text="No creative campaigns yet." />
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
