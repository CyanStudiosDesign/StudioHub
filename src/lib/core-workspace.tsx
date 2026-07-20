import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export type CoreWorkspace = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string | null;
};

export type CoreWorkspaceSetup =
  | { workspace: CoreWorkspace; setupError: null }
  | { workspace: null; setupError: string };

type Supabase = SupabaseClient<Database>;

export function getCoreWorkspaceSlug() {
  return process.env.NEXT_PUBLIC_CORE?.trim() ?? "";
}

export async function getCoreWorkspace(
  supabase: Supabase,
): Promise<CoreWorkspaceSetup> {
  const slug = getCoreWorkspaceSlug();

  if (!slug) {
    return {
      workspace: null,
      setupError:
        "Missing NEXT_PUBLIC_CORE. Add NEXT_PUBLIC_CORE=cyan-studios to your environment.",
    };
  }

  const { data, error } = await supabase.rpc("get_workspace_by_slug", {
    p_slug: slug,
  });

  if (error) {
    return {
      workspace: null,
      setupError: `Core workspace lookup failed: ${error.message}`,
    };
  }

  const workspace = data?.[0] ?? null;

  if (!workspace) {
    return {
      workspace: null,
      setupError: `No active workspace found for NEXT_PUBLIC_CORE=${slug}.`,
    };
  }

  return { workspace, setupError: null };
}

export async function getCoreMembership(
  supabase: Supabase,
  workspaceId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspace_id, user_id, role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function canManageWorkspaceMembers(
  supabase: Supabase,
  workspaceId: string,
  userId: string,
) {
  const { data, error } = await supabase.rpc("has_workspace_permission", {
    p_workspace_id: workspaceId,
    p_permission: "members.manage",
    p_user_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

export function SetupErrorScreen({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 text-zinc-950">
      <section className="w-full max-w-xl rounded-3xl border border-red-100 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wider text-red-500">
          Setup error
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Core workspace is not ready
        </h1>
        <p className="mt-4 text-sm leading-6 text-zinc-600">{message}</p>
      </section>
    </main>
  );
}
