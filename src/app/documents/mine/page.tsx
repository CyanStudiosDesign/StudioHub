import Link from "next/link";
import { BookOpen, Eye, LockKeyhole, PenLine, UsersRound } from "lucide-react";
import { redirect } from "next/navigation";
import {
  getCoreMembership,
  getCoreWorkspace,
  SetupErrorScreen,
} from "@/lib/core-workspace";
import { getDocumentHref } from "@/lib/document-paths";
import { isMissingDocumentVisibilityColumn } from "@/lib/document-visibility";
import { coerceTiptapDocument, tiptapDocumentText } from "@/lib/tiptap-document";
import { createClient } from "@/utils/supabase/server";
import { Card } from "@/components/ui/card/Card";

const visibilityMeta = {
  public: { label: "Public", icon: Eye, className: "bg-success-subtle text-success-strong" },
  private: { label: "Private", icon: LockKeyhole, className: "bg-subtle text-fg-muted" },
  workspace: { label: "Workspace only", icon: UsersRound, className: "bg-info-subtle text-info-strong" },
};

function formatDate(value: string | null) {
  if (!value) return "Draft";
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export default async function MyArticlesPage() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect("/login");

  const { workspace, setupError } = await getCoreWorkspace(supabase);
  if (setupError || !workspace) {
    return <SetupErrorScreen message={setupError ?? "Workspace missing."} />;
  }
  const membership = await getCoreMembership(supabase, workspace.id, user.id);
  if (!membership) redirect("/");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, username, email")
    .eq("id", user.id)
    .single();
  if (profileError) throw new Error(profileError.message);

  const { data: visibilityDocuments, error: documentsError } = await supabase
    .from("documents")
    .select("id, title, content_json, content_md, visibility, updated_at")
    .eq("author_id", user.id)
    .order("updated_at", { ascending: false });
  let documents = visibilityDocuments ?? [];

  if (documentsError && isMissingDocumentVisibilityColumn(documentsError)) {
    const { data: legacyDocuments, error: legacyError } = await supabase
      .from("documents")
      .select("id, title, content_json, content_md, updated_at")
      .eq("author_id", user.id)
      .order("updated_at", { ascending: false });
    if (legacyError) throw new Error(legacyError.message);
    documents = legacyDocuments.map((document) => ({
      ...document,
      visibility: "workspace" as const,
    }));
  } else if (documentsError) {
    throw new Error(documentsError.message);
  }

  const displayName = profile.full_name || profile.username;
  const publicCount = documents.filter((document) => document.visibility === "public").length;
  const totalWords = documents.reduce((total, document) => total + tiptapDocumentText(
    coerceTiptapDocument(document.content_json, document.content_md),
  ).split(/\s+/).filter(Boolean).length, 0);

  return (
    <>
      <main className="min-h-screen bg-canvas text-fg">
        <div className="mx-auto max-w-6xl px-6 py-12 lg:px-10">
          <Card size="xl" variant="glass" className="max-w-none rounded-[2rem]">
            <div className="h-36 bg-gradient-to-r from-[#07110f] via-[#145347] to-[#0a7968]" />
            <div className="px-7 pb-8 sm:px-10">
              <div className="-mt-14 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-end gap-5">
                  <span className="flex size-28 items-center justify-center rounded-full border-8 border-surface bg-subtle text-4xl font-semibold text-fg">
                    {displayName.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="pb-2">
                    <h1 className="text-4xl font-semibold tracking-tight">{displayName}</h1>
                    <p className="mt-1 text-sm text-fg-muted">@{profile.username} · {profile.email}</p>
                  </div>
                </div>
                <Link href={`/editor?workspaceId=${workspace.id}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-[#066555] px-5 text-sm font-semibold text-primary-fg hover:brightness-110">
                  <PenLine className="size-4" /> Write an article
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-8 border-t border-border pt-6 text-sm">
                <p><strong className="text-xl">{documents.length}</strong><span className="ml-2 text-fg-muted">Articles</span></p>
                <p><strong className="text-xl">{publicCount}</strong><span className="ml-2 text-fg-muted">Published</span></p>
                <p><strong className="text-xl">{totalWords.toLocaleString()}</strong><span className="ml-2 text-fg-muted">Words written</span></p>
              </div>
            </div>
          </Card>

          <section className="mt-12">
            <div className="mb-6 flex items-end justify-between border-b border-border pb-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-fg-subtle">Your library</p>
                <h2 className="mt-2 text-3xl font-semibold">All articles</h2>
              </div>
              <Link href="/documents" className="text-sm font-semibold text-fg-muted hover:text-fg">View publication</Link>
            </div>

            {documents.length ? (
              <div className="divide-y divide-border">
                {documents.map((document) => {
                  const meta = visibilityMeta[document.visibility];
                  const VisibilityIcon = meta.icon;
                  const text = tiptapDocumentText(coerceTiptapDocument(document.content_json, document.content_md));
                  const excerpt = text.toLowerCase().startsWith(document.title.toLowerCase())
                    ? text.slice(document.title.length).trim()
                    : text;
                  return (
                    <article key={document.id} className="grid gap-5 py-7 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                      <Link href={getDocumentHref(document)} className="group min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${meta.className}`}>
                            <VisibilityIcon className="size-3.5" /> {meta.label}
                          </span>
                          <span className="text-xs text-fg-subtle">Updated {formatDate(document.updated_at)}</span>
                        </div>
                        <h3 className="mt-3 text-2xl font-semibold group-hover:underline">{document.title}</h3>
                        <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-fg-muted">{excerpt || "No article summary yet."}</p>
                      </Link>
                      <Link href={`/editor?docId=${document.id}`} className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border-strong bg-surface px-4 text-sm font-semibold hover:border-primary hover:bg-subtle">
                        <PenLine className="size-4" /> Edit
                      </Link>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[2rem] border border-dashed border-border-strong bg-surface px-6 py-16 text-center">
                <BookOpen className="mx-auto size-10 text-fg-subtle" />
                <h3 className="mt-5 text-3xl font-semibold">Your first story starts here.</h3>
                <p className="mt-3 text-fg-muted">Create a private draft, share it with your workspace, or publish it for everyone.</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
