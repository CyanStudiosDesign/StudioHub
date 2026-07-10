import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/components/ui/sidebar/AppShell";
import { createClient } from "@/utils/supabase/server";

export default async function WorkspacesPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: workspaces, error } = await supabase
    .from("workspaces")
    .select("id, name, slug, icon")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <AppShell>
      <main className="min-h-screen px-6 py-10 text-zinc-950">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">
                Studio Hub
              </p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                Workspaces
              </h1>
            </div>
            <Link
              href="/workspaces/new"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Create workspace
            </Link>
          </div>

          {workspaces.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {workspaces.map((workspace) => (
                <Link
                  key={workspace.id}
                  href={`/workspaces/${workspace.id}`}
                  className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-zinc-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-zinc-950 text-lg font-semibold text-white">
                      {workspace.icon}
                    </div>
                    <div>
                      <p className="font-semibold">{workspace.name}</p>
                      <p className="mt-1 text-sm text-zinc-500">
                        {workspace.slug}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-600">
              No workspaces yet.
            </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}
