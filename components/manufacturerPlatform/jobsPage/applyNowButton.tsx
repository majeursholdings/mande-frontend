"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Lock, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { MANUFACTURER_PLAN_SETTINGS_URL } from "@/constant/manufacturer";
import {
    useApplyForJob,
    useJobApplications,
} from "../dashboardLayout/jobApplicationsContext";

const BUTTON_CLASS =
    "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-button px-3 text-xs font-medium font-text transition-colors duration-200 cursor-pointer";

// ─────────────────────────────────────────────────────────────────────────────
// ApplyNowButton — the open job card's quick apply. Sends the application
// straight from the card; once sent it becomes an "Applied" label. With no
// free job slot it stays tappable but looks locked, and tapping it says why,
// with a shortcut to upgrade — a disabled button would give no reason.
// ─────────────────────────────────────────────────────────────────────────────

export default function ApplyNowButton({ jobId, jobTitle }: { jobId: string; jobTitle: string }) {
    const router = useRouter();
    const { getApplication, slots, plan, isLoading } = useJobApplications();
    const { isApplying, applyForJob } = useApplyForJob(jobId);

    // Whether they've applied, or have a free slot, isn't known yet
    if (isLoading) {
        return <Skeleton aria-hidden className="h-8 w-24 shrink-0 rounded-button" />;
    }

    if (getApplication(jobId)) {
        return (
            <span className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-primary-50 px-3 text-xs font-medium font-text text-primary-700">
                <CheckCircle2 className="size-3.5" aria-hidden />
                Applied
            </span>
        );
    }

    if (!slots.canApply) {
        return (
            <button
                type="button"
                aria-disabled
                aria-label={`Apply now for ${jobTitle}: all job slots are in use`}
                onClick={() =>
                    slots.accountHold === "flagged"
                          ? toast.warning("Your account is flagged", {
                                description: "You can hold one job at a time until the flag is lifted.",
                            })
                          : toast.warning(
                        `All ${slots.limit} job slots on your ${plan?.name ?? "current"} plan are in use`,
                        {
                            description:
                                "Finish a job or withdraw an application to apply, or upgrade for more.",
                            action: {
                                label: "Upgrade",
                                onClick: () => router.push(MANUFACTURER_PLAN_SETTINGS_URL),
                            },
                        },
                    )
                }
                className={cn(BUTTON_CLASS, "bg-mist-100 text-mist-500 hover:bg-mist-200")}
            >
                <Lock className="size-3.5" aria-hidden />
                Apply now
            </button>
        );
    }

    return (
        <button
            type="button"
            aria-label={`Apply now for ${jobTitle}`}
            disabled={isApplying}
            onClick={applyForJob}
            className={cn(
                BUTTON_CLASS,
                "bg-secondary-700 text-white hover:bg-secondary-900 disabled:cursor-wait",
            )}
        >
            {isApplying ? (
                <>
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    Applying...
                </>
            ) : (
                <>
                    <Send className="size-3.5" aria-hidden />
                    Apply now
                </>
            )}
        </button>
    );
}
