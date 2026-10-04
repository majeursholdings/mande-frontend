import { Skeleton } from "@/components/ui/skeleton";

/** A labelled figure. While `loading`, a skeleton stands in for the value (the label still shows). */
export default function ProfileStatCard({
    label,
    value,
    loading = false,
}: {
    label: string;
    value: string;
    loading?: boolean;
}) {
    return (
        <div className="flex flex-col justify-center gap-1 rounded-xl border border-border bg-white p-4 lg:p-5">
            <p className="text-xs lg:text-sm font-text text-mist-500">{label}</p>
            {loading ? (
                <Skeleton className="h-7 lg:h-8 w-20" />
            ) : value ? (
                <p className="text-xl lg:text-2xl font-semibold font-text text-mist-950">{value}</p>
            ) : (
                <p className="text-sm font-medium font-text text-mist-400">Not set</p>
            )}
        </div>
    );
}
