"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/currency";
import { getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { CARD_CHECK_AMOUNT } from "@/constant/manufacturer";
import { useManufacturerSubscription } from "@/components/manufacturerPlatform/dashboardLayout/manufacturerSubscriptionContext";
import { FormCancelButton, PRIMARY_BUTTON_CLASS } from "./formButtons";

// ─────────────────────────────────────────────────────────────────────────────
// AddCardForm — saves a new card (the dialog's content). The card is entered
// on the payment partner's secure page, never in this app: it's charged a
// small amount there, refunded once the card is saved, then they come back
// to the Plan tab, which confirms it.
// ─────────────────────────────────────────────────────────────────────────────

export default function AddCardForm({ onCancel }: { onCancel: () => void }) {
    const { addCard } = useManufacturerSubscription();
    const [isLoading, setIsLoading] = useState(false);

    const handleContinue = async () => {
        if (isLoading) return;
        setIsLoading(true);
        let redirected = false;
        try {
            await addCard();
            redirected = true;
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't open the payment page. Please try again."));
        } finally {
            // Stays loading while the browser leaves for the checkout
            if (!redirected) setIsLoading(false);
        }
    };

    return (
        <>
            <div className="flex flex-col gap-1">
                <DialogTitle>Add a card</DialogTitle>
                <DialogDescription>
                    You&apos;ll enter your card details on our payment partner&apos;s secure page. To check the
                    card, it&apos;s charged {formatPrice(CARD_CHECK_AMOUNT)}, which is refunded as soon as the card
                    is saved. Then you&apos;ll come back here.
                </DialogDescription>
            </div>
            <div className="flex justify-end gap-3">
                <FormCancelButton onClick={onCancel} disabled={isLoading} />
                <Button
                    type="button"
                    onClick={handleContinue}
                    disabled={isLoading}
                    aria-busy={isLoading}
                    className={cn(PRIMARY_BUTTON_CLASS, "disabled:opacity-80")}
                >
                    {isLoading && <Loader2 className="size-4 animate-spin" aria-hidden />}
                    Continue to payment
                </Button>
            </div>
        </>
    );
}
