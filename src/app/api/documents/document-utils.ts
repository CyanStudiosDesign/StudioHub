export function getDocumentTitle(markdown: string) {
  const lines = markdown
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const heading = lines.find((line) => /^#{1,3}\s+/.test(line));
  const title = (heading ?? lines[0] ?? "untitled")
    .replace(/^#{1,6}\s+/, "")
    .replace(/^[-*]\s+/, "")
    .replace(/^>\s+/, "")
    .trim();

  return title.slice(0, 180) || "untitled";
}

export async function readDocumentPayload(request: Request) {
  const body = (await request.json()) as {
    workspaceId?: unknown;
    markdown?: unknown;
    title?: unknown;
    folderPath?: unknown;
  };

  const workspaceId =
    typeof body.workspaceId === "string" ? body.workspaceId.trim() : "";
  const markdown = typeof body.markdown === "string" ? body.markdown : "";
  const explicitTitle =
    typeof body.title === "string" ? body.title.trim().slice(0, 180) : "";
  const folderPath =
    typeof body.folderPath === "string" && body.folderPath.trim()
      ? body.folderPath.trim()
      : "/";

  return {
    workspaceId,
    markdown,
    folderPath,
    title: explicitTitle || getDocumentTitle(markdown),
  };
}
