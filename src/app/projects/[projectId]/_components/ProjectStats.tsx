import type { ProjectTask } from "@/types/supabase";

const statuses = [
  "backlog",
  "todo",
  "in_progress",
  "blocked",
  "in_review",
  "completed",
] as const;

function label(status: string) {
  return status
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

export default function ProjectStats({ tasks }: { tasks: ProjectTask[] }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-zinc-500">Tasks</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight">
          {tasks.length}
        </p>
      </div>
      {statuses.map((status) => (
        <div
          key={status}
          className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
        >
          <p className="text-sm text-zinc-500">{label(status)}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {tasks.filter((task) => task.status === status).length}
          </p>
        </div>
      ))}
    </section>
  );
}
