import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary"| "outline"| "ghost"| "subtle"| "danger"| "link"| "info"| "success"| "warning";

type ButtonSize = "sm" | "md" | "lg" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variants: Record<ButtonVariant, string> = {
  primary:"bg-primary text-fg-inverse hover:bg-primary-hover border border-primary",
  outline: "bg-canvas text-fg border border-border hover:bg-subtle",
  ghost: "bg-transparent text-fg hover:bg-subtle border border-transparent",
  subtle:"border border-border bg-subtle text-fg hover:border-primary hover:bg-surface hover:text-primary hover:shadow-sm active:scale-[0.98]",
  danger:"border border-danger bg-danger-subtle text-danger-strong hover:bg-danger hover:text-fg-inverse hover:border-danger hover:shadow-sm active:scale-[0.98]",
  link: "bg-transparent text-primary border border-transparent underline-offset-4 hover:underline px-0",
  info: "border border-info bg-info-subtle text-info-strong hover:bg-info hover:text-fg-inverse hover:shadow-sm active:scale-[0.98]",
  success:"border border-success bg-success-subtle text-success-strong hover:bg-success hover:text-fg-inverse hover:shadow-sm active:scale-[0.98]",
  warning:"border border-warning bg-warning-subtle text-warning-strong hover:bg-warning hover:text-fg-inverse hover:shadow-sm active:scale-[0.98]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "size-10 p-0",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium leading-tight transition-colors duration-base focus-ring-visible disabled:cursor-not-allowed disabled:bg-disabled disabled:text-fg-subtle disabled:border-border-disabled",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
