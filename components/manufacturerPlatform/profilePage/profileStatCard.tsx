export default function ProfileStatCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col justify-center gap-1 rounded-xl border border-border bg-white p-4 lg:p-5">
            <p className="text-xs lg:text-sm font-text text-mist-500">{label}</p>
            {value ? (
                <p className="text-xl lg:text-2xl font-semibold font-text text-mist-950">{value}</p>
            ) : (
                <p className="text-sm font-medium font-text text-mist-400">Not set</p>
            )}
        </div>
    );
}

export function ProfileStatCardSkeleton() {
    return (
        <div className="flex flex-col justify-center gap-2 rounded-xl border border-border bg-white p-4 lg:p-5 animate-pulse">
            <div className="h-3.5 w-24 bg-mist-200 rounded" />
            <div className="h-7 w-20 bg-mist-200 rounded" />
        </div>
    );
}
