import * as React from "react"
import Link from "next/link"

const buttonVariants = {
  primary: "bg-navy text-white hover:bg-navy-dark",
  secondary: "border border-border-strong bg-bg text-navy hover:bg-bg-accent hover:border-navy",
  danger: "border border-red-200 bg-error text-white hover:bg-red-700 hover:border-red-700",
  ghost: "text-text-muted hover:bg-bg-accent hover:text-navy",
  outline: "border border-white/30 text-white hover:bg-white/10",
  icon: "text-navy hover:bg-bg-accent",
}

const sizeVariants = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-8 py-3.5 text-base",
  icon: "h-10 w-10 justify-center p-0",
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants
  size?: keyof typeof sizeVariants
  href?: string
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", href, ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center gap-2 rounded-[6px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none khmer-text"
    const variantClasses = buttonVariants[variant]
    const sizeClasses = sizeVariants[size]
    
    const combinedClasses = `${baseClasses} ${variantClasses} ${sizeClasses} ${className}`.trim()

    if (href) {
      return (
        <Link href={href} className={combinedClasses} {...(props as any)}>
          {props.children}
        </Link>
      )
    }

    return (
      <button
        className={combinedClasses}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
