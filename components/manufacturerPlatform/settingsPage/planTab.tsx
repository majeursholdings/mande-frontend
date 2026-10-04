"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/currency";
import { formatOrdinalDate } from "@/lib/date";
import { getErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import ListPrice from "@/components/ui/listPrice";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    getPlanPrice,
    type PricingPlan,
} from "@/constant/plans";
import PlanUpgradeForm from "@/components/manufacturerPlatform/form/planUpgradeForm";
import { FormCancelButton } from "@/components/manufacturerPlatform/form/formButtons";
import { Skeleton } from "@/components/ui/skeleton";
import Notice from "../notice";
import LoadError from "../loadError";
import SettingsSection from "../settingsSection";
import { PLAN_SETTINGS_PATH, useManufacturerSubscription } from "../dashboardLayout/manufacturerSubscriptionContext";
import type { ManufacturerSubscription } from "@/constant/manufacturer";
import { usePlans } from "@/hooks/usePlans";

type PlanDialog = "upgrade" | "downgrade" | "cancel";

/** The badge beside the plan's name. Only an active plan can be changed or cancelled. */
const STATUS_BADGE: Record<ManufacturerSubscription["status"], { label: string; className: string }> = {
    active: { label: "Active", className: "bg-primary-50 text-primary-700" },
    past_due: { label: "Payment due", className: "bg-error-50 text-error-600" },
    pending_payment: { label: "Not paid", className: "bg-error-50 text-error-600" },
    cancelled: { label: "Ended", className: "bg-mist-100 text-mist-600" },
};

// ─────────────────────────────────────────────────────────────────────────────
// PlanTab — the current plan, switching plans, and cancelling.
//   Upgrade   → pay the difference (wallet or card), applies now
//   Downgrade → confirm, applies when the billing period ends
//   Cancel    → confirm, the plan ends when the billing period ends
// A pending downgrade or cancellation can be undone until then. A plan
// that isn't active (it lapsed or ended) is paid for in full instead, any
// plan they choose; a failed payment can be tried again from here. An upgrade
// paid with a new card comes back here from the payment partner's checkout
// with ?reference=…, which is checked before the new plan shows.
// ─────────────────────────────────────────────────────────────────────────────

export default function PlanTab() {
    const { plans, discountPercent, getPlan, isPending: isPlansPending, isError: isPlansError } = usePlans();

    const {
        subscription,
        isLoading,
        isError,
        latestPayment,
        payForPlan,
        keepCurrentPlan,
        scheduleDowngrade,
        cancelPlan,
        confirmPayment,
    } = useManufacturerSubscription();
    // The plan whose checkout is opening, while the browser leaves for it
    const [payingPlanId, setPayingPlanId] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();
    const returnedReference = useSearchParams().get("reference");
    const [isConfirming, setIsConfirming] = useState(!!returnedReference);

    // Back from the checkout: check the upgrade's payment once, then drop
    // ?reference from the address (unless it's still pending, so a refresh checks again)
    const confirmStarted = useRef(false);
    useEffect(() => {
        if (!returnedReference || confirmStarted.current) return;
        confirmStarted.current = true;
        void (async () => {
            try {
                const payment = await confirmPayment(returnedReference);
                if (payment?.status === "pending") {
                    toast.info("We're still confirming your payment. Refresh this page in a minute to check again.");
                    return;
                }
                if (payment?.status === "succeeded") toast.success("Payment successful. Your new plan is active.");
                else toast.error(payment?.failureReason || "Payment didn't go through. Please try again.");
                router.replace(`${pathname}?tab=plan`);
            } catch (err) {
                toast.error(getErrorMessage(err, "Couldn't check your payment. Refresh this page to try again."));
            } finally {
                setIsConfirming(false);
            }
        })();
    }, [returnedReference, confirmPayment, pathname, router]);
    const [dialog, setDialog] = useState<PlanDialog | null>(null);
    // Kept after closing so the dialog's content stays put while it animates out
    const [targetPlanId, setTargetPlanId] = useState<string | null>(null);

    if (isLoading || isPlansPending || isConfirming) {
        return <PlanTabSkeleton isConfirming={isConfirming} />;
    }

    if (isError || isPlansError || !subscription) {
        return <LoadError>We couldn&apos;t load your plan. Please refresh the page to try again.</LoadError>;
    }

    const currentPlan = getPlan(subscription.planId);
    if (!currentPlan) {
        return <LoadError>We couldn&apos;t load your plan. Please refresh the page to try again.</LoadError>;
    }

    const cycle = subscription.billingCycle;
    const per = cycle === "annual" ? "year" : "month";
    const currentPrice = getPlanPrice(currentPlan, cycle, discountPercent);
    const periodEnd = formatOrdinalDate(new Date(subscription.renewsAt));
    const scheduledPlan = getPlan(subscription.scheduledPlanId);
    const targetPlan = getPlan(targetPlanId);

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

    const isActive = subscription.status === "active";
    const badge = isActive && subscription.cancelAtPeriodEnd
        ? { label: "Cancelled", className: "bg-warning-50 text-warning-700" }
        : STATUS_BADGE[subscription.status];

    /** An inactive plan: pays for `planId` in full through the checkout, which comes back here. */
    const handlePayForPlan = async (planId: string, billingCycle = cycle) => {
        setPayingPlanId(planId);
        try {
            await payForPlan(planId, billingCycle, PLAN_SETTINGS_PATH);
        } catch (err) {
            toast.error(getErrorMessage(err, "Payment didn't go through. Please try again."));
            setPayingPlanId(null);
        }
    };

    // A failed payment can be tried again: on an inactive plan by paying for
    // it in full, or, for a failed upgrade, by opening the upgrade again
    const failedPayment = latestPayment?.status === "failed" ? latestPayment : null;
    const failedUpgradePlan = failedPayment?.kind === "upgrade"
        ? plans.find((p) => p.id === failedPayment.planId && getPlanPrice(p, cycle, discountPercent) > currentPrice)
        : undefined;
    const canRetry = !!failedPayment && (!isActive || !!failedUpgradePlan);
    const handleRetry = () => {
        if (!failedPayment) return;
        if (!isActive) void handlePayForPlan(failedPayment.planId, failedPayment.billingCycle);
        else if (failedUpgradePlan) openDialog("upgrade", failedUpgradePlan.id);
    };

    const handleKeepPlan = async () => {
        try {
            await keepCurrentPlan();
            toast.success(`You'll stay on the ${currentPlan.name} plan`);
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't update your plan. Please try again."));
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
                                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", badge.className)}>
                                    {badge.label}
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
                    {isActive && (
                        <p className="text-sm font-text text-mist-600">
                            {subscription.cancelAtPeriodEnd ? "Ends" : "Renews"} on {periodEnd}
                        </p>
                    )}

                    {failedPayment && (
                        <Notice tone="warning">
                            Your payment of {formatPrice(failedPayment.amountKobo / 100)} didn&apos;t go through
                            {failedPayment.failureReason ? ` (${failedPayment.failureReason})` : ""}.
                        </Notice>
                    )}
                    {!isActive && (
                        <Notice tone="warning">
                            {subscription.status === "past_due"
                                ? `Your plan ran out on ${periodEnd} and hasn't been renewed.`
                                : subscription.status === "cancelled"
                                  ? "Your plan has ended."
                                  : "Your plan hasn't been paid for yet."}{" "}
                            Until it&apos;s paid for, you won&apos;t be matched with new jobs.
                        </Notice>
                    )}
                    {(canRetry || !isActive) && (
                        <div>
                            <Button
                                type="button"
                                onClick={canRetry ? handleRetry : () => void handlePayForPlan(currentPlan.id)}
                                disabled={!!payingPlanId}
                                className="h-10 rounded-button bg-secondary-700 px-5 text-sm font-medium font-text text-white hover:bg-secondary-900 cursor-pointer"
                            >
                                {payingPlanId && <Loader2 className="size-4 animate-spin" aria-hidden />}
                                {canRetry ? "Retry payment" : `Pay ${formatPrice(currentPrice)}`}
                            </Button>
                        </div>
                    )}

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
                description={
                    isActive
                        ? "Upgrades start straight away, and you pay the difference for the rest of this billing period. Downgrades start when it ends."
                        : "Pay for the plan you choose, and it starts straight away."
                }
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
                                {isActive ? (
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
                                ) : (
                                    <button
                                        type="button"
                                        disabled={!!payingPlanId}
                                        onClick={() => void handlePayForPlan(plan.id)}
                                        className="flex h-9 shrink-0 items-center gap-2 rounded-button bg-secondary-700 px-4 text-sm font-medium font-text text-white transition-colors duration-200 cursor-pointer hover:bg-secondary-900 disabled:cursor-default disabled:opacity-60"
                                    >
                                        {payingPlanId === plan.id && <Loader2 className="size-4 animate-spin" aria-hidden />}
                                        Pay {formatPrice(price)}
                                    </button>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </SettingsSection>

            {isActive && (
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
            )}

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
                        onConfirm={async () => {
                            if (!targetPlan) return;
                            await scheduleDowngrade(targetPlan.id);
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
                        onConfirm={async () => {
                            await cancelPlan();
                            toast.success(`Your plan will end on ${periodEnd}`);
                            closeDialog();
                        }}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}

/** The plan tab while the plan loads (or a returning payment is checked): headings show, the plan's details are skeletons. */
function PlanTabSkeleton({ isConfirming }: { isConfirming: boolean }) {
    return (
        <>
            <SettingsSection headingLevel="h3" title="Current plan">
                {isConfirming && <Notice>Checking your payment. This only takes a moment.</Notice>}
                <div className="flex flex-col gap-4 rounded-xl border border-border bg-white p-5" aria-busy>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-6 w-28" />
                                <Skeleton className="h-5 w-14 rounded-full" />
                            </div>
                            <Skeleton className="h-3 w-36" />
                        </div>
                        <Skeleton className="h-6 w-28" />
                    </div>
                    <ul className="flex flex-col gap-2.5 border-t border-border pt-4">
                        {[1, 2, 3, 4].map((i) => (
                            <li key={i} className="flex justify-between gap-3">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-4 w-16" />
                            </li>
                        ))}
                    </ul>
                    <Skeleton className="h-4 w-44" />
                </div>
            </SettingsSection>

            <SettingsSection headingLevel="h3" title="Change plan">
                <ul className="flex flex-col gap-3">
                    {[1, 2].map((i) => (
                        <li
                            key={i}
                            className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-white px-4 py-3.5"
                        >
                            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-48" />
                            </div>
                            <Skeleton className="h-9 w-24 rounded-button" />
                        </li>
                    ))}
                </ul>
            </SettingsSection>
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

function InlineAction({ onClick, children }: { onClick: () => void | Promise<void>; children: ReactNode }) {
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

/** Cancel + confirm buttons for a plan confirmation dialog; `onConfirm` makes the change. */
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
    onConfirm: () => Promise<void>;
    onCancel: () => void;
}) {
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            await onConfirm();
        } catch (err) {
            toast.error(getErrorMessage(err, "Couldn't update your plan. Please try again."));
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
