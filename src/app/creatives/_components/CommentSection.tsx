import type { CreativeComment, Profile } from "@/types/supabase";
import { addCreativeComment } from "../actions";

type CommentSectionProps = {
  comments: CreativeComment[];
  profilesById: Map<string, Profile>;
  workspaceId: string;
  campaignId: string;
  postId: string;
  versionId?: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function CommentSection({
  comments,
  profilesById,
  workspaceId,
  campaignId,
  postId,
  versionId,
}: CommentSectionProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
        Comments
      </h2>
      <div className="mt-4 space-y-4">
        {comments.length ? (
          comments.map((comment) => {
            const author = profilesById.get(comment.author_id);

            return (
              <div key={comment.id} className="rounded-xl bg-zinc-50 p-3">
                <p className="text-sm font-semibold text-zinc-950">
                  {author?.full_name || author?.username || "Unknown member"}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                  {comment.message}
                </p>
                <p className="mt-2 text-xs text-zinc-400">
                  {formatDate(comment.created_at)}
                </p>
              </div>
            );
          })
        ) : (
          <p className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">
            No comments on this version.
          </p>
        )}
      </div>

      {versionId ? (
        <form action={addCreativeComment} className="mt-4 space-y-3">
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <input type="hidden" name="campaignId" value={campaignId} />
          <input type="hidden" name="postId" value={postId} />
          <input type="hidden" name="versionId" value={versionId} />
          <textarea
            name="message"
            required
            placeholder="Add feedback or approval notes"
            className="min-h-24 w-full resize-none rounded-xl border border-zinc-200 px-3 py-3 text-sm outline-none focus:border-zinc-950"
          />
          <button className="h-10 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800">
            Add comment
          </button>
        </form>
      ) : null}
    </div>
  );
}
