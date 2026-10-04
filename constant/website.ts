import type { SelectOption } from "@/components/form/types";
import { formatPrice } from "@/lib/currency";
import {
    FAULT_REPORT_DAYS,
    JOB_BONUS_PERCENT,
    JOB_PAYMENT_SCHEDULE,
    JOB_PRODUCTION_STEPS,
    MAX_EXTENSION_PERCENT,
    MAX_JOB_REJECTIONS,
    MAX_STEP_PROOF_PHOTOS,
    REJECTION_CHARGE_PERCENT,
    REVIEW_WINDOW_HOURS,
} from "@/constant/jobWorkflow";
import {
    getAnnualSavingPercent,
    isSoloPlan,
    getPlanListPrice,
    getPlanPrice,
    type PricingPlan,
} from "@/constant/plans";
import { SUPPORT_HOURS } from "@/constant/support";

// ─────────────────────────────────────────────────────────────────────────────
// The website's copy: the values FAQ answers quote, and the contact page's
// topics and details. The FAQs themselves are in the CMS (lib/cms/faq.ts);
// their answers name these values as {{placeholders}}, so they stay true when
// the platform's rules or the plans change.
// ─────────────────────────────────────────────────────────────────────────────

/** "Solo Artisan and Workshop": lists the way people say them. */
function joinList(items: string[]): string {
    return items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

// "10% when you accept the job, 12% at Frame, …, and 28% once it's signed off"
const PAYMENT_SHARES = joinList(
    JOB_PAYMENT_SCHEDULE.map(({ milestone, label, percent }) =>
        milestone === "accepted"
            ? `${percent}% when you accept the job`
            : milestone === "signed-off"
              ? `${percent}% once it's signed off`
              : `${percent}% at ${label.replace(" approved", "")}`,
    ),
);

export function formatPlanPricesList(discountPercent: number, plans: PricingPlan[]): string {
    return joinList(
        plans.map((plan, index) => {
            const price = formatPrice(getPlanPrice(plan, "monthly", discountPercent));
            const usually = discountPercent > 0 ? ` (usually ${formatPrice(getPlanListPrice(plan, "monthly"))})` : "";
            return index === 0 ? `${plan.name} is ${price} a month${usually}` : `${plan.name} ${price}${usually}`;
        }),
    );
}

const formatJobSlots = (plans: PricingPlan[]) =>
    joinList(
        plans.map((plan) =>
            plan.maxConcurrentJobs === null ? `unlimited on ${plan.name}` : `${plan.maxConcurrentJobs} on ${plan.name}`,
        ),
    );

/**
 * What each {{placeholder}} in an FAQ answer stands for. The plans' ones are
 * left out when there are no plans (the API couldn't be reached), so answers
 * that use them can't be shown. Keep the names in step with the studio's
 * list (mande-sanity/schemaTypes/faq/faqTokens.ts), which checks answers
 * as they're written.
 */
export function getFaqTokens(discountPercent: number, plans: PricingPlan[]): Record<string, string> {
    const rules = {
        paymentPartCount: String(JOB_PAYMENT_SCHEDULE.length),
        paymentShares: PAYMENT_SHARES,
        jobBonusPercent: String(JOB_BONUS_PERCENT),
        faultReportDays: String(FAULT_REPORT_DAYS),
        reviewWindowHours: String(REVIEW_WINDOW_HOURS),
        productionStepCount: String(JOB_PRODUCTION_STEPS.length),
        productionSteps: joinList(JOB_PRODUCTION_STEPS.map((step) => step.label)),
        maxProofPhotos: String(MAX_STEP_PROOF_PHOTOS),
        maxExtensionPercent: String(MAX_EXTENSION_PERCENT),
        maxRejections: String(MAX_JOB_REJECTIONS),
        rejectionChargePercent: String(REJECTION_CHARGE_PERCENT),
    };
    if (plans.length === 0) return rules;

    // The plan that needs no business documents (see requiresBusinessDocuments), and the ones that do
    const soloPlan = plans.find((plan) => isSoloPlan(plan.id));
    const documentPlanNames = plans.filter((plan) => !isSoloPlan(plan.id)).map((plan) => plan.name);
    const planPrices = formatPlanPricesList(discountPercent, plans);

    return {
        ...rules,
        planCount: String(plans.length),
        planNames: joinList(plans.map((plan) => plan.name)),
        planPrices: discountPercent > 0 ? `Right now every plan is ${discountPercent}% off: ${planPrices}` : planPrices,
        annualSaving: String(getAnnualSavingPercent(plans[0])),
        jobSlots: formatJobSlots(plans),
        ...(soloPlan && { soloPlanName: soloPlan.name }),
        ...(documentPlanNames.length > 0 && { documentPlanNames: joinList(documentPlanNames) }),
    };
}

export const CONTACT_TOPIC_OPTIONS: SelectOption[] = [
    { label: "I'm a furniture maker", value: "maker" },
    { label: "I have a furniture project", value: "project" },
    { label: "Partnerships", value: "partnership" },
    { label: "Press", value: "press" },
    { label: "Something else", value: "other" },
];

export const CONTACT_DETAILS = {
    // Confirm this inbox is set up before launch
    email: "hello@mande.com.ng",
    hours: SUPPORT_HOURS,
};
