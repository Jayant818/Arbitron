import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const neonButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 font-display tracking-wide",
  {
    variants: {
      variant: {
        primary: "bg-electric-teal text-quantum-void hover:bg-electric-teal/90 glow-teal hover:glow-teal",
        secondary: "bg-vibrant-purple text-ghost-white hover:bg-vibrant-purple/90 glow-purple hover:glow-purple",
        destructive: "bg-hot-pink text-ghost-white hover:bg-hot-pink/90 glow-pink hover:glow-pink",
        outline:
          "border border-electric-teal text-electric-teal hover:bg-electric-teal hover:text-quantum-void glow-teal",
        ghost: "text-electric-teal hover:bg-electric-teal/10 hover:text-electric-teal",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        xl: "h-12 rounded-lg px-10 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
)

export interface NeonButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof neonButtonVariants> {
  asChild?: boolean
}

const NeonButton = React.forwardRef<HTMLButtonElement, NeonButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return <Comp className={cn(neonButtonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
NeonButton.displayName = "NeonButton"

export { NeonButton, neonButtonVariants }
