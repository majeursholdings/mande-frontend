import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/currency";
import { PLAN_DISCOUNT_PERCENT, getPlanListPrice, type BillingCycle, type PricingPlan } from "@/constant/sampleData";

/**
 * A plan's usual price, struck through beside what it costs now, while
 * PLAN_DISCOUNT_PERCENT applies — nothing when there's no offer.
 */
export default function ListPrice({
    plan,
    billingCycle,
    className,
}: {
    plan: PricingPlan;
    billingCycle: BillingCycle;
    className?: string;
}) {
    if (PLAN_DISCOUNT_PERCENT === 0) return null;
    return (
        <s className={cn("font-normal", className)}>
            <span className="sr-only">Usually </span>
            {formatPrice(getPlanListPrice(plan, billingCycle))}
        </s>
    );
}
