import type { CreativeCampaign, CreativePost } from "@/types/supabase";
import { cn } from "@/lib/utils";

type Status = CreativeCampaign["status"] | CreativePost["current_status"];

const styles: Record<Status, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  archived: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  completed: "bg-blue-50 text-blue-700 ring-blue-100",
  draft: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  improvement_required: "bg-amber-50 text-amber-700 ring-amber-100",
  selected: "bg-violet-50 text-violet-700 ring-violet-100",
  rejected: "bg-red-50 text-red-700 ring-red-100",
  published: "bg-emerald-50 text-emerald-700 ring-emerald-100",
};

function labelFor(status: Status) {
  return status
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        styles[status],
      )}
    >
      {labelFor(status)}
    </span>
  );
}
