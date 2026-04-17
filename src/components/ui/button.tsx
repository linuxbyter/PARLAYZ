import * as React from "react"
import { cn } from "@/src/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "gold" | "outline" | "ghost" | "destructive" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-bold text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black)] disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-white text-black hover:bg-gray-100": variant === "default",
            "bg-[var(--gold)] text-black hover:bg-[var(--gold-light)] hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]": variant === "gold",
            "border border-[var(--black-border)] bg-transparent text-white hover:bg-[var(--black-card)] hover:border-[var(--black-muted)]": variant === "outline",
            "bg-transparent text-[var(--black-dim)] hover:bg-[var(--black-card)] hover:text-white": variant === "ghost",
            "bg-[var(--status-lost)] text-white hover:bg-[var(--status-lost)]/90": variant === "destructive",
            "text-[var(--gold)] underline-offset-4 hover:underline": variant === "link",
          },
          {
            "h-10 px-4 py-2": size === "default",
            "h-8 px-3 text-xs": size === "sm",
            "h-12 px-6 text-base": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
