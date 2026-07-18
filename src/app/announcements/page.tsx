import { Megaphone } from "lucide-react";
import { redirect } from "next/navigation";
import AppShell from "@/components/ui/sidebar/AppShell";
import { createClient } from "@/utils/supabase/server";
import { createAnnouncement, markAnnouncementsRead } from "./actions";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AnnouncementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: workspaceMembers, error: membersError } = await supabase
    .from("workspace_members")
    .select("workspace_id, user_id, role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (membersError) {
    throw new Error(membersError.message);
  }

  const workspaceIds = workspaceMembers.map((member) => member.workspace_id);
  const { data: workspaces, error: workspacesError } = workspaceIds.length
    ? await supabase
        .from("workspaces")
        .select("id, name, icon")
        .in("id", workspaceIds)
    : { data: [], error: null };

  if (workspacesError) {
    throw new Error(workspacesError.message);
  }

  const { data: announcements, error: announcementsError } = workspaceIds.length
    ? await supabase
        .from("announcements")
        .select("id, workspace_id, title, message, created_by, created_at, updated_at")
        .in("workspace_id", workspaceIds)
        .order("created_at", { ascending: false })
        .limit(80)
    : { data: [], error: null };

  if (announcementsError) {
    throw new Error(announcementsError.message);
  }

  const announcementIds = announcements.map((announcement) => announcement.id);
  const { data: reads, error: readsError } = announcementIds.length
    ? await supabase
        .from("announcement_reads")
        .select("announcement_id, user_id, read_at")
        .eq("user_id", user.id)
        .in("announcement_id", announcementIds)
    : { data: [], error: null };

  if (readsError) {
    throw new Error(readsError.message);
  }

  const authorIds = Array.from(
    new Set(announcements.map((announcement) => announcement.created_by)),
  );
  const { data: authors, error: authorsError } = authorIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, username, email")
        .in("id", authorIds)
    : { data: [], error: null };

  if (authorsError) {
    throw new Error(authorsError.message);
  }

  const workspaceMap = new Map(workspaces.map((workspace) => [workspace.id, workspace]));
  const authorMap = new Map(authors.map((author) => [author.id, author]));
  const readIds = new Set(reads.map((read) => read.announcement_id));
  const unreadAnnouncements = announcements.filter(
    (announcement) => !readIds.has(announcement.id),
  );
  const adminWorkspaces = workspaceMembers
    .filter((member) => member.role === "owner" || member.role === "admin")
    .map((member) => workspaceMap.get(member.workspace_id))
    .filter((workspace): workspace is NonNullable<typeof workspace> =>
      Boolean(workspace),
    );

  return (
    <AppShell>
      <main className="min-h-screen px-6 py-10 text-zinc-950">
        <div className="mx-auto max-w-5xl space-y-6">
          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="relative flex size-11 items-center justify-center rounded-2xl bg-zinc-950 text-white">
                    <Megaphone className="size-5" />
                    {unreadAnnouncements.length ? (
                      <span className="absolute -right-1 -top-1 size-3 rounded-full bg-red-500 ring-2 ring-white" />
                    ) : null}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-500">
                      Team updates
                    </p>
                    <h1 className="text-3xl font-semibold tracking-tight">
                      Announcements
                    </h1>
                  </div>
                </div>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-600">
                  Workspace owners and administrators can post updates here so
                  every member sees important changes in one place.
                </p>
              </div>

              <form action={markAnnouncementsRead}>
                {unreadAnnouncements.map((announcement) => (
                  <input
                    key={announcement.id}
                    type="hidden"
                    name="announcementId"
                    value={announcement.id}
                  />
                ))}
                <button
                  disabled={!unreadAnnouncements.length}
                  className="h-10 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Mark all read
                </button>
              </form>
            </div>
          </section>

          {adminWorkspaces.length ? (
            <form
              action={createAnnouncement}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
            >
              <h2 className="text-lg font-semibold tracking-tight">
                New announcement
              </h2>
              <div className="mt-4 grid gap-3 md:grid-cols-[220px_1fr]">
                <select
                  name="workspaceId"
                  required
                  className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-950"
                >
                  <option value="">Workspace</option>
                  {adminWorkspaces.map((workspace) => (
                    <option key={workspace.id} value={workspace.id}>
                      {workspace.icon} {workspace.name}
                    </option>
                  ))}
                </select>
                <input
                  name="title"
                  required
                  minLength={2}
                  maxLength={180}
                  placeholder="Announcement title"
                  className="h-11 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-950"
                />
                <textarea
                  name="message"
                  required
                  placeholder="What should everyone know?"
                  className="min-h-28 resize-none rounded-xl border border-zinc-200 px-3 py-3 text-sm outline-none focus:border-zinc-950 md:col-span-2"
                />
              </div>
              <button className="mt-4 h-11 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800">
                Post announcement
              </button>
            </form>
          ) : null}

          <section className="space-y-3">
            {announcements.length ? (
              announcements.map((announcement) => {
                const workspace = workspaceMap.get(announcement.workspace_id);
                const author = authorMap.get(announcement.created_by);
                const unread = !readIds.has(announcement.id);

                return (
                  <article
                    key={announcement.id}
                    className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex gap-4">
                      <div className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-sm font-semibold text-white">
                        {workspace?.icon ?? "!"}
                        {unread ? (
                          <span className="absolute -right-1 -top-1 size-3 rounded-full bg-red-500 ring-2 ring-white" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-semibold tracking-tight">
                            {announcement.title}
                          </h2>
                          {unread ? (
                            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                              New
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-zinc-500">
                          {workspace?.name ?? "Workspace"} ·{" "}
                          {author?.full_name ||
                            author?.username ||
                            author?.email ||
                            "Admin"}{" "}
                          · {formatDate(announcement.created_at)}
                        </p>
                        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                          {announcement.message}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">
                <p className="text-lg font-semibold text-zinc-950">
                  No announcements yet
                </p>
                <p className="mt-2 text-sm text-zinc-500">
                  When an administrator posts an update, it will appear here.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </AppShell>
  );
}
