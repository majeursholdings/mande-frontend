import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { superAdminService } from "@/lib/services/superAdminService";
import type { PricingPlan } from "@/constant/plans";

const NO_PLANS: PricingPlan[] = [];

/** The plans and the offer on them, from the API (/plans). Empty, with no offer, until loaded. */
export function usePlans() {
    const query = useQuery({
        queryKey: queryKeys.settings.plans(),
        queryFn: () => superAdminService.getPlans(),
        staleTime: 5 * 60 * 1000,
    });
    const plans = query.data?.plans ?? NO_PLANS;
    /** The plan with this id, once the plans have loaded. Stable until the plans change. */
    const getPlan = useCallback(
        (planId: string | null | undefined) => plans.find((plan) => plan.id === planId),
        [plans],
    );
    return useMemo(
        () => ({ ...query, plans, discountPercent: query.data?.discountPercent ?? 0, getPlan }),
        [query, plans, getPlan],
    );
}
