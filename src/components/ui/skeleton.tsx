import { cn } from "@/src/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-md skeleton", className)}
      {...props}
    />
  )
}

export { Skeleton }
