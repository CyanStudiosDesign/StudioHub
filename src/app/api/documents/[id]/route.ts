import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/action";
import { readDocumentPayload } from "../document-utils";

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

  const { markdown, folderPath, title } = await readDocumentPayload(request);

  const { data: document, error } = await supabase
    .from("documents")
    .update({
      title,
      content_md: markdown,
      folder_path: folderPath,
    })
    .eq("id", id)
    .select("id, title, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ document });
}
