"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Check, LoaderCircle, Pencil, X } from "lucide-react";
import type { Profile, ProjectTask, ProjectTaskAssignee } from "@/types/supabase";
import { updateTaskFromTable } from "../actions";
import PriorityBadge from "./PriorityBadge";
import StatusBadge from "./StatusBadge";
import { Select, SelectGroup, SelectItem } from "@/components/ui/select";

const statuses = [
  ["backlog", "Backlog"],
  ["todo", "To do"],
  ["in_progress", "In progress"],
  ["blocked", "Blocked"],
  ["in_review", "Review"],
  ["completed", "Completed"],
  ["cancelled", "Cancelled"],
] as const;

const priorities = ["low", "medium", "high", "critical"] as const;

type EditableFields = Pick<ProjectTask, "title" | "status" | "priority" | "due_date">;

function dateInputValue(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function formatDate(value: string | null) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

function EditableTaskRow({
  projectId,
  task,
  assigneeLabel,
}: {
  projectId: string;
  task: ProjectTask;
  assigneeLabel: string;
}) {
  const initialFields: EditableFields = {
    title: task.title,
    status: task.status,
    priority: task.priority,
    due_date: task.due_date,
  };
  const [draft, setDraft] = useState(initialFields);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [optimisticTask, updateOptimisticTask] = useOptimistic(
    task,
    (current, update: EditableFields) => ({ ...current, ...update }),
  );

  function beginEditing() {
    setDraft({
      title: optimisticTask.title,
      status: optimisticTask.status,
      priority: optimisticTask.priority,
      due_date: optimisticTask.due_date,
    });
    setError("");
    setIsEditing(true);
  }

  function cancel() {
    setDraft({
      title: optimisticTask.title,
      status: optimisticTask.status,
      priority: optimisticTask.priority,
      due_date: optimisticTask.due_date,
    });
    setError("");
    setIsEditing(false);
  }

  function save() {
    if (isPending || draft.title.trim().length < 2) return;
    const next = { ...draft, title: draft.title.trim() };
    const formData = new FormData();
    formData.set("projectId", projectId);
    formData.set("taskId", task.id);
    formData.set("title", next.title);
    formData.set("status", next.status);
    formData.set("priority", next.priority);
    formData.set("dueDate", dateInputValue(next.due_date));

    setError("");
    startTransition(async () => {
      updateOptimisticTask(next);
      setIsEditing(false);
      try {
        await updateTaskFromTable(formData);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Task update failed.");
        setIsEditing(true);
      }
    });
  }

  return (
    <tr className="group align-middle transition hover:bg-subtle/60">
      <td className="px-4 py-3">
        {isEditing ? (
          <input
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                save();
              }
              if (event.key === "Escape") cancel();
            }}
            autoFocus
            maxLength={240}
            className="h-9 w-full min-w-56 rounded-lg border border-primary bg-canvas px-2.5 font-medium text-fg outline-none ring-2 ring-primary/15"
          />
        ) : (
          <button type="button" onClick={beginEditing} className="text-left font-medium text-fg hover:text-primary">
            {optimisticTask.title}
          </button>
        )}
        {error ? <p className="mt-1 max-w-sm text-xs text-danger-strong">{error}</p> : null}
      </td>
      <td className="px-4 py-3">
        {isEditing ? (
          <Select title="Status" value={draft.status} onValueChange={(value) => setDraft((current) => ({
              ...current,
              status: value as ProjectTask["status"],
            }))} className="min-w-36" triggerClassName="h-9">
            <SelectGroup>{statuses.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectGroup>
          </Select>
        ) : <StatusBadge status={optimisticTask.status} />}
      </td>
      <td className="px-4 py-3">
        {isEditing ? (
          <Select title="Priority" value={draft.priority} onValueChange={(value) => setDraft((current) => ({
              ...current,
              priority: value as ProjectTask["priority"],
            }))} className="min-w-32" triggerClassName="h-9 capitalize">
            <SelectGroup>{priorities.map((priority) => <SelectItem key={priority} value={priority}>{priority}</SelectItem>)}</SelectGroup>
          </Select>
        ) : <PriorityBadge priority={optimisticTask.priority} />}
      </td>
      <td className="px-4 py-3 text-fg-muted">{assigneeLabel}</td>
      <td className="px-4 py-3 text-fg-muted">
        {isEditing ? (
          <input
            type="date"
            value={dateInputValue(draft.due_date)}
            onChange={(event) => setDraft((current) => ({ ...current, due_date: event.target.value || null }))}
            className="h-9 rounded-lg border border-border bg-canvas px-2.5 text-fg outline-none focus:border-primary"
          />
        ) : formatDate(optimisticTask.due_date)}
      </td>
      <td className="px-4 py-3 text-right">
        {isEditing ? (
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={cancel}
              disabled={isPending}
              aria-label={`Cancel editing ${task.title}`}
              className="flex size-9 items-center justify-center rounded-lg border border-border bg-surface text-fg-muted hover:bg-subtle hover:text-fg disabled:opacity-50"
            >
              <X className="size-4" />
            </button>
            <button
              type="button"
              onClick={save}
              disabled={isPending || draft.title.trim().length < 2}
              aria-label={`Save ${task.title}`}
              className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-fg hover:bg-primary-hover disabled:opacity-50"
            >
              {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={beginEditing}
            disabled={isPending}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-fg-muted opacity-70 transition hover:border-primary hover:text-fg group-hover:opacity-100 disabled:opacity-50"
          >
            {isPending ? <LoaderCircle className="size-3.5 animate-spin" /> : <Pencil className="size-3.5" />}
            {isPending ? "Saving" : "Edit"}
          </button>
        )}
      </td>
    </tr>
  );
}

export default function TaskTable({
  projectId,
  tasks,
  assignees,
  profiles,
}: {
  projectId: string;
  tasks: ProjectTask[];
  assignees: ProjectTaskAssignee[];
  profiles: Profile[];
}) {
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="border-b border-border px-4 py-3">
        <p className="text-sm font-semibold text-fg">Editable task table</p>
        <p className="mt-1 text-xs text-fg-muted">Select a task title or Edit to update it without leaving this page.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b border-border bg-subtle text-xs uppercase tracking-wide text-fg-muted">
            <tr>
              <th className="px-4 py-3">Task</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Assignees</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tasks.map((task) => {
              const assigneeLabel = assignees
                .filter((assignee) => assignee.task_id === task.id)
                .map((assignee) => {
                  const profile = profilesById.get(assignee.user_id);
                  return profile?.full_name || profile?.username || "Member";
                })
                .join(", ") || "Unassigned";

              return (
                <EditableTaskRow
                  key={task.id}
                  projectId={projectId}
                  task={task}
                  assigneeLabel={assigneeLabel}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
