import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { StatusBadge } from "@/components/customTable/statusBadge";
import {
    JOB_STATUS_CONFIG,
    MANUFACTURER_JOBS_URL,
    getJobCategoryLabel,
    type Job,
    type OpenJob,
} from "@/constant/manufacturer";
import { formatPrice } from "@/lib/currency";
import { getTimeAgoLabel } from "@/lib/date";
import ApplyNowButton from "./applyNowButton";

/**
 * The card shared by assigned and open jobs — they differ only in the line
 * under the title, what sits beside the price, and the photo open jobs show
 * on top. The title's link is stretched over the whole card, so the card is
 * clickable while a button beside the price (e.g. "Apply now") still works —
 * a button can't sit inside a link.
 */
function JobCardFrame({
    href,
    title,
    meta,
    description,
    price,
    trailing,
    imageUrl,
}: {
    href: string;
    title: string;
    meta: string;
    description: string;
    price: number;
    /** Beside the price — a status badge or an action. */
    trailing?: ReactNode;
    imageUrl?: string;
}) {
    return (
        <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-white transition-colors hover:border-mist-300 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-secondary-300">
            {imageUrl && (
                <div className="relative aspect-4/3 shrink-0 bg-mist-100">
                    <Image
                        src={imageUrl}
                        // The title right below says what it is
                        alt=""
                        fill
                        sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 80vw"
                        className="object-cover"
                    />
                </div>
            )}
            <div className="flex flex-1 flex-col gap-3 p-4">
                <div>
                    <h4 className="text-sm font-semibold font-text text-mist-950">
                        <Link href={href} className="outline-none after:absolute after:inset-0">
                            {title}
                        </Link>
                    </h4>
                    <span className="text-xs font-text text-mist-400">{meta}</span>
                </div>
                <p className="text-xs font-text text-mist-500 line-clamp-2">{description}</p>
                {/* min-h fits a badge or button, so prices line up across cards */}
                <div className="mt-auto flex min-h-8 items-center justify-between gap-2 pt-1">
                    <span className="text-sm font-semibold font-text text-mist-950">
                        {formatPrice(price)}
                    </span>
                    {/* Buttons sit above the stretched link and get their own clicks;
                        clicks on a badge still pass through to the card */}
                    {trailing && (
                        <div className="pointer-events-none relative z-10 [&_button]:pointer-events-auto">
                            {trailing}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/** A job assigned to the manufacturer, with its status. */
export default function JobCard({ job }: { job: Job }) {
    const config = JOB_STATUS_CONFIG[job.status];

    return (
        <JobCardFrame
            href={`${MANUFACTURER_JOBS_URL}/${job.id}`}
            title={job.title}
            meta={`${getJobCategoryLabel(job.category)} · ${job.assignedLabel}`}
            description={job.description}
            price={job.price}
            trailing={<StatusBadge label={config.badgeLabel} tone={config.tone} variant="pill" />}
        />
    );
}

/** An open job — always with its photo, and an "Apply now" button that becomes "Applied". */
export function OpenJobCard({ job }: { job: OpenJob }) {
    return (
        <JobCardFrame
            href={`${MANUFACTURER_JOBS_URL}/${job.id}`}
            title={job.title}
            meta={`${getJobCategoryLabel(job.category)} · Posted ${getTimeAgoLabel(new Date(job.postedAt))}`}
            description={job.description}
            price={job.price}
            imageUrl={job.imageUrl}
            trailing={<ApplyNowButton jobId={job.id} jobTitle={job.title} />}
        />
    );
}
