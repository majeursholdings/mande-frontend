"use client";

import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/currency";
import { formatOrdinalDate } from "@/lib/date";
import { queryKeys } from "@/lib/queryKeys";
import { superAdminService } from "@/lib/services/superAdminService";
import { Button } from "@/components/ui/button";
import ListPrice from "@/components/ui/listPrice";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    PRICING_PLANS,
    getPlanPrice,
    getPricingPlan,
    type PricingPlan,
} from "@/constant/sampleData";
import PlanUpgradeForm from "@/components/manufacturerPlatform/form/planUpgradeForm";
import { FormCancelButton } from "@/components/manufacturerPlatform/form/formButtons";
import Notice from "../notice";
import SettingsSection from "../settingsSection";
import { useManufacturerSubscription } from "../dashboardLayout/manufacturerSubscriptionContext";

type PlanDialog = "upgrade" | "downgrade" | "cancel";

// ─────────────────────────────────────────────────────────────────────────────
// PlanTab — the current plan, switching plans, and cancelling.
//   Upgrade   → pay the difference (wallet or card), applies now
//   Downgrade → confirm, applies when the billing period ends
//   Cancel    → confirm, the plan ends when the billing period ends
// A pending downgrade or cancellation can be undone until then.
// ─────────────────────────────────────────────────────────────────────────────

export default function PlanTab() {
    const { data: plansData } = useQuery({
        queryKey: queryKeys.settings.plans(),
        queryFn: () => superAdminService.getPlans(),
    });
    const discountPercent = plansData?.discountPercent ?? 0;
    const plans = plansData?.plans ?? PRICING_PLANS;

    const { subscription, keepCurrentPlan, scheduleDowngrade, cancelPlan } =
        useManufacturerSubscription();
    const [dialog, setDialog] = useState<PlanDialog | null>(null);
    // Kept after closing so the dialog's content stays put while it animates out
    const [targetPlanId, setTargetPlanId] = useState<string | null>(null);

    const currentPlan = plans.find((p) => p.id === subscription.planId) ?? getPricingPlan(subscription.planId);
    if (!currentPlan) {
        return <Notice>We couldn&apos;t load your plan. Please refresh the page.</Notice>;
    }

    const cycle = subscription.billingCycle;
    const per = cycle === "annual" ? "year" : "month";
    const currentPrice = getPlanPrice(currentPlan, cycle, discountPercent);
    const periodEnd = formatOrdinalDate(new Date(subscription.renewsAt));
    const scheduledPlan = plans.find((p) => p.id === subscription.scheduledPlanId) ?? getPricingPlan(subscription.scheduledPlanId ?? "");
    const targetPlan = plans.find((p) => p.id === targetPlanId) ?? getPricingPlan(targetPlanId ?? "");

    const openDialog = (kind: PlanDialog, planId?: string) => {
        if (planId) setTargetPlanId(planId);
        setDialog(kind);
    };
    const closeDialog = () => setDialog(null);
    const dialogProps = (kind: PlanDialog) => ({
        open: dialog === kind,
        onOpenChange: (open: boolean) => {
            if (!open) closeDialog();
        },
    });

    const handleKeepPlan = () => {
        try {
            keepCurrentPlan();
            toast.success(`You'll stay on the ${currentPlan.name} plan`);
        } catch {
            toast.error("Couldn't update your plan. Please try again.");
        }
    };

    return (
        <>
            <SettingsSection headingLevel="h3" title="Current plan">
                <div className="flex flex-col gap-4 rounded-xl border border-border bg-white p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex flex-col gap-1">
                            <p className="flex items-center gap-2 text-lg font-semibold font-text text-mist-950">
                                {currentPlan.name}
                                <span
                                    className={cn(
                                        "rounded-full px-2 py-0.5 text-[11px] font-medium",
                                        subscription.cancelAtPeriodEnd
                                            ? "bg-warning-50 text-warning-700"
                                            : "bg-primary-50 text-primary-700",
                                    )}
                                >
                                    {subscription.cancelAtPeriodEnd ? "Cancelled" : "Active"}
                                </span>
                            </p>
                            <p className="text-[11px] font-medium font-text uppercase tracking-wide text-mist-500">
                                {currentPlan.targetAudience}
                            </p>
                        </div>
                        <p className="flex flex-wrap items-baseline justify-end gap-x-2 text-lg font-semibold font-text text-mist-950">
                            <ListPrice plan={currentPlan} billingCycle={cycle} discountPercent={discountPercent} className="text-sm text-mist-400" />
                            <span>
                                {formatPrice(currentPrice)}
                                <span className="text-xs font-normal text-mist-500">/{per}</span>
                            </span>
                        </p>
                    </div>
                    <PlanFeatures plan={currentPlan} />
                    <p className="text-sm font-text text-mist-600">
                        {subscription.cancelAtPeriodEnd ? "Ends" : "Renews"} on {periodEnd}
                    </p>

                    {scheduledPlan && (
                        <Notice>
                            Your plan changes to {scheduledPlan.name} on {periodEnd}.{" "}
                            <InlineAction onClick={handleKeepPlan}>
                                Keep {currentPlan.name}
                            </InlineAction>
                        </Notice>
                    )}
                    {subscription.cancelAtPeriodEnd && (
                        <Notice tone="warning">
                            Your plan ends on {periodEnd}. After that, you won&apos;t be matched
                            with new jobs.{" "}
                            <InlineAction onClick={handleKeepPlan}>Resume plan</InlineAction>
                        </Notice>
                    )}
                </div>
            </SettingsSection>

            <SettingsSection headingLevel="h3"
                title="Change plan"
description="Upgrades start straight away, and you pay the difference for the rest of this billing period. Downgrades start when it ends."
            >
                <ul className="flex flex-col gap-3">
                    {plans.filter((plan) => plan.id !== currentPlan.id).map((plan) => {
                        const price = getPlanPrice(plan, cycle, discountPercent);
                        const isUpgrade = price > currentPrice;
                        const isScheduled = plan.id === subscription.scheduledPlanId;

                        return (
                            <li
                                key={plan.id}
                                className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-white px-4 py-3.5"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium font-text text-mist-950">
                                        {plan.name}
                                    </p>
                                    <p className="text-xs font-text text-mist-500">
                                        {formatPrice(price)}/{per} <ListPrice plan={plan} billingCycle={cycle} discountPercent={discountPercent} className="text-mist-400" /> ·{" "}
                                        {plan.targetAudience.toLowerCase()}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    disabled={isScheduled}
                                    onClick={() =>
                                        openDialog(isUpgrade ? "upgrade" : "downgrade", plan.id)
                                    }
                                    className={cn(
                                        "h-9 shrink-0 rounded-button px-4 text-sm font-medium font-text transition-colors duration-200 cursor-pointer disabled:cursor-default",
                                        isUpgrade
                                            ? "bg-secondary-700 text-white hover:bg-secondary-900"
                                            : "border border-border text-mist-700 enabled:hover:bg-mist-50 disabled:text-mist-400",
                                    )}
                                >
                                    {isScheduled ? "Scheduled" : isUpgrade ? "Upgrade" : "Downgrade"}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </SettingsSection>

            <SettingsSection headingLevel="h3"
                title="Cancel plan"
                description={`You'll keep ${currentPlan.name} until the end of this billing period, then it won't renew.`}
            >
                <div>
                    <button
                        type="button"
                        disabled={subscription.cancelAtPeriodEnd}
                        onClick={() => openDialog("cancel")}
                        className="h-9 rounded-button border border-error-200 px-4 text-sm font-medium font-text text-error-600 transition-colors duration-200 cursor-pointer enabled:hover:bg-error-50 disabled:cursor-default disabled:border-border disabled:text-mist-400"
                    >
                        {subscription.cancelAtPeriodEnd ? `Ends on ${periodEnd}` : "Cancel plan"}
                    </button>
                </div>
            </SettingsSection>

            <Dialog {...dialogProps("upgrade")}>
                <DialogContent>
                    <DialogTitle>Upgrade to {targetPlan?.name}</DialogTitle>
                    {targetPlan && (
                        <PlanUpgradeForm
                            currentPlan={currentPlan}
                            newPlan={targetPlan}
                            subscription={subscription}
                            onUpgraded={closeDialog}
                            discountPercent={discountPercent}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <Dialog {...dialogProps("downgrade")}>
                <DialogContent showCloseButton={false} className="max-w-100">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>Switch to {targetPlan?.name}?</DialogTitle>
                        <DialogDescription>
                            Your plan changes on {periodEnd}, when this billing period ends.
                            You&apos;ll keep {currentPlan.name}&apos;s features until then, and
                            pay {targetPlan && formatPrice(getPlanPrice(targetPlan, cycle, discountPercent))} per{" "}
                            {per} after.
                        </DialogDescription>
                    </div>
                    <ConfirmActions
                        confirmLabel="Switch plan"
                        onCancel={closeDialog}
                        onConfirm={() => {
                            if (!targetPlan) return;
                            scheduleDowngrade(targetPlan.id);
                            toast.success(`Your plan changes to ${targetPlan.name} on ${periodEnd}`);
                            closeDialog();
                        }}
                    />
                </DialogContent>
            </Dialog>

            <Dialog {...dialogProps("cancel")}>
                <DialogContent showCloseButton={false} className="max-w-100">
                    <div className="flex flex-col gap-1">
                        <DialogTitle>Cancel your plan?</DialogTitle>
                        <DialogDescription>
                            You&apos;ll keep {currentPlan.name} until {periodEnd}. After that, it
                            won&apos;t renew and you won&apos;t be matched with new jobs.
                        </DialogDescription>
                    </div>
                    <ConfirmActions
                        confirmLabel="Yes, cancel plan"
                        cancelLabel="Keep plan"
                        tone="danger"
                        onCancel={closeDialog}
                        onConfirm={() => {
                            cancelPlan();
                            toast.success(`Your plan will end on ${periodEnd}`);
                            closeDialog();
                        }}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}

function PlanFeatures({ plan }: { plan: PricingPlan }) {
    return (
        <ul className="flex flex-col gap-1.5 border-t border-border pt-4 text-sm font-text text-mist-600">
            {plan.features.map((feature) => (
                <li key={feature.label} className="flex justify-between gap-3">
                    <span>{feature.label}</span>
                    <span className="font-medium text-mist-900">{feature.value}</span>
                </li>
            ))}
        </ul>
    );
}

function InlineAction({ onClick, children }: { onClick: () => void; children: ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="font-medium text-secondary-700 hover:underline cursor-pointer"
        >
            {children}
        </button>
    );
}

/** Cancel + confirm buttons for a plan confirmation dialog, with the request simulated. */
function ConfirmActions({
    confirmLabel,
    cancelLabel = "Cancel",
    tone = "primary",
    onConfirm,
    onCancel,
}: {
    confirmLabel: string;
    cancelLabel?: string;
    tone?: "primary" | "danger";
    onConfirm: () => void;
    onCancel: () => void;
}) {
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            // No backend is wired up yet — simulate the request so the flow
            // is testable end-to-end.
            await new Promise((resolve) => setTimeout(resolve, 800));
            onConfirm();
        } catch {
            toast.error("Couldn't update your plan. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-end gap-3">
            <FormCancelButton onClick={onCancel} disabled={isLoading}>
                {cancelLabel}
            </FormCancelButton>
            <Button
                type="button"
                onClick={handleConfirm}
                disabled={isLoading}
                className={cn(
                    "h-11 px-5 text-white font-medium font-text rounded-button cursor-pointer transition-colors duration-300 disabled:opacity-80",
                    tone === "danger"
                        ? "bg-error-600 hover:bg-error-700"
                        : "bg-secondary-700 hover:bg-secondary-900",
                )}
            >
                {isLoading ? (
                    <span className="flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin" />
                        {confirmLabel}
                    </span>
                ) : (
                    confirmLabel
                )}
            </Button>
        </div>
    );
}
