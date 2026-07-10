"use server";

import { redirect } from "next/navigation";
import { clearAppSessionCookie } from "@/utils/auth-session-cookie";
import { createClient } from "@/utils/supabase/action";

export async function logout() {
  const supabase = await createClient();

  await supabase.auth.signOut();
  await clearAppSessionCookie();

  redirect("/login");
}
