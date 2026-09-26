import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import JobDetailContent from "@/components/manufacturerPlatform/jobDetailPage/jobDetailContent";
import OpenJobDetailContent from "@/components/manufacturerPlatform/jobDetailPage/openJobDetailContent";
import {
    JOBS,
    MANUFACTURER_ACTIVE_JOBS_URL,
    MANUFACTURER_JOBS_URL,
    OPEN_JOBS,
} from "@/constant/manufacturer";

// Standalone route — what a shared link or a hard refresh of the job detail
// URL lands on. Same content as the sheet, no board behind it.
export default async function JobDetailPage({
    params,
}: {
    params: Promise<{ jobId: string }>;
}) {
    const { jobId } = await params;
    const openJob = OPEN_JOBS.find((j) => j.id === jobId);
    const job = openJob ? undefined : JOBS.find((j) => j.id === jobId);
    if (!openJob && !job) notFound();

    return (
        <div className="mx-auto max-w-2xl">
            <Link
                href={openJob ? MANUFACTURER_JOBS_URL : MANUFACTURER_ACTIVE_JOBS_URL}
                className="inline-flex items-center gap-2 mb-4 text-sm font-medium font-text text-mist-700 hover:text-mist-950"
            >
                <ArrowLeft className="size-4" />
                Back to Jobs
            </Link>
            <div className="rounded-xl border border-border bg-white overflow-hidden">
                {openJob ? (
                    <OpenJobDetailContent job={openJob} closeSlot={<span />} />
                ) : (
                    job && <JobDetailContent job={job} closeSlot={<span />} />
                )}
            </div>
        </div>
    );
}
