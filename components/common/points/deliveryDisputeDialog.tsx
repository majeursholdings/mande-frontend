import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AlertCircle, Send, ShieldAlert } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { pointsService } from "@/lib/services/pointsService";
import { getErrorMessage } from "@/lib/api";

const disputeSchema = z.object({
    reason: z
        .string()
        .min(20, "Please provide a detailed explanation of at least 20 characters.")
        .max(1000, "Reason cannot exceed 1000 characters."),
});

type DisputeFormValues = z.infer<typeof disputeSchema>;

interface DeliveryDisputeDialogProps {
    open: boolean;
    onClose: () => void;
    jobId: string;
    jobTitle: string;
    rejectionId: string;
    onSuccess?: () => void;
}

export default function DeliveryDisputeDialog({
    open,
    onClose,
    jobId,
    jobTitle,
    rejectionId,
    onSuccess,
}: DeliveryDisputeDialogProps) {
    const [submitting, setSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<DisputeFormValues>({
        resolver: zodResolver(disputeSchema),
        defaultValues: { reason: "" },
    });

    const onSubmit = async (values: DisputeFormValues) => {
        setSubmitting(true);
        try {
            await pointsService.submitDeliveryDispute({
                jobId,
                rejectionId,
                reason: values.reason,
            });
            toast.success("Dispute submitted successfully. Super Admins will review the case.");
            reset();
            onClose();
            onSuccess?.();
        } catch (err) {
            toast.error(getErrorMessage(err, "Failed to submit dispute. Please check the 48h window."));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-lg">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-amber-600 mb-1">
                        <ShieldAlert className="size-5" />
                        <span className="text-xs font-semibold uppercase tracking-wider font-text">
                            48-Hour Appeal Window
                        </span>
                    </div>
                    <DialogTitle className="text-lg font-semibold font-text text-mist-950">
                        Dispute Delivery Rejection Points
                    </DialogTitle>
                    <DialogDescription className="text-xs text-mist-600 font-text">
                        If the rejection on <strong>{jobTitle}</strong> was caused by inaccurate site specs, client
                        delays, or external logistics rather than workmanship, submit your dispute below. Super Admins
                        will review the case and restore deducted points if upheld.
                    </DialogDescription>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="dispute-reason" className="text-xs font-medium font-text text-mist-800">
                            Explanation & Justification <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="dispute-reason"
                            rows={4}
                            placeholder="Detail why the defect should not be attributed to earlier production stages or your handling..."
                            className="w-full text-xs font-text rounded-lg border border-border p-3 focus:outline-none focus:ring-2 focus:ring-secondary-500 placeholder:text-mist-400"
                            {...register("reason")}
                        />
                        {errors.reason && (
                            <p className="text-[11px] text-red-600 font-text">{errors.reason.message}</p>
                        )}
                    </div>

                    <div className="rounded-lg bg-mist-50 border border-mist-200 p-3 text-xs text-mist-600 flex items-start gap-2.5">
                        <AlertCircle className="size-4 text-mist-500 shrink-0 mt-0.5" />
                        <p>
                            You have 48 hours from the time of rejection to dispute. Submitting a dispute does not pause
                            job deadlines.
                        </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="px-4 py-2 text-xs font-medium font-text text-mist-700 hover:bg-mist-100 rounded-lg transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium font-text text-white bg-secondary-700 hover:bg-secondary-800 rounded-lg transition-colors shadow-xs cursor-pointer"
                        >
                            <Send className="size-3.5" />
                            {submitting ? "Submitting..." : "Submit Dispute"}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
