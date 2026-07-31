import type { ReactNode } from "react";
import { logout } from "@/app/actions";
import { SidebarProvider } from "@/components/ui/provider/SidebarProvider";
import { createClient } from "@/utils/supabase/server";
import { getCoreMembership, getCoreWorkspace } from "@/lib/core-workspace";
import Sidebar from "./Sidebar";

type AppShellProps = {
  children: ReactNode;
  workspaceId?: string;
};

async function getShellState(workspaceId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  let resolvedWorkspaceId = workspaceId;
  if (!resolvedWorkspaceId) {
    const { workspace } = await getCoreWorkspace(supabase);
    resolvedWorkspaceId = workspace?.id;
  }
  if (!resolvedWorkspaceId) return null;

  const membership = await getCoreMembership(supabase, resolvedWorkspaceId, user.id);
  if (!membership) return null;

  let query = supabase
    .from("announcements")
    .select("id")
    .limit(100);

  query = query.eq("workspace_id", resolvedWorkspaceId);

  const { data: announcements, error: announcementsError } = await query;

  if (announcementsError || !announcements.length) {
    return { workspaceId: resolvedWorkspaceId, hasUnread: false };
  }

  const announcementIds = announcements.map((announcement) => announcement.id);
  const { data: reads, error: readsError } = await supabase
    .from("announcement_reads")
    .select("announcement_id")
    .eq("user_id", user.id)
    .in("announcement_id", announcementIds);

  if (readsError) return { workspaceId: resolvedWorkspaceId, hasUnread: false };

  const readIds = new Set(reads.map((read) => read.announcement_id));
  return {
    workspaceId: resolvedWorkspaceId,
    hasUnread: announcements.some((announcement) => !readIds.has(announcement.id)),
  };
}

export default async function AppShell({ children, workspaceId }: AppShellProps) {
  const shellState = await getShellState(workspaceId);

  if (!shellState) return children;

  return (
    <SidebarProvider>
      <div className="app-theme flex min-h-screen bg-canvas text-fg">
        <Sidebar
          workspaceId={shellState.workspaceId}
          hasUnreadAnnouncements={shellState.hasUnread}
          logoutAction={logout}
        />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </SidebarProvider>
  );
}
