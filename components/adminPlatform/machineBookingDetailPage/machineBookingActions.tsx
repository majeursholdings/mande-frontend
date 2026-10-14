"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { getErrorMessage } from "@/lib/api";
import { machineBookingService, type MachineBooking } from "@/lib/services/machineBookingService";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import ConfirmMachineBookingForm from "../form/confirmMachineBookingForm";
import CancelMachineBookingForm from "../form/cancelMachineBookingForm";
import { formatKobo } from "../machineBookingsPage/machineBookingParts";

type BookingAction = "confirm" | "complete" | "cancel";

const PRIMARY_BUTTON_CLASS =
    "h-10 px-4 bg-secondary-700 hover:bg-secondary-900 text-white text-sm font-medium font-text rounded-button cursor-pointer";
const SECONDARY_BUTTON_CLASS =
    "h-10 px-4 bg-mist-100 hover:bg-mist-200 text-mist-950 text-sm font-medium font-text rounded-button cursor-pointer";

/** Bookings that can still be cancelled. */
const CANCELLABLE: MachineBooking["status"][] = ["pending_payment", "paid", "confirmed"];

/**
 * What staff can do with a booking, by its status: confirm a paid one
 * (optionally moving the slot), mark a confirmed one completed, or cancel
 * one that's awaiting payment, paid or confirmed. Each answers with the
 * updated booking, passed to `onUpdated`.
 */
export default function MachineBookingActions({
    booking,
    onUpdated,
}: {
    booking: MachineBooking;
    onUpdated: (booking: MachineBooking) => void;
}) {
    const [action, setAction] = useState<BookingAction | null>(null);
    const [isCompleting, setIsCompleting] = useState(false);
    const close = () => setAction(null);

    const canConfirm = booking.status === "paid";
    const canComplete = booking.status === "confirmed";
    const canCancel = CANCELLABLE.includes(booking.status);
    if (!canConfirm && !canComplete && !canCancel) return null;

    const isPaid = !!booking.paidAt && booking.status !== "pending_payment";

    const handleComplete = async () => {
        setIsCompleting(true);
        try {
            const updated = await machineBookingService.completeBooking(booking.id);
            onUpdated(updated);
            toast.success(`${booking.code} is marked completed`);
            close();
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't mark the booking completed. Please try again."));
        } finally {
            setIsCompleting(false);
        }
    };

    return (
        <>
            <div className="flex flex-wrap gap-3">
                {canCancel && (
                    <Button type="button" onClick={() => setAction("cancel")} className={SECONDARY_BUTTON_CLASS}>
                        Cancel booking
                    </Button>
                )}
                {canConfirm && (
                    <Button type="button" onClick={() => setAction("confirm")} className={PRIMARY_BUTTON_CLASS}>
                        Confirm booking
                    </Button>
                )}
                {canComplete && (
                    <Button type="button" onClick={() => setAction("complete")} className={PRIMARY_BUTTON_CLASS}>
                        Mark completed
                    </Button>
                )}
            </div>

            <Dialog open={action === "confirm"} onOpenChange={(open) => !open && close()}>
                <DialogContent className="max-w-120">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>Confirm {booking.code}</DialogTitle>
                        <DialogDescription>
                            Keep the slot they asked for, or change the date or start time to move it. We&apos;ll email{" "}
                            {booking.fullName} the confirmed slot and your note.
                        </DialogDescription>
                    </div>
                    {action === "confirm" && (
                        <ConfirmMachineBookingForm
                            booking={booking}
                            onCancel={close}
                            onConfirm={async (payload) => {
                                const updated = await machineBookingService.confirmBooking(booking.id, payload);
                                onUpdated(updated);
                                toast.success(`${booking.code} is confirmed`);
                                close();
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={action === "complete"} onOpenChange={(open) => !open && !isCompleting && close()}>
                <DialogContent className="max-w-110">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>Mark {booking.code} completed?</DialogTitle>
                        <DialogDescription>Do this once {booking.fullName} has had their time on the machines.</DialogDescription>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button type="button" onClick={close} disabled={isCompleting} className={SECONDARY_BUTTON_CLASS}>
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={() => void handleComplete()}
                            disabled={isCompleting}
                            className={`${PRIMARY_BUTTON_CLASS} gap-2`}
                        >
                            {isCompleting && <Loader2 className="size-4 animate-spin" />}
                            {isCompleting ? "Saving..." : "Mark completed"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={action === "cancel"} onOpenChange={(open) => !open && close()}>
                <DialogContent className="max-w-120">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>Cancel {booking.code}?</DialogTitle>
                        <DialogDescription>
                            {isPaid
                                ? `They paid, so ${formatKobo(booking.amountKobo)} is refunded to them in full. We'll email ${booking.fullName} your reason.`
                                : `They haven't paid yet, so there's nothing to refund. We'll email ${booking.fullName} your reason.`}
                        </DialogDescription>
                    </div>
                    {action === "cancel" && (
                        <CancelMachineBookingForm
                            onClose={close}
                            onCancelBooking={async (reason) => {
                                const updated = await machineBookingService.cancelBooking(booking.id, reason);
                                onUpdated(updated);
                                if (updated.refundStatus === "failed") {
                                    toast.error(
                                        `${booking.code} is cancelled, but the refund didn't go through. Refund it by hand on the payment platform.`,
                                    );
                                } else {
                                    toast.success(isPaid ? `${booking.code} is cancelled and refunded` : `${booking.code} is cancelled`);
                                }
                                close();
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
