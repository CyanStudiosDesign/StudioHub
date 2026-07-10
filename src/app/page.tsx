import Link from "next/link";
import { redirect } from "next/navigation";
import AppShell from "@/components/ui/sidebar/AppShell";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const fullName =
    profile?.full_name ?? user.user_metadata.full_name ?? user.email ?? "there";

  const { data: workspaces, error: workspacesError } = await supabase
    .from("workspaces")
    .select("id, name, slug, icon")
    .order("updated_at", { ascending: false });

  if (workspacesError) {
    throw new Error(workspacesError.message);
  }

  return (
    <AppShell>
      <main className="min-h-screen px-6 py-10 text-zinc-950">
      <div className="mx-auto max-w-5xl">
        <nav className="mb-10 flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
          <Link href="/" className="text-base font-semibold tracking-tight">
            Studio Hub
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/workspaces/new"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
            >
              Create workspace
            </Link>
          </div>
        </nav>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">
              Hello {fullName}
            </h1>
            <p className="mt-3 text-sm text-zinc-600">
              Create a workspace to organize members, projects, and content.
            </p>
          </div>
        </div>

        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Workspaces
          </h2>

          {workspaces.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
            <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-sm text-zinc-600">
              No workspaces yet.
            </div>
          )}
        </section>
      </div>
    </main>
    </AppShell>
  );
}
