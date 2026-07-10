import type { ReactNode } from "react";
import { logout } from "@/app/actions";
import { SidebarProvider } from "@/components/ui/provider/SidebarProvider";
import Sidebar from "./Sidebar";

type AppShellProps = {
  children: ReactNode;
  workspaceId?: string;
};

export default function AppShell({ children, workspaceId }: AppShellProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-[#f6f7fb]">
        <Sidebar workspaceId={workspaceId} logoutAction={logout} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </SidebarProvider>
  );
}
