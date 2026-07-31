import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import MarkdownEditor from "@/editor/MarkdownEditor";
import { coerceTiptapDocument } from "@/lib/tiptap-document";
import { isMissingDocumentVisibilityColumn } from "@/lib/document-visibility";
import {
  getCoreMembership,
  getCoreWorkspace,
  SetupErrorScreen,
} from "@/lib/core-workspace";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
  title: "Document Editor | TuesdaySpace",
  description: "A Notion-inspired TipTap document editor",
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
      <>
        <MarkdownEditor
          workspaceId={workspace.id}
          availableWorkspaces={workspaces}
        />
      </>
    );
  }

  if (docId) {
    const { data: visibilityDocument, error } = await supabase
      .from("documents")
      .select("id, workspace_id, title, content_json, content_md, visibility")
      .eq("id", docId)
      .maybeSingle();

    let document = visibilityDocument;
    if (error && isMissingDocumentVisibilityColumn(error)) {
      const { data: legacyDocument, error: legacyError } = await supabase
        .from("documents")
        .select("id, workspace_id, title, content_json, content_md")
        .eq("id", docId)
        .maybeSingle();
      if (legacyError) throw new Error(legacyError.message);
      document = legacyDocument
        ? { ...legacyDocument, visibility: "workspace" as const }
        : null;
    } else if (error) {
      throw new Error(error.message);
    }

    if (!document) {
      notFound();
    }

    if (document.workspace_id !== workspace.id) {
      notFound();
    }

    return (
      <>
        <MarkdownEditor
          documentId={document.id}
          workspaceId={document.workspace_id}
          initialTitle={document.title}
          initialContent={coerceTiptapDocument(
            document.content_json,
            document.content_md,
          )}
          initialVisibility={document.visibility}
          availableWorkspaces={workspaces}
        />
      </>
    );
  }

  if (!workspaceId) {
    notFound();
  }

  if (workspaceId !== workspace.id) {
    redirect(`/editor?workspaceId=${workspace.id}`);
  }

  return (
    <>
      <MarkdownEditor
        workspaceId={workspace.id}
        availableWorkspaces={workspaces}
      />
    </>
  );
}
