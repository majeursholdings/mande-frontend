"use client";

import { useState } from "react";
import Link from "next/link";
import { MACHINE_BOOKING_MY_BOOKINGS_URL } from "@/constant/navigation";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import MachineBookingForm from "@/components/manufacturerPlatform/form/machineBookingForm";

/**
 * A "Book machine time" button that opens the booking form in a modal. A
 * client island for the (server rendered) Services page; `className` styles
 * the button like the page's other buttons. `initialMachineIds` opens the
 * form with those machines picked; `disabled` shows the button greyed out.
 */
export default function BookMachineTimeButton({
    className,
    children = "Book machine time",
    initialMachineIds,
    disabled = false,
}: {
    className?: string;
    children?: React.ReactNode;
    initialMachineIds?: string[];
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button type="button" onClick={() => setOpen(true)} disabled={disabled} className={className}>
                {children}
            </button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-2xl gap-5 p-5 md:p-8">
                    <div className="flex flex-col gap-1">
                        <DialogTitle className="text-xl">Book machine time</DialogTitle>
                        <DialogDescription>
                            Tell us what you need and when. You pay now, then we confirm your slot at the Lagos factory by
                            email.
                        </DialogDescription>
                        <Link
                            href={MACHINE_BOOKING_MY_BOOKINGS_URL}
                            onClick={() => setOpen(false)}
                            className="w-fit text-sm font-medium text-primary-800 underline-offset-4 hover:underline"
                        >
                            Already booked? See your bookings
                        </Link>
                    </div>
                    <MachineBookingForm initialMachineIds={initialMachineIds} />
                </DialogContent>
            </Dialog>
        </>
    );
}
