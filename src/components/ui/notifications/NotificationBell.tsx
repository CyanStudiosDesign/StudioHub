"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect } from "react";
import { Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownSeparator, DropdownTrigger } from "@/components/ui/dropdown-menu/DropDownMenu";
import { useToast } from "@/components/ui/toast";

export type BellNotification = { id: string; title: string; message: string; createdAt: string; unread: boolean };

export function NotificationBell({ notifications }: { notifications: BellNotification[] }) {
  const toast = useToast();
  const hasUnread = notifications.some((notification) => notification.unread);
  const latestUnread = notifications.find((notification) => notification.unread);
  useEffect(() => {
    if (!latestUnread) return;
    const key = `studio-hub-announcement-${latestUnread.id}`;
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "shown");
    toast({ message: latestUnread.title, description: latestUnread.message, variant: "info", duration: 6000 });
  }, [latestUnread, toast]);
  return (
    <Dropdown>
      <DropdownTrigger aria-label="Notifications" className="relative size-10 rounded-xl p-0">
        <Bell className="size-5" />
        {hasUnread ? <span className="absolute -right-1 -top-1 size-3 rounded-full bg-red-500 ring-2 ring-surface" /> : null}
      </DropdownTrigger>
      <DropdownContent className="right-0 left-auto w-[min(24rem,calc(100vw-2rem))] p-2">
        <DropdownLabel>Notifications</DropdownLabel>
        {notifications.length ? notifications.map((notification) => (
          <DropdownItem key={notification.id} href="/announcements" className="items-start gap-3 rounded-xl px-3 py-3">
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2 font-semibold"><span className="truncate">{notification.title}</span>{notification.unread ? <span className="size-2 shrink-0 rounded-full bg-red-500" /> : null}</span>
              <span className="mt-1 line-clamp-2 text-xs leading-5 text-fg-muted">{notification.message}</span>
              <span className="mt-1 block text-[11px] text-fg-subtle">{notification.createdAt}</span>
            </span>
          </DropdownItem>
        )) : <p className="px-3 py-6 text-center text-sm text-fg-muted">You’re all caught up.</p>}
        <DropdownSeparator />
        <Link href="/announcements" className="flex h-9 items-center justify-center rounded-xl text-sm font-semibold text-primary hover:bg-subtle">View all announcements</Link>
      </DropdownContent>
    </Dropdown>
  );
}
