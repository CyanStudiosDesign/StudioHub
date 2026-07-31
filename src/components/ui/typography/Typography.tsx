import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type TextVariant =
  | "h1"| "h2"| "h3"| "h4"| "lead"| "para"| "muted"| "small"| "caption"| "label"| "overline"| "link"| "code"| "kbd"| "strong"| "error"| "success"| "blockquote";


type TextProps = {
  children: ReactNode;
  variant?: TextVariant;
  className?: string;
};


const styles: Record<TextVariant, string> = {
  h1: "text-xl font-medium leading-tight text-fg",
  h2: "text-lg font-medium leading-tight text-fg",
  h3: "text-base font-medium leading-tight text-fg",
  h4: "text-sm font-medium leading-tight text-fg",

  lead: "text-lg leading-normal text-fg-muted",
  para: "text-base leading-normal text-fg",
  muted: "text-sm leading-normal text-fg-muted",
  small: "text-xs leading-normal text-fg-muted",
  caption: "text-xs leading-normal text-fg-subtle",

  label: "text-sm font-medium leading-tight text-fg",
  overline: "text-xs font-medium uppercase leading-tight text-fg-muted",

  link: "text-base font-medium text-primary underline-offset-4 hover:underline",
  code: "rounded-sm bg-subtle px-2 py-1 font-sans text-sm text-fg",
  kbd: "rounded-sm border border-border bg-surface px-1.5 py-0.5 font-sans text-xs text-fg",

  strong: "font-medium text-fg",
  error: "text-sm leading-normal text-danger-strong",
  success: "text-sm leading-normal text-success-strong",

  blockquote: "border-l-4 border-border pl-4 italic text-fg-muted",
};
const tags = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  lead: "p",
  para: "p",
  muted: "p",
  small: "small",
  caption: "p",
  label: "label",
  overline: "p",
  link: "a",
  code: "code",
  kbd: "kbd",
  strong: "strong",
  error: "p",
  success: "p",
  blockquote: "blockquote",
} as const;

export function Text({
  children,
  variant = "para",
  className,
}: TextProps) {
  const Component = tags[variant];

  return (
    <Component className={cn(styles[variant], className)}>
      {children}
    </Component>
  );
}
