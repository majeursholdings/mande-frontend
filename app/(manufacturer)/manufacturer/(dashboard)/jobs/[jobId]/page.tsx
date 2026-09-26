import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import JobDetailContent from "@/components/manufacturerPlatform/jobDetailPage/jobDetailContent";
import { JOBS, MANUFACTURER_JOBS_URL } from "@/constant/manufacturer";

// Standalone route — what a shared link or a hard refresh of the job detail
// URL lands on. Same content as the sheet, no board behind it.
export default async function JobDetailPage({
    params,
}: {
    params: Promise<{ jobId: string }>;
}) {
    const { jobId } = await params;
    const job = JOBS.find((j) => j.id === jobId);
    if (!job) notFound();

    return (
        <div className="mx-auto max-w-2xl">
            <Link
                href={MANUFACTURER_JOBS_URL}
                className="inline-flex items-center gap-2 mb-4 text-sm font-medium font-text text-mist-700 hover:text-mist-950"
            >
                <ArrowLeft className="size-4" />
                Back to Jobs
            </Link>
            <div className="rounded-xl border border-border bg-white overflow-hidden">
                <JobDetailContent job={job} closeSlot={<span />} />
            </div>
        </div>
    );
}
