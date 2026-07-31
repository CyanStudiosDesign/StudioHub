import { notFound, redirect } from "next/navigation";
import {
  getCoreMembership,
  getCoreWorkspace,
  SetupErrorScreen,
} from "@/lib/core-workspace";
import { createClient } from "@/utils/supabase/server";
import type {
  Database,
  Profile,
  ProjectTask,
  ProjectTaskAssignee,
} from "@/types/supabase";
import {
  addFinancialEntry,
  createGoal,
  createTask,
  updateTaskStatus,
} from "./actions";
import { Tabs } from "@/components/blocks/tabs/Tabs";
import { TabsContent } from "@/components/blocks/tabs/TabsContent";
import { TabsList } from "@/components/blocks/tabs/TabsList";
import { TabsTrigger } from "@/components/blocks/tabs/TabsTrigger";
import {
  OptimisticForm,
  OptimisticSubmitButton,
} from "@/components/ui/forms/OptimisticForm";
import { Select, SelectGroup, SelectItem } from "@/components/ui/select";
import ActivityTimeline from "./_components/ActivityTimeline";
import CalendarView from "./_components/CalendarView";
import CostBreakdown from "./_components/CostBreakdown";
import EmptyState from "./_components/EmptyState";
import FinancialSummary from "./_components/FinancialSummary";
import GoalCard from "./_components/GoalCard";
import KanbanBoard from "./_components/KanbanBoard";
import MemberList from "./_components/MemberList";
import ProjectHeader from "./_components/ProjectHeader";
import ProjectProgress from "./_components/ProjectProgress";
import ProjectSettingsDialog from "./_components/ProjectSettingsDialog";
import ProjectStats from "./_components/ProjectStats";
import StatusBadge from "./_components/StatusBadge";
import SubtaskChecklist from "./_components/SubtaskChecklist";
import TaskAttachments from "./_components/TaskAttachments";
import TaskComments from "./_components/TaskComments";
import TaskDependencyGraph from "./_components/TaskDependencyGraph";
import TaskTable from "./_components/TaskTable";
import TimelineView from "./_components/TimelineView";
import WorkloadView from "./_components/WorkloadView";

type ProjectDashboardPageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{
    q?: string;
    status?: Database["public"]["Enums"]["project_task_status"];
    priority?: Database["public"]["Enums"]["project_task_priority"];
    assignee?: string;
    goal?: string;
    task?: string;
  }>;
};

const taskStatuses = [
  "backlog",
  "todo",
  "in_progress",
  "blocked",
  "in_review",
  "completed",
  "cancelled",
] as const;

const priorities = ["low", "medium", "high", "critical"] as const;

function percent(done: number, total: number) {
  return total ? Math.round((done / total) * 100) : 0;
}

function isStatus(
  value: string | undefined,
): value is Database["public"]["Enums"]["project_task_status"] {
  return taskStatuses.includes(value as (typeof taskStatuses)[number]);
}

function isPriority(
  value: string | undefined,
): value is Database["public"]["Enums"]["project_task_priority"] {
  return priorities.includes(value as (typeof priorities)[number]);
}

function name(profile: Profile | undefined) {
  return profile?.full_name || profile?.username || profile?.email || "Unknown";
}

export default async function ProjectDashboardPage({
  params,
  searchParams,
}: ProjectDashboardPageProps) {
  const { projectId } = await params;
  const filters = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { workspace: coreWorkspace, setupError } =
    await getCoreWorkspace(supabase);

  if (setupError || !coreWorkspace) {
    return <SetupErrorScreen message={setupError ?? "Workspace missing."} />;
  }

  const membership = await getCoreMembership(supabase, coreWorkspace.id, user.id);

  if (!membership) {
    redirect("/");
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select(
      "id, workspace_id, created_by, name, description, client_name, estimated_deadline, status, created_at, updated_at",
    )
    .eq("id", projectId)
    .maybeSingle();

  if (projectError) throw new Error(projectError.message);
  if (!project) notFound();

  if (project.workspace_id !== coreWorkspace.id) {
    notFound();
  }

  const { data: canManage, error: manageError } = await supabase.rpc(
    "can_manage_project",
    {
      p_project_id: project.id,
      p_user_id: user.id,
    },
  );
  if (manageError) throw new Error(manageError.message);

  const { data: canViewFinancials, error: financialPermissionError } =
    await supabase.rpc("can_view_project_financials", {
      p_project_id: project.id,
      p_user_id: user.id,
    });
  if (financialPermissionError) {
    throw new Error(financialPermissionError.message);
  }

  const { data: workspaceMembers, error: workspaceMembersError } =
    await supabase
      .from("workspace_members")
      .select("user_id, role")
      .eq("workspace_id", project.workspace_id)
      .order("created_at", { ascending: true });
  if (workspaceMembersError) throw new Error(workspaceMembersError.message);

  const { data: projectMembers, error: projectMembersError } = await supabase
    .from("project_members")
    .select("project_id, user_id, assigned_by, role, created_at, updated_at")
    .eq("project_id", project.id)
    .order("created_at", { ascending: true });
  if (projectMembersError) throw new Error(projectMembersError.message);

  const { data: goals, error: goalsError } = await supabase
    .from("project_goals")
    .select("id, project_id, workspace_id, name, description, deadline, created_by, created_at, updated_at")
    .eq("project_id", project.id)
    .order("updated_at", { ascending: false });
  if (goalsError) throw new Error(goalsError.message);

  let taskQuery = supabase
    .from("project_tasks")
    .select(
      "id, project_id, workspace_id, goal_id, parent_task_id, title, description, status, priority, reporter_id, created_by, start_date, due_date, estimated_hours, actual_hours, labels, block_completion_on_dependencies, created_at, updated_at",
    )
    .eq("project_id", project.id)
    .order("updated_at", { ascending: false })
    .limit(200);

  if (filters.q) {
    taskQuery = taskQuery.or(
      `title.ilike.%${filters.q}%,description.ilike.%${filters.q}%`,
    );
  }
  if (isStatus(filters.status)) taskQuery = taskQuery.eq("status", filters.status);
  if (isPriority(filters.priority)) {
    taskQuery = taskQuery.eq("priority", filters.priority);
  }
  if (filters.goal) taskQuery = taskQuery.eq("goal_id", filters.goal);

  const { data: tasks, error: tasksError } = await taskQuery;
  if (tasksError) throw new Error(tasksError.message);

  const taskIds = tasks.map((task) => task.id);
  const { data: taskAssignees, error: taskAssigneesError } = taskIds.length
    ? await supabase
        .from("project_task_assignees")
        .select("task_id, user_id, assigned_by, created_at")
        .in("task_id", taskIds)
    : { data: [], error: null };
  if (taskAssigneesError) throw new Error(taskAssigneesError.message);

  const filteredTasks = filters.assignee
    ? tasks.filter((task) =>
        taskAssignees.some(
          (assignee) =>
            assignee.task_id === task.id && assignee.user_id === filters.assignee,
        ),
      )
    : tasks;

  const { data: subtasks, error: subtasksError } = taskIds.length
    ? await supabase
        .from("project_subtasks")
        .select("id, task_id, title, is_completed, completed_by, completed_at, created_by, created_at, updated_at")
        .in("task_id", taskIds)
    : { data: [], error: null };
  if (subtasksError) throw new Error(subtasksError.message);

  const { data: dependencies, error: dependenciesError } = taskIds.length
    ? await supabase
        .from("project_task_dependencies")
        .select("task_id, depends_on_task_id, created_by, created_at")
        .in("task_id", taskIds)
    : { data: [], error: null };
  if (dependenciesError) throw new Error(dependenciesError.message);

  const { data: comments, error: commentsError } = await supabase
    .from("project_comments")
    .select("id, project_id, task_id, author_id, message, metadata, created_at")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false })
    .limit(40);
  if (commentsError) throw new Error(commentsError.message);

  const { data: attachments, error: attachmentsError } = taskIds.length
    ? await supabase
        .from("project_attachments")
        .select("id, project_id, task_id, uploaded_by, storage_path, preview_url, file_name, file_size, mime_type, created_at")
        .in("task_id", taskIds)
        .order("created_at", { ascending: false })
    : { data: [], error: null };
  if (attachmentsError) throw new Error(attachmentsError.message);

  const { data: financialEntries, error: financialEntriesError } =
    canViewFinancials
      ? await supabase
          .from("project_financial_entries")
          .select("id, project_id, workspace_id, title, category, amount, is_revenue, notes, created_by, created_at, updated_at")
          .eq("project_id", project.id)
          .order("created_at", { ascending: false })
      : { data: [], error: null };
  if (financialEntriesError) throw new Error(financialEntriesError.message);

  const { data: activities, error: activitiesError } = await supabase
    .from("project_activity")
    .select("id, project_id, task_id, goal_id, actor_id, type, message, metadata, created_at")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false })
    .limit(30);
  if (activitiesError) throw new Error(activitiesError.message);

  const profileIds = Array.from(
    new Set([
      project.created_by,
      ...workspaceMembers.map((member) => member.user_id),
      ...projectMembers.map((member) => member.user_id),
      ...tasks.flatMap((task) => [task.created_by, task.reporter_id].filter(Boolean) as string[]),
      ...taskAssignees.map((assignee) => assignee.user_id),
      ...comments.map((comment) => comment.author_id),
      ...activities.flatMap((activity) => activity.actor_id ? [activity.actor_id] : []),
    ]),
  );
  const { data: profiles, error: profilesError } = profileIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, email, full_name, date_of_birth, avatar_url, created_at, updated_at")
        .in("id", profileIds)
    : { data: [], error: null };
  if (profilesError) throw new Error(profilesError.message);

  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  const assignedProjectMemberIds = new Set(
    projectMembers.map((member) => member.user_id),
  );
  const assignableWorkspaceMembers = workspaceMembers.filter(
    (member) => !assignedProjectMemberIds.has(member.user_id),
  );
  const completedTasks = tasks.filter((task) => task.status === "completed").length;
  const completedGoals = goals.filter((goal) => {
    const goalTasks = tasks.filter((task) => task.goal_id === goal.id);
    return goalTasks.length > 0 && goalTasks.every((task) => task.status === "completed");
  }).length;
  const selectedTask =
    filteredTasks.find((task) => task.id === filters.task) ?? filteredTasks[0];

  return (
    <>
      <main className="min-h-screen bg-canvas px-6 py-10 text-fg">
        <div className="mx-auto max-w-7xl space-y-6">
          <ProjectHeader project={project} />

          <Tabs defaultValue="overview">
            <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
              <TabsList className="mb-0 h-auto max-w-full justify-start gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1.5">
                <TabsTrigger value="overview" className="rounded-lg px-4">Overview</TabsTrigger>
                <TabsTrigger value="tasks" className="rounded-lg px-4">Tasks</TabsTrigger>
                <TabsTrigger value="goals" className="rounded-lg px-4">Goals</TabsTrigger>
                <TabsTrigger value="team" className="rounded-lg px-4">Team</TabsTrigger>
                <TabsTrigger value="activity" className="rounded-lg px-4">Activity</TabsTrigger>
                {canViewFinancials ? (
                  <TabsTrigger value="financials" className="rounded-lg px-4">Financials</TabsTrigger>
                ) : null}
              </TabsList>
              <ProjectSettingsDialog
                project={project}
                canManage={Boolean(canManage)}
                assignableMembers={assignableWorkspaceMembers.map((member) => ({
                  id: member.user_id,
                  label: name(profilesById.get(member.user_id)),
                }))}
              />
            </div>

            <TabsContent value="overview" className="space-y-6">
              <ProjectStats tasks={tasks as ProjectTask[]} />
              <div className="grid gap-6 xl:grid-cols-3">
                <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-fg-subtle">Milestones</p>
                      <h2 className="mt-1 text-lg font-semibold tracking-tight">Goals</h2>
                    </div>
                    <span className="rounded-full bg-subtle px-3 py-1 text-xs font-semibold text-fg-muted">
                      {completedGoals}/{goals.length} complete
                    </span>
                  </div>
                  <div className="mt-5 space-y-3">
                    {goals.length ? goals.slice(0, 3).map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        tasks={tasks.filter((task) => task.goal_id === goal.id) as ProjectTask[]}
                      />
                    )) : (
                      <p className="rounded-xl border border-dashed border-border p-5 text-sm text-fg-muted">No project goals yet.</p>
                    )}
                  </div>
                </section>
                {canViewFinancials ? (
                  <FinancialSummary entries={financialEntries} />
                ) : (
                  <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                    <h2 className="text-lg font-semibold tracking-tight">Financial overview</h2>
                    <p className="mt-3 text-sm leading-6 text-fg-muted">Financial data is limited to authorized project members.</p>
                  </section>
                )}
                <ProjectProgress
                  taskProgress={percent(completedTasks, tasks.length)}
                  goalProgress={percent(completedGoals, goals.length)}
                  completedTasks={completedTasks}
                  totalTasks={tasks.length}
                  completedGoals={completedGoals}
                  totalGoals={goals.length}
                />
              </div>
            </TabsContent>

            <TabsContent value="goals">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold tracking-tight">Goals</h2>
            </div>
            <OptimisticForm
              action={createGoal}
              pendingMessage="Creating goal…"
              resetOnSubmit
              className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_1fr_160px_auto]"
            >
              <input type="hidden" name="projectId" value={project.id} />
              <input type="hidden" name="workspaceId" value={project.workspace_id} />
              <input
                name="name"
                required
                placeholder="Goal name"
                className="h-11 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-950"
              />
              <input
                name="description"
                placeholder="Description"
                className="h-11 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-950"
              />
              <input
                name="deadline"
                type="date"
                className="h-11 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-950"
              />
              <OptimisticSubmitButton
                disabled={!canManage}
                pendingLabel="Creating…"
                className="h-11 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Create goal
              </OptimisticSubmitButton>
            </OptimisticForm>
            {goals.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {goals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    tasks={tasks.filter((task) => task.goal_id === goal.id) as ProjectTask[]}
                  />
                ))}
              </div>
            ) : (
              <EmptyState title="No goals yet" description="Create project milestones to group tasks and measure launch progress." />
            )}
          </section>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-6">
          <section className="space-y-5">
            <h2 className="text-2xl font-semibold tracking-tight">Tasks</h2>
            <form className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_160px_160px_180px_auto]">
              <input
                name="q"
                defaultValue={filters.q ?? ""}
                placeholder="Search task title or description"
                className="h-11 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-950"
              />
              <Select name="status" title="All statuses" defaultValue={filters.status ?? ""}><SelectGroup><SelectItem value="">All statuses</SelectItem>{taskStatuses.map((status) => <SelectItem key={status} value={status}>{status.replaceAll("_", " ")}</SelectItem>)}</SelectGroup></Select>
              <Select name="priority" title="All priorities" defaultValue={filters.priority ?? ""}><SelectGroup><SelectItem value="">All priorities</SelectItem>{priorities.map((priority) => <SelectItem key={priority} value={priority}>{priority}</SelectItem>)}</SelectGroup></Select>
              <Select name="goal" title="All goals" defaultValue={filters.goal ?? ""}><SelectGroup><SelectItem value="">All goals</SelectItem>{goals.map((goal) => <SelectItem key={goal.id} value={goal.id}>{goal.name}</SelectItem>)}</SelectGroup></Select>
              <button className="h-11 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800">
                Filter
              </button>
            </form>

            <OptimisticForm
              action={createTask}
              pendingMessage="Creating task…"
              successMessage="Task created"
              resetOnSubmit
              className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_1fr_150px_150px_170px_auto]"
            >
              <input type="hidden" name="projectId" value={project.id} />
              <input type="hidden" name="workspaceId" value={project.workspace_id} />
              <input name="title" required placeholder="Task title" className="h-11 rounded-xl border border-zinc-200 px-3 text-sm" />
              <input name="description" placeholder="Description" className="h-11 rounded-xl border border-zinc-200 px-3 text-sm" />
              <Select name="priority" title="Priority" defaultValue="medium"><SelectGroup>{priorities.map((priority) => <SelectItem key={priority} value={priority}>{priority}</SelectItem>)}</SelectGroup></Select>
              <Select name="goalId" title="No goal"><SelectGroup><SelectItem value="">No goal</SelectItem>{goals.map((goal) => <SelectItem key={goal.id} value={goal.id}>{goal.name}</SelectItem>)}</SelectGroup></Select>
              <Select name="assigneeId" title="No assignee"><SelectGroup title="Workspace members"><SelectItem value="">No assignee</SelectItem>{workspaceMembers.map((member) => <SelectItem key={member.user_id} value={member.user_id}>{member.user_id === user.id ? `${name(profilesById.get(member.user_id))} (you)` : name(profilesById.get(member.user_id))}</SelectItem>)}</SelectGroup></Select>
              <OptimisticSubmitButton pendingLabel="Creating…" className="h-11 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800">
                Create task
              </OptimisticSubmitButton>
            </OptimisticForm>

            {filteredTasks.length ? (
              <>
                <KanbanBoard
                  projectId={project.id}
                  tasks={filteredTasks as ProjectTask[]}
                  assignees={taskAssignees as ProjectTaskAssignee[]}
                  subtasks={subtasks}
                  profiles={profiles}
                />
                <TaskTable
                  projectId={project.id}
                  tasks={filteredTasks as ProjectTask[]}
                  assignees={taskAssignees as ProjectTaskAssignee[]}
                  profiles={profiles}
                />
              </>
            ) : (
              <EmptyState title="No tasks match this view" description="Create a task or adjust your filters to see project work." />
            )}
          </section>

          {selectedTask ? (
            <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
              <div className="space-y-6">
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight">
                        {selectedTask.title}
                      </h2>
                      {selectedTask.description ? (
                        <p className="mt-2 text-sm leading-6 text-zinc-600">
                          {selectedTask.description}
                        </p>
                      ) : null}
                    </div>
                    <StatusBadge status={selectedTask.status} />
                  </div>
                  <OptimisticForm action={updateTaskStatus} pendingMessage="Updating status…" className="mt-4 flex gap-2">
                    <input type="hidden" name="projectId" value={project.id} />
                    <input type="hidden" name="taskId" value={selectedTask.id} />
                    <Select name="status" title="Status" defaultValue={selectedTask.status} className="max-w-52"><SelectGroup>{taskStatuses.map((status) => <SelectItem key={status} value={status}>{status.replaceAll("_", " ")}</SelectItem>)}</SelectGroup></Select>
                    <OptimisticSubmitButton pendingLabel="Updating…" className="h-10 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800">
                      Update status
                    </OptimisticSubmitButton>
                  </OptimisticForm>
                </div>
                <TimelineView tasks={tasks as ProjectTask[]} />
                <CalendarView tasks={tasks as ProjectTask[]} />
                <WorkloadView
                  projectMembers={projectMembers.map((member) => member.user_id)}
                  tasks={tasks as ProjectTask[]}
                  assignees={taskAssignees as ProjectTaskAssignee[]}
                  profilesById={profilesById}
                />
              </div>
              <div className="space-y-6">
                <SubtaskChecklist subtasks={subtasks.filter((subtask) => subtask.task_id === selectedTask.id)} />
                <TaskDependencyGraph task={selectedTask as ProjectTask} tasks={tasks as ProjectTask[]} dependencies={dependencies} />
                <TaskComments
                  projectId={project.id}
                  taskId={selectedTask.id}
                  comments={comments.filter((comment) => comment.task_id === selectedTask.id)}
                  profilesById={profilesById}
                />
                <TaskAttachments
                  projectId={project.id}
                  taskId={selectedTask.id}
                  attachments={attachments.filter((attachment) => attachment.task_id === selectedTask.id)}
                />
              </div>
            </section>
          ) : null}
            </TabsContent>

            <TabsContent value="team">
              <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
                <MemberList
                  members={projectMembers}
                  tasks={tasks as ProjectTask[]}
                  assignees={taskAssignees as ProjectTaskAssignee[]}
                  profilesById={profilesById}
                />
                <WorkloadView
                  projectMembers={projectMembers.map((member) => member.user_id)}
                  tasks={tasks as ProjectTask[]}
                  assignees={taskAssignees as ProjectTaskAssignee[]}
                  profilesById={profilesById}
                />
              </div>
            </TabsContent>

            <TabsContent value="activity">
              <ActivityTimeline activities={activities} profilesById={profilesById} />
            </TabsContent>

          {canViewFinancials ? (
            <TabsContent value="financials">
            <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
              <div className="space-y-6">
                <FinancialSummary entries={financialEntries} />
                <CostBreakdown entries={financialEntries} />
              </div>
              <OptimisticForm
                action={addFinancialEntry}
                pendingMessage="Saving entry…"
                resetOnSubmit
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <h2 className="text-lg font-semibold tracking-tight">
                  Add financial entry
                </h2>
                <input type="hidden" name="projectId" value={project.id} />
                <input type="hidden" name="workspaceId" value={project.workspace_id} />
                <div className="mt-4 space-y-3">
                  <input name="title" required placeholder="Entry title" className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm" />
                  <input name="category" required placeholder="Development, Design, Hosting..." className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm" />
                  <input name="amount" required type="number" step="0.01" placeholder="Amount" className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm" />
                  <label className="flex items-center gap-2 text-sm text-zinc-700">
                    <input type="checkbox" name="isRevenue" className="size-4 accent-zinc-950" />
                    Revenue entry
                  </label>
                  <textarea name="notes" placeholder="Notes" className="min-h-24 w-full resize-none rounded-xl border border-zinc-200 px-3 py-3 text-sm" />
                  <OptimisticSubmitButton pendingLabel="Saving…" className="h-11 w-full rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800">
                    Save entry
                  </OptimisticSubmitButton>
                </div>
              </OptimisticForm>
            </section>
            </TabsContent>
          ) : null}
          </Tabs>
        </div>
      </main>
    </>
  );
}
