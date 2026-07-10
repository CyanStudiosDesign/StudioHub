import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/ui/sidebar/AppShell";
import { createClient } from "@/utils/supabase/server";

type WorkspaceDocsPageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(value: string | null) {
  if (!value) return "Not saved yet";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function authorName(
  profile:
    | {
        full_name: string;
        username: string;
      }
    | undefined,
) {
  if (!profile) return "Unknown author";
  return profile.full_name || profile.username;
}

export default async function WorkspaceDocsPage({
  params,
}: WorkspaceDocsPageProps) {
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

  const { data: documents, error: documentsError } = await supabase
    .from("documents")
    .select("id, title, folder_path, updated_at, author_id")
    .eq("workspace_id", workspace.id)
    .order("folder_path", { ascending: true })
    .order("updated_at", { ascending: false });

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
  const folders = documents.reduce<Record<string, typeof documents>>(
    (groups, document) => {
      const folder = document.folder_path || "/";
      groups[folder] = groups[folder] ?? [];
      groups[folder].push(document);
      return groups;
    },
    {},
  );

  return (
    <AppShell workspaceId={workspace.id}>
      <main className="min-h-screen px-6 py-10 text-zinc-950">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
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
                  Documentation
                </p>
                <h1 className="text-3xl font-semibold tracking-tight">
                  {workspace.name}
                </h1>
              </div>
            </div>
          </div>

          <Link
            href={`/editor?workspaceId=${workspace.id}`}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            Create document
          </Link>
        </div>

        {documents.length ? (
          <div className="space-y-6">
            {Object.entries(folders).map(([folder, folderDocuments]) => (
              <section
                key={folder}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-500">
                  <span>Folder</span>
                  <span className="font-mono text-zinc-950">{folder}</span>
                </div>
                <div className="divide-y divide-zinc-100">
                  {folderDocuments.map((document) => (
                    <div
                      key={document.id}
                      className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <Link
                          href={`/docs/${document.id}`}
                          className="font-semibold text-zinc-950 hover:underline"
                        >
                          {document.title}
                        </Link>
                        <p className="mt-1 text-sm text-zinc-500">
                          Created by {authorName(authorMap.get(document.author_id))}
                          {" · "}
                          Updated {formatDate(document.updated_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/editor?docId=${document.id}`}
                          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-950"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/docs/${document.id}`}
                          className="rounded-lg bg-zinc-950 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <section className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
            <h2 className="text-xl font-semibold tracking-tight">
              No documents yet
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-600">
              Create the first markdown document for this workspace. It will be
              visible only to workspace members.
            </p>
            <Link
              href={`/editor?workspaceId=${workspace.id}`}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
            >
              Create document
            </Link>
          </section>
        )}
      </div>
    </main>
    </AppShell>
  );
}
