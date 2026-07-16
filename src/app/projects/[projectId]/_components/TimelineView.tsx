import type { ProjectTask } from "@/types/supabase";
import StatusBadge from "./StatusBadge";

function dateLabel(value: string | null) {
  if (!value) return "Unscheduled";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
    new Date(value),
  );
}

export default function TimelineView({ tasks }: { tasks: ProjectTask[] }) {
  const scheduled = tasks.filter((task) => task.start_date || task.due_date);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight">Timeline</h2>
      <div className="mt-4 space-y-3">
        {scheduled.length ? (
          scheduled.slice(0, 12).map((task) => (
            <div
              key={task.id}
              className="grid gap-3 rounded-xl bg-zinc-50 p-3 text-sm md:grid-cols-[180px_1fr_auto]"
            >
              <span className="font-medium text-zinc-500">
                {dateLabel(task.start_date)} to {dateLabel(task.due_date)}
              </span>
              <span className="font-semibold text-zinc-950">{task.title}</span>
              <StatusBadge status={task.status} />
            </div>
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">
            Add start and due dates to build the timeline.
          </p>
        )}
      </div>
    </section>
  );
}
