import type { ComponentPropsWithoutRef } from "react"

import { cn } from "@/lib/utils"

interface NumberTickerProps extends ComponentPropsWithoutRef<"span"> {
  value: number
  startValue?: number
  direction?: "up" | "down"
  delay?: number
  decimalPlaces?: number
}

export function NumberTicker({
  value,
  startValue: _startValue = 0,
  direction: _direction = "up",
  delay: _delay = 0,
  className,
  decimalPlaces = 0,
  ...props
}: NumberTickerProps) {
  const formattedValue = Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(value)

  return (
    <span
      className={cn(
        "number-ticker-value inline-block tracking-wider text-black tabular-nums dark:text-white",
        className
      )}
      {...props}
    >
      {formattedValue}
    </span>
  )
}
