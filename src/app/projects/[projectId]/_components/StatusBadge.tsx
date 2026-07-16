import type { Database } from "@/types/supabase";

type Status =
  | Database["public"]["Enums"]["project_status"]
  | Database["public"]["Enums"]["project_task_status"];

const styles: Record<Status, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  archived: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  completed: "bg-blue-50 text-blue-700 ring-blue-100",
  backlog: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  todo: "bg-sky-50 text-sky-700 ring-sky-100",
  in_progress: "bg-violet-50 text-violet-700 ring-violet-100",
  blocked: "bg-red-50 text-red-700 ring-red-100",
  in_review: "bg-amber-50 text-amber-700 ring-amber-100",
  cancelled: "bg-zinc-100 text-zinc-500 ring-zinc-200",
};

function label(status: Status) {
  return status
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${styles[status]}`}
    >
      {label(status)}
    </span>
  );
}
