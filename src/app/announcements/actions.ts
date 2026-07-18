"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

export async function createAnnouncement(formData: FormData) {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!workspaceId || title.length < 2 || !message) {
    throw new Error("Workspace, title, and message are required.");
  }

  const { supabase, userId } = await requireUser();
  const { data: isAdmin, error: adminError } = await supabase.rpc(
    "is_workspace_admin",
    {
      p_workspace_id: workspaceId,
      p_user_id: userId,
    },
  );

  if (adminError) {
    throw new Error(adminError.message);
  }

  if (!isAdmin) {
    throw new Error("Only workspace owners and administrators can post announcements.");
  }

  const { error } = await supabase.from("announcements").insert({
    workspace_id: workspaceId,
    title,
    message,
    created_by: userId,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/announcements");
}

export async function markAnnouncementsRead(formData: FormData) {
  const ids = formData.getAll("announcementId").map(String).filter(Boolean);

  if (!ids.length) {
    revalidatePath("/");
    revalidatePath("/announcements");
    return;
  }

  const { supabase, userId } = await requireUser();
  const { error } = await supabase.from("announcement_reads").upsert(
    ids.map((announcementId) => ({
      announcement_id: announcementId,
      user_id: userId,
      read_at: new Date().toISOString(),
    })),
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/announcements");
}
