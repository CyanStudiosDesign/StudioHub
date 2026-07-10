import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/action";
import { readDocumentPayload } from "./document-utils";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { workspaceId, markdown, folderPath, title } =
    await readDocumentPayload(request);

  if (!workspaceId) {
    return NextResponse.json(
      { error: "workspaceId is required" },
      { status: 400 },
    );
  }

  const { data: document, error } = await supabase
    .from("documents")
    .insert({
      workspace_id: workspaceId,
      author_id: user.id,
      title,
      content_md: markdown,
      folder_path: folderPath,
    })
    .select("id, title, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ document });
}
