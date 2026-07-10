import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/ui/sidebar/AppShell";
import { MarkdownArticle } from "@/doc/markdown-renderer";
import { createClient } from "@/utils/supabase/server";

type DocumentViewPageProps = {
  params: Promise<{ docId: string }>;
};

export default async function DocumentViewPage({
  params,
}: DocumentViewPageProps) {
  const { docId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: document, error } = await supabase
    .from("documents")
    .select("id, workspace_id, author_id, title, content_md, updated_at")
    .eq("id", docId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!document) {
    notFound();
  }

  const { data: author, error: authorError } = await supabase
    .from("profiles")
    .select("full_name, username")
    .eq("id", document.author_id)
    .maybeSingle();

  if (authorError) {
    throw new Error(authorError.message);
  }

  const authorLabel = author?.full_name || author?.username || "Unknown author";

  return (
    <AppShell workspaceId={document.workspace_id}>
      <main className="min-h-screen bg-white text-zinc-950">
      <div className="sticky top-0 z-20 border-b border-zinc-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <Link
              href={`/workspaces/${document.workspace_id}/docs`}
              className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-950"
            >
              Back to docs
            </Link>
            <p className="mt-1 text-xs text-zinc-500">
              Created by {authorLabel}
            </p>
          </div>
          <Link
            href={`/editor?docId=${document.id}`}
            className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            Edit document
          </Link>
        </div>
      </div>

      <MarkdownArticle markdown={document.content_md} />
    </main>
    </AppShell>
  );
}
