import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/ui/sidebar/AppShell";
import MarkdownEditor from "@/editor/MarkdownEditor";
import {
  getCoreMembership,
  getCoreWorkspace,
  SetupErrorScreen,
} from "@/lib/core-workspace";
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

  const workspaces = [workspace];

  if (!workspaceId && !docId) {
    return (
      <AppShell workspaceId={workspace.id}>
        <MarkdownEditor
          workspaceId={workspace.id}
          availableWorkspaces={workspaces}
        />
      </AppShell>
    );
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

    if (document.workspace_id !== workspace.id) {
      notFound();
    }

    return (
      <AppShell workspaceId={document.workspace_id}>
        <MarkdownEditor
          documentId={document.id}
          workspaceId={document.workspace_id}
          initialTitle={document.title}
          initialMarkdown={document.content_md}
          availableWorkspaces={workspaces}
        />
      </AppShell>
    );
  }

  if (!workspaceId) {
    notFound();
  }

  if (workspaceId !== workspace.id) {
    redirect(`/editor?workspaceId=${workspace.id}`);
  }

  return (
    <AppShell workspaceId={workspace.id}>
      <MarkdownEditor
        workspaceId={workspace.id}
        availableWorkspaces={workspaces}
      />
    </AppShell>
  );
}
