"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
  {
    variants: {
      variant: {
        default:
          "bg-accent text-white hover:bg-accent-glow shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-shadow",
        yes:
          "bg-gradient-to-r from-yes to-yes-blue text-white shadow-lg shadow-yes/30 hover:shadow-yes/50 transition-shadow",
        no: "bg-gradient-to-r from-no to-no-red text-white shadow-lg shadow-no/30 hover:shadow-no/50 transition-shadow",
        gold:
          "bg-gold text-black hover:bg-gold-glow shadow-lg shadow-gold/30",
        ghost:
          "bg-transparent text-text-primary hover:bg-surface/60",
        outline:
          "border border-border bg-surface/60 text-text-primary hover:border-accent/40 hover:bg-surface transition-colors",
        destructive:
          "bg-no/15 text-no border border-no/30 hover:bg-no/25 transition-colors",
      },
      size: {
        default: "h-11 px-5 text-sm",
        sm: "h-9 px-3 text-xs",
        lg: "h-14 px-8 text-base",
        xl: "h-20 px-8 text-xl",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
