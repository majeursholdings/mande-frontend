import JobCardSkeleton from "@/components/ui/jobCardSkeleton";

/** The open job cards' grid while the jobs load. */
export default function JobCardsSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div aria-hidden className="grid w-full grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {Array.from({ length: count }, (_, i) => (
                <JobCardSkeleton key={i} />
            ))}
        </div>
    );
}
