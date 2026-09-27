"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full bg-mist-200 p-0.5 outline-none transition-colors duration-200 focus-visible:ring-3 focus-visible:ring-secondary-300 data-checked:bg-secondary-700 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-4 rounded-full bg-white shadow-sm transition-transform duration-200 data-checked:translate-x-4"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
