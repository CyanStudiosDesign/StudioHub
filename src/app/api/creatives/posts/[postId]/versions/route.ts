import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/action";
import type { Database } from "@/types/supabase";

type RouteContext = {
  params: Promise<{ postId: string }>;
};

type VersionPayload = {
  storagePath?: string;
  previewUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  notes?: string;
};

function mediaTypeFromMime(
  mimeType: string | undefined,
): Database["public"]["Enums"]["creative_media_type"] {
  if (!mimeType) return "other";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf") return "pdf";
  return "other";
}

export async function POST(request: Request, context: RouteContext) {
  const { postId } = await context.params;
  const payload = (await request.json()) as VersionPayload;

  if (!payload.storagePath || !payload.fileName) {
    return NextResponse.json(
      { error: "Uploaded file metadata is required." },
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

  const { data: post, error: postError } = await supabase
    .from("creative_posts")
    .select("id, workspace_id, campaign_id, title, current_status")
    .eq("id", postId)
    .maybeSingle();

  if (postError) {
    return NextResponse.json({ error: postError.message }, { status: 500 });
  }

  if (!post) {
    return NextResponse.json({ error: "Creative not found." }, { status: 404 });
  }

  const { data: canUpload, error: permissionError } = await supabase.rpc(
    "has_workspace_permission",
    {
      p_workspace_id: post.workspace_id,
      p_permission: "creatives.upload",
      p_user_id: user.id,
    },
  );

  if (permissionError) {
    return NextResponse.json({ error: permissionError.message }, { status: 500 });
  }

  if (!canUpload) {
    return NextResponse.json(
      { error: "You do not have permission to upload creative versions." },
      { status: 403 },
    );
  }

  const { data: approvedVersion, error: approvedError } = await supabase
    .from("creative_versions")
    .select("id")
    .eq("post_id", post.id)
    .eq("workspace_id", post.workspace_id)
    .eq("is_approved", true)
    .maybeSingle();

  if (approvedError) {
    return NextResponse.json({ error: approvedError.message }, { status: 500 });
  }

  const { data: version, error: insertError } = await supabase
    .from("creative_versions")
    .insert({
      post_id: post.id,
      workspace_id: post.workspace_id,
      version_number: 0,
      uploaded_by: user.id,
      storage_path: payload.storagePath,
      preview_url: payload.previewUrl ?? null,
      file_name: payload.fileName,
      file_size: payload.fileSize ?? null,
      mime_type: payload.mimeType ?? null,
      media_type: mediaTypeFromMime(payload.mimeType),
      notes: payload.notes?.trim() || null,
    })
    .select("id, version_number")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  if (!approvedVersion) {
    const { error: postUpdateError } = await supabase
      .from("creative_posts")
      .update({ current_version_id: version.id, current_status: "draft" })
      .eq("id", post.id)
      .eq("workspace_id", post.workspace_id);

    if (postUpdateError) {
      return NextResponse.json(
        { error: postUpdateError.message },
        { status: 500 },
      );
    }
  }

  await supabase.from("creative_activity").insert({
    workspace_id: post.workspace_id,
    campaign_id: post.campaign_id,
    post_id: post.id,
    version_id: version.id,
    actor_id: user.id,
    type: "version_uploaded",
    message: `Uploaded version ${version.version_number} for "${post.title}".`,
  });

  revalidatePath(`/creatives/${post.campaign_id}`);
  revalidatePath(`/creatives/posts/${post.id}`);

  return NextResponse.json({ version });
}
