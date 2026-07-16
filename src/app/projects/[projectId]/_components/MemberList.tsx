import type { Profile, ProjectTask, ProjectTaskAssignee } from "@/types/supabase";

function initials(profile: Profile | undefined) {
  const value = profile?.full_name || profile?.username || profile?.email || "?";
  return value
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function display(profile: Profile | undefined) {
  return profile?.full_name || profile?.username || profile?.email || "Unknown";
}

export default function MemberList({
  members,
  tasks,
  assignees,
  profilesById,
}: {
  members: { user_id: string; role: string }[];
  tasks: ProjectTask[];
  assignees: ProjectTaskAssignee[];
  profilesById: Map<string, Profile>;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight">Members</h2>
      <div className="mt-4 space-y-3">
        {members.map((member) => {
          const profile = profilesById.get(member.user_id);
          const assignedTaskIds = assignees
            .filter((item) => item.user_id === member.user_id)
            .map((item) => item.task_id);
          const active = tasks.filter(
            (task) =>
              assignedTaskIds.includes(task.id) &&
              task.status !== "completed" &&
              task.status !== "cancelled",
          ).length;

          return (
            <div
              key={member.user_id}
              className="flex items-center justify-between gap-4 rounded-xl bg-zinc-50 px-3 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-zinc-950 text-xs font-semibold text-white">
                  {initials(profile)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-950">
                    {display(profile)}
                  </p>
                  <p className="text-xs text-zinc-500">{member.role}</p>
                </div>
              </div>
              <p className="text-xs text-zinc-500">{active} active tasks</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
