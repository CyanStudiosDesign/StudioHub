"use client";

import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/buttons/Buttons";
import ModalUi from "@/components/ui/dialog/ModalUi";
import {
  OptimisticForm,
  OptimisticSubmitButton,
} from "@/components/ui/forms/OptimisticForm";
import type { Project } from "@/types/supabase";
import { Select, SelectGroup, SelectItem } from "@/components/ui/select";
import { ThemeToggle } from "@/components/ui/theme/ThemeToggle";
import { addProjectMember, updateProjectOverview } from "../actions";

type AssignableMember = { id: string; label: string };

export default function ProjectSettingsDialog({
  project,
  canManage,
  assignableMembers,
}: {
  project: Project;
  canManage: boolean;
  assignableMembers: AssignableMember[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="h-10 shrink-0 rounded-xl border-border-strong bg-surface px-4 text-fg hover:border-primary hover:bg-subtle"
      >
        <Settings className="size-4" />
        Settings
      </Button>
      {isOpen ? (
        <ModalUi
          handleClose={() => setIsOpen(false)}
          title="Project settings"
          description="Update project details and control who can collaborate on this project."
        >
          <div className="space-y-8">
            <div className="flex items-center justify-between rounded-2xl border border-border bg-canvas p-4"><div><h3 className="font-semibold">Appearance</h3><p className="mt-1 text-sm text-fg-muted">Use the dark Studio Hub theme.</p></div><ThemeToggle /></div>
            <OptimisticForm action={updateProjectOverview} pendingMessage="Saving project…" successMessage="Project settings saved">
              <div>
                <h3 className="font-semibold">Project details</h3>
                <p className="mt-1 text-sm text-fg-muted">
                  Keep the project name, client, deadline, and description current.
                </p>
              </div>
              <input type="hidden" name="projectId" value={project.id} />
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium">
                  Project name
                  <input
                    name="name"
                    defaultValue={project.name}
                    className="h-11 rounded-xl border border-border bg-canvas px-3 text-sm text-fg outline-none placeholder:text-fg-subtle focus:border-primary"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Client
                  <input
                    name="clientName"
                    defaultValue={project.client_name ?? ""}
                    placeholder="Client name"
                    className="h-11 rounded-xl border border-border bg-canvas px-3 text-sm text-fg outline-none placeholder:text-fg-subtle focus:border-primary"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Deadline
                  <input
                    name="estimatedDeadline"
                    type="date"
                    defaultValue={project.estimated_deadline ?? ""}
                    className="h-11 rounded-xl border border-border bg-canvas px-3 text-sm text-fg outline-none focus:border-primary"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium sm:col-span-2">
                  Description
                  <textarea
                    name="description"
                    defaultValue={project.description ?? ""}
                    placeholder="Project description"
                    className="min-h-28 resize-none rounded-xl border border-border bg-canvas px-3 py-3 text-sm text-fg outline-none placeholder:text-fg-subtle focus:border-primary"
                  />
                </label>
              </div>
              <OptimisticSubmitButton
                disabled={!canManage}
                pendingLabel="Saving…"
                className="mt-5 h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-fg hover:bg-primary-hover"
              >
                Save project
              </OptimisticSubmitButton>
            </OptimisticForm>

            <div className="border-t border-border pt-8">
              <h3 className="font-semibold">Project access</h3>
              <p className="mt-1 text-sm text-fg-muted">
                Add an existing workspace member and describe their role.
              </p>
              <OptimisticForm
                action={addProjectMember}
                pendingMessage="Adding member…"
                successMessage="Project member added"
                resetOnSubmit
                className="mt-5 grid gap-3 sm:grid-cols-[1fr_180px_auto]"
              >
                <input type="hidden" name="projectId" value={project.id} />
                <Select name="userId" title="Workspace member" required disabled={!assignableMembers.length}><SelectGroup>{assignableMembers.map((member) => <SelectItem key={member.id} value={member.id}>{member.label}</SelectItem>)}</SelectGroup></Select>
                <input
                  name="role"
                  placeholder="Project role"
                  className="h-11 rounded-xl border border-border bg-canvas px-3 text-sm text-fg outline-none placeholder:text-fg-subtle focus:border-primary"
                />
                <OptimisticSubmitButton
                  disabled={!canManage || !assignableMembers.length}
                  pendingLabel="Adding…"
                  className="h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-fg hover:bg-primary-hover"
                >
                  Add member
                </OptimisticSubmitButton>
              </OptimisticForm>
            </div>
          </div>
        </ModalUi>
      ) : null}
    </>
  );
}
