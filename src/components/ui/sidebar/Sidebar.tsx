"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Bell,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Megaphone,
  PanelLeft,
  UserRound,
} from "lucide-react";
import { useSidebar } from "@/components/ui/provider/SidebarProvider";
import { Button } from "@/components/ui/buttons/Buttons";
import { Separator } from "@/components/ui/separator/Separator";
import { ThemeToggle } from "@/components/ui/theme/ThemeToggle";
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
  if (item.label === "Documents") return pathname === "/documents";
  if (item.label === "My articles") {
    return pathname.startsWith("/documents/mine") || pathname === "/editor";
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
    { href: "/documents/mine", label: "My articles", icon: UserRound },
  ];

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col border-r border-border bg-surface text-fg transition-all duration-200",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-16 items-center justify-between px-3">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleSidebar}
          className="rounded-xl"
          aria-label="Toggle sidebar"
        >
          <PanelLeft className="size-5" />
        </Button>

        {!collapsed ? (
          <div className="flex items-center gap-2 text-sm font-semibold">
            <BookOpen className="size-4" />
            TuesdaySpace
          </div>
        ) : null}
        {!collapsed ? <ThemeToggle /> : null}
      </div>
      <Separator />

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
                  ? "bg-gradient-to-r from-primary to-[#066555] text-primary-fg shadow-[0_0_26px_color-mix(in_srgb,var(--primary)_24%,transparent)]"
                  : "text-fg-muted hover:bg-subtle hover:text-fg",
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

      <Separator />
      <div className="p-3">
        {collapsed ? <div className="mb-2 flex justify-center"><ThemeToggle /></div> : null}
        <form action={logoutAction}>
          <Button
            type="submit"
            variant="ghost"
            title={collapsed ? "Logout" : undefined}
            className={cn(
              baseLinkClass,
              "w-full text-fg-muted hover:bg-danger-subtle hover:text-danger-strong",
              collapsed && "justify-center px-0",
            )}
          >
            <LogOut className="size-5 shrink-0" />
            {!collapsed ? <span>Logout</span> : null}
          </Button>
        </form>
      </div>
    </aside>
  );
}
