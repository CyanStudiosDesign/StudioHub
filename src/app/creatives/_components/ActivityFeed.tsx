import type { CreativeActivity, Profile } from "@/types/supabase";

type ActivityFeedProps = {
  activities: CreativeActivity[];
  profilesById: Map<string, Profile>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function ActivityFeed({
  activities,
  profilesById,
}: ActivityFeedProps) {
  if (!activities.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-500">
        No activity yet.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
        Recent activity
      </h2>
      <div className="mt-4 space-y-4">
        {activities.map((activity) => {
          const actor = activity.actor_id
            ? profilesById.get(activity.actor_id)
            : undefined;

          return (
            <div key={activity.id} className="flex gap-3">
              <div className="mt-1 size-2 rounded-full bg-zinc-950" />
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  {activity.message}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {actor?.full_name || actor?.username || "System"} ·{" "}
                  {formatDate(activity.created_at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
