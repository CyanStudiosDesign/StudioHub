"use client";

import React, { useEffect, useState } from "react";
import { ContextMenuContent } from "./ContextMenuContent";
import { cn } from "@/lib/utils";

interface ContextMenuProps {
  children: React.ReactNode;
  className?: string;
}

interface ContextMenuContentProps {
  children: React.ReactNode;
  x?: number;
  y?: number;
  onClose?: () => void;
}

export function ContextMenu({ children, className }: ContextMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();

    
    setOpen(false);

    setPosition({
      x: e.clientX,
      y: e.clientY,
    });

    setOpen(true);
  };

  useEffect(() => {
    const closeMenu = () => setOpen(false);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  return (
    <div
      onContextMenu={handleContextMenu}
      className={cn(
        "relative w-full",
        className,
      )}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === ContextMenuContent) {
          if (!open) return null;

          return React.cloneElement(
            child as React.ReactElement<ContextMenuContentProps>,
            {
              x: position.x,
              y: position.y,
              onClose: () => setOpen(false),
            },
          );
        }
        return child;
      })}
    </div>
  );
}

export { ContextMenuContent };
