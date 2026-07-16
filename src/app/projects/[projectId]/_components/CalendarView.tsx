import type { ProjectTask } from "@/types/supabase";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export default function CalendarView({ tasks }: { tasks: ProjectTask[] }) {
  const grouped = tasks
    .filter((task) => task.due_date)
    .reduce<Record<string, ProjectTask[]>>((groups, task) => {
      const key = task.due_date as string;
      groups[key] = groups[key] ?? [];
      groups[key].push(task);
      return groups;
    }, {});

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight">Calendar</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {Object.entries(grouped).length ? (
          Object.entries(grouped)
            .slice(0, 8)
            .map(([date, dateTasks]) => (
              <div key={date} className="rounded-xl bg-zinc-50 p-3">
                <p className="text-sm font-semibold text-zinc-950">
                  {formatDate(date)}
                </p>
                <div className="mt-2 space-y-1">
                  {dateTasks.map((task) => (
                    <p key={task.id} className="text-sm text-zinc-600">
                      {task.title}
                    </p>
                  ))}
                </div>
              </div>
            ))
        ) : (
          <p className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 md:col-span-2">
            No deadlines are scheduled yet.
          </p>
        )}
      </div>
    </section>
  );
}
