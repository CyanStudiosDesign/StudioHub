import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/ui/sidebar/AppShell";
import MarkdownEditor from "@/editor/MarkdownEditor";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
  title: "Markdown Editor | Studio Hub",
  description: "A Notion-inspired live Markdown editor",
};

type EditorPageProps = {
  searchParams: Promise<{
    workspaceId?: string;
    docId?: string;
  }>;
};

export default async function EditorPage({ searchParams }: EditorPageProps) {
  const { workspaceId, docId } = await searchParams;

  if (!workspaceId && !docId) {
    return (
      <AppShell>
        <MarkdownEditor />
      </AppShell>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  if (docId) {
    const { data: document, error } = await supabase
      .from("documents")
      .select("id, workspace_id, title, content_md")
      .eq("id", docId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!document) {
      notFound();
    }

    return (
      <AppShell workspaceId={document.workspace_id}>
        <MarkdownEditor
          documentId={document.id}
          workspaceId={document.workspace_id}
          initialTitle={document.title}
          initialMarkdown={document.content_md}
        />
      </AppShell>
    );
  }

  if (!workspaceId) {
    notFound();
  }

  const { data: workspace, error } = await supabase
    .from("workspaces")
    .select("id")
    .eq("id", workspaceId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!workspace) {
    notFound();
  }

  return (
    <AppShell workspaceId={workspace.id}>
      <MarkdownEditor workspaceId={workspace.id} />
    </AppShell>
  );
}
