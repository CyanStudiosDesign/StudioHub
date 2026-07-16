import type { ProjectSubtask } from "@/types/supabase";

export default function SubtaskChecklist({
  subtasks,
}: {
  subtasks: ProjectSubtask[];
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight">Subtasks</h2>
      <div className="mt-4 space-y-2">
        {subtasks.length ? (
          subtasks.slice(0, 8).map((subtask) => (
            <div
              key={subtask.id}
              className="flex items-center gap-3 rounded-xl bg-zinc-50 px-3 py-2 text-sm"
            >
              <span
                className={`flex size-5 items-center justify-center rounded-full border ${
                  subtask.is_completed
                    ? "border-zinc-950 bg-zinc-950"
                    : "border-zinc-300"
                }`}
              />
              <span
                className={
                  subtask.is_completed
                    ? "text-zinc-400 line-through"
                    : "text-zinc-800"
                }
              >
                {subtask.title}
              </span>
            </div>
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">
            No subtasks yet.
          </p>
        )}
      </div>
    </section>
  );
}
