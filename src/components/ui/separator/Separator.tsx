import { cn } from "@/lib/utils";

type SeparatorProps = {
  variant?: "vertical" | "horizontal";
  className?: string;
};

export const Separator = ({
  variant = "horizontal",
  className,
}: SeparatorProps) => {
  return (
    <div
      className={cn(
        variant === "horizontal"
          ? "h-px w-full bg-border"
          : "h-full w-px bg-border",
        className,
      )}
    />
  );
};
