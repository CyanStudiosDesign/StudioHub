import type { Profile, ProjectComment } from "@/types/supabase";
import { addTaskComment } from "../actions";

export default function TaskComments({
  projectId,
  taskId,
  comments,
  profilesById,
}: {
  projectId: string;
  taskId?: string;
  comments: ProjectComment[];
  profilesById: Map<string, Profile>;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight">Comments</h2>
      <div className="mt-4 space-y-3">
        {comments.length ? (
          comments.slice(0, 8).map((comment) => {
            const author = profilesById.get(comment.author_id);
            return (
              <div key={comment.id} className="rounded-xl bg-zinc-50 p-3">
                <p className="text-sm font-semibold text-zinc-950">
                  {author?.full_name || author?.username || "Member"}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                  {comment.message}
                </p>
              </div>
            );
          })
        ) : (
          <p className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">
            No discussion yet.
          </p>
        )}
      </div>
      <form action={addTaskComment} className="mt-4 space-y-3">
        <input type="hidden" name="projectId" value={projectId} />
        {taskId ? <input type="hidden" name="taskId" value={taskId} /> : null}
        <textarea
          name="message"
          required
          placeholder="Add a comment, mention, or update"
          className="min-h-24 w-full resize-none rounded-xl border border-zinc-200 px-3 py-3 text-sm outline-none focus:border-zinc-950"
        />
        <button className="h-10 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800">
          Add comment
        </button>
      </form>
    </section>
  );
}
