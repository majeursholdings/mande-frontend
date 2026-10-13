"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { savedCardLabel, type SavedCard } from "@/constant/manufacturer";
import Notice from "@/components/manufacturerPlatform/notice";
import { useManufacturerSubscription } from "@/components/manufacturerPlatform/dashboardLayout/manufacturerSubscriptionContext";
import { FormCancelButton } from "./formButtons";

// ─────────────────────────────────────────────────────────────────────────────
// RemoveCardForm — confirms removing a saved card (the dialog's content). If
// it pays the plan's renewals, the API moves them to the newest other saved
// card, so that's named here; with no other card, the next renewal by card
// would fail, so it warns to switch to the wallet or add a card.
// ─────────────────────────────────────────────────────────────────────────────

export default function RemoveCardForm({
    card,
    savedCards,
    paysRenewals,
    onRemoved,
    onCancel,
}: {
    card: SavedCard;
    /** Every saved card, newest first (as the API lists them). */
    savedCards: SavedCard[];
    /** True when renewals are charged to this card. */
    paysRenewals: boolean;
    onRemoved: () => void;
    onCancel: () => void;
}) {
    const { removeCard } = useManufacturerSubscription();
    const [isLoading, setIsLoading] = useState(false);
    // The card renewals move to: the newest one left
    const nextCard = savedCards.find((c) => c.id !== card.id) ?? null;

    const handleRemove = async () => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            await removeCard(card.id);
            toast.success(`${savedCardLabel(card)} removed`);
            onRemoved();
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't remove this card. Please try again."));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="flex flex-col gap-1">
                <DialogTitle>Remove {savedCardLabel(card)}?</DialogTitle>
                <DialogDescription>
                    {paysRenewals && nextCard
                        ? `This card pays your plan renewals. Once it's removed, they'll be charged to ${savedCardLabel(nextCard)}.`
                        : "You won't be able to pay with it until you add it again."}
                </DialogDescription>
            </div>
            {paysRenewals && !nextCard && (
                <Notice tone="warning">
                    This card pays your plan renewals and it&apos;s your only saved card. Pay renewals from your
                    wallet or add another card, or your next renewal will fail.
                </Notice>
            )}
            <div className="flex justify-end gap-3">
                <FormCancelButton onClick={onCancel} disabled={isLoading}>
                    Keep card
                </FormCancelButton>
                <Button
                    type="button"
                    onClick={handleRemove}
                    disabled={isLoading}
                    aria-busy={isLoading}
                    className="h-11 px-5 bg-error-600 hover:bg-error-700 text-white font-medium font-text rounded-button cursor-pointer transition-colors duration-300 disabled:opacity-80"
                >
                    {isLoading && <Loader2 className="size-4 animate-spin" aria-hidden />}
                    Remove card
                </Button>
            </div>
        </>
    );
}
