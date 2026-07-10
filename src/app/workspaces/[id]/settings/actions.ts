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
    });

  if (permissionsError) {
    throw new Error(permissionsError.message);
  }

  revalidatePath(`/workspaces/${workspaceId}/settings`);
  revalidatePath(`/workspaces/${workspaceId}`);
}
