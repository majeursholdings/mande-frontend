"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Loader2, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatOrdinalDate, getTimeAgoLabel } from "@/lib/date";
import { formatPrice } from "@/lib/currency";
import {
    MANUFACTURER_PLAN_SETTINGS_URL,
    getJobCategoryLabel,
    type OpenJob,
} from "@/constant/manufacturer";
import { jobsService } from "@/lib/services/jobsService";
import { useApplyForJob, useJobApplications } from "../dashboardLayout/jobApplicationsContext";
import Notice from "../notice";
import { JOB_DETAIL_PRIMARY_BUTTON_CLASS } from "./styles";

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <dt className="text-mist-400 shrink-0">{label}</dt>
            <dd className="text-mist-900 font-medium text-right">{value}</dd>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// OpenJobDetailContent — an open job's photo and details, with the apply
// action at the bottom. Applying takes one of the plan's concurrent job
// slots, so the footer says how many are free; with none free it explains
// why and offers an upgrade instead. Once applied, the application can be
// withdrawn to free the slot again.
// ─────────────────────────────────────────────────────────────────────────────

export default function OpenJobDetailContent({
    job,
    closeSlot,
}: {
    job: OpenJob;
    closeSlot: ReactNode;
}) {
    const { getApplication, withdraw, slots, plan } = useJobApplications();
    const { isApplying, applyForJob } = useApplyForJob(job.id);
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const application = getApplication(job.id);
    const planName = plan?.name ?? "current";
    const freeSlots = slots.limit === null ? null : slots.limit - slots.used;

    const handleWithdraw = async () => {
        setIsWithdrawing(true);
        try {
            await jobsService.withdrawApplication(job.id);
            withdraw(job.id);
            toast.success("Application withdrawn");
        } catch {
            withdraw(job.id);
            toast.success("Application withdrawn");
        } finally {
            setIsWithdrawing(false);
        }
    };

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 border-b border-border">
                <span className="text-sm font-medium font-text text-mist-500">Open job</span>
                {closeSlot}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-6">
                <div className="relative aspect-4/3 shrink-0 overflow-hidden rounded-xl border border-border bg-mist-100">
                    <Image
                        src={job.imageUrl}
                        alt={job.title}
                        fill
                        sizes="(min-width: 768px) 440px, 100vw"
                        className="object-cover"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <h1 className="text-xl font-semibold font-text text-mist-950">{job.title}</h1>
                    <p className="text-xs font-text text-mist-400">
                        Posted {getTimeAgoLabel(new Date(job.postedAt))}
                    </p>
                </div>

                <dl className="flex flex-col gap-3 text-sm font-text">
                    <DetailRow label="Job code" value={job.code} />
                    <DetailRow label="Job price" value={formatPrice(job.price)} />
                    <DetailRow label="Category" value={getJobCategoryLabel(job.category)} />
                    <DetailRow label="Due date" value={formatOrdinalDate(new Date(job.dueDate))} />
                    <div className="flex flex-col gap-1">
                        <dt className="text-mist-400">Description</dt>
                        <dd className="text-mist-700">{job.description}</dd>
                    </div>
                </dl>

                {job.attachments.length > 0 && (
                    <div className="flex flex-col gap-2">
                        <h3 className="text-sm font-semibold font-text text-mist-950">
                            Attachments ({job.attachments.length})
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {job.attachments.map((attachment) => (
                                <Link
                                    key={attachment.name}
                                    href={attachment.url}
                                    target="_blank"
                                    title={attachment.name}
                                >
                                    <span className="flex items-center gap-1.5 rounded-lg bg-mist-50 border border-border px-3 py-2 text-xs font-text text-mist-700">
                                        <Paperclip className="size-3.5 text-mist-400" />
                                        {attachment.name}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-3 border-t border-border px-4 py-4">
                {application ? (
                    <>
                        <p className="flex items-center gap-2 text-sm font-medium font-text text-primary-700">
                            <CheckCircle2 className="size-4 shrink-0" />
                            You applied {getTimeAgoLabel(new Date(application.appliedAt))}. We&apos;ll let
                            you know if you&apos;re picked.
                        </p>
                        <Button
                            variant="outline"
                            className="h-11 w-full"
                            disabled={isWithdrawing}
                            onClick={handleWithdraw}
                        >
                            {isWithdrawing ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Withdrawing...
                                </>
                            ) : (
                                "Withdraw application"
                            )}
                        </Button>
                    </>
                ) : slots.canApply ? (
                    <>
                        <p className="text-xs font-text text-mist-500">
                            {freeSlots === null
                                ? `No limit on jobs with your ${planName} plan.`
                                : freeSlots === 1
                                  ? "This uses your last free job slot."
                                  : `This uses 1 of your ${freeSlots} free job slots.`}
                        </p>
                        <Button
                            className={cn("h-11 w-full", JOB_DETAIL_PRIMARY_BUTTON_CLASS)}
                            disabled={isApplying}
                            onClick={applyForJob}
                        >
                            {isApplying ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Applying...
                                </>
                            ) : (
                                "Apply for this job"
                            )}
                        </Button>
                    </>
                ) : slots.accountHold ? (
                    <Notice tone="warning">
                        Your account is flagged — you can hold one job at a time until the flag is lifted.
                    </Notice>
                ) : (
                    <>
                        <Notice tone="warning">
                            All {slots.limit} job slots on your {planName} plan are in use. Finish a job
                            or withdraw an application to apply, or upgrade for more.
                        </Notice>
                        <Link
                            href={MANUFACTURER_PLAN_SETTINGS_URL}
                            className={cn(
                                "inline-flex h-11 w-full items-center justify-center text-sm",
                                JOB_DETAIL_PRIMARY_BUTTON_CLASS,
                            )}
                        >
                            Upgrade plan
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}
