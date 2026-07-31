import {
  coerceTiptapDocument,
  getTiptapDocumentTitle,
  tiptapDocumentToMarkdown,
} from "@/lib/tiptap-document";

export async function readDocumentPayload(request: Request) {
  const body = (await request.json()) as {
    workspaceId?: unknown;
    content?: unknown;
    markdown?: unknown;
    title?: unknown;
    folderPath?: unknown;
    visibility?: unknown;
  };

  const workspaceId =
    typeof body.workspaceId === "string" ? body.workspaceId.trim() : "";
  const legacyMarkdown = typeof body.markdown === "string" ? body.markdown : "";
  const structuredContent = body.content;
  const hasStructuredContent =
    structuredContent !== null &&
    typeof structuredContent === "object" &&
    "type" in structuredContent &&
    structuredContent.type === "doc";

  if (!hasStructuredContent && typeof body.markdown !== "string") {
    throw new Error("A TipTap JSON document is required.");
  }

  const content = coerceTiptapDocument(
    hasStructuredContent ? structuredContent : null,
    legacyMarkdown,
  );
  const markdown = tiptapDocumentToMarkdown(content);
  const explicitTitle =
    typeof body.title === "string" ? body.title.trim().slice(0, 180) : "";
  const folderPath =
    typeof body.folderPath === "string" && body.folderPath.trim()
      ? body.folderPath.trim()
      : "/";
  const visibility = ["public", "private", "workspace"].includes(
    typeof body.visibility === "string" ? body.visibility : "",
  )
    ? (body.visibility as "public" | "private" | "workspace")
    : "private";

  return {
    workspaceId,
    content,
    markdown,
    folderPath,
    visibility,
    title: explicitTitle || getTiptapDocumentTitle(content),
  };
}
