import * as React from "react"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <input
        className={`w-full rounded-[6px] border border-border-strong bg-bg px-3 py-2 text-[0.9375rem] leading-6 text-text transition-all focus:border-navy focus:outline-none focus:ring-3 focus:ring-navy/10 disabled:cursor-not-allowed disabled:bg-bg-subtle disabled:opacity-70 ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"
