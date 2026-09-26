import Link from "next/link";
import { StatusBadge } from "@/components/customTable/statusBadge";
import {
    JOB_STATUS_CONFIG,
    MANUFACTURER_JOBS_URL,
    getJobCategoryLabel,
    type Job,
} from "@/constant/manufacturer";
import { formatPrice } from "@/lib/currency";

export default function JobCard({ job }: { job: Job }) {
    const config = JOB_STATUS_CONFIG[job.status];

    return (
        <Link
            href={`${MANUFACTURER_JOBS_URL}/${job.id}`}
            className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4 hover:border-mist-300 transition-colors"
        >
            <div>
                <h4 className="text-sm font-semibold font-text text-mist-950">{job.title}</h4>
                <span className="text-xs font-text text-mist-400">
                    {getJobCategoryLabel(job.category)} · {job.assignedLabel}
                </span>
            </div>
            <p className="text-xs font-text text-mist-500 line-clamp-2">{job.description}</p>
            <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-semibold font-text text-mist-950">
                    {formatPrice(job.price)}
                </span>
                <StatusBadge label={config.badgeLabel} tone={config.tone} variant="pill" />
            </div>
        </Link>
    );
}
