"use client";

import { useState } from "react";
import { CreditCard, Plus, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBalance, formatPrice } from "@/lib/currency";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
    MAX_SAVED_CARDS,
    isCardExpired,
    renewalCardOf,
    savedCardLabel,
    type ManufacturerSubscription,
    type SavedCard,
} from "@/constant/manufacturer";
import AddCardForm from "@/components/manufacturerPlatform/form/addCardForm";
import RemoveCardForm from "@/components/manufacturerPlatform/form/removeCardForm";
import RenewalSourceForm from "@/components/manufacturerPlatform/form/renewalSourceForm";
import Notice from "../notice";
import SettingsSection from "../settingsSection";
import EmptyState from "../dashboardPage/emptyState";
import { useManufacturerSubscription } from "../dashboardLayout/manufacturerSubscriptionContext";
import { useManufacturerWallet } from "../dashboardLayout/manufacturerWalletContext";

type PaymentMethodsDialog = "add" | "renewals" | "remove";

const SECTION_TITLE = "Payment methods";
const SECTION_DESCRIPTION = "Cards you've saved for paying for your plan. Card details are kept by our payment partner, never by MANDE.";

// ─────────────────────────────────────────────────────────────────────────────
// PaymentMethods — the Plan tab's saved cards, and where renewals are paid
// from. Renewals can be switched between the wallet and any saved card that
// hasn't expired (only while the plan is active, as the API requires). A
// card can be removed (renewals then move to the newest other card), and a
// new one added through the payment partner's checkout, which comes back to
// the Plan tab with ?reference=… (PlanTab confirms it).
// ─────────────────────────────────────────────────────────────────────────────

export default function PaymentMethods({
    subscription,
    renewalPrice,
    renewsOn,
}: {
    subscription: ManufacturerSubscription;
    /** The next renewal's price, in naira. */
    renewalPrice: number;
    /** "3rd May", or null when the API has no period end. */
    renewsOn: string | null;
}) {
    const { savedCards } = useManufacturerSubscription();
    const { wallet, isLoading: isWalletLoading, isError: isWalletError } = useManufacturerWallet();
    const [dialog, setDialog] = useState<PaymentMethodsDialog | null>(null);
    // Kept after closing so the dialog's content stays put while it animates out
    const [cardToRemove, setCardToRemove] = useState<SavedCard | null>(null);

    const isActive = subscription.status === "active";
    const renewalCard = renewalCardOf(subscription, savedCards);
    const paysByCard = subscription.renewalsPaidFrom === "card";
    const walletBalance = isWalletLoading || isWalletError ? null : wallet.balance;
    const atCardLimit = savedCards.length >= MAX_SAVED_CARDS;

    const closeDialog = () => setDialog(null);
    const dialogProps = (kind: PaymentMethodsDialog) => ({
        open: dialog === kind,
        onOpenChange: (open: boolean) => {
            if (!open) closeDialog();
        },
    });
    const openRemove = (card: SavedCard) => {
        setCardToRemove(card);
        setDialog("remove");
    };

    const addCardButton = (
        <button
            type="button"
            onClick={() => setDialog("add")}
            disabled={atCardLimit}
            title={atCardLimit ? `You can save up to ${MAX_SAVED_CARDS} cards. Remove one to add another.` : undefined}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-button border border-border px-4 text-sm font-medium font-text text-mist-700 transition-colors duration-200 cursor-pointer enabled:hover:bg-mist-50 disabled:cursor-default disabled:text-mist-400"
        >
            <Plus className="size-4" aria-hidden />
            Add card
        </button>
    );

    return (
        <>
            <SettingsSection
                headingLevel="h3"
                title={SECTION_TITLE}
                description={SECTION_DESCRIPTION}
                action={savedCards.length > 0 ? addCardButton : undefined}
            >
                {isActive && (
                    <div className="flex flex-col gap-3 rounded-xl border border-border bg-white px-4 py-3.5">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-mist-100 text-mist-700">
                                {paysByCard ? <CreditCard className="size-4" strokeWidth={1.75} /> : <Wallet className="size-4" strokeWidth={1.75} />}
                            </span>
                            <div className="min-w-0 flex-1 font-text">
                                <p className="text-xs text-mist-500">
                                    {subscription.cancelAtPeriodEnd ? "Renewals would be paid from" : "Renewals are paid from"}
                                </p>
                                <p className="text-sm font-medium text-mist-950">
                                    {!paysByCard ? "Wallet balance" : renewalCard ? savedCardLabel(renewalCard) : "No card saved"}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDialog("renewals")}
                                className="h-9 shrink-0 rounded-button border border-border px-4 text-sm font-medium font-text text-mist-700 transition-colors duration-200 cursor-pointer hover:bg-mist-50"
                            >
                                Change
                            </button>
                        </div>
                        {paysByCard && !renewalCard && (
                            <Notice tone="warning">
                                Renewals are set to be paid by card, but you have no saved card. Add a card or pay
                                renewals from your wallet, or your next renewal will fail.
                            </Notice>
                        )}
                        {renewalCard && isCardExpired(renewalCard) && (
                            <Notice tone="warning">
                                The card that pays your renewals has expired. Choose another card or your wallet, or
                                your next renewal will fail.
                            </Notice>
                        )}
                        {!paysByCard && walletBalance !== null && walletBalance < renewalPrice && !subscription.cancelAtPeriodEnd && (
                            <Notice tone="warning">
                                Your wallet has {formatBalance(walletBalance)} and your next renewal is{" "}
                                {formatPrice(renewalPrice)}{renewsOn ? ` on ${renewsOn}` : ""}. If it&apos;s still short then,
                                the renewal fails and you won&apos;t be matched with new jobs until it&apos;s paid.
                            </Notice>
                        )}
                    </div>
                )}

                {savedCards.length === 0 ? (
                    <div className="rounded-xl border border-border bg-white">
                        <EmptyState
                            compact
                            icon={CreditCard}
                            title="No saved cards"
                            description="Add a card to pay for upgrades and renewals without entering it each time."
                            action={addCardButton}
                        />
                    </div>
                ) : (
                    <ul className="flex flex-col gap-3">
                        {savedCards.map((card) => {
                            const expired = isCardExpired(card);
                            const paysRenewals = renewalCard?.id === card.id;
                            return (
                                <li
                                    key={card.id}
                                    className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-white px-4 py-3.5"
                                >
                                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-mist-100 text-mist-700">
                                        <CreditCard className="size-4" strokeWidth={1.75} />
                                    </span>
                                    <div className="min-w-0 flex-1 font-text">
                                        <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-mist-950">
                                            {savedCardLabel(card)}
                                            {paysRenewals && <CardBadge className="bg-primary-50 text-primary-700">Pays renewals</CardBadge>}
                                            {expired && <CardBadge className="bg-error-50 text-error-600">Expired</CardBadge>}
                                        </p>
                                        {card.expiry && (
                                            <p className="text-xs text-mist-500">
                                                {expired ? "Expired" : "Expires"} {card.expiry}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => openRemove(card)}
                                        aria-label={`Remove ${savedCardLabel(card)}`}
                                        className="h-9 shrink-0 rounded-button border border-error-200 px-4 text-sm font-medium font-text text-error-600 transition-colors duration-200 cursor-pointer hover:bg-error-50"
                                    >
                                        Remove
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </SettingsSection>

            <Dialog {...dialogProps("add")}>
                <DialogContent showCloseButton={false} className="max-w-100">
                    <AddCardForm onCancel={closeDialog} />
                </DialogContent>
            </Dialog>

            <Dialog {...dialogProps("renewals")}>
                <DialogContent>
                    <DialogTitle>Pay renewals with</DialogTitle>
                    <RenewalSourceForm
                        subscription={subscription}
                        savedCards={savedCards}
                        renewalPrice={renewalPrice}
                        walletBalance={walletBalance}
                        onSaved={closeDialog}
                        onCancel={closeDialog}
                    />
                </DialogContent>
            </Dialog>

            <Dialog {...dialogProps("remove")}>
                <DialogContent showCloseButton={false} className="max-w-100">
                    {cardToRemove && (
                        <RemoveCardForm
                            card={cardToRemove}
                            savedCards={savedCards}
                            paysRenewals={renewalCard?.id === cardToRemove.id}
                            onRemoved={closeDialog}
                            onCancel={closeDialog}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

function CardBadge({ className, children }: { className: string; children: string }) {
    return <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", className)}>{children}</span>;
}

/** The section while the plan loads: the heading shows, the cards are skeletons. */
export function PaymentMethodsSkeleton() {
    return (
        <SettingsSection headingLevel="h3" title={SECTION_TITLE} description={SECTION_DESCRIPTION}>
            <ul className="flex flex-col gap-3" aria-busy>
                {[1, 2].map((i) => (
                    <li key={i} className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-3.5">
                        <Skeleton className="size-9 rounded-full" />
                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                            <Skeleton className="h-4 w-36" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-9 w-20 rounded-button" />
                    </li>
                ))}
            </ul>
        </SettingsSection>
    );
}
