"use client";

// components/ui/Card.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export type CardSize = "sm" | "md" | "lg" | "xl";
export type CardVariant = "default" | "bordered" | "ghost" | "glass";
export type CardLayout = "vertical" | "horizontal";
export type CardHoverEffect = "none" | "lift" | "zoom" | "glow";

interface CardContextType {
  size: CardSize;
  layout: CardLayout;
  disabled: boolean; 
}

const CardContext = React.createContext<CardContextType>({
  size: "md",
  layout: "vertical",
  disabled: false,
});

// =========================================================================
// UNIFIED STRUCTURAL VARIANT MAPS (Sizing, Radii, and Border Widths)
// =========================================================================
const containerSizeVariants: Record<CardSize, string> = {
  sm: "w-full max-w-sm rounded-sm border text-sm", 
  md: "w-full max-w-md rounded-md border",
  lg: "w-full max-w-lg rounded-lg border-2",
  xl: "w-full max-w-2xl rounded-3xl border-2",
};

const mediaRadiusVariants: Record<CardSize, string> = {
  sm: "rounded-[calc(4px-1px)]",
  md: "rounded-[calc(8px-1px)]",
  lg: "rounded-[calc(12px-2px)]",
  xl: "rounded-[calc(16px-2px)]",
};

const actionSizeVariants: Record<CardSize, string> = {
  sm: "h-8 px-3 text-xs rounded-sm border",
  md: "h-10 px-4 text-sm rounded-md border",
  lg: "h-12 px-5 text-base rounded-lg border-2",
  xl: "h-14 px-7 text-lg rounded-xl border-2",
};

const paddingVariants: Record<CardSize, { header: string; inner: string; horizontalGap: string }> = {
  sm: { header: "p-3 flex flex-col space-y-1", inner: "p-3 pt-0", horizontalGap: "p-3 gap-3" },
  md: { header: "p-5 flex flex-col space-y-1.5", inner: "p-5 pt-0", horizontalGap: "p-5 gap-4" },
  lg: { header: "p-7 flex flex-col space-y-2", inner: "p-7 pt-0", horizontalGap: "p-7 gap-6" },
  xl: { header: "p-9 flex flex-col space-y-3", inner: "p-9 pt-0", horizontalGap: "p-9 gap-8" },
};

const surfaceVariants: Record<CardVariant, string> = {
  default: "bg-surface border-border text-fg shadow-sm",
  bordered: "bg-transparent border-border text-fg shadow-none",
  ghost: "bg-transparent border-transparent text-fg shadow-none",
  glass: "bg-surface/70 backdrop-blur-md border-border text-fg shadow-sm",
};

const hoverGlowVariants: Record<CardSize, string> = {
  sm: "hover:border-border-strong hover:ring-1 hover:ring-primary/10",
  md: "hover:border-border-strong hover:ring-2 hover:ring-primary/10",
  lg: "hover:border-border-strong hover:ring-4 hover:ring-primary/10",
  xl: "hover:border-border-strong hover:ring-4 hover:ring-primary/20",
};

const hoverVariants: Record<CardHoverEffect, string> = {
  none: "",
  lift: "hover:-translate-y-1 hover:shadow-md",
  zoom: "hover:scale-[1.015]",
  glow: "", 
};

const titleVariants: Record<CardSize, string> = {
  sm: "text-base font-weight-semibold leading-tight",
  md: "text-xl font-weight-semibold leading-none tracking-tight",
  lg: "text-2xl font-weight-bold leading-none tracking-tight",
  xl: "text-3xl font-weight-bold leading-none tracking-tight",
};

const descriptionVariants: Record<CardSize, string> = {
  sm: "text-xs text-fg-muted",
  md: "text-sm text-fg-muted",
  lg: "text-base text-fg-muted",
  xl: "text-lg text-fg-muted",
};

// ==========================================
// CARD CONTAINER
// ==========================================
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: CardSize;
  variant?: CardVariant;
  layout?: CardLayout;
  hoverEffect?: CardHoverEffect;
  isPressable?: boolean;
  disabled?: boolean; 
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      size = "md",
      variant = "default",
      layout = "vertical",
      hoverEffect = "none",
      isPressable = false,
      disabled = false,
      ...props
    },
    ref
  ) => {
    return (
      <CardContext.Provider value={{ size, layout, disabled }}>
        <div
          ref={ref}
          aria-disabled={disabled ? true : undefined}
          className={cn(
            "overflow-hidden transition-all duration-200 flex font-sans",
            layout === "horizontal" 
              ? cn("flex-row items-center", paddingVariants[size].horizontalGap) 
              : "flex-col",
            containerSizeVariants[size],
            surfaceVariants[variant],
            !disabled && hoverVariants[hoverEffect],
            !disabled && hoverEffect === "glow" && hoverGlowVariants[size],
            !disabled && isPressable && "cursor-pointer select-none active:scale-[0.99]",
            disabled && "opacity-60 pointer-events-none select-none bg-surface-muted/50 border-border-muted shadow-none",
            disabled && "opacity-60 pointer-events-none select-none bg-surface-muted/50 border-transparent shadow-none",
            className
          )}
          {...props}
        />
      </CardContext.Provider>
    );
  }
);
Card.displayName = "Card";

// ==========================================
// CARD MEDIA / IMAGE SLOT
// ==========================================
export interface CardMediaProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  aspectRatio?: "video" | "square" | "auto";
}

const CardMedia = React.forwardRef<HTMLImageElement, CardMediaProps>(
  ({ className, aspectRatio = "video", alt = "Card media", ...props }, ref) => {
    const { size, layout, disabled } = React.useContext(CardContext);

    return (
      <div
        className={cn(
          "overflow-hidden shrink-0",
          mediaRadiusVariants[size], 
          layout === "horizontal" ? "h-full w-1/3" : "w-full",
          aspectRatio === "video" && "aspect-video",
          aspectRatio === "square" && "aspect-square",
          aspectRatio === "auto" && "h-auto",
          className
        )}
      >
        {/* Cyan Card accepts arbitrary external media URLs, so a native image is intentional. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={ref}
          alt={alt}
          className={cn(
            "h-full w-full object-cover transition-transform duration-300", 
            mediaRadiusVariants[size],
            disabled && "grayscale contrast-75 brightness-95",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
CardMedia.displayName = "CardMedia";

// ==========================================
// CARD HEADER
// ==========================================
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { size, layout } = React.useContext(CardContext);
    return (
      <div
        ref={ref}
        className={cn(
          layout === "horizontal" ? "p-0 flex flex-col space-y-1" : paddingVariants[size].header,
          "w-full",
          className
        )}
        {...props}
      />
    );
  }
);
CardHeader.displayName = "CardHeader";

// ==========================================
// CARD TITLE
// ==========================================
const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    const { size } = React.useContext(CardContext);
    return <h3 ref={ref} className={cn(titleVariants[size], className)} {...props} />;
  }
);
CardTitle.displayName = "CardTitle";

// ==========================================
// CARD DESCRIPTION
// ==========================================
const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    const { size } = React.useContext(CardContext);
    return <p ref={ref} className={cn(descriptionVariants[size], className)} {...props} />;
  }
);
CardDescription.displayName = "CardDescription";

// ==========================================
// CARD CONTENT
// ==========================================
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { size, layout } = React.useContext(CardContext);
    return (
      <div
        ref={ref}
        className={cn(
          layout === "horizontal" ? "p-0" : paddingVariants[size].inner,
          "flex-1 w-full text-fg-muted leading-normal",
          className
        )}
        {...props}
      />
    );
  }
);
CardContent.displayName = "CardContent";

// ==========================================
// CARD FOOTER
// ==========================================
const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { size, layout } = React.useContext(CardContext);
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center w-full",
          layout === "horizontal" ? "p-0" : paddingVariants[size].inner,
          className
        )}
        {...props}
      />
    );
  }
);
CardFooter.displayName = "CardFooter";

// ==========================================
// CARD ACTION
// ==========================================
const CardAction = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, disabled: customButtonDisabled, ...props }, ref) => {
    const contextValue = React.useContext(CardContext);
    const isActuallyDisabled = customButtonDisabled || contextValue.disabled;

    return (
      <button
        ref={ref}
        disabled={isActuallyDisabled}
        className={cn(
          "inline-flex items-center justify-center font-weight-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 focus-ring-visible",
          "bg-primary border-primary text-primary-fg hover:bg-primary-hover hover:border-primary-hover",
          actionSizeVariants[contextValue.size],
          className
        )}
        {...props}
      />
    );
  }
);
CardAction.displayName = "CardAction";

export { Card, CardMedia, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction };
