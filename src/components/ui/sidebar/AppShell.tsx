import type { ReactNode } from "react";
import { logout } from "@/app/actions";
import { SidebarProvider } from "@/components/ui/provider/SidebarProvider";
import { createClient } from "@/utils/supabase/server";
import Sidebar from "./Sidebar";

type AppShellProps = {
  children: ReactNode;
  workspaceId?: string;
};

async function hasUnreadAnnouncements() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: announcements, error: announcementsError } = await supabase
    .from("announcements")
    .select("id")
    .limit(100);

  if (announcementsError || !announcements.length) {
    return false;
  }

  const announcementIds = announcements.map((announcement) => announcement.id);
  const { data: reads, error: readsError } = await supabase
    .from("announcement_reads")
    .select("announcement_id")
    .eq("user_id", user.id)
    .in("announcement_id", announcementIds);

  if (readsError) return false;

  const readIds = new Set(reads.map((read) => read.announcement_id));
  return announcements.some((announcement) => !readIds.has(announcement.id));
}

export default async function AppShell({ children, workspaceId }: AppShellProps) {
  const hasUnread = await hasUnreadAnnouncements();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-[#f6f7fb]">
        <Sidebar
          workspaceId={workspaceId}
          hasUnreadAnnouncements={hasUnread}
          logoutAction={logout}
        />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </SidebarProvider>
  );
}
