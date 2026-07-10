"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/action";

function createSlug(name: string) {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  const safeBase = base.length >= 3 ? base : "workspace";

  return `${safeBase}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function createWorkspace(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim() || "W";

  if (name.length < 2 || name.length > 120) {
    throw new Error("Workspace name must be between 2 and 120 characters.");
  }

  if (icon.length < 1 || icon.length > 32) {
    throw new Error("Workspace icon must be between 1 and 32 characters.");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: workspaceId, error } = await supabase.rpc("create_workspace", {
    p_name: name,
    p_icon: icon,
    p_slug: createSlug(name),
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect(`/workspaces/${workspaceId}`);
}
