import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { CreativeVersion } from "@/types/supabase";

type VersionTimelineProps = {
  postId: string;
  versions: CreativeVersion[];
  selectedVersionId?: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function VersionTimeline({
  postId,
  versions,
  selectedVersionId,
}: VersionTimelineProps) {
  if (!versions.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 p-5 text-sm text-zinc-500">
        No versions uploaded yet.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
        Version timeline
      </h2>
      <div className="mt-4 space-y-2">
        {versions.map((version) => {
          const selected = selectedVersionId === version.id;

          return (
            <Link
              key={version.id}
              href={`/creatives/posts/${postId}?versionId=${version.id}`}
              className={`block rounded-xl border px-4 py-3 transition ${
                selected
                  ? "border-zinc-950 bg-zinc-950 text-white"
                  : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">Version {version.version_number}</p>
                {version.is_approved ? (
                  <CheckCircle2 className="size-4 text-emerald-500" />
                ) : null}
              </div>
              <p
                className={`mt-1 text-xs ${
                  selected ? "text-zinc-300" : "text-zinc-500"
                }`}
              >
                {formatDate(version.created_at)}
              </p>
              {version.notes ? (
                <p
                  className={`mt-2 line-clamp-2 text-xs ${
                    selected ? "text-zinc-200" : "text-zinc-600"
                  }`}
                >
                  {version.notes}
                </p>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
