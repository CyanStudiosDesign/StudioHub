"use client";

import { useOptimistic, useState, useTransition, type DragEvent } from "react";
import { GripVertical, LoaderCircle } from "lucide-react";
import type {
  Profile,
  ProjectSubtask,
  ProjectTask,
  ProjectTaskAssignee,
} from "@/types/supabase";
import { cn } from "@/lib/utils";
import { updateTaskStatus } from "../actions";
import TaskCard from "./TaskCard";
import { Select, SelectGroup, SelectItem } from "@/components/ui/select";

const columns = [
  ["backlog", "Backlog"],
  ["todo", "To do"],
  ["in_progress", "In progress"],
  ["blocked", "Blocked"],
  ["in_review", "Review"],
  ["completed", "Completed"],
  ["cancelled", "Cancelled"],
] as const;

type TaskStatus = ProjectTask["status"];
type OptimisticMove = { taskId: string; status: TaskStatus };

export default function KanbanBoard({
  projectId,
  tasks,
  assignees,
  subtasks,
  profiles,
}: {
  projectId: string;
  tasks: ProjectTask[];
  assignees: ProjectTaskAssignee[];
  subtasks: ProjectSubtask[];
  profiles: Profile[];
}) {
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<TaskStatus | null>(null);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [, startTransition] = useTransition();
  const [optimisticTasks, moveOptimisticTask] = useOptimistic(
    tasks,
    (current, move: OptimisticMove) => current.map((task) =>
      task.id === move.taskId ? { ...task, status: move.status } : task,
    ),
  );

  function moveTask(taskId: string, status: TaskStatus) {
    const currentTask = optimisticTasks.find((task) => task.id === taskId);
    if (!currentTask || currentTask.status === status || pendingTaskId === taskId) return;

    const formData = new FormData();
    formData.set("projectId", projectId);
    formData.set("taskId", taskId);
    formData.set("status", status);
    setError("");

    startTransition(async () => {
      moveOptimisticTask({ taskId, status });
      setPendingTaskId(taskId);
      try {
        await updateTaskStatus(formData);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Task could not be moved.");
      } finally {
        setPendingTaskId(null);
      }
    });
  }

  function onDragStart(event: DragEvent<HTMLDivElement>, taskId: string) {
    setDraggedTaskId(taskId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", taskId);
  }

  function onDrop(event: DragEvent<HTMLDivElement>, status: TaskStatus) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/plain") || draggedTaskId;
    setDraggedTaskId(null);
    setDropTarget(null);
    if (taskId) moveTask(taskId, status);
  }

  return (
    <section>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-fg">Task board</h2>
          <p className="mt-1 text-sm text-fg-muted">Drag cards between columns. The move saves automatically.</p>
        </div>
        {pendingTaskId ? (
          <span className="inline-flex items-center gap-2 text-sm font-medium text-fg-muted">
            <LoaderCircle className="size-4 animate-spin" /> Saving move…
          </span>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="mb-3 rounded-xl border border-danger/30 bg-danger-subtle px-4 py-3 text-sm text-danger-strong">
          {error} The card was returned to its previous column.
        </p>
      ) : null}
      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[1540px] grid-cols-7 gap-4">
          {columns.map(([status, label]) => {
            const columnTasks = optimisticTasks.filter((task) => task.status === status);
            const isTarget = dropTarget === status;

            return (
              <div
                key={status}
                onDragEnter={() => setDropTarget(status)}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  if (dropTarget !== status) setDropTarget(status);
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    setDropTarget(null);
                  }
                }}
                onDrop={(event) => onDrop(event, status)}
                className={cn(
                  "min-h-52 rounded-2xl border border-transparent bg-subtle/75 p-3 transition",
                  isTarget && "border-primary bg-primary/10 shadow-[inset_0_0_0_1px_var(--primary)]",
                )}
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <h3 className="text-sm font-semibold text-fg">{label}</h3>
                  <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-semibold text-fg-muted">
                    {columnTasks.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {columnTasks.map((task) => {
                    const isDragging = draggedTaskId === task.id;
                    const isSaving = pendingTaskId === task.id;
                    return (
                      <div
                        key={task.id}
                        draggable={!isSaving}
                        onDragStart={(event) => onDragStart(event, task.id)}
                        onDragEnd={() => {
                          setDraggedTaskId(null);
                          setDropTarget(null);
                        }}
                        className={cn(
                          "cursor-grab transition active:cursor-grabbing",
                          isDragging && "opacity-40",
                          isSaving && "pointer-events-none opacity-65",
                        )}
                      >
                        <div className="mb-1 flex items-center gap-1 px-2 text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">
                          <GripVertical className="size-3.5" /> Drag to move
                        </div>
                        <TaskCard
                          task={task}
                          assignees={assignees.filter((item) => item.task_id === task.id)}
                          subtasks={subtasks.filter((item) => item.task_id === task.id)}
                          profilesById={profilesById}
                          statusControl={(
                            <label className="flex items-center justify-between gap-2 text-xs font-medium text-fg-muted">
                              Move to
                              <span onPointerDown={(event) => event.stopPropagation()}><Select title="Move" value={task.status} disabled={isSaving} onValueChange={(value) => moveTask(task.id, value as TaskStatus)} className="min-w-32" triggerClassName="h-8 text-xs"><SelectGroup>{columns.map(([value, columnLabel]) => <SelectItem key={value} value={value}>{columnLabel}</SelectItem>)}</SelectGroup></Select></span>
                            </label>
                          )}
                        />
                      </div>
                    );
                  })}
                  {!columnTasks.length ? (
                    <div className={cn(
                      "flex min-h-24 items-center justify-center rounded-xl border border-dashed border-border px-3 text-center text-xs text-fg-subtle",
                      isTarget && "border-primary text-primary",
                    )}>
                      Drop a task here
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
