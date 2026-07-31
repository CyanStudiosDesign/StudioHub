import React from "react";
import { cn } from "@/lib/utils";

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabsList({
  children,
  className,
}: TabsListProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "mb-1 inline-flex h-10 items-center justify-center rounded-md bg-subtle p-1",
        className,
      )}
    >
      {children}
    </div>
  );
}
