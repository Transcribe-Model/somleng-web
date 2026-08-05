import * as React from "react"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-[6px] border border-border bg-bg shadow-[0_1px_3px_rgba(16,24,40,0.06)] ${className}`}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"
