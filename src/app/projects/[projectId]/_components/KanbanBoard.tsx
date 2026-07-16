import type {
  Profile,
  ProjectSubtask,
  ProjectTask,
  ProjectTaskAssignee,
} from "@/types/supabase";
import TaskCard from "./TaskCard";

const columns = [
  ["backlog", "Backlog"],
  ["todo", "Todo"],
  ["in_progress", "In Progress"],
  ["blocked", "Blocked"],
  ["in_review", "Review"],
  ["completed", "Completed"],
] as const;

export default function KanbanBoard({
  tasks,
  assignees,
  subtasks,
  profilesById,
}: {
  tasks: ProjectTask[];
  assignees: ProjectTaskAssignee[];
  subtasks: ProjectSubtask[];
  profilesById: Map<string, Profile>;
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-3 2xl:grid-cols-6">
      {columns.map(([status, label]) => {
        const columnTasks = tasks.filter((task) => task.status === status);

        return (
          <div key={status} className="rounded-2xl bg-zinc-100/70 p-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <h3 className="text-sm font-semibold text-zinc-800">{label}</h3>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-zinc-500">
                {columnTasks.length}
              </span>
            </div>
            <div className="space-y-3">
              {columnTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  assignees={assignees.filter((item) => item.task_id === task.id)}
                  subtasks={subtasks.filter((item) => item.task_id === task.id)}
                  profilesById={profilesById}
                />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
