"use client";

import { useState, type ReactNode } from "react";
import { useController, useForm } from "react-hook-form";
import { ArrowRight, CreditCard, Plus, Wallet, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatBalance, formatPrice } from "@/lib/currency";
import { formatOrdinalDate } from "@/lib/date";
import MainForm, { CheckboxInput } from "@/components/form";
import { getPlanPrice, requiresBusinessDocuments, type PricingPlan } from "@/constant/sampleData";
import { hasBusinessDocuments, type ManufacturerSubscription } from "@/constant/manufacturer";
import Notice from "@/components/manufacturerPlatform/notice";
import { useManufacturerProfile } from "@/components/manufacturerPlatform/dashboardLayout/manufacturerProfileContext";
import { useManufacturerSubscription } from "@/components/manufacturerPlatform/dashboardLayout/manufacturerSubscriptionContext";
import { useManufacturerWallet } from "@/components/manufacturerPlatform/dashboardLayout/manufacturerWalletContext";
import { FormSubmitButton } from "./formButtons";

type PlanUpgradeFormValues = {
    /** "wallet", "new-card", or "card:<saved card id>". */
    paymentMethod: string;
    saveCard: boolean;
};

const NEW_CARD = "new-card";
const WALLET = "wallet";

// ─────────────────────────────────────────────────────────────────────────────
// PlanUpgradeForm — pays for an upgrade and applies it straight away. The
// charge is the difference between the two plans for this billing period;
// the new price applies from the next renewal. Payable from the wallet
// balance, a saved card, or a new card (entered on the payment partner's
// secure form — card details never pass through this app).
// ─────────────────────────────────────────────────────────────────────────────

export default function PlanUpgradeForm({
    currentPlan,
    newPlan,
    subscription,
    onUpgraded,
    discountPercent = 0,
}: {
    currentPlan: PricingPlan;
    newPlan: PricingPlan;
    subscription: ManufacturerSubscription;
    onUpgraded: () => void;
    discountPercent?: number;
}) {
    const { profile } = useManufacturerProfile();
    const { wallet, payFromBalance } = useManufacturerWallet();
    const { savedCards, addCard, upgradePlan } = useManufacturerSubscription();
    const [isLoading, setIsLoading] = useState(false);

    const cycle = subscription.billingCycle;
    const per = cycle === "annual" ? "year" : "month";
    const newPrice = getPlanPrice(newPlan, cycle, discountPercent);
    const amountDue = newPrice - getPlanPrice(currentPlan, cycle, discountPercent);
    const canPayFromWallet = wallet.balance >= amountDue;
    // Solo doesn't need these, other plans do — they're asked for right after paying
    const needsBusinessDocuments =
        requiresBusinessDocuments(newPlan.id) && !hasBusinessDocuments(profile);

    const methods = useForm<PlanUpgradeFormValues>({
        defaultValues: {
            paymentMethod: canPayFromWallet
                ? WALLET
                : savedCards[0]
                  ? `card:${savedCards[0].id}`
                  : NEW_CARD,
            saveCard: true,
        },
    });
    const { field } = useController({
        name: "paymentMethod",
        control: methods.control,
        rules: { required: "Choose how to pay" },
    });

    const handleSubmit = async ({ paymentMethod, saveCard }: PlanUpgradeFormValues) => {
        setIsLoading(true);
        try {
            if (paymentMethod === WALLET) {
                payFromBalance(amountDue, `${newPlan.name} plan upgrade`);
                await upgradePlan(newPlan.id, { from: "wallet" });
            } else if (paymentMethod.startsWith("card:")) {
                const cardId = paymentMethod.slice("card:".length);
                await upgradePlan(newPlan.id, { from: "card", cardId });
            } else {
                if (saveCard) {
                    addCard({ id: `card-${Date.now()}`, brand: "Mastercard", last4: "5100", expiry: "12/28" });
                }
                await upgradePlan(newPlan.id, { from: "new-card", saveCard });
            }
            toast.success(`You're now on the ${newPlan.name} plan`);
            onUpgraded();
        } catch {
            toast.error("Payment didn't go through. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3 rounded-xl border border-border p-4 font-text">
                <div className="flex items-center gap-3 text-sm">
                    <PlanPrice name={currentPlan.name} price={formatPrice(getPlanPrice(currentPlan, cycle))} per={per} muted />
                    <ArrowRight className="size-4 shrink-0 text-mist-400" aria-hidden />
                    <PlanPrice name={newPlan.name} price={formatPrice(newPrice)} per={per} />
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                    <span className="text-sm text-mist-600">Due today</span>
                    <span className="text-lg font-semibold text-mist-950">{formatPrice(amountDue)}</span>
                </div>
                <p className="text-xs text-mist-500">
                    The difference for the rest of this billing period. From{" "}
                    {formatOrdinalDate(new Date(subscription.renewsAt))} you&apos;ll pay{" "}
                    {formatPrice(newPrice)} per {per}.
                </p>
            </div>

            {needsBusinessDocuments && (
                <Notice>
                    {newPlan.name} needs your company tax number and business license
                    number. We&apos;ll ask for them right after you pay.
                </Notice>
            )}

            <MainForm<PlanUpgradeFormValues>
                methods={methods}
                fields={[]}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                footerSlot={
                    <div className="flex flex-col gap-3">
                        <h3 className="text-xs font-semibold font-text uppercase tracking-wide text-mist-700">
                            Pay with
                        </h3>
                        <div role="radiogroup" aria-label="Payment method" className="flex flex-col gap-2">
                            <PaymentOption
                                name={field.name}
                                value={WALLET}
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={!canPayFromWallet}
                                icon={Wallet}
                                title="Wallet balance"
                                subtitle={
                                    canPayFromWallet
                                        ? `${formatBalance(wallet.balance)} available`
                                        : `Not enough balance — ${formatBalance(wallet.balance)} available`
                                }
                            />
                            {savedCards.map((card) => (
                                <PaymentOption
                                    key={card.id}
                                    name={field.name}
                                    value={`card:${card.id}`}
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    icon={CreditCard}
                                    title={`${card.brand} •••• ${card.last4}`}
                                    subtitle={`Expires ${card.expiry}`}
                                />
                            ))}
                            <PaymentOption
                                name={field.name}
                                value={NEW_CARD}
                                selected={field.value}
                                onSelect={field.onChange}
                                icon={Plus}
                                title="Add a new card"
                                subtitle="Enter your card details securely with our payment partner"
                            >
                                {field.value === NEW_CARD && (
                                    <CheckboxInput
                                        field={{
                                            name: "saveCard",
                                            type: "checkbox",
                                            label: "Save this card for future payments",
                                        }}
                                        control={methods.control}
                                    />
                                )}
                            </PaymentOption>
                        </div>
                    </div>
                }
                renderFooter={({ isLoading }) => (
                    <FormSubmitButton
                        label={`Pay ${formatPrice(amountDue)}`}
                        loadingLabel="Processing payment..."
                        isLoading={isLoading}
                        disabled={!field.value}
                        className="mt-1 w-full"
                    />
                )}
            />
        </div>
    );
}

function PlanPrice({
    name,
    price,
    per,
    muted = false,
}: {
    name: string;
    price: string;
    per: string;
    muted?: boolean;
}) {
    return (
        <div className="min-w-0 flex-1">
            <p className={cn("font-medium", muted ? "text-mist-500" : "text-mist-950")}>{name}</p>
            <p className={cn("text-xs", muted ? "text-mist-400" : "text-mist-600")}>
                {price}/{per}
            </p>
        </div>
    );
}

function PaymentOption({
    name,
    value,
    selected,
    onSelect,
    disabled = false,
    icon: Icon,
    title,
    subtitle,
    children,
}: {
    name: string;
    value: string;
    selected: string;
    onSelect: (value: string) => void;
    disabled?: boolean;
    icon: LucideIcon;
    title: string;
    subtitle: string;
    /** Extra controls shown under the option, e.g. "save this card". */
    children?: ReactNode;
}) {
    return (
        <div
            className={cn(
                "rounded-xl border border-border bg-white transition-colors has-checked:border-secondary-700 has-checked:bg-secondary-50/40",
                disabled && "opacity-60",
            )}
        >
            <label
                className={cn(
                    "flex items-center gap-3 px-4 py-3 has-focus-visible:ring-2 has-focus-visible:ring-secondary-300 rounded-xl",
                    disabled ? "cursor-not-allowed" : "cursor-pointer",
                )}
            >
                <input
                    type="radio"
                    name={name}
                    value={value}
                    checked={selected === value}
                    onChange={() => onSelect(value)}
                    disabled={disabled}
                    className="size-4 shrink-0 accent-secondary-700"
                />
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-mist-100 text-mist-700">
                    <Icon className="size-4" strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1 font-text">
                    <span className="block text-sm font-medium text-mist-950">{title}</span>
                    <span className="block text-xs text-mist-500">{subtitle}</span>
                </span>
            </label>
            {children && <div className="px-4 pb-3 pl-11">{children}</div>}
        </div>
    );
}
