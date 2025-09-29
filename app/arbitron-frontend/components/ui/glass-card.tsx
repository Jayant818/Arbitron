import * as React from "react"
import { cn } from "@/lib/utils"

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(({ className, hover = false, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "glass-card rounded-lg p-6",
        hover && "glass-card-hover transition-all duration-300 cursor-pointer",
        className,
      )}
      {...props}
    />
  )
})
GlassCard.displayName = "GlassCard"

export { GlassCard }
