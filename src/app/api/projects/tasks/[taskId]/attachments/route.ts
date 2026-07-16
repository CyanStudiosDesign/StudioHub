import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/action";

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

type AttachmentPayload = {
  projectId?: string;
  storagePath?: string;
  previewUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
};

export async function POST(request: Request, context: RouteContext) {
  const { taskId } = await context.params;
  const payload = (await request.json()) as AttachmentPayload;

  if (!payload.projectId || !payload.storagePath || !payload.fileName) {
    return NextResponse.json(
      { error: "Attachment metadata is required." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: allowed, error: accessError } = await supabase.rpc(
    "can_access_project",
    {
      p_project_id: payload.projectId,
    },
  );

  if (accessError) {
    return NextResponse.json({ error: accessError.message }, { status: 500 });
  }

  if (!allowed) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { error } = await supabase.from("project_attachments").insert({
    project_id: payload.projectId,
    task_id: taskId,
    uploaded_by: user.id,
    storage_path: payload.storagePath,
    preview_url: payload.previewUrl ?? null,
    file_name: payload.fileName,
    file_size: payload.fileSize ?? null,
    mime_type: payload.mimeType ?? null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("project_activity").insert({
    project_id: payload.projectId,
    task_id: taskId,
    actor_id: user.id,
    type: "attachment_uploaded",
    message: `Uploaded attachment "${payload.fileName}".`,
  });

  revalidatePath(`/projects/${payload.projectId}`);

  return NextResponse.json({ ok: true });
}
