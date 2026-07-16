import type { ProjectGoal, ProjectTask } from "@/types/supabase";
import ProgressBar from "./ProgressBar";

function formatDate(value: string | null) {
  if (!value) return "No deadline";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export default function GoalCard({
  goal,
  tasks,
}: {
  goal: ProjectGoal;
  tasks: ProjectTask[];
}) {
  const completed = tasks.filter((task) => task.status === "completed").length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold tracking-tight text-zinc-950">
            {goal.name}
          </h3>
          {goal.description ? (
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-600">
              {goal.description}
            </p>
          ) : null}
        </div>
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600">
          {formatDate(goal.deadline)}
        </span>
      </div>
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-zinc-500">
          <span>{completed} / {tasks.length} tasks</span>
          <span>{progress}%</span>
        </div>
        <ProgressBar value={progress} />
      </div>
    </article>
  );
}
