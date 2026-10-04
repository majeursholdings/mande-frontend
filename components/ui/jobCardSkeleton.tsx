import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * A job card while its job loads: the same frame as the shared JobCard
 * (components/ui/jobCard), with skeletons for the photo, title, line under
 * it, description, pay, duration and the status or action beside them.
 * Used by the manufacturer platform's job lists and the website's open jobs.
 */
export default function JobCardSkeleton({ className }: { className?: string }) {
    return (
        <div
            aria-hidden
            className={cn("flex h-full flex-col overflow-hidden rounded-xl border border-border bg-white", className)}
        >
            <Skeleton className="aspect-4/3 w-full shrink-0 rounded-none" />
            <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                </div>
                <div className="mt-auto flex min-h-8 items-end justify-between gap-2 border-t border-border pt-3">
                    <div className="flex flex-col gap-1.5">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-3 w-14" />
                    </div>
                    <Skeleton className="h-8 w-20 rounded-button" />
                </div>
            </div>
        </div>
    );
}
