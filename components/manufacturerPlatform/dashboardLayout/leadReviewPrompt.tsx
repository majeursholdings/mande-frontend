"use client";

import { useIsClient } from "@/hooks/useIsClient";
import LeadReviewDialog from "../leadReviewDialog";
import { useLeadReviews } from "./leadReviewsContext";

/**
 * The first thing they see once a job is completed: rate its project lead.
 * One job at a time, newest first; closing it puts that one off until they
 * next open the platform (the job still has Rate your project lead). Waits
 * for the browser, as whether a job has been approved by now depends on the
 * time.
 */
export default function LeadReviewPrompt() {
    const { jobsToRate, putOff } = useLeadReviews();
    const isClient = useIsClient();
    const job = isClient ? jobsToRate[0] : undefined;

    return (
        <LeadReviewDialog
            // A fresh form for each job in turn
            key={job?.id}
            job={job}
            open={!!job}
            onOpenChange={(open) => {
                if (!open && job) putOff(job.id);
            }}
        />
    );
}
