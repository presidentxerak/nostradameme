import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "yes" | "no" | "gold" | "muted";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const styles = {
    default: "bg-accent/20 text-accent-glow border-accent/30",
    yes: "bg-yes/20 text-yes-glow border-yes/30",
    no: "bg-no/20 text-no-glow border-no/30",
    gold: "bg-gold/20 text-gold-glow border-gold/30",
    muted: "bg-surface text-text-secondary border-border",
  }[variant];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles,
        className,
      )}
      {...props}
    />
  );
}
