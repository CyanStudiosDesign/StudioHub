import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/ui/sidebar/AppShell";
import { createWorkspace } from "./actions";

export const metadata: Metadata = {
  title: "Create Workspace | Studio Hub",
};

export default function NewWorkspacePage() {
  return (
    <AppShell>
      <main className="min-h-screen px-6 py-10 text-zinc-950">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl items-center">
        <section className="w-full rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <div className="mb-8">
            <Link
              href="/"
              className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-950"
            >
              Back home
            </Link>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight">
              Create a workspace
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Workspaces are shared places for members, projects, discussions,
              and files.
            </p>
          </div>

          <form action={createWorkspace} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-zinc-800"
              >
                Workspace name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                minLength={2}
                maxLength={120}
                placeholder="Design Studio"
                className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-950"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="icon"
                className="block text-sm font-medium text-zinc-800"
              >
                Icon
              </label>
              <input
                id="icon"
                name="icon"
                type="text"
                required
                maxLength={32}
                defaultValue="W"
                placeholder="W"
                className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-950"
              />
            </div>

            <button
              type="submit"
              className="h-12 w-full rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
            >
              Create workspace
            </button>
          </form>
        </section>
      </div>
    </main>
    </AppShell>
  );
}
