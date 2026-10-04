"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ManufacturerSubscription, SavedCard } from "@/constant/manufacturer";
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
// loaded (or if it can't, or there's none) the subscription is null.
// ─────────────────────────────────────────────────────────────────────────────

/** Where the payment partner's checkout sends them back to after paying for an upgrade. */
export const PLAN_SETTINGS_PATH = "/manufacturer/profile/settings?tab=plan";

type ManufacturerSubscriptionContextValue = {
    /** Null until loaded, if it can't load, or when they've never had a plan. */
    subscription: ManufacturerSubscription | null;
    savedCards: SavedCard[];
    /** True until the plan has loaded from the API. */
    isLoading: boolean;
    /** True when the plan couldn't load. */
    isError: boolean;
    /**
     * A plan was never paid for (the sign-up payment failed or was left): the
     * dashboard waits behind the payment screen until it is (see PlanPaymentGate).
     */
    needsFirstPayment: boolean;
    /** The newest plan payment, e.g. to offer a retry when it failed. Null when there's none. */
    latestPayment: SubscriptionPayment | null;
    /**
     * Pays for `planId` in full through the payment partner's checkout, for a
     * plan that isn't active (never paid for, lapsed or ended). Leaves the
     * page; the checkout comes back to `returnPath` with ?reference=…, for
     * confirmPayment.
     */
    payForPlan: (planId: string, billingCycle: ManufacturerSubscription["billingCycle"], returnPath: string) => Promise<void>;
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
        status: view.status,
        renewsAt: view.renewsAt ?? new Date().toISOString(),
        cancelAtPeriodEnd: view.cancelAtPeriodEnd,
        scheduledPlanId: view.scheduledPlanId,
    };
}

/** Leaves for the payment partner's checkout (only ever an https link from the API). */
function goToCheckout(checkoutUrl: string) {
    if (!checkoutUrl.startsWith("https://")) {
        throw new Error("Payments aren't available right now. Please try again later.");
    }
    window.location.assign(checkoutUrl);
}

export function ManufacturerSubscriptionProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();
    const { data, isPending, isError } = useQuery({
        queryKey: queryKeys.subscription.details(),
        queryFn: () => subscriptionService.getSubscription(),
        retry: false,
    });

    // The actions only need the query client, so they keep their identity across renders
    const actions = useMemo(() => {
        /** Shows what the API answered with (every plan route answers with the whole plan). */
        const show = (view: SubscriptionView): void => {
            queryClient.setQueryData<SubscriptionView>(queryKeys.subscription.details(), {
                subscription: view.subscription,
                cards: view.cards,
                payments: view.payments,
            });
        };

        return {
            payForPlan: async (planId, billingCycle, returnPath) => {
                const { checkoutUrl } = await subscriptionService.startCheckout({ planId, billingCycle, saveCard: true, returnPath });
                goToCheckout(checkoutUrl);
            },
            upgradePlan: async (planId, pay) => {
                const result = await subscriptionService.upgradePlan({
                    planId,
                    pay: pay.from === "new-card" ? { ...pay, returnPath: PLAN_SETTINGS_PATH } : pay,
                });
                if (result.checkoutUrl) {
                    goToCheckout(result.checkoutUrl);
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
        } satisfies Pick<
            ManufacturerSubscriptionContextValue,
            "payForPlan" | "upgradePlan" | "confirmPayment" | "scheduleDowngrade" | "keepCurrentPlan" | "cancelPlan"
        >;
    }, [queryClient]);

    const value: ManufacturerSubscriptionContextValue = useMemo(
        () => ({
            subscription: toSubscription(data?.subscription ?? null),
            savedCards: (data?.cards ?? []).map((card) => ({ id: card.id, brand: toCardBrand(card.brand), last4: card.last4, expiry: card.expiry })),
            isLoading: isPending,
            isError,
            needsFirstPayment: !!data && (!data.subscription || data.subscription.status === "pending_payment"),
            latestPayment: data?.payments[0] ?? null,
            ...actions,
        }),
        [data, isPending, isError, actions],
    );

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
