import type { Database } from "@/types/supabase";

type Priority = Database["public"]["Enums"]["project_task_priority"];

const styles: Record<Priority, string> = {
  low: "bg-zinc-100 text-zinc-600",
  medium: "bg-blue-50 text-blue-700",
  high: "bg-amber-50 text-amber-700",
  critical: "bg-red-50 text-red-700",
};

export default function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles[priority]}`}
    >
      {priority[0].toUpperCase() + priority.slice(1)}
    </span>
  );
}
