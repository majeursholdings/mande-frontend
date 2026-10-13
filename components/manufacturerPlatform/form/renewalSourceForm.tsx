"use client";

import { useState } from "react";
import { useController, useForm } from "react-hook-form";
import { CreditCard, Wallet } from "lucide-react";
import { toast } from "sonner";
import { formatBalance, formatPrice } from "@/lib/currency";
import { getErrorMessage } from "@/lib/api";
import MainForm from "@/components/form";
import {
    isCardExpired,
    renewalCardOf,
    savedCardLabel,
    type ManufacturerSubscription,
    type SavedCard,
} from "@/constant/manufacturer";
import { useManufacturerSubscription } from "@/components/manufacturerPlatform/dashboardLayout/manufacturerSubscriptionContext";
import { FormCancelButton, FormSubmitButton } from "./formButtons";
import { PaymentOption } from "./planUpgradeForm";

type RenewalSourceFormValues = {
    /** "wallet" or "card:<saved card id>". */
    source: string;
};

const WALLET = "wallet";

// ─────────────────────────────────────────────────────────────────────────────
// RenewalSourceForm — where the plan's renewals are charged: the wallet
// balance, or one of the saved cards. An expired card can't be chosen. If
// the wallet doesn't cover the renewal when it's due, the renewal fails and
// the plan stops matching new jobs until it's paid, so that's said up front.
// ─────────────────────────────────────────────────────────────────────────────

export default function RenewalSourceForm({
    subscription,
    savedCards,
    renewalPrice,
    walletBalance,
    onSaved,
    onCancel,
}: {
    subscription: ManufacturerSubscription;
    savedCards: SavedCard[];
    /** The next renewal's price, in naira. */
    renewalPrice: number;
    /** In naira. Null while the wallet loads. */
    walletBalance: number | null;
    onSaved: () => void;
    onCancel: () => void;
}) {
    const { setRenewalSource } = useManufacturerSubscription();
    const [isLoading, setIsLoading] = useState(false);

    const currentCard = renewalCardOf(subscription, savedCards);
    const current = subscription.renewalsPaidFrom === "wallet" ? WALLET : currentCard ? `card:${currentCard.id}` : "";
    const walletIsShort = walletBalance !== null && walletBalance < renewalPrice;

    const methods = useForm<RenewalSourceFormValues>({ defaultValues: { source: current } });
    const { field } = useController({
        name: "source",
        control: methods.control,
        rules: { required: "Choose how to pay renewals" },
    });

    const handleSubmit = async ({ source }: RenewalSourceFormValues) => {
        if (isLoading) return;
        setIsLoading(true);
        try {
            const cardId = source.startsWith("card:") ? source.slice("card:".length) : null;
            await setRenewalSource(cardId ? { from: "card", cardId } : { from: "wallet" });
            const card = savedCards.find((c) => c.id === cardId);
            toast.success(card ? `Renewals will be charged to ${savedCardLabel(card)}` : "Renewals will be paid from your wallet");
            onSaved();
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't change how renewals are paid. Please try again."));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MainForm<RenewalSourceFormValues>
            methods={methods}
            fields={[]}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            footerSlot={
                <div role="radiogroup" aria-label="Pay renewals with" className="flex flex-col gap-2">
                    <PaymentOption
                        name={field.name}
                        value={WALLET}
                        selected={field.value}
                        onSelect={field.onChange}
                        icon={Wallet}
                        title="Wallet balance"
                        subtitle={
                            walletBalance === null
                                ? `Each renewal is ${formatPrice(renewalPrice)}`
                                : walletIsShort
                                  ? `${formatBalance(walletBalance)} available, less than the ${formatPrice(renewalPrice)} renewal. If it's still short then, the renewal fails.`
                                  : `${formatBalance(walletBalance)} available`
                        }
                    />
                    {savedCards.map((card) => {
                        const expired = isCardExpired(card);
                        return (
                            <PaymentOption
                                key={card.id}
                                name={field.name}
                                value={`card:${card.id}`}
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={expired}
                                icon={CreditCard}
                                title={savedCardLabel(card)}
                                subtitle={expired ? `Expired ${card.expiry}` : card.expiry ? `Expires ${card.expiry}` : "Saved card"}
                            />
                        );
                    })}
                </div>
            }
            renderFooter={({ isLoading }) => (
                <div className="flex justify-end gap-3">
                    <FormCancelButton onClick={onCancel} disabled={isLoading} />
                    <FormSubmitButton
                        label="Save"
                        loadingLabel="Saving..."
                        isLoading={isLoading}
                        disabled={!field.value || field.value === current}
                    />
                </div>
            )}
        />
    );
}
