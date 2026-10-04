import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/currency";
import { getPlanListPrice, type BillingCycle, type PricingPlan } from "@/constant/plans";

/**
 * A plan's usual price, struck through beside what it costs now, while an
 * offer (the API's discountPercent) applies — nothing when there's no offer.
 */
export default function ListPrice({
    plan,
    billingCycle,
    className,
    discountPercent,
}: {
    plan: PricingPlan;
    billingCycle: BillingCycle;
    className?: string;
    discountPercent: number;
}) {
    if (discountPercent === 0) return null;
    return (
        <s className={cn("font-normal", className)}>
            <span className="sr-only">Usually </span>
            {formatPrice(getPlanListPrice(plan, billingCycle))}
        </s>
    );
}
