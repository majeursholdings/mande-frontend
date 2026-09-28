"use client";

import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import RatingReviewForm from "@/components/form/ratingReviewForm";
import type { Job } from "@/constant/manufacturer";
import { useLeadReviews } from "./dashboardLayout/leadReviewsContext";

/**
 * "Rate Project Lead Performance" — the manufacturer's stars and review of a
 * completed job's project lead. Opened by the prompt the moment a job is
 * completed, or from the job itself.
 */
export default function LeadReviewDialog({
    job,
    open,
    onOpenChange,
}: {
    job: Job | undefined;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { submitLeadReview } = useLeadReviews();
    const leadName = job?.assignee?.name ?? "your project lead";

    return (
        <Dialog open={open && !!job} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-110">
                {job && (
                    <>
                        <div className="flex flex-col gap-1">
                            <DialogTitle>Rate Project Lead Performance</DialogTitle>
                            <DialogDescription>
                                Give a review and rate the performance of{" "}
                                <span className="font-medium text-mist-950">{leadName}</span> for the{" "}
                                <span className="font-medium text-mist-950">{job.title}</span> job.
                            </DialogDescription>
                        </div>
                        <RatingReviewForm
                            key={job.id}
                            ratingLabel="Rate project lead's performance"
                            submitLabel="Submit"
                            loadingLabel="Submitting..."
                            errorMessage="Couldn't send your review. Please try again."
                            onSubmit={(review) => {
                                submitLeadReview(job.id, review);
                                toast.success(`Thanks, your review of ${leadName} was sent`);
                                onOpenChange(false);
                            }}
                        />
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
