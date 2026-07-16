import ProgressBar from "./ProgressBar";

export default function ProjectProgress({
  taskProgress,
  goalProgress,
  completedTasks,
  totalTasks,
  completedGoals,
  totalGoals,
}: {
  taskProgress: number;
  goalProgress: number;
  completedTasks: number;
  totalTasks: number;
  completedGoals: number;
  totalGoals: number;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
        Overall progress
      </h2>
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-zinc-700">Tasks</span>
          <span className="font-semibold text-zinc-950">{taskProgress}%</span>
        </div>
        <ProgressBar value={taskProgress} />
        <p className="mt-2 text-sm text-zinc-500">
          {completedTasks} / {totalTasks} completed
        </p>
      </div>
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-zinc-700">Goals</span>
          <span className="font-semibold text-zinc-950">{goalProgress}%</span>
        </div>
        <ProgressBar value={goalProgress} />
        <p className="mt-2 text-sm text-zinc-500">
          {completedGoals} / {totalGoals} completed
        </p>
      </div>
    </section>
  );
}
