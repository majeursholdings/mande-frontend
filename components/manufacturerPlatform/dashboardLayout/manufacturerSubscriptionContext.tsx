"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    MANUFACTURER_SAVED_CARDS,
    MANUFACTURER_SUBSCRIPTION,
    type ManufacturerSubscription,
    type SavedCard,
} from "@/constant/manufacturer";
import { queryKeys } from "@/lib/queryKeys";
import {
    subscriptionService,
    type SubscriptionPayment,
    type SubscriptionView,
    type UpgradePlanPayload,
} from "@/lib/services/subscriptionService";

// ─────────────────────────────────────────────────────────────────────────────
// ManufacturerSubscriptionProvider — the manufacturer's plan and saved cards,
// from the API, for the edit profile Plan tab (and the screens that check the
// plan). Upgrades apply straight away (they're paid for up front); downgrades
// and cancellations wait for the end of the billing period. Every change is
// made by the API, and its answer replaces what's shown. Until the plan has
// loaded (or if it can't), the sample plan stands in, as the wallet does.
// ─────────────────────────────────────────────────────────────────────────────

/** Where the payment partner's checkout sends them back to after paying for an upgrade. */
export const PLAN_SETTINGS_PATH = "/manufacturer/profile/settings?tab=plan";

type ManufacturerSubscriptionContextValue = {
    subscription: ManufacturerSubscription;
    savedCards: SavedCard[];
    /** True until the plan has loaded from the API. */
    isLoading: boolean;
    /**
     * Moves to `planId` now, paid as `pay` says (also undoes a pending
     * cancellation or downgrade). Paying with a new card leaves for the
     * payment partner's checkout: `redirected` is then true, and the plan
     * changes once confirmPayment sees it paid.
     */
    upgradePlan: (planId: string, pay: UpgradePlanPayload["pay"]) => Promise<{ redirected: boolean }>;
    /** Checks a payment the checkout sent them back from, and shows the plan it led to. */
    confirmPayment: (reference: string) => Promise<SubscriptionPayment | null>;
    /** Moves to `planId` when the current period ends. */
    scheduleDowngrade: (planId: string) => Promise<void>;
    /** Keeps the current plan — drops a scheduled downgrade or cancellation. */
    keepCurrentPlan: () => Promise<void>;
    /** Ends the plan when the current period ends. */
    cancelPlan: () => Promise<void>;
};

const ManufacturerSubscriptionContext =
    createContext<ManufacturerSubscriptionContextValue | null>(null);

/** "visa " → "Visa", the way the card is named on screen. */
const toCardBrand = (brand: string) => {
    const name = brand.trim();
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : "Card";
};

function toSubscription(view: SubscriptionView["subscription"]): ManufacturerSubscription | null {
    if (!view) return null;
    return {
        planId: view.planId,
        billingCycle: view.billingCycle,
        renewsAt: view.renewsAt ?? new Date().toISOString(),
        cancelAtPeriodEnd: view.cancelAtPeriodEnd,
        scheduledPlanId: view.scheduledPlanId,
    };
}

export function ManufacturerSubscriptionProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();
    const { data, isPending } = useQuery({
        queryKey: queryKeys.subscription.details(),
        queryFn: () => subscriptionService.getSubscription(),
        retry: false,
    });

    /** Shows what the API answered with (every plan route answers with the whole plan). */
    const show = (view: SubscriptionView): void => {
        queryClient.setQueryData<SubscriptionView>(queryKeys.subscription.details(), {
            subscription: view.subscription,
            cards: view.cards,
            payments: view.payments,
        });
    };

    const value: ManufacturerSubscriptionContextValue = {
        subscription: toSubscription(data?.subscription ?? null) ?? MANUFACTURER_SUBSCRIPTION,
        savedCards: data
            ? data.cards.map((card) => ({ id: card.id, brand: toCardBrand(card.brand), last4: card.last4, expiry: card.expiry }))
            : MANUFACTURER_SAVED_CARDS,
        isLoading: isPending,
        upgradePlan: async (planId, pay) => {
            const result = await subscriptionService.upgradePlan({
                planId,
                pay: pay.from === "new-card" ? { ...pay, returnPath: PLAN_SETTINGS_PATH } : pay,
            });
            if (result.checkoutUrl) {
                if (!result.checkoutUrl.startsWith("https://")) {
                    throw new Error("Payments aren't available right now. Please try again later.");
                }
                window.location.assign(result.checkoutUrl);
                return { redirected: true };
            }
            show(result);
            // A wallet payment moved money: show the new balance
            if (pay.from === "wallet") await queryClient.invalidateQueries({ queryKey: queryKeys.wallet.all });
            return { redirected: false };
        },
        confirmPayment: async (reference) => {
            const { payment, ...view } = await subscriptionService.confirmPayment(reference);
            show(view);
            return payment;
        },
        scheduleDowngrade: async (planId) => show(await subscriptionService.scheduleDowngrade(planId)),
        keepCurrentPlan: async () => show(await subscriptionService.keepCurrentPlan()),
        cancelPlan: async () => show(await subscriptionService.cancelPlan()),
    };

    return (
        <ManufacturerSubscriptionContext.Provider value={value}>
            {children}
        </ManufacturerSubscriptionContext.Provider>
    );
}

export function useManufacturerSubscription() {
    const context = useContext(ManufacturerSubscriptionContext);
    if (!context) {
        throw new Error(
            "useManufacturerSubscription must be used within a ManufacturerSubscriptionProvider",
        );
    }
    return context;
}
