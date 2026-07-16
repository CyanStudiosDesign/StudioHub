import type { Profile, ProjectTask, ProjectTaskAssignee } from "@/types/supabase";

function name(profile: Profile | undefined) {
  return profile?.full_name || profile?.username || "Unknown member";
}

export default function WorkloadView({
  projectMembers,
  tasks,
  assignees,
  profilesById,
}: {
  projectMembers: string[];
  tasks: ProjectTask[];
  assignees: ProjectTaskAssignee[];
  profilesById: Map<string, Profile>;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight">Workload</h2>
      <div className="mt-4 space-y-2">
        {projectMembers.map((memberId) => {
          const memberTasks = assignees
            .filter((assignee) => assignee.user_id === memberId)
            .map((assignee) => tasks.find((task) => task.id === assignee.task_id))
            .filter((task): task is ProjectTask => Boolean(task));
          const activeTasks = memberTasks.filter(
            (task) => task.status !== "completed" && task.status !== "cancelled",
          );

          return (
            <div
              key={memberId}
              className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2 text-sm"
            >
              <span className="font-medium text-zinc-800">
                {name(profilesById.get(memberId))}
              </span>
              <span className="text-zinc-500">
                {activeTasks.length} active / {memberTasks.length} total
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
