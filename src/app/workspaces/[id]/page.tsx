import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/ui/sidebar/AppShell";
import { createClient } from "@/utils/supabase/server";

type WorkspacePageProps = {
  params: Promise<{ id: string }>;
};

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

  const { data: workspace, error } = await supabase
    .from("workspaces")
    .select("id, name, slug, icon, description, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
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

  const { count: memberCount } = await supabase
    .from("workspace_members")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", workspace.id);

  const { count: projectCount, error: projectCountError } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", workspace.id);

  if (projectCountError) {
    throw new Error(projectCountError.message);
  }

  const { data: documents, error: documentsError } = await supabase
    .from("documents")
    .select("id, title, updated_at, author_id")
    .eq("workspace_id", workspace.id)
    .order("updated_at", { ascending: false })
    .limit(5);

  if (documentsError) {
    throw new Error(documentsError.message);
  }

  const authorIds = Array.from(new Set(documents.map((document) => document.author_id)));
  const { data: authors, error: authorsError } = authorIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, username")
        .in("id", authorIds)
    : { data: [], error: null };

  if (authorsError) {
    throw new Error(authorsError.message);
  }

  const authorMap = new Map(authors.map((author) => [author.id, author]));

  return (
    <AppShell workspaceId={workspace.id}>
      <main className="min-h-screen px-6 py-10 text-zinc-950">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-950"
        >
          Back home
        </Link>

        <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="flex items-start gap-5">
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
              <p className="mt-3 text-sm text-zinc-600">
                {memberCount ?? 1} member{memberCount === 1 ? "" : "s"}
                {" · "}
                {projectCount ?? 0} project{projectCount === 1 ? "" : "s"}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={`/workspaces/${workspace.id}/projects`}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  View projects
                </Link>
                <Link
                  href={`/workspaces/${workspace.id}/docs`}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-700 hover:border-zinc-300 hover:text-zinc-950"
                >
                  View docs
                </Link>
                <Link
                  href={`/editor?workspaceId=${workspace.id}`}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-700 hover:border-zinc-300 hover:text-zinc-950"
                >
                  Create document
                </Link>
                {isOwner ? (
                  <Link
                    href={`/workspaces/${workspace.id}/settings`}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-700 hover:border-zinc-300 hover:text-zinc-950"
                  >
                    Settings
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight">
              Recent documents
            </h2>
            <Link
              href={`/workspaces/${workspace.id}/docs`}
              className="text-sm font-medium text-zinc-500 hover:text-zinc-950"
            >
              See all
            </Link>
          </div>

          {documents.length ? (
            <div className="mt-4 divide-y divide-zinc-100">
              {documents.map((document) => (
                <Link
                  key={document.id}
                  href={`/docs/${document.id}`}
                  className="block py-3 first:pt-0 last:pb-0"
                >
                  <p className="font-medium text-zinc-950">{document.title}</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Created by{" "}
                    {authorMap.get(document.author_id)?.full_name ||
                      authorMap.get(document.author_id)?.username ||
                      "Unknown author"}
                    {" · "}
                    {document.updated_at
                      ? new Intl.DateTimeFormat("en", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(document.updated_at))
                      : "Not saved yet"}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-zinc-300 p-5 text-sm text-zinc-600">
              No documents in this workspace yet.
            </p>
          )}
        </section>
      </div>
    </main>
    </AppShell>
  );
}
