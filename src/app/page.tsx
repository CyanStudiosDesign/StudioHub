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
  Plus,
  Sparkles,
} from "lucide-react";
import AppShell from "@/components/ui/sidebar/AppShell";
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
      <p className={dark ? "mt-2 text-sm text-zinc-300" : "mt-2 text-sm text-zinc-500"}>
        {description}
      </p>
    </Link>
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

  const { data: workspaces, error: workspacesError } = await supabase
    .from("workspaces")
    .select("id, name, slug, icon, updated_at")
    .order("updated_at", { ascending: false })
    .limit(6);

  if (workspacesError) {
    throw new Error(workspacesError.message);
  }

  const workspaceIds = workspaces.map((workspace) => workspace.id);

  const { data: documents } = workspaceIds.length
    ? await supabase
        .from("documents")
        .select("id, title, workspace_id, author_id, updated_at")
        .in("workspace_id", workspaceIds)
        .order("updated_at", { ascending: false })
        .limit(5)
    : { data: [] };

  const { data: projects } = workspaceIds.length
    ? await supabase
        .from("projects")
        .select("id, workspace_id, name, status, updated_at")
        .in("workspace_id", workspaceIds)
        .order("updated_at", { ascending: false })
        .limit(5)
    : { data: [] };

  const { data: creativeCampaigns } = workspaceIds.length
    ? await supabase
        .from("creative_campaigns")
        .select("id, workspace_id, title, status, updated_at")
        .in("workspace_id", workspaceIds)
        .order("updated_at", { ascending: false })
        .limit(5)
    : { data: [] };

  const { data: announcements } = workspaceIds.length
    ? await supabase
        .from("announcements")
        .select("id, workspace_id, title, message, created_at")
        .in("workspace_id", workspaceIds)
        .order("created_at", { ascending: false })
        .limit(6)
    : { data: [] };

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

  const workspaceMap = new Map(
    workspaces.map((workspace) => [workspace.id, workspace]),
  );

  return (
    <AppShell>
      <main className="min-h-screen px-6 py-10 text-zinc-950">
        <div className="mx-auto max-w-7xl space-y-6">
          <nav className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
            <Link href="/" className="flex items-center gap-2 text-base font-semibold tracking-tight">
              <Sparkles className="size-4" />
              Studio Hub
            </Link>

            <div className="flex items-center gap-3">
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
              <Link
                href="/workspaces/new"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
              >
                <Plus className="size-4" />
                Workspace
              </Link>
            </div>
          </nav>

          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">
                  Command dashboard
                </p>
                <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                  Hello {fullName}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
                  Jump into workspaces, create documents, review creative work,
                  and catch team updates without digging through the sidebar.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[360px]">
                <Link
                  href="/workspaces/new"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  <Plus className="size-4" />
                  New workspace
                </Link>
                <Link
                  href="/editor"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-700 hover:border-zinc-300 hover:text-zinc-950"
                >
                  <FilePlus className="size-4" />
                  New document
                </Link>
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Workspaces"
              value={workspaces.length}
              detail="Active places you can open"
            />
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
              href={workspaces[0] ? `/workspaces/${workspaces[0].id}` : "/workspaces"}
              icon={LayoutDashboard}
              title="Open workspace"
              description="Go straight to your latest workspace dashboard."
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
                    Workspaces
                  </h2>
                  <Link
                    href="/workspaces"
                    className="text-sm font-semibold text-zinc-500 hover:text-zinc-950"
                  >
                    See all
                  </Link>
                </div>

                {workspaces.length ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {workspaces.map((workspace) => (
                      <Link
                        key={workspace.id}
                        href={`/workspaces/${workspace.id}`}
                        className="rounded-2xl border border-zinc-200 p-4 transition hover:border-zinc-300 hover:bg-zinc-50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex size-12 items-center justify-center rounded-xl bg-zinc-950 text-lg font-semibold text-white">
                            {workspace.icon}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-zinc-950">
                              {workspace.name}
                            </p>
                            <p className="mt-1 truncate text-sm text-zinc-500">
                              {workspace.slug}
                            </p>
                          </div>
                        </div>
                        <p className="mt-4 text-xs text-zinc-400">
                          Updated {formatDate(workspace.updated_at)}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <EmptyState text="No workspaces yet. Create one to start organizing your team." />
                )}
              </section>

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
                    documents.map((document) => {
                      const workspace = workspaceMap.get(document.workspace_id);
                      return (
                        <Link
                          key={document.id}
                          href={`/docs/${document.id}`}
                          className="flex items-center justify-between gap-4 rounded-xl bg-zinc-50 px-3 py-3 transition hover:bg-zinc-100"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-zinc-950">
                              {document.title}
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                              {workspace?.name ?? "Workspace"} ·{" "}
                              {formatDate(document.updated_at)}
                            </p>
                          </div>
                          <FileText className="size-4 shrink-0 text-zinc-400" />
                        </Link>
                      );
                    })
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
                    projects.map((project) => {
                      const workspace = workspaceMap.get(project.workspace_id);
                      return (
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
                            {workspace?.name ?? "Workspace"} ·{" "}
                            {formatDate(project.updated_at)}
                          </p>
                        </Link>
                      );
                    })
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
                      const workspace = workspaceMap.get(announcement.workspace_id);
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
                            {workspace?.name ?? "Workspace"} · {announcement.message}
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
                    creativeCampaigns.map((campaign) => {
                      const workspace = workspaceMap.get(campaign.workspace_id);
                      return (
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
                            {workspace?.name ?? "Workspace"} ·{" "}
                            {formatDate(campaign.updated_at)}
                          </p>
                        </Link>
                      );
                    })
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
