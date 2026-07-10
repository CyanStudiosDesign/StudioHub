"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/action";

async function getUserId() {
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

export async function createProject(formData: FormData) {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!workspaceId) {
    throw new Error("Workspace is required.");
  }

  if (name.length < 2 || name.length > 140) {
    throw new Error("Project name must be between 2 and 140 characters.");
  }

  const { supabase, userId } = await getUserId();
  const { error } = await supabase.from("projects").insert({
    workspace_id: workspaceId,
    created_by: userId,
    name,
    description: description || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/workspaces/${workspaceId}/projects`);
}

export async function assignProjectMember(formData: FormData) {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  const userId = String(formData.get("userId") ?? "");

  if (!workspaceId || !projectId || !userId) {
    throw new Error("Project and member are required.");
  }

  const { supabase, userId: assignedBy } = await getUserId();
  const { error } = await supabase.from("project_members").insert({
    project_id: projectId,
    user_id: userId,
    assigned_by: assignedBy,
  });

  if (error && error.code !== "23505") {
    throw new Error(error.message);
  }

  revalidatePath(`/workspaces/${workspaceId}/projects`);
}

export async function removeProjectMember(formData: FormData) {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  const userId = String(formData.get("userId") ?? "");

  if (!workspaceId || !projectId || !userId) {
    throw new Error("Project and member are required.");
  }

  const { supabase } = await getUserId();
  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/workspaces/${workspaceId}/projects`);
}
