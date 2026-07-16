import type {
  Profile,
  ProjectSubtask,
  ProjectTask,
  ProjectTaskAssignee,
} from "@/types/supabase";
import PriorityBadge from "./PriorityBadge";
import ProgressBar from "./ProgressBar";
import StatusBadge from "./StatusBadge";

function displayName(profile: Profile | undefined) {
  return profile?.full_name || profile?.username || "Unassigned";
}

function taskProgress(task: ProjectTask, subtasks: ProjectSubtask[]) {
  if (!subtasks.length) return task.status === "completed" ? 100 : 0;
  return Math.round(
    (subtasks.filter((subtask) => subtask.is_completed).length /
      subtasks.length) *
      100,
  );
}

export default function TaskCard({
  task,
  assignees,
  subtasks,
  profilesById,
}: {
  task: ProjectTask;
  assignees: ProjectTaskAssignee[];
  subtasks: ProjectSubtask[];
  profilesById: Map<string, Profile>;
}) {
  const progress = taskProgress(task, subtasks);

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold tracking-tight text-zinc-950">
            {task.title}
          </h3>
          {task.description ? (
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-600">
              {task.description}
            </p>
          ) : null}
        </div>
        <PriorityBadge priority={task.priority} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <StatusBadge status={task.status} />
        {task.labels.map((label) => (
          <span
            key={label}
            className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600"
          >
            {label}
          </span>
        ))}
      </div>
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
          <span>Completion</span>
          <span>{progress}%</span>
        </div>
        <ProgressBar value={progress} />
      </div>
      <p className="mt-4 text-xs text-zinc-500">
        Assigned to{" "}
        {assignees.length
          ? assignees
              .map((assignee) => displayName(profilesById.get(assignee.user_id)))
              .join(", ")
          : "no one"}
      </p>
    </article>
  );
}
