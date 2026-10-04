import { cn } from "@/lib/utils"

/**
 * A grey block standing in for server data while it loads. Size it like the
 * value it replaces. `inline` renders a <span>, for a value inside running
 * text (e.g. within a <p>), where a <div> isn't allowed.
 */
function Skeleton({
  className,
  inline = false,
  ...props
}: React.ComponentProps<"div"> & { inline?: boolean }) {
  const classes = cn("animate-pulse rounded-md bg-gray-300", inline && "inline-block align-middle", className)
  return inline ? (
    <span data-slot="skeleton" aria-hidden className={classes} {...(props as React.ComponentProps<"span">)} />
  ) : (
    <div data-slot="skeleton" className={classes} {...props} />
  )
}

export { Skeleton }
