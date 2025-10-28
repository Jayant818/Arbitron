import { cn } from "@/lib/utils"

interface MonoNumberProps {
  value: string | number
  className?: string
  prefix?: string
  suffix?: string
}

/**
 * Renders numbers in Geist Mono font for consistent, readable numerical display
 * Use this component for all numerical values (prices, balances, percentages, etc.)
 */
export function MonoNumber({ value, className, prefix, suffix }: MonoNumberProps) {
  return (
    <span className={cn("font-mono tabular-nums", className)}>
      {prefix && <span className="mr-0.5">{prefix}</span>}
      {value}
      {suffix && <span className="ml-0.5">{suffix}</span>}
    </span>
  )
}

/**
 * Formats a number as currency with Geist Mono font
 */
export function MonoCurrency({ 
  value, 
  currency = "SOL", 
  decimals = 2,
  className 
}: { 
  value: number | string
  currency?: string
  decimals?: number
  className?: string 
}) {
  const numValue = typeof value === "string" ? parseFloat(value) : value
  const formatted = numValue.toFixed(decimals)
  
  return (
    <MonoNumber 
      value={formatted} 
      suffix={currency} 
      className={className}
    />
  )
}

/**
 * Formats a percentage with Geist Mono font
 */
export function MonoPercentage({ 
  value, 
  decimals = 1,
  showSign = false,
  className 
}: { 
  value: number | string
  decimals?: number
  showSign?: boolean
  className?: string 
}) {
  const numValue = typeof value === "string" ? parseFloat(value) : value
  const formatted = numValue.toFixed(decimals)
  const prefix = showSign && numValue > 0 ? "+" : ""
  
  return (
    <MonoNumber 
      value={formatted} 
      prefix={prefix}
      suffix="%" 
      className={cn(
        numValue > 0 && "text-success",
        numValue < 0 && "text-destructive",
        className
      )}
    />
  )
}
