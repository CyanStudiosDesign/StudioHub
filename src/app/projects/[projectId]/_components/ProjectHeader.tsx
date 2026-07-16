import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Project } from "@/types/supabase";
import StatusBadge from "./StatusBadge";

function formatDate(value: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export default function ProjectHeader({
  project,
}: {
  project: Project;
}) {
  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <Link
        href={`/workspaces/${project.workspace_id}/projects`}
        aria-label="Back"
        className="inline-flex size-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-950"
      >
        <ArrowLeft className="size-4" />
      </Link>
      <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-950">
              {project.name}
            </h1>
            <StatusBadge status={project.status} />
          </div>
          {project.description ? (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-600">
              {project.description}
            </p>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
          <div className="rounded-2xl bg-zinc-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Client
            </p>
            <p className="mt-2 font-semibold text-zinc-950">
              {project.client_name || "Internal"}
            </p>
          </div>
          <div className="rounded-2xl bg-zinc-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Created
            </p>
            <p className="mt-2 font-semibold text-zinc-950">
              {formatDate(project.created_at)}
            </p>
          </div>
          <div className="rounded-2xl bg-zinc-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Deadline
            </p>
            <p className="mt-2 font-semibold text-zinc-950">
              {formatDate(project.estimated_deadline)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
