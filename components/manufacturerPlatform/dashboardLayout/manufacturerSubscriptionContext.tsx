"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import {
    MANUFACTURER_SAVED_CARDS,
    MANUFACTURER_SUBSCRIPTION,
    type ManufacturerSubscription,
    type SavedCard,
} from "@/constant/manufacturer";

// ─────────────────────────────────────────────────────────────────────────────
// ManufacturerSubscriptionProvider — the manufacturer's plan and saved cards,
// for the edit profile Plan tab. Upgrades apply straight away (they're paid
// for up front); downgrades and cancellations wait for the end of the billing
// period. Seeded from sample data and updated locally for now; once the
// backend is connected, load these from the API and let it apply the changes.
// ─────────────────────────────────────────────────────────────────────────────

import { subscriptionService, type UpgradePlanPayload } from "@/lib/services/subscriptionService";

type ManufacturerSubscriptionContextValue = {
    subscription: ManufacturerSubscription;
    savedCards: SavedCard[];
    /** Moves to `planId` now — also undoes a pending cancellation or downgrade. */
    upgradePlan: (planId: string, pay?: UpgradePlanPayload["pay"]) => void | Promise<void>;
    /** Moves to `planId` when the current period ends. */
    scheduleDowngrade: (planId: string) => void | Promise<void>;
    /** Keeps the current plan — drops a scheduled downgrade or cancellation. */
    keepCurrentPlan: () => void | Promise<void>;
    /** Ends the plan when the current period ends. */
    cancelPlan: () => void | Promise<void>;
    addCard: (card: SavedCard) => void;
};

const ManufacturerSubscriptionContext =
    createContext<ManufacturerSubscriptionContextValue | null>(null);

export function ManufacturerSubscriptionProvider({ children }: { children: ReactNode }) {
    const [subscription, setSubscription] = useState(MANUFACTURER_SUBSCRIPTION);
    const [savedCards, setSavedCards] = useState(MANUFACTURER_SAVED_CARDS);

    const update = (changes: Partial<ManufacturerSubscription>) =>
        setSubscription((current) => ({ ...current, ...changes }));

    const value: ManufacturerSubscriptionContextValue = {
        subscription,
        savedCards,
        upgradePlan: async (planId, pay) => {
            update({ planId, cancelAtPeriodEnd: false, scheduledPlanId: null });
            try {
                if (pay) {
                    await subscriptionService.upgradePlan({ planId, pay });
                }
            } catch (err) {
                console.error("Failed to upgrade plan on server:", err);
            }
        },
        scheduleDowngrade: async (planId) => {
            update({ scheduledPlanId: planId, cancelAtPeriodEnd: false });
            try {
                await subscriptionService.scheduleDowngrade(planId);
            } catch (err) {
                console.error("Failed to schedule downgrade on server:", err);
            }
        },
        keepCurrentPlan: async () => {
            update({ scheduledPlanId: null, cancelAtPeriodEnd: false });
            try {
                await subscriptionService.keepCurrentPlan();
            } catch (err) {
                console.error("Failed to keep current plan on server:", err);
            }
        },
        cancelPlan: async () => {
            update({ cancelAtPeriodEnd: true, scheduledPlanId: null });
            try {
                await subscriptionService.cancelPlan();
            } catch (err) {
                console.error("Failed to cancel plan on server:", err);
            }
        },
        addCard: (card) => setSavedCards((current) => [...current, card]),
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
