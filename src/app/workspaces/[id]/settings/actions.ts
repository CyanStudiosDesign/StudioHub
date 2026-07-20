"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/action";
import type { Database } from "@/types/supabase";

type WorkspaceRole = Database["public"]["Enums"]["workspace_role"];

async function requireWorkspaceOwner(workspaceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: isOwner, error } = await supabase.rpc("is_workspace_owner", {
    p_workspace_id: workspaceId,
    p_user_id: user.id,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!isOwner) {
    throw new Error("Only workspace owners can update permissions.");
  }

  return { supabase, userId: user.id };
}

function checked(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function assertValidSlug(slug: string) {
  if (!/^[a-z0-9][a-z0-9-]{2,62}$/.test(slug)) {
    throw new Error(
      "Workspace slug must be 3-63 characters and use lowercase letters, numbers, or hyphens.",
    );
  }
}

export async function updateWorkspaceIdentity(formData: FormData) {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const slug = normalizeSlug(String(formData.get("slug") ?? ""));

  if (!workspaceId) {
    throw new Error("Workspace is required.");
  }

  if (name.length < 2 || name.length > 120) {
    throw new Error("Workspace name must be between 2 and 120 characters.");
  }

  assertValidSlug(slug);

  const { supabase } = await requireWorkspaceOwner(workspaceId);

  const { error } = await supabase
    .from("workspaces")
    .update({ name, slug })
    .eq("id", workspaceId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/workspaces");
  revalidatePath(`/workspaces/${workspaceId}`);
  revalidatePath(`/workspaces/${workspaceId}/settings`);
}

export async function softDeleteWorkspace(formData: FormData) {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const workspaceSlug = String(formData.get("workspaceSlug") ?? "");
  const confirmSlug = String(formData.get("confirmSlug") ?? "").trim();
  const confirmPhrase = String(formData.get("confirmPhrase") ?? "").trim();

  if (!workspaceId || !workspaceSlug) {
    throw new Error("Workspace is required.");
  }

  if (confirmSlug !== workspaceSlug) {
    throw new Error("The workspace slug confirmation does not match.");
  }

  if (confirmPhrase !== "delete my workspace") {
    throw new Error('Type "delete my workspace" to confirm.');
  }

  const { supabase, userId } = await requireWorkspaceOwner(workspaceId);

  const { error } = await supabase
    .from("workspaces")
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: userId,
    })
    .eq("id", workspaceId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/workspaces");
  redirect("/workspaces");
}

export async function updateMemberPermissions(formData: FormData) {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "member") as WorkspaceRole;

  if (!workspaceId || !userId) {
    throw new Error("Workspace and user are required.");
  }

  if (!["admin", "member"].includes(role)) {
    throw new Error("Owner permissions cannot be edited from this form.");
  }

  const { supabase } = await requireWorkspaceOwner(workspaceId);

  const { error: roleError } = await supabase
    .from("workspace_members")
    .update({ role })
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId);

  if (roleError) {
    throw new Error(roleError.message);
  }

  const isAdmin = role === "admin";
  const { error: permissionsError } = await supabase
    .from("workspace_member_permissions")
    .upsert({
      workspace_id: workspaceId,
      user_id: userId,
      can_view_documents: isAdmin || checked(formData, "can_view_documents"),
      can_manage_documents: isAdmin || checked(formData, "can_manage_documents"),
      can_view_projects: isAdmin || checked(formData, "can_view_projects"),
      can_manage_projects: isAdmin || checked(formData, "can_manage_projects"),
      can_manage_members: isAdmin || checked(formData, "can_manage_members"),
      can_view_creatives: isAdmin || checked(formData, "can_view_creatives"),
      can_manage_creatives:
        isAdmin || checked(formData, "can_manage_creatives"),
      can_upload_creatives:
        isAdmin || checked(formData, "can_upload_creatives"),
      can_approve_creatives:
        isAdmin || checked(formData, "can_approve_creatives"),
    });

  if (permissionsError) {
    throw new Error(permissionsError.message);
  }

  revalidatePath(`/workspaces/${workspaceId}/settings`);
  revalidatePath(`/workspaces/${workspaceId}`);
}
