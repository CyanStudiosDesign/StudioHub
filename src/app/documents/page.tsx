import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/components/ui/sidebar/AppShell";
import {
  getCoreMembership,
  getCoreWorkspace,
  SetupErrorScreen,
} from "@/lib/core-workspace";
import { getDocumentHref } from "@/lib/document-paths";
import { createClient } from "@/utils/supabase/server";

function formatDate(value: string | null) {
  if (!value) return "Not saved yet";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function DocumentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { workspace, setupError } = await getCoreWorkspace(supabase);

  if (setupError || !workspace) {
    return <SetupErrorScreen message={setupError ?? "Workspace missing."} />;
  }

  const membership = await getCoreMembership(supabase, workspace.id, user.id);

  if (!membership) {
    redirect("/");
  }

  const { data: documents, error } = await supabase
    .from("documents")
    .select("id, workspace_id, author_id, title, folder_path, updated_at")
    .eq("workspace_id", workspace.id)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const authorIds = Array.from(new Set(documents.map((document) => document.author_id)));
  const { data: authors, error: authorsError } = authorIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, username")
        .in("id", authorIds)
    : { data: [], error: null };
  if (authorsError) throw new Error(authorsError.message);

  const authorMap = new Map(authors.map((author) => [author.id, author]));
  const visibleDocuments = documents;

  return (
    <AppShell workspaceId={workspace.id}>
      <main className="min-h-screen px-6 py-10 text-zinc-950">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">
              Library
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              Documents
            </h1>
          </div>

          {visibleDocuments.length ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="divide-y divide-zinc-100">
                {visibleDocuments.map((document) => {
                  const author = authorMap.get(document.author_id);
                  return (
                    <div
                      key={document.id}
                      className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <Link
                        href={getDocumentHref(document)}
                        className="flex min-w-0 flex-1 gap-4 rounded-xl transition-colors hover:bg-zinc-50"
                      >
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-sm font-semibold text-white">
                          {workspace.icon}
                        </div>
                        <div>
                          <p className="font-semibold hover:underline">
                            {document.title}
                          </p>
                          <p className="mt-1 text-sm text-zinc-500">
                            {workspace.name} · Created by{" "}
                            {author?.full_name ||
                              author?.username ||
                              "Unknown author"}{" "}
                            · Updated {formatDate(document.updated_at)}
                          </p>
                        </div>
                      </Link>
                      <Link
                        href={`/editor?docId=${document.id}`}
                        className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-950"
                      >
                        Edit
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-600">
              No documents available yet.
            </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}
