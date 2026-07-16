import type { ProjectTask, ProjectTaskDependency } from "@/types/supabase";

export default function TaskDependencyGraph({
  task,
  tasks,
  dependencies,
}: {
  task: ProjectTask;
  tasks: ProjectTask[];
  dependencies: ProjectTaskDependency[];
}) {
  const blockedBy = dependencies
    .filter((dependency) => dependency.task_id === task.id)
    .map((dependency) =>
      tasks.find((item) => item.id === dependency.depends_on_task_id),
    )
    .filter((item): item is ProjectTask => Boolean(item));

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight">Dependencies</h2>
      <div className="mt-4">
        {blockedBy.length ? (
          <div className="space-y-2">
            {blockedBy.map((dependency) => (
              <div
                key={dependency.id}
                className="flex items-center gap-3 rounded-xl bg-zinc-50 px-3 py-2 text-sm"
              >
                <span className="h-px w-8 bg-zinc-300" />
                <span className="font-medium text-zinc-800">
                  {dependency.title}
                </span>
                <span className="text-xs text-zinc-500">
                  {dependency.status.replaceAll("_", " ")}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">
            This task has no blockers.
          </p>
        )}
      </div>
    </section>
  );
}
