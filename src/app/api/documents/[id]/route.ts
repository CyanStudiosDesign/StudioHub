import { NextResponse } from "next/server";
import { getCoreWorkspace } from "@/lib/core-workspace";
import { createClient } from "@/utils/supabase/action";
import { readDocumentPayload } from "../document-utils";
import { isMissingDocumentVisibilityColumn } from "@/lib/document-visibility";

type DocumentRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  { params }: DocumentRouteContext,
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload;
  try {
    payload = await readDocumentPayload(request);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid document payload." },
      { status: 400 },
    );
  }

  const { content, markdown, folderPath, title, visibility } = payload;
  const { workspace, setupError } = await getCoreWorkspace(supabase);

  if (setupError || !workspace) {
    return NextResponse.json(
      { error: setupError ?? "Core workspace is not configured." },
      { status: 500 },
    );
  }

  let saveResult = await supabase
    .from("documents")
    .update({
      title,
      content_json: content,
      content_md: markdown,
      folder_path: folderPath,
      visibility,
    })
    .eq("id", id)
    .eq("workspace_id", workspace.id)
    .select("id, title, updated_at")
    .single();

  if (isMissingDocumentVisibilityColumn(saveResult.error)) {
    saveResult = await supabase
      .from("documents")
      .update({
        title,
        content_json: content,
        content_md: markdown,
        folder_path: folderPath,
      })
      .eq("id", id)
      .eq("workspace_id", workspace.id)
      .select("id, title, updated_at")
      .single();
  }

  const { data: document, error } = saveResult;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ document });
}
