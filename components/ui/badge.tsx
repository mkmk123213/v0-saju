import * as React from "react";

import { cn } from "@/lib/utils";

export type BadgeVariant = "default" | "secondary" | "outline" | "destructive";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const base =
    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

  const v =
    variant === "secondary"
      ? "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80"
      : variant === "outline"
        ? "text-foreground"
        : variant === "destructive"
          ? "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80"
          : "border-transparent bg-primary text-primary-foreground hover:bg-primary/80";

  return <span className={cn(base, v, className)} {...props} />;
}
