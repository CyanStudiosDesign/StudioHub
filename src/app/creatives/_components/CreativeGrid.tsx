import type { CreativePost, CreativeVersion, Profile } from "@/types/supabase";
import CreativeCard from "./CreativeCard";

type CreativeGridProps = {
  posts: CreativePost[];
  versionsByPost: Map<string, CreativeVersion>;
  profilesById: Map<string, Profile>;
  assigneesByPost: Map<string, Profile[]>;
};

export default function CreativeGrid({
  posts,
  versionsByPost,
  profilesById,
  assigneesByPost,
}: CreativeGridProps) {
  if (!posts.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
        <p className="text-lg font-semibold text-zinc-950">
          No creatives yet
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Create the first post for this campaign, then upload versioned assets.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {posts.map((post) => (
        <CreativeCard
          key={post.id}
          post={post}
          latestVersion={versionsByPost.get(post.id)}
          owner={post.owner_id ? profilesById.get(post.owner_id) : undefined}
          assignees={assigneesByPost.get(post.id) ?? []}
        />
      ))}
    </div>
  );
}
