import Link from "next/link";
import { FileText, Play, Image as ImageIcon, Trash2 } from "lucide-react";
import type { CreativePost, CreativeVersion, Profile } from "@/types/supabase";
import { deleteCreativePost } from "../actions";
import MemberAvatarGroup from "./MemberAvatarGroup";
import StatusBadge from "./StatusBadge";

type CreativeCardProps = {
  post: CreativePost;
  latestVersion?: CreativeVersion;
  owner?: Profile;
  assignees: Profile[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function Preview({ version }: { version?: CreativeVersion }) {
  if (!version) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-100 text-zinc-400">
        <ImageIcon className="size-10" />
      </div>
    );
  }

  if (version.media_type === "image" && version.preview_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={version.preview_url}
        alt={version.file_name}
        loading="lazy"
        className="h-full w-full object-cover"
      />
    );
  }

  const Icon = version.media_type === "video" ? Play : FileText;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-zinc-950 text-white">
      <Icon className="size-10" />
      <span className="text-xs font-medium uppercase tracking-wide">
        {version.media_type}
      </span>
    </div>
  );
}

export default function CreativeCard({
  post,
  latestVersion,
  owner,
  assignees,
}: CreativeCardProps) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md">
      <Link href={`/creatives/posts/${post.id}`} className="block">
        <div className="aspect-[4/3] overflow-hidden border-b border-zinc-100">
          <Preview version={latestVersion} />
        </div>
      </Link>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link href={`/creatives/posts/${post.id}`}>
              <h3 className="font-semibold tracking-tight text-zinc-950 hover:underline">
                {post.title}
              </h3>
            </Link>
            <p className="mt-1 text-xs text-zinc-500">
              {latestVersion
                ? `Version ${latestVersion.version_number}`
                : "No versions uploaded"}
            </p>
          </div>
          <StatusBadge status={post.current_status} />
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-zinc-500">Owner</p>
            <p className="mt-1 truncate text-sm font-medium text-zinc-800">
              {owner?.full_name || owner?.username || "Unassigned"}
            </p>
          </div>
          <MemberAvatarGroup members={assignees} limit={3} />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-zinc-400">
            Updated {formatDate(post.updated_at)}
          </p>
          <form action={deleteCreativePost}>
            <input type="hidden" name="workspaceId" value={post.workspace_id} />
            <input type="hidden" name="campaignId" value={post.campaign_id} />
            <input type="hidden" name="postId" value={post.id} />
            <button
              type="submit"
              className="inline-flex size-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
              aria-label={`Delete ${post.title}`}
            >
              <Trash2 className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}
