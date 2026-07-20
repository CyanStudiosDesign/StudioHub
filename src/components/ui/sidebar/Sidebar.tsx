"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Bell,
  FilePlus,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Megaphone,
  PanelLeft,
} from "lucide-react";
import { useSidebar } from "@/components/ui/provider/SidebarProvider";
import { cn } from "@/lib/utils";

type SidebarProps = {
  workspaceId?: string;
  hasUnreadAnnouncements?: boolean;
  logoutAction: () => void | Promise<void>;
};

const baseLinkClass =
  "flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors";

function isNavItemActive(
  pathname: string,
  item: { href: string; label: string },
) {
  const href = item.href.split("?")[0];

  if (href === "/") return pathname === "/";
  if (item.label === "Projects") {
    return pathname === href || pathname.startsWith("/projects/");
  }
  if (item.label === "Workspace") {
    return /^\/workspaces\/[^/]+($|\/settings$)/.test(pathname);
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar({
  workspaceId,
  hasUnreadAnnouncements,
  logoutAction,
}: SidebarProps) {
  const { collapsed, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const createDocumentHref = workspaceId
    ? `/editor?workspaceId=${workspaceId}`
    : "/editor";
  const projectsHref = workspaceId
    ? `/workspaces/${workspaceId}/projects`
    : "/workspaces";
  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/documents", label: "Documents", icon: FileText },
    { href: projectsHref, label: "Projects", icon: LayoutDashboard },
    {
      href: "/announcements",
      label: "Announcements",
      icon: Bell,
      hasDot: hasUnreadAnnouncements,
    },
    { href: "/creatives", label: "Creatives", icon: Megaphone },
    { href: createDocumentHref, label: "Create document", icon: FilePlus },
  ];

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col border-r border-zinc-200 bg-white text-zinc-950 transition-all duration-200",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-3">
        <button
          type="button"
          onClick={toggleSidebar}
          className="flex size-10 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-950"
          aria-label="Toggle sidebar"
        >
          <PanelLeft className="size-5" />
        </button>

        {!collapsed ? (
          <div className="flex items-center gap-2 text-sm font-semibold">
            <BookOpen className="size-4" />
            Studio Hub
          </div>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isNavItemActive(pathname, item);

          return (
            <Link
              key={item.label}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                baseLinkClass,
                isActive
                  ? "bg-zinc-950 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
                collapsed && "justify-center px-0",
              )}
            >
              <span className="relative shrink-0">
                <Icon className="size-5" />
                {item.hasDot ? (
                  <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                ) : null}
              </span>
              {!collapsed ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-200 p-3">
        <form action={logoutAction}>
          <button
            type="submit"
            title={collapsed ? "Logout" : undefined}
            className={cn(
              baseLinkClass,
              "w-full text-zinc-600 hover:bg-red-50 hover:text-red-700",
              collapsed && "justify-center px-0",
            )}
          >
            <LogOut className="size-5 shrink-0" />
            {!collapsed ? <span>Logout</span> : null}
          </button>
        </form>
      </div>
    </aside>
  );
}
