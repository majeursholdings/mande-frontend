import Link from "next/link";
import { CalendarClock, CircleAlert, CreditCard, Wallet } from "lucide-react";
import { formatPrice } from "@/lib/currency";
import { formatOrdinalDate } from "@/lib/date";
import ListPrice from "@/components/ui/listPrice";
import { getPlanPrice } from "@/constant/plans";
import type { ManufacturerRecord } from "@/constant/platformRecords";
import { usePlans } from "@/hooks/usePlans";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * The plan as the card shows it. `status` and `cancelAtPeriodEnd` are optional
 * (staff screens may not have them): without them it reads as an active plan.
 * A null `renewsAt` leaves the date line out.
 */
export type ManufacturerPlanCardSubscription = Omit<ManufacturerRecord["subscription"], "renewsAt"> & {
    renewsAt: string | null;
    status?: "active" | "past_due" | "pending_payment" | "cancelled";
    cancelAtPeriodEnd?: boolean;
};

/** The date line, worded like the Plan tab's badge: ends, payment due, ended or renews. */
function getRenewalLine(subscription: ManufacturerPlanCardSubscription, isOwn: boolean): { text: string; warn: boolean } | null {
    const date = subscription.renewsAt ? formatOrdinalDate(new Date(subscription.renewsAt)) : null;
    switch (subscription.status ?? "active") {
        case "past_due":
            return { text: date ? `Payment due since ${date}` : "Payment due", warn: true };
        case "pending_payment":
            return { text: "Not paid yet", warn: true };
        case "cancelled":
            return { text: date ? `Ended on ${date}` : "Ended", warn: true };
        default:
            if (subscription.cancelAtPeriodEnd) {
                return { text: date ? `Ends on ${date}` : `Cancelled, ends at the end of ${isOwn ? "your" : "their"} billing period`, warn: true };
            }
            return date ? { text: `Renews ${date}`, warn: false } : null;
    }
}

/**
 * The plan a manufacturer is on — what it costs them now (with the usual
 * price struck through while there's an offer), when it renews and how
 * renewals are paid. Under their card on the manufacturer page.
 */
export default function ManufacturerPlanCard({
    subscription,
    className,
    discountPercent: propDiscount,
    manageHref,
}: {
    subscription?: ManufacturerPlanCardSubscription;
    className?: string;
    discountPercent?: number;
    /** The manufacturer's own card: worded to them, with a link to manage it. Staff see "their". */
    manageHref?: string;
}) {
    const { getPlan, discountPercent: apiDiscount, isLoading } = usePlans();
    const discountPercent = propDiscount ?? apiDiscount;

    if (!subscription?.planId) return null;
    if (isLoading) return <ManufacturerPlanCardSkeleton className={className} />;
    const plan = getPlan(subscription.planId);
    if (!plan) return null;
    const isAnnual = subscription.billingCycle === "annual";
    const renewal = getRenewalLine(subscription, !!manageHref);
    // Renewals only happen for an active plan that isn't cancelled
    const renews = (subscription.status ?? "active") === "active" && !subscription.cancelAtPeriodEnd;

    return (
        <section className={`flex flex-col gap-4 rounded-xl border border-border bg-white p-5 ${className ?? ""}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                    <h2 className="text-xs font-medium font-text tracking-wide text-mist-500 uppercase">Current plan</h2>
                    <p className="text-base font-semibold font-text text-mist-950">{plan.name}</p>
                </div>
                <span className="shrink-0 rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-medium font-text text-primary-700">
                    {isAnnual ? "Yearly" : "Monthly"}
                </span>
            </div>

            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 font-text">
                <span className="text-xl font-semibold text-mist-950">
                    {formatPrice(getPlanPrice(plan, subscription.billingCycle, discountPercent))}
                </span>
                <span className="text-xs text-mist-500">{isAnnual ? "a year" : "a month"}</span>
                <ListPrice plan={plan} billingCycle={subscription.billingCycle} discountPercent={discountPercent} className="text-xs text-mist-400" />
            </p>

            <ul className="flex flex-col gap-2 text-sm font-text text-mist-600">
                {renewal && (
                    <li className={`flex items-center gap-2 ${renewal.warn ? "text-error-600" : ""}`}>
                        {renewal.warn ? (
                            <CircleAlert className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                        ) : (
                            <CalendarClock className="size-4 shrink-0 text-mist-400" strokeWidth={1.75} aria-hidden />
                        )}
                        {renewal.text}
                    </li>
                )}
                {renews && (
                <li className="flex items-center gap-2">
                    {subscription.renewalsPaidFrom === "wallet" ? (
                        <Wallet className="size-4 shrink-0 text-mist-400" strokeWidth={1.75} aria-hidden />
                    ) : (
                        <CreditCard className="size-4 shrink-0 text-mist-400" strokeWidth={1.75} aria-hidden />
                    )}
                    {subscription.renewalsPaidFrom === "wallet"
                        ? `Renews from ${manageHref ? "your" : "their"} wallet`
                        : "Renews by card"}
                </li>
                )}
            </ul>
            {manageHref && (
                <Link href={manageHref} className="self-start text-sm font-medium font-text text-secondary-700 hover:underline">
                    Manage plan
                </Link>
            )}
        </section>
    );
}

/** The plan card while the plans load: its heading shows, the plan, price and renewal are skeletons. */
export function ManufacturerPlanCardSkeleton({ className }: { className?: string }) {
    return (
        <section
            aria-busy="true"
            className={`flex flex-col gap-4 rounded-xl border border-border bg-white p-5 ${className ?? ""}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                    <h2 className="text-xs font-medium font-text tracking-wide text-mist-500 uppercase">Current plan</h2>
                    <Skeleton className="h-5 w-28" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-7 w-32" />
            <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-40" />
            </div>
        </section>
    );
}
