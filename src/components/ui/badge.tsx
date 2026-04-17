import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/src/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold uppercase tracking-wider transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[var(--black-muted)] text-[var(--black-dim)]",
        gold: "border-[var(--gold)]/30 bg-[var(--gold-muted)] text-[var(--gold)]",
        success: "border-[var(--status-won)]/30 bg-[var(--status-won-bg)] text-[var(--status-won)]",
        destructive: "border-[var(--status-lost)]/30 bg-[var(--status-lost-bg)] text-[var(--status-lost)]",
        warning: "border-[var(--status-pending)]/30 bg-[var(--status-pending-bg)] text-[var(--status-pending)]",
        outline: "border-[var(--black-border)] text-[var(--black-dim)]",
        live: "border-[var(--status-lost)]/30 bg-[var(--status-lost-bg)] text-[var(--status-lost)] animate-pulse",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
