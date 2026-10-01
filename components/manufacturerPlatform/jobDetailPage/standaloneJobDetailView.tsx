"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import JobDetailContent from "./jobDetailContent";
import OpenJobDetailContent from "./openJobDetailContent";
import {
    useManufacturerJobDetail,
    JobDetailSkeleton,
    JobDetailNotFound,
} from "./useManufacturerJobDetail";
import {
    MANUFACTURER_ACTIVE_JOBS_URL,
    MANUFACTURER_JOBS_URL,
} from "@/constant/manufacturer";

export default function StandaloneJobDetailView({ jobId }: { jobId: string }) {
    const router = useRouter();
    const { data, isPending, isError } = useManufacturerJobDetail(jobId);

    const backUrl =
        data?.type === "assigned"
            ? MANUFACTURER_ACTIVE_JOBS_URL
            : MANUFACTURER_JOBS_URL;

    return (
        <div className="mx-auto max-w-2xl">
            <Link
                href={backUrl}
                className="inline-flex items-center gap-2 mb-4 text-sm font-medium font-text text-mist-700 hover:text-mist-950"
            >
                <ArrowLeft className="size-4" />
                Back to Jobs
            </Link>
            <div className="rounded-xl border border-border bg-white overflow-hidden min-h-[480px]">
                {isPending ? (
                    <JobDetailSkeleton closeSlot={<span />} />
                ) : !data || isError ? (
                    <JobDetailNotFound
                        closeSlot={<span />}
                        onBack={() => router.push(MANUFACTURER_JOBS_URL)}
                    />
                ) : data.type === "open" ? (
                    <OpenJobDetailContent key={data.job.id} job={data.job} closeSlot={<span />} />
                ) : (
                    <JobDetailContent key={data.job.id} job={data.job} closeSlot={<span />} />
                )}
            </div>
        </div>
    );
}
