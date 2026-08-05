import * as React from "react"

const badgeVariants = {
  default: "bg-bg-accent text-navy",
  success: "bg-success/15 text-success",
  error: "bg-red-100 text-red-700",
  muted: "bg-bg-accent text-text-muted",
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof badgeVariants
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = "", variant = "default", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`khmer-text shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${badgeVariants[variant]} ${className}`}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"
