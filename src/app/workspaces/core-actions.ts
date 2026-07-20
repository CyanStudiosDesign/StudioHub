"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  canManageWorkspaceMembers,
  getCoreWorkspace,
  getCoreWorkspaceSlug,
} from "@/lib/core-workspace";
import { createClient } from "@/utils/supabase/action";

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

export async function requestCoreWorkspaceAccess() {
  const { supabase } = await requireUser();
  const slug = getCoreWorkspaceSlug();

  if (!slug) {
    throw new Error("Missing NEXT_PUBLIC_CORE.");
  }

  const { error } = await supabase.rpc("request_workspace_join", {
    p_workspace_slug: slug,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
}

export async function approveWorkspaceJoinRequest(formData: FormData) {
  const requestId = String(formData.get("requestId") ?? "");

  if (!requestId) {
    throw new Error("Join request is required.");
  }

  const { supabase, userId } = await requireUser();
  const { data: request, error: requestError } = await supabase
    .from("workspace_join_requests")
    .select("id, workspace_id, user_id, status")
    .eq("id", requestId)
    .maybeSingle();

  if (requestError) throw new Error(requestError.message);
  if (!request) throw new Error("Join request not found.");

  const canManage = await canManageWorkspaceMembers(
    supabase,
    request.workspace_id,
    userId,
  );

  if (!canManage) {
    throw new Error("You do not have permission to manage workspace members.");
  }

  const { error: memberError } = await supabase.from("workspace_members").upsert({
    workspace_id: request.workspace_id,
    user_id: request.user_id,
    role: "member",
    invited_by: userId,
  });

  if (memberError) throw new Error(memberError.message);

  const { error: updateError } = await supabase
    .from("workspace_join_requests")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId,
    })
    .eq("id", request.id);

  if (updateError) throw new Error(updateError.message);

  revalidatePath("/");
  revalidatePath(`/workspaces/${request.workspace_id}`);
}

export async function rejectWorkspaceJoinRequest(formData: FormData) {
  const requestId = String(formData.get("requestId") ?? "");

  if (!requestId) {
    throw new Error("Join request is required.");
  }

  const { supabase, userId } = await requireUser();
  const { data: request, error: requestError } = await supabase
    .from("workspace_join_requests")
    .select("id, workspace_id")
    .eq("id", requestId)
    .maybeSingle();

  if (requestError) throw new Error(requestError.message);
  if (!request) throw new Error("Join request not found.");

  const canManage = await canManageWorkspaceMembers(
    supabase,
    request.workspace_id,
    userId,
  );

  if (!canManage) {
    throw new Error("You do not have permission to manage workspace members.");
  }

  const { error } = await supabase
    .from("workspace_join_requests")
    .update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId,
    })
    .eq("id", request.id);

  if (error) throw new Error(error.message);

  revalidatePath(`/workspaces/${request.workspace_id}`);
}

export async function addCoreWorkspaceMemberByEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    throw new Error("Email is required.");
  }

  const { supabase } = await requireUser();
  const { workspace, setupError } = await getCoreWorkspace(supabase);

  if (setupError || !workspace) {
    throw new Error(setupError ?? "Core workspace is not configured.");
  }

  const { error } = await supabase.rpc("add_workspace_member_by_email", {
    p_workspace_id: workspace.id,
    p_email: email,
    p_role: "member",
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/workspaces/${workspace.id}`);
  revalidatePath("/");
}
