import { CalendarClock, CreditCard, Wallet } from "lucide-react";
import { formatPrice } from "@/lib/currency";
import { formatOrdinalDate } from "@/lib/date";
import ListPrice from "@/components/ui/listPrice";
import { getPlanPrice, getPricingPlan } from "@/constant/sampleData";
import type { ManufacturerRecord } from "@/constant/sampleDb";

/**
 * The plan a manufacturer is on — what it costs them now (with the usual
 * price struck through while there's an offer), when it renews and how
 * renewals are paid. Under their card on the manufacturer page.
 */
export default function ManufacturerPlanCard({
    subscription,
    className,
}: {
    subscription: ManufacturerRecord["subscription"];
    className?: string;
}) {
    const plan = getPricingPlan(subscription.planId);
    if (!plan) return null;
    const isAnnual = subscription.billingCycle === "annual";

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
                    {formatPrice(getPlanPrice(plan, subscription.billingCycle))}
                </span>
                <span className="text-xs text-mist-500">{isAnnual ? "a year" : "a month"}</span>
                <ListPrice plan={plan} billingCycle={subscription.billingCycle} className="text-xs text-mist-400" />
            </p>

            <ul className="flex flex-col gap-2 text-sm font-text text-mist-600">
                <li className="flex items-center gap-2">
                    <CalendarClock className="size-4 shrink-0 text-mist-400" strokeWidth={1.75} aria-hidden />
                    Renews {formatOrdinalDate(new Date(subscription.renewsAt))}
                </li>
                <li className="flex items-center gap-2">
                    {subscription.renewalsPaidFrom === "wallet" ? (
                        <Wallet className="size-4 shrink-0 text-mist-400" strokeWidth={1.75} aria-hidden />
                    ) : (
                        <CreditCard className="size-4 shrink-0 text-mist-400" strokeWidth={1.75} aria-hidden />
                    )}
                    {subscription.renewalsPaidFrom === "wallet" ? "Renews from their wallet" : "Renews by card"}
                </li>
            </ul>
        </section>
    );
}
