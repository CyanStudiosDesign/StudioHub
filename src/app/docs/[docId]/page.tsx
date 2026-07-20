import Link from "next/link";
import { ArrowLeft, Clock3, PenLine, UserRound } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/ui/sidebar/AppShell";
import { MarkdownArticle } from "@/doc/markdown-renderer";
import {
  getCoreMembership,
  getCoreWorkspace,
  SetupErrorScreen,
} from "@/lib/core-workspace";
import {
  createDocumentSlug,
  createDocumentSlugId,
  getDocumentIdFromSlugId,
} from "@/lib/document-paths";
import { createClient } from "@/utils/supabase/server";

type DocumentViewPageProps = {
  params: Promise<{ docId: string }>;
};

function formatDate(value: string | null) {
  if (!value) return "Not saved yet";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function DocumentViewPage({
  params,
}: DocumentViewPageProps) {
  const { docId } = await params;
  const documentId = getDocumentIdFromSlugId(docId);
  const requestedSlug = docId
    .replace(documentId, "")
    .replace(/-+$/g, "")
    .toLowerCase();
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

  const membership = await getCoreMembership(supabase, coreWorkspace.id, user.id);

  if (!membership) {
    redirect("/");
  }

  const { data: directDocument, error } = await supabase
    .from("documents")
    .select("id, workspace_id, author_id, title, content_md, updated_at")
    .eq("id", documentId)
    .maybeSingle();
  let document = directDocument;

  if (error) {
    throw new Error(error.message);
  }

  if (!document) {
    const { data: visibleDocuments, error: fallbackError } = await supabase
      .from("documents")
      .select("id, workspace_id, author_id, title, content_md, updated_at")
      .order("updated_at", { ascending: false });

    if (fallbackError) {
      throw new Error(fallbackError.message);
    }

    document =
      visibleDocuments.find((item) => item.id === documentId) ??
      visibleDocuments.find(
        (item) =>
          requestedSlug.length > 0 && createDocumentSlug(item.title) === requestedSlug,
      ) ??
      null;

    if (!document) {
      notFound();
    }
  }

  if (document.workspace_id !== coreWorkspace.id) {
    notFound();
  }

  const canonicalSlug = createDocumentSlugId(document);
  if (docId !== canonicalSlug) {
    redirect(`/docs/${canonicalSlug}`);
  }

  const { data: author, error: authorError } = await supabase
    .from("profiles")
    .select("full_name, username")
    .eq("id", document.author_id)
    .maybeSingle();

  if (authorError) {
    throw new Error(authorError.message);
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id, name, icon")
    .eq("id", document.workspace_id)
    .eq("is_deleted", false)
    .maybeSingle();

  if (workspaceError) {
    throw new Error(workspaceError.message);
  }

  if (!workspace) {
    notFound();
  }

  const authorLabel = author?.full_name || author?.username || "Unknown author";

  return (
    <AppShell workspaceId={document.workspace_id}>
      <main className="min-h-screen bg-zinc-50 text-zinc-950">
        <div className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div className="flex items-center gap-3">
              <Link
                href={`/workspaces/${document.workspace_id}/docs`}
                aria-label="Back to documentation"
                className="inline-flex size-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-950"
              >
                <ArrowLeft className="size-4" />
              </Link>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Documentation
                </p>
                <p className="mt-1 text-sm font-medium text-zinc-700">
                  {workspace.icon} {workspace.name}
                </p>
              </div>
            </div>

            <Link
              href={`/editor?docId=${document.id}`}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
            >
              <PenLine className="size-4" />
              Edit document
            </Link>
          </div>
        </div>

        <section className="mx-auto max-w-6xl px-5 py-8">
          <div className="rounded-3xl border border-zinc-200 bg-white px-6 py-5 shadow-sm">
            <h1 className="text-3xl font-semibold tracking-tight">
              {document.title}
            </h1>
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-zinc-500">
              <span className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5">
                <UserRound className="size-4" />
                {authorLabel}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5">
                <Clock3 className="size-4" />
                Updated {formatDate(document.updated_at)}
              </span>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-16">
          <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm">
            <MarkdownArticle markdown={document.content_md} />
          </div>
        </section>
      </main>
    </AppShell>
  );
}
