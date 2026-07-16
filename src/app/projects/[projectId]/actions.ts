"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/action";
import type { Database } from "@/types/supabase";

type TaskStatus = Database["public"]["Enums"]["project_task_status"];
type TaskPriority = Database["public"]["Enums"]["project_task_priority"];

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return { supabase, userId: user.id };
}

async function requireProjectAccess(projectId: string) {
  const { supabase, userId } = await requireUser();
  const { data: allowed, error } = await supabase.rpc("can_access_project", {
    p_project_id: projectId,
  });

  if (error) throw new Error(error.message);
  if (!allowed) throw new Error("You do not have access to this project.");

  return { supabase, userId };
}

async function requireProjectManager(projectId: string) {
  const { supabase, userId } = await requireUser();
  const { data: allowed, error } = await supabase.rpc("can_manage_project", {
    p_project_id: projectId,
    p_user_id: userId,
  });

  if (error) throw new Error(error.message);
  if (!allowed) throw new Error("You do not have permission to manage this project.");

  return { supabase, userId };
}

async function requireFinancialAccess(projectId: string) {
  const { supabase, userId } = await requireUser();
  const { data: allowed, error } = await supabase.rpc(
    "can_view_project_financials",
    {
      p_project_id: projectId,
      p_user_id: userId,
    },
  );

  if (error) throw new Error(error.message);
  if (!allowed) throw new Error("Financial data is restricted to owners and administrators.");

  return { supabase, userId };
}

function nullableDate(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "");
  return value || null;
}

function nullableNumber(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) return null;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) throw new Error(`${key} must be a valid number.`);
  return parsed;
}

function labelsFromInput(value: string) {
  return value
    .split(",")
    .map((label) => label.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export async function updateProjectOverview(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const clientName = String(formData.get("clientName") ?? "").trim();
  const estimatedDeadline = nullableDate(formData, "estimatedDeadline");

  if (!projectId || name.length < 2) {
    throw new Error("Project name is required.");
  }

  const { supabase, userId } = await requireProjectManager(projectId);
  const { error } = await supabase
    .from("projects")
    .update({
      name,
      description: description || null,
      client_name: clientName || null,
      estimated_deadline: estimatedDeadline,
    })
    .eq("id", projectId);

  if (error) throw new Error(error.message);

  await supabase.from("project_activity").insert({
    project_id: projectId,
    actor_id: userId,
    type: "project_updated",
    message: "Updated project details.",
  });

  revalidatePath(`/projects/${projectId}`);
}

export async function createGoal(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const deadline = nullableDate(formData, "deadline");

  if (!projectId || !workspaceId || name.length < 2) {
    throw new Error("Goal name is required.");
  }

  const { supabase, userId } = await requireProjectManager(projectId);
  const { data: goal, error } = await supabase
    .from("project_goals")
    .insert({
      project_id: projectId,
      workspace_id: workspaceId,
      name,
      description: description || null,
      deadline,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  await supabase.from("project_activity").insert({
    project_id: projectId,
    goal_id: goal.id,
    actor_id: userId,
    type: "goal_created",
    message: `Created goal "${name}".`,
  });

  revalidatePath(`/projects/${projectId}`);
}

export async function createTask(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const goalId = String(formData.get("goalId") ?? "") || null;
  const assigneeId = String(formData.get("assigneeId") ?? "") || null;
  const priority = String(formData.get("priority") ?? "medium") as TaskPriority;
  const status = String(formData.get("status") ?? "todo") as TaskStatus;
  const labels = labelsFromInput(String(formData.get("labels") ?? ""));

  if (!projectId || !workspaceId || title.length < 2) {
    throw new Error("Task title is required.");
  }

  const { supabase, userId } = await requireProjectAccess(projectId);
  const { data: task, error } = await supabase
    .from("project_tasks")
    .insert({
      project_id: projectId,
      workspace_id: workspaceId,
      title,
      description: description || null,
      goal_id: goalId,
      priority,
      status,
      reporter_id: userId,
      created_by: userId,
      start_date: nullableDate(formData, "startDate"),
      due_date: nullableDate(formData, "dueDate"),
      estimated_hours: nullableNumber(formData, "estimatedHours"),
      labels,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  if (assigneeId) {
    const { error: assigneeError } = await supabase
      .from("project_task_assignees")
      .insert({
        task_id: task.id,
        user_id: assigneeId,
        assigned_by: userId,
      });
    if (assigneeError && assigneeError.code !== "23505") {
      throw new Error(assigneeError.message);
    }
  }

  await supabase.from("project_activity").insert({
    project_id: projectId,
    task_id: task.id,
    goal_id: goalId,
    actor_id: userId,
    type: "task_created",
    message: `Created task "${title}".`,
  });

  revalidatePath(`/projects/${projectId}`);
}

export async function updateTaskStatus(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const taskId = String(formData.get("taskId") ?? "");
  const status = String(formData.get("status") ?? "") as TaskStatus;

  if (!projectId || !taskId || !status) {
    throw new Error("Task status is required.");
  }

  const { supabase, userId } = await requireProjectAccess(projectId);

  if (status === "completed") {
    const { data: dependencies, error: dependencyError } = await supabase
      .from("project_task_dependencies")
      .select("depends_on_task_id")
      .eq("task_id", taskId);

    if (dependencyError) throw new Error(dependencyError.message);

    const dependencyIds = dependencies.map((item) => item.depends_on_task_id);
    if (dependencyIds.length) {
      const { data: requiredTasks, error: requiredError } = await supabase
        .from("project_tasks")
        .select("id, status")
        .in("id", dependencyIds);

      if (requiredError) throw new Error(requiredError.message);

      const hasOpenDependency = requiredTasks.some(
        (task) => task.status !== "completed" && task.status !== "cancelled",
      );

      if (hasOpenDependency) {
        throw new Error("Complete or cancel blocking dependencies before completing this task.");
      }
    }
  }

  const { error } = await supabase
    .from("project_tasks")
    .update({ status })
    .eq("id", taskId)
    .eq("project_id", projectId);

  if (error) throw new Error(error.message);

  await supabase.from("project_activity").insert({
    project_id: projectId,
    task_id: taskId,
    actor_id: userId,
    type: status === "completed" ? "task_updated" : "status_changed",
    message: `Changed task status to ${status.replaceAll("_", " ")}.`,
  });

  revalidatePath(`/projects/${projectId}`);
}

export async function addProjectMember(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "member").trim() || "member";

  if (!projectId || !userId) {
    throw new Error("Project and member are required.");
  }

  const { supabase, userId: assignedBy } = await requireProjectManager(projectId);
  const { error } = await supabase.from("project_members").insert({
    project_id: projectId,
    user_id: userId,
    assigned_by: assignedBy,
    role,
  });

  if (error && error.code !== "23505") throw new Error(error.message);

  await supabase.from("project_activity").insert({
    project_id: projectId,
    actor_id: assignedBy,
    type: "member_assigned",
    message: "Added a member to the project.",
  });

  revalidatePath(`/projects/${projectId}`);
}

export async function addFinancialEntry(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const amount = nullableNumber(formData, "amount");
  const notes = String(formData.get("notes") ?? "").trim();
  const isRevenue = formData.get("isRevenue") === "on";

  if (!projectId || !workspaceId || title.length < 2 || !category || amount === null) {
    throw new Error("Financial title, category, and amount are required.");
  }

  const { supabase, userId } = await requireFinancialAccess(projectId);
  const { error } = await supabase.from("project_financial_entries").insert({
    project_id: projectId,
    workspace_id: workspaceId,
    title,
    category,
    amount,
    is_revenue: isRevenue,
    notes: notes || null,
    created_by: userId,
  });

  if (error) throw new Error(error.message);

  await supabase.from("project_activity").insert({
    project_id: projectId,
    actor_id: userId,
    type: "financial_entry_added",
    message: `Added ${isRevenue ? "revenue" : "expense"} entry "${title}".`,
  });

  revalidatePath(`/projects/${projectId}`);
}

export async function addTaskComment(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const taskId = String(formData.get("taskId") ?? "") || null;
  const message = String(formData.get("message") ?? "").trim();

  if (!projectId || !message) {
    throw new Error("Comment message is required.");
  }

  const { supabase, userId } = await requireProjectAccess(projectId);
  const { error } = await supabase.from("project_comments").insert({
    project_id: projectId,
    task_id: taskId,
    author_id: userId,
    message,
  });

  if (error) throw new Error(error.message);

  await supabase.from("project_activity").insert({
    project_id: projectId,
    task_id: taskId,
    actor_id: userId,
    type: "comment_added",
    message: "Added a task comment.",
  });

  revalidatePath(`/projects/${projectId}`);
}
