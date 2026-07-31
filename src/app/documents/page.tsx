import Link from "next/link";
import { BookOpen, PenLine, UserRound } from "lucide-react";
import { redirect } from "next/navigation";
import {
  getCoreMembership,
  getCoreWorkspace,
  SetupErrorScreen,
} from "@/lib/core-workspace";
import { getDocumentHref } from "@/lib/document-paths";
import { isMissingDocumentVisibilityColumn } from "@/lib/document-visibility";
import {
  coerceTiptapDocument,
  tiptapDocumentText,
} from "@/lib/tiptap-document";
import { createClient } from "@/utils/supabase/server";
import { Text } from "@/components/ui/typography/Typography";
import { ArticleTabs } from "./ArticleTabs";

type DocumentsPageProps = {
  searchParams: Promise<{ tab?: string }>;
};

const coverStyles = [
  "from-amber-100 via-orange-50 to-rose-100 text-amber-950 dark:from-[#102820] dark:via-[#0d1715] dark:to-[#151918] dark:text-emerald-50",
  "from-sky-100 via-cyan-50 to-emerald-100 text-sky-950 dark:from-[#12342d] dark:via-[#0c1b18] dark:to-[#111514] dark:text-cyan-50",
  "from-violet-100 via-fuchsia-50 to-pink-100 text-violet-950 dark:from-[#21302c] dark:via-[#121816] dark:to-[#0e1110] dark:text-teal-50",
  "from-lime-100 via-yellow-50 to-orange-100 text-lime-950 dark:from-[#18352d] dark:via-[#101c19] dark:to-[#101312] dark:text-lime-50",
];

function formatDate(value: string | null) {
  if (!value) return "Draft";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function articleExcerpt(
  document: { title: string; content_json: unknown; content_md: string },
) {
  const text = tiptapDocumentText(
    coerceTiptapDocument(document.content_json, document.content_md),
  );
  const withoutTitle = text.toLowerCase().startsWith(document.title.toLowerCase())
    ? text.slice(document.title.length).trim()
    : text;
  return withoutTitle.slice(0, 180) || "Open this article to start reading.";
}

function readTime(
  document: { content_json: unknown; content_md: string },
) {
  const words = tiptapDocumentText(
    coerceTiptapDocument(document.content_json, document.content_md),
  ).split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

export default async function DocumentsPage({ searchParams }: DocumentsPageProps) {
  const { tab } = await searchParams;
  const activeTab = tab === "workspace" ? "workspace" : "all";
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) redirect("/login");

  const { workspace, setupError } = await getCoreWorkspace(supabase);
  if (setupError || !workspace) {
    return <SetupErrorScreen message={setupError ?? "Workspace missing."} />;
  }

  const membership = await getCoreMembership(supabase, workspace.id, user.id);
  if (!membership) redirect("/");

  let query = supabase
    .from("documents")
    .select("id, workspace_id, author_id, title, content_json, content_md, visibility, updated_at")
    .order("updated_at", { ascending: false });

  query = activeTab === "all"
    ? query.eq("visibility", "public")
    : query.eq("workspace_id", workspace.id).eq("visibility", "workspace");

  const { data: visibilityDocuments, error } = await query;
  let documents = visibilityDocuments ?? [];

  if (error && isMissingDocumentVisibilityColumn(error)) {
    if (activeTab === "all") {
      documents = [];
    } else {
      const { data: legacyDocuments, error: legacyError } = await supabase
        .from("documents")
        .select("id, workspace_id, author_id, title, content_json, content_md, updated_at")
        .eq("workspace_id", workspace.id)
        .order("updated_at", { ascending: false });
      if (legacyError) throw new Error(legacyError.message);
      documents = legacyDocuments.map((document) => ({
        ...document,
        visibility: "workspace" as const,
      }));
    }
  } else if (error) {
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
  return (
    <>
      <main className="min-h-screen bg-canvas text-fg">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
          <header className="flex flex-col gap-7 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Text variant="overline" className="tracking-[0.18em] text-fg-subtle">
                Studio Hub Journal
              </Text>
              <Text variant="h1" className="mt-3 text-5xl font-semibold tracking-tight text-fg sm:text-6xl">
                Ideas worth sharing.
              </Text>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-fg-muted">
                Read public stories from across Studio Hub or switch to your workspace’s private knowledge.
              </p>
            </div>
            <Link
              href="/documents/mine"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-border-strong bg-surface px-5 text-sm font-semibold text-fg transition hover:border-primary hover:bg-subtle"
            >
              <UserRound className="size-4" />
              My articles
            </Link>
          </header>

          <nav className="border-b border-border" aria-label="Article visibility">
            <ArticleTabs activeTab={activeTab} />
          </nav>

          {documents.length ? (
            <section className="py-10">
              <div className="mb-7 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-fg-subtle">Latest</p>
                  <h2 className="mt-2 text-3xl font-semibold">Latest articles</h2>
                </div>
                <p className="text-sm text-fg-muted">{documents.length} article{documents.length === 1 ? "" : "s"}</p>
              </div>
              <div className="grid gap-x-8 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
                {documents.map((document, index) => {
                  const author = authorMap.get(document.author_id);
                  return (
                    <Link key={document.id} href={getDocumentHref(document)} className="group block">
                      <div className={`flex aspect-[16/10] items-end rounded-3xl bg-gradient-to-br p-6 ${coverStyles[index % coverStyles.length]}`}>
                        <span className="text-6xl font-semibold opacity-20">{document.title.slice(0, 1).toUpperCase()}</span>
                      </div>
                      <h3 className="mt-5 text-2xl font-semibold leading-8 group-hover:underline">{document.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-fg-muted">{articleExcerpt(document)}</p>
                      <p className="mt-4 text-xs font-medium text-fg-muted">
                        {author?.full_name || author?.username || "Studio Hub author"}{" · "}{readTime(document)}{" · "}{formatDate(document.updated_at)}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </section>
          ) : (
            <section className="my-12 rounded-[2rem] border border-dashed border-border-strong bg-surface px-6 py-20 text-center">
              <BookOpen className="mx-auto size-10 text-fg-subtle" />
              <h2 className="mt-5 text-3xl font-semibold">
                {activeTab === "all" ? "No public articles yet" : "No workspace articles yet"}
              </h2>
              <p className="mx-auto mt-3 max-w-md leading-7 text-fg-muted">
                Publish an article from My articles and it will appear in the matching collection.
              </p>
              <Link href="/documents/mine" className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-[#066555] px-5 text-sm font-semibold text-primary-fg">
                <PenLine className="size-4" /> Write an article
              </Link>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
