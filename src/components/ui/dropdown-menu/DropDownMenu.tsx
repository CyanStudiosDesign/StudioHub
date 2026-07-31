"use client";

import React, {
  useState,
  createContext,
  useContext,
  useRef,
  useEffect,
  ReactNode,
} from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface DropdownContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

interface DropdownProps {
  children: ReactNode;
}
interface TriggerProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}
interface ContentProps {
  children: ReactNode;
  className?: string;
}
interface LabelProps {
  children: ReactNode;
  className?: string;
}
interface ItemProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}
interface ShortcutProps {
  children: ReactNode;
  className?: string;
}
interface SubProps {
  children: ReactNode;
  className?: string;
  label: string;
  disabled?: boolean;
}
interface SeparatorProps {
  className?: string;
}

const DropdownContext = createContext<DropdownContextType | undefined>(
  undefined,
);

const useDropdown = () => {
  const context = useContext(DropdownContext);
  if (!context)
    throw new Error(
      "Dropdown components must be used within a <Dropdown /> provider",
    );
  return context;
};

// ==========================================
// Main Dropdown Provider
// ==========================================
export function Dropdown({ children }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="relative inline-block text-left" ref={containerRef}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

// ==========================================
// 2. Dropdown Trigger
// ==========================================
export function DropdownTrigger({
  children,
  className = "",
  disabled = false,
}: TriggerProps) {
  const { isOpen, setIsOpen } = useDropdown();
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => setIsOpen(!isOpen)}
      aria-expanded={isOpen}
      aria-haspopup="true"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg bg-surface px-3 py-2 text-sm font-semibold text-fg border border-border transition-colors",
        disabled
          ? "cursor-not-allowed opacity-50 pointer-events-none"
          : "hover:bg-subtle focus-ring-visible",
        className,
      )}
    >
      {children}
    </button>
  );
}

// ==========================================
// 7. Dropdown Content (Wrapper)
// ==========================================
export function DropdownContent({ children, className = "" }: ContentProps) {
  const { isOpen } = useDropdown();
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        /* max-h and overflow limits added to support mobile views gracefully */
        "absolute left-0 z-50 mt-1 w-48 max-h-[85vh] overflow-y-auto origin-top-right rounded-xl bg-surface p-1 border border-border shadow-xl",
        className,
      )}
      role="menu"
    >
      {children}
    </div>
  );
}

// ==========================================
// 3. Dropdown Label
// ==========================================
export function DropdownLabel({ children, className = "" }: LabelProps) {
  return (
    <div
      className={cn(
        "px-2 py-1.5 text-xs font-bold text-fg-muted tracking-wider uppercase",
        className,
      )}
    >
      {children}
    </div>
  );
}

// ==========================================
// 4. Dropdown Item
// ==========================================
export function DropdownItem({
  children,
  href,
  onClick,
  className = "",
  disabled = false,
}: ItemProps) {
  const { setIsOpen } = useDropdown();

  const combinedStyles = cn(
    "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm text-fg transition-colors text-left",
    disabled
      ? "opacity-50 cursor-not-allowed pointer-events-none"
      : "hover:bg-subtle focus-ring-visible",
    className,
  );

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    onClick?.();
    setIsOpen(false);
  };

  if (href && !disabled) {
    return (
      <Link
        href={href}
        className={combinedStyles}
        onClick={handleClick}
        role="menuitem"
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      className={combinedStyles}
      onClick={handleClick}
      role="menuitem"
    >
      {children}
    </button>
  );
}

// ==========================================
// 5. Dropdown Shortcut
// ==========================================
export function DropdownShortcut({ children, className = "" }: ShortcutProps) {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-fg-subtle font-mono",
        className,
      )}
    >
      {children}
    </span>
  );
}

// ==========================================
// Dropdown Separator
// ==========================================
export function DropdownSeparator({ className = "" }: SeparatorProps) {
  return <hr className={cn("my-1 border-t border-border", className)} />;
}

// ==========================================
// 6. Dropdown Sub (Nested Menu)
// ==========================================
export function DropdownSub({
  children,
  label,
  className = "",
  disabled = false,
}: SubProps) {
  const [isSubOpen, setIsSubOpen] = useState(false);
  const subRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (subRef.current && !subRef.current.contains(event.target as Node)) {
        setIsSubOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const combinedSubStyles = cn(
    "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm text-fg transition-colors text-left",
    disabled
      ? "opacity-50 cursor-not-allowed pointer-events-none"
      : "hover:bg-subtle focus-ring-visible",
    className,
  );

  return (
    <div
      className="relative"
      ref={subRef}
      // Move mouse events to the outermost container box
      onMouseEnter={() => !disabled && setIsSubOpen(true)}
      onMouseLeave={() => !disabled && setIsSubOpen(false)}
    >
      <button
        type="button"
        disabled={disabled}
        onMouseEnter={() => !disabled && setIsSubOpen(true)}
        onClick={() => !disabled && setIsSubOpen(!isSubOpen)}
        className={combinedSubStyles}
      >
        <span>{label}</span>
        <ChevronRight className="h-4 w-4 text-fg-subtle" />
      </button>

      {isSubOpen && !disabled && (
        <div className="absolute left-full top-0 z-var(--z-dropdown) pl-2 origin-top-left">
          <div className="w-30 max-h-[70vh] rounded-lg bg-surface p-1 border border-border shadow-md">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
