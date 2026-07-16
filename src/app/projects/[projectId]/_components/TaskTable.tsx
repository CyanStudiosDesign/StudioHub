import type { Profile, ProjectTask, ProjectTaskAssignee } from "@/types/supabase";
import PriorityBadge from "./PriorityBadge";
import StatusBadge from "./StatusBadge";

function formatDate(value: string | null) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export default function TaskTable({
  tasks,
  assignees,
  profilesById,
}: {
  tasks: ProjectTask[];
  assignees: ProjectTaskAssignee[];
  profilesById: Map<string, Profile>;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">Task</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Assignees</th>
              <th className="px-4 py-3">Due</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {tasks.map((task) => (
              <tr key={task.id}>
                <td className="px-4 py-3 font-medium text-zinc-950">
                  {task.title}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={task.status} />
                </td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={task.priority} />
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {assignees
                    .filter((assignee) => assignee.task_id === task.id)
                    .map((assignee) => {
                      const profile = profilesById.get(assignee.user_id);
                      return profile?.full_name || profile?.username || "Member";
                    })
                    .join(", ") || "Unassigned"}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {formatDate(task.due_date)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
