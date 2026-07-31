import Link from "next/link";
import { ArrowLeft, Clock3 } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { TiptapArticle } from "@/doc/TiptapArticle";
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
import { isMissingDocumentVisibilityColumn } from "@/lib/document-visibility";
import {
  coerceTiptapDocument,
  tiptapDocumentText,
} from "@/lib/tiptap-document";
import { createClient } from "@/utils/supabase/server";

type DocumentViewPageProps = {
  params: Promise<{ docId: string }>;
};

function formatDate(value: string | null) {
  if (!value) return "Draft";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default async function DocumentViewPage({ params }: DocumentViewPageProps) {
  const { docId } = await params;
  const documentId = getDocumentIdFromSlugId(docId);
  const requestedSlug = docId.replace(documentId, "").replace(/-+$/g, "").toLowerCase();
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) redirect("/login");

  const { workspace: coreWorkspace, setupError } = await getCoreWorkspace(supabase);
  if (setupError || !coreWorkspace) {
    return <SetupErrorScreen message={setupError ?? "Workspace missing."} />;
  }
  const membership = await getCoreMembership(supabase, coreWorkspace.id, user.id);
  if (!membership) redirect("/");

  const fields = "id, workspace_id, author_id, title, content_json, content_md, visibility, updated_at" as const;
  const { data: visibilityDocument, error } = await supabase
    .from("documents")
    .select(fields)
    .eq("id", documentId)
    .maybeSingle();
  let directDocument = visibilityDocument;
  if (error && isMissingDocumentVisibilityColumn(error)) {
    const { data: legacyDocument, error: legacyError } = await supabase
      .from("documents")
      .select("id, workspace_id, author_id, title, content_json, content_md, updated_at")
      .eq("id", documentId)
      .maybeSingle();
    if (legacyError) throw new Error(legacyError.message);
    directDocument = legacyDocument
      ? { ...legacyDocument, visibility: "workspace" as const }
      : null;
  } else if (error) {
    throw new Error(error.message);
  }

  let document = directDocument;
  if (!document) {
    const { data: visibilityDocuments, error: fallbackError } = await supabase
      .from("documents")
      .select(fields)
      .order("updated_at", { ascending: false });
    let visibleDocuments = visibilityDocuments ?? [];
    if (fallbackError && isMissingDocumentVisibilityColumn(fallbackError)) {
      const { data: legacyDocuments, error: legacyError } = await supabase
        .from("documents")
        .select("id, workspace_id, author_id, title, content_json, content_md, updated_at")
        .order("updated_at", { ascending: false });
      if (legacyError) throw new Error(legacyError.message);
      visibleDocuments = legacyDocuments.map((item) => ({
        ...item,
        visibility: "workspace" as const,
      }));
    } else if (fallbackError) {
      throw new Error(fallbackError.message);
    }
    document = visibleDocuments.find((item) => item.id === documentId) ??
      visibleDocuments.find((item) => requestedSlug && createDocumentSlug(item.title) === requestedSlug) ??
      null;
  }
  if (!document) notFound();

  const canonicalSlug = createDocumentSlugId(document);
  if (docId !== canonicalSlug) redirect(`/docs/${canonicalSlug}`);

  const { data: author, error: authorError } = await supabase
    .from("profiles")
    .select("full_name, username")
    .eq("id", document.author_id)
    .maybeSingle();
  if (authorError) throw new Error(authorError.message);

  const content = coerceTiptapDocument(document.content_json, document.content_md);
  const words = tiptapDocumentText(content).split(/\s+/).filter(Boolean).length;
  const authorLabel = author?.full_name || author?.username || "Studio Hub author";
  const backHref = document.visibility === "public"
    ? "/documents?tab=all"
    : document.visibility === "workspace"
      ? "/documents?tab=workspace"
      : "/documents/mine";

  return (
    <>
      <main className="min-h-screen bg-canvas text-fg">
        <div className="sticky top-0 z-20 border-b border-border bg-canvas/90 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
            <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-semibold text-fg-muted hover:text-fg">
              <ArrowLeft className="size-4" /> Back to articles
            </Link>
            <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold capitalize text-fg-muted">
              {document.visibility === "workspace" ? "Workspace only" : document.visibility}
            </span>
          </div>
        </div>

        <article className="mx-auto max-w-4xl px-6 pb-20 pt-14">
          <header className="mx-auto max-w-3xl border-b border-border pb-10">
            <h1 className="text-5xl font-semibold leading-[1.08] tracking-tight sm:text-7xl">
              {document.title}
            </h1>
            <div className="mt-8 flex items-center gap-4">
              <span className="flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#066555] text-sm font-bold text-primary-fg">
                {authorLabel.slice(0, 1).toUpperCase()}
              </span>
              <div>
                <p className="font-semibold">{authorLabel}</p>
                <p className="mt-1 flex items-center gap-2 text-sm text-fg-muted">
                  <Clock3 className="size-3.5" />
                  {Math.max(1, Math.ceil(words / 200))} min read · {formatDate(document.updated_at)}
                </p>
              </div>
            </div>
          </header>

          <TiptapArticle content={content} hideTitle />
        </article>
      </main>
    </>
  );
}
