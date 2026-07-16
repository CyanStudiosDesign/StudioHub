"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/action";
import type { Database } from "@/types/supabase";

type CreativePostStatus = Database["public"]["Enums"]["creative_post_status"];
type CreativeMediaType = Database["public"]["Enums"]["creative_media_type"];

const approvalStatuses = new Set<CreativePostStatus>([
  "selected",
  "rejected",
  "published",
]);
const allowedCreativeMimeTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "application/pdf",
]);

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return { supabase, userId: user.id };
}

async function assertWorkspacePermission(
  workspaceId: string,
  permission: string,
) {
  const { supabase, userId } = await requireUser();
  const { data: allowed, error } = await supabase.rpc(
    "has_workspace_permission",
    {
      p_workspace_id: workspaceId,
      p_permission: permission,
      p_user_id: userId,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  if (!allowed) {
    throw new Error("You do not have permission to perform this action.");
  }

  return { supabase, userId };
}

function cleanFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}

function mediaTypeFromMime(mimeType: string | undefined): CreativeMediaType {
  if (!mimeType) return "other";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf") return "pdf";
  return "other";
}

function getOptionalCreativeFile(formData: FormData) {
  const file = formData.get("asset");
  if (!(file instanceof File) || file.size === 0) return null;
  if (!allowedCreativeMimeTypes.has(file.type)) {
    throw new Error("Unsupported file type. Use PNG, JPG, WEBP, MP4, MOV, or PDF.");
  }
  return file;
}

export async function createCampaign(formData: FormData) {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!workspaceId || title.length < 2) {
    throw new Error("Workspace and campaign title are required.");
  }

  const { supabase, userId } = await assertWorkspacePermission(
    workspaceId,
    "creatives.manage",
  );

  const { data: campaign, error } = await supabase
    .from("creative_campaigns")
    .insert({
      workspace_id: workspaceId,
      title,
      description: description || null,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await supabase.from("creative_activity").insert({
    workspace_id: workspaceId,
    campaign_id: campaign.id,
    actor_id: userId,
    type: "campaign_created",
    message: `Created campaign "${title}".`,
  });

  revalidatePath("/creatives");
  redirect(`/creatives/${campaign.id}`);
}

export async function archiveCampaign(formData: FormData) {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const campaignId = String(formData.get("campaignId") ?? "");

  if (!workspaceId || !campaignId) {
    throw new Error("Campaign is required.");
  }

  const { supabase, userId } = await assertWorkspacePermission(
    workspaceId,
    "creatives.manage",
  );

  const { error } = await supabase
    .from("creative_campaigns")
    .update({ status: "archived" })
    .eq("id", campaignId)
    .eq("workspace_id", workspaceId);

  if (error) {
    throw new Error(error.message);
  }

  await supabase.from("creative_activity").insert({
    workspace_id: workspaceId,
    campaign_id: campaignId,
    actor_id: userId,
    type: "status_changed",
    message: "Archived the campaign.",
  });

  revalidatePath("/creatives");
  revalidatePath(`/creatives/${campaignId}`);
}

export async function createCreativePost(formData: FormData) {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const campaignId = String(formData.get("campaignId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const ownerId = String(formData.get("ownerId") ?? "") || null;
  const versionNotes = String(formData.get("versionNotes") ?? "").trim();
  const asset = getOptionalCreativeFile(formData);

  if (!workspaceId || !campaignId || title.length < 2) {
    throw new Error("Campaign and creative title are required.");
  }

  const { supabase, userId } = await assertWorkspacePermission(
    workspaceId,
    "creatives.manage",
  );

  if (asset) {
    const { data: canUpload, error: uploadPermissionError } = await supabase.rpc(
      "has_workspace_permission",
      {
        p_workspace_id: workspaceId,
        p_permission: "creatives.upload",
        p_user_id: userId,
      },
    );

    if (uploadPermissionError) {
      throw new Error(uploadPermissionError.message);
    }

    if (!canUpload) {
      throw new Error("You do not have permission to upload creative versions.");
    }
  }

  const { data: post, error } = await supabase
    .from("creative_posts")
    .insert({
      workspace_id: workspaceId,
      campaign_id: campaignId,
      title,
      description: description || null,
      owner_id: ownerId,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await supabase.from("creative_activity").insert({
    workspace_id: workspaceId,
    campaign_id: campaignId,
    post_id: post.id,
    actor_id: userId,
    type: "post_created",
    message: `Created creative "${title}".`,
  });

  if (asset) {
    const storagePath = `${workspaceId}/${post.id}/${crypto.randomUUID()}-${cleanFileName(
      asset.name,
    )}`;
    const { error: uploadError } = await supabase.storage
      .from("creative-assets")
      .upload(storagePath, asset, {
        cacheControl: "3600",
        upsert: false,
        contentType: asset.type,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data: publicUrl } = supabase.storage
      .from("creative-assets")
      .getPublicUrl(storagePath);
    const { data: version, error: versionError } = await supabase
      .from("creative_versions")
      .insert({
        post_id: post.id,
        workspace_id: workspaceId,
        version_number: 0,
        uploaded_by: userId,
        storage_path: storagePath,
        preview_url: publicUrl.publicUrl,
        file_name: asset.name,
        file_size: asset.size,
        mime_type: asset.type,
        media_type: mediaTypeFromMime(asset.type),
        notes: versionNotes || null,
      })
      .select("id, version_number")
      .single();

    if (versionError) {
      throw new Error(versionError.message);
    }

    const { error: postUpdateError } = await supabase
      .from("creative_posts")
      .update({ current_version_id: version.id, current_status: "draft" })
      .eq("id", post.id)
      .eq("workspace_id", workspaceId);

    if (postUpdateError) {
      throw new Error(postUpdateError.message);
    }

    await supabase.from("creative_activity").insert({
      workspace_id: workspaceId,
      campaign_id: campaignId,
      post_id: post.id,
      version_id: version.id,
      actor_id: userId,
      type: "version_uploaded",
      message: `Uploaded version ${version.version_number} for "${title}".`,
    });
  }

  revalidatePath(`/creatives/${campaignId}`);
}

export async function deleteCreativePost(formData: FormData) {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const campaignId = String(formData.get("campaignId") ?? "");
  const postId = String(formData.get("postId") ?? "");

  if (!workspaceId || !campaignId || !postId) {
    throw new Error("Creative is required.");
  }

  const { supabase, userId } = await assertWorkspacePermission(
    workspaceId,
    "creatives.manage",
  );

  const { data: post, error: postError } = await supabase
    .from("creative_posts")
    .select("id, title")
    .eq("id", postId)
    .eq("workspace_id", workspaceId)
    .eq("campaign_id", campaignId)
    .maybeSingle();

  if (postError) {
    throw new Error(postError.message);
  }

  if (!post) {
    throw new Error("Creative not found.");
  }

  const { data: versions, error: versionsError } = await supabase
    .from("creative_versions")
    .select("storage_path")
    .eq("post_id", postId)
    .eq("workspace_id", workspaceId);

  if (versionsError) {
    throw new Error(versionsError.message);
  }

  const storagePaths = versions
    .map((version) => version.storage_path)
    .filter(Boolean);
  if (storagePaths.length) {
    await supabase.storage.from("creative-assets").remove(storagePaths);
  }

  const { error: deleteError } = await supabase
    .from("creative_posts")
    .delete()
    .eq("id", postId)
    .eq("workspace_id", workspaceId)
    .eq("campaign_id", campaignId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  await supabase.from("creative_activity").insert({
    workspace_id: workspaceId,
    campaign_id: campaignId,
    actor_id: userId,
    type: "status_changed",
    message: `Deleted creative "${post.title}".`,
  });

  revalidatePath(`/creatives/${campaignId}`);
  revalidatePath(`/creatives/posts/${postId}`);
  redirect(`/creatives/${campaignId}`);
}

export async function updateCreativeStatus(formData: FormData) {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const campaignId = String(formData.get("campaignId") ?? "");
  const postId = String(formData.get("postId") ?? "");
  const status = String(formData.get("status") ?? "") as CreativePostStatus;

  if (!workspaceId || !campaignId || !postId || !status) {
    throw new Error("Creative status is required.");
  }

  const permission = approvalStatuses.has(status)
    ? "creatives.approve"
    : "creatives.manage";
  const { supabase, userId } = await assertWorkspacePermission(
    workspaceId,
    permission,
  );

  const { error } = await supabase
    .from("creative_posts")
    .update({ current_status: status })
    .eq("id", postId)
    .eq("workspace_id", workspaceId);

  if (error) {
    throw new Error(error.message);
  }

  const activityType =
    status === "selected"
      ? "creative_selected"
      : status === "rejected"
        ? "creative_rejected"
        : status === "published"
          ? "creative_published"
          : "status_changed";

  await supabase.from("creative_activity").insert({
    workspace_id: workspaceId,
    campaign_id: campaignId,
    post_id: postId,
    actor_id: userId,
    type: activityType,
    message: `Changed creative status to ${status.replaceAll("_", " ")}.`,
  });

  revalidatePath(`/creatives/${campaignId}`);
  revalidatePath(`/creatives/posts/${postId}`);
}

export async function approveCreativeVersion(formData: FormData) {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const campaignId = String(formData.get("campaignId") ?? "");
  const postId = String(formData.get("postId") ?? "");
  const versionId = String(formData.get("versionId") ?? "");

  if (!workspaceId || !campaignId || !postId || !versionId) {
    throw new Error("Version is required.");
  }

  const { supabase, userId } = await assertWorkspacePermission(
    workspaceId,
    "creatives.approve",
  );

  const { error: clearError } = await supabase
    .from("creative_versions")
    .update({ is_approved: false })
    .eq("post_id", postId)
    .eq("workspace_id", workspaceId);

  if (clearError) {
    throw new Error(clearError.message);
  }

  const { error: approveError } = await supabase
    .from("creative_versions")
    .update({ is_approved: true, is_active_draft: false })
    .eq("id", versionId)
    .eq("post_id", postId)
    .eq("workspace_id", workspaceId);

  if (approveError) {
    throw new Error(approveError.message);
  }

  const { error: postError } = await supabase
    .from("creative_posts")
    .update({ current_version_id: versionId, current_status: "selected" })
    .eq("id", postId)
    .eq("workspace_id", workspaceId);

  if (postError) {
    throw new Error(postError.message);
  }

  await supabase.from("creative_activity").insert({
    workspace_id: workspaceId,
    campaign_id: campaignId,
    post_id: postId,
    version_id: versionId,
    actor_id: userId,
    type: "creative_selected",
    message: "Marked a version as the approved creative.",
  });

  revalidatePath(`/creatives/${campaignId}`);
  revalidatePath(`/creatives/posts/${postId}`);
}

export async function addCreativeComment(formData: FormData) {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const campaignId = String(formData.get("campaignId") ?? "");
  const postId = String(formData.get("postId") ?? "");
  const versionId = String(formData.get("versionId") ?? "");
  const message = String(formData.get("message") ?? "").trim();

  if (!workspaceId || !campaignId || !postId || !versionId || !message) {
    throw new Error("Comment message is required.");
  }

  const { supabase, userId } = await assertWorkspacePermission(
    workspaceId,
    "creatives.view",
  );

  const { error } = await supabase.from("creative_comments").insert({
    workspace_id: workspaceId,
    post_id: postId,
    version_id: versionId,
    author_id: userId,
    message,
  });

  if (error) {
    throw new Error(error.message);
  }

  await supabase.from("creative_activity").insert({
    workspace_id: workspaceId,
    campaign_id: campaignId,
    post_id: postId,
    version_id: versionId,
    actor_id: userId,
    type: "comment_added",
    message: "Added a comment.",
  });

  revalidatePath(`/creatives/${campaignId}`);
  revalidatePath(`/creatives/posts/${postId}`);
}

export async function assignCreativePost(formData: FormData) {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const campaignId = String(formData.get("campaignId") ?? "");
  const postId = String(formData.get("postId") ?? "");
  const userId = String(formData.get("userId") ?? "");

  if (!workspaceId || !campaignId || !postId || !userId) {
    throw new Error("Creative and member are required.");
  }

  const { supabase, userId: assignedBy } = await assertWorkspacePermission(
    workspaceId,
    "creatives.manage",
  );

  const { error } = await supabase.from("creative_post_assignees").insert({
    post_id: postId,
    user_id: userId,
    assigned_by: assignedBy,
  });

  if (error && error.code !== "23505") {
    throw new Error(error.message);
  }

  await supabase.from("creative_activity").insert({
    workspace_id: workspaceId,
    campaign_id: campaignId,
    post_id: postId,
    actor_id: assignedBy,
    type: "assignee_changed",
    message: "Assigned a member to the creative.",
  });

  revalidatePath(`/creatives/${campaignId}`);
  revalidatePath(`/creatives/posts/${postId}`);
}

export async function removeCreativeAssignee(formData: FormData) {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const campaignId = String(formData.get("campaignId") ?? "");
  const postId = String(formData.get("postId") ?? "");
  const userId = String(formData.get("userId") ?? "");

  if (!workspaceId || !campaignId || !postId || !userId) {
    throw new Error("Creative and member are required.");
  }

  const { supabase, userId: removedBy } = await assertWorkspacePermission(
    workspaceId,
    "creatives.manage",
  );

  const { error } = await supabase
    .from("creative_post_assignees")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  await supabase.from("creative_activity").insert({
    workspace_id: workspaceId,
    campaign_id: campaignId,
    post_id: postId,
    actor_id: removedBy,
    type: "assignee_changed",
    message: "Removed a creative assignee.",
  });

  revalidatePath(`/creatives/${campaignId}`);
  revalidatePath(`/creatives/posts/${postId}`);
}
