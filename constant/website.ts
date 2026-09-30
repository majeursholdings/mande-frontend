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
    PRICING_PLANS,
    getAnnualSavingPercent,
    getPlanListPrice,
    getPlanPrice,
    type PricingPlan,
} from "@/constant/sampleData";
import { SUPPORT_HOURS } from "@/constant/support";

// ─────────────────────────────────────────────────────────────────────────────
// The website's copy — the FAQs, and the contact page's topics and details.
// Answers quote the platform's own rules (payment shares, the bonus, plan
// prices and job slots), so they stay true when those change.
// ─────────────────────────────────────────────────────────────────────────────

export type WebsiteFaq = { question: string; answer: string };

export type WebsiteFaqGroup = {
    /** For the page's jump links, e.g. #payments. */
    id: string;
    title: string;
    faqs: WebsiteFaq[];
};

/** "Solo Artisan and Workshop" — lists the way people say them. */
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

export function formatPlanPricesList(discountPercent: number = 0, plans: PricingPlan[] = PRICING_PLANS): string {
    return joinList(
        plans.map((plan, index) => {
            const price = formatPrice(getPlanPrice(plan, "monthly", discountPercent));
            const usually = discountPercent > 0 ? ` (usually ${formatPrice(getPlanListPrice(plan, "monthly"))})` : "";
            return index === 0 ? `${plan.name} is ${price} a month${usually}` : `${plan.name} ${price}${usually}`;
        }),
    );
}

const JOB_SLOTS = joinList(
    PRICING_PLANS.map((plan) =>
        plan.maxConcurrentJobs === null ? `unlimited on ${plan.name}` : `${plan.maxConcurrentJobs} on ${plan.name}`,
    ),
);

export function getWebsiteFaqGroups(discountPercent: number = 0, plans: PricingPlan[] = PRICING_PLANS): WebsiteFaqGroup[] {
    const planNames = plans.map((plan) => plan.name);
    const planPrices = formatPlanPricesList(discountPercent, plans);
    const annualSaving = getAnnualSavingPercent(plans[0]);

    return [
        {
            id: "getting-started",
            title: "Getting started",
            faqs: [
                {
                    question: "What is MANDE?",
                    answer: "MANDE connects furniture makers and woodworkers with real furniture jobs. You take a job on, build it stage by stage, and get paid as each stage is approved — so your pay is protected from the first cut.",
                },
                {
                    question: "Who can join?",
                    answer: `Furniture makers and workshops of any size, from a single artisan to a studio of ten or more. There are ${plans.length} plans — ${joinList(planNames)} — so you can pick the one that fits your team.`,
                },
                {
                    question: "How do I sign up?",
                    answer: "Create your profile, choose a plan and upload a photo of your NIN card. Our team checks every NIN card before an account is verified — it usually takes 1–2 working days, and you'll get a notification once it's done.",
                },
                {
                    question: "Do I need business documents?",
                    answer: `On the ${plans[0].name} plan, your NIN card is all you need. On ${joinList(planNames.slice(1))}, add your company tax number and business license number too.`,
                },
            ],
        },
        {
            id: "jobs",
            title: "Jobs",
            faqs: [
                {
                    question: "How do I find jobs?",
                    answer: "Browse the open jobs and apply for the ones that suit your workshop. A project lead reviews the applications and assigns the job. Jobs can also be offered to you directly.",
                },
                {
                    question: "How many jobs can I take on at once?",
                    answer: `It depends on your plan: ${JOB_SLOTS}. Each job you're working on uses a slot, and so does each application while it's waiting.`,
                },
                {
                    question: "How does a job run?",
                    answer: `Every job moves through ${JOB_PRODUCTION_STEPS.length} stages — ${joinList(JOB_PRODUCTION_STEPS.map((step) => step.label))}. At each one you send up to ${MAX_STEP_PROOF_PHOTOS} photos as proof, and your project lead approves it.`,
                },
                {
                    question: "What if I can't meet the due date?",
                    answer: `Report a delay from the job as early as you can and pick a new date — up to ${MAX_EXTENSION_PERCENT}% longer than the job's original timeline. Your project lead approves or declines it, and the customer is kept in the loop.`,
                },
                {
                    question: "What happens if my finished work is rejected?",
                    answer: `You'll see the reason on the job. Fix the work and resubmit it with new photos. A job can be rejected up to ${MAX_JOB_REJECTIONS} times, and each rejection charges ${REJECTION_CHARGE_PERCENT}% of your labour from your wallet.`,
                },
            ],
        },
        {
            id: "payments",
            title: "Payments",
            faqs: [
                {
                    question: "When do I get paid?",
                    answer: `In ${JOB_PAYMENT_SCHEDULE.length} parts as the job moves: ${PAYMENT_SHARES}. Each part lands in your MANDE balance the moment it's earned.`,
                },
                {
                    question: "Is there a bonus?",
                    answer: `Yes — ${JOB_BONUS_PERCENT}% of your labour on top, when you deliver on time with no stage sent back and no fault reported in the ${FAULT_REPORT_DAYS} days after sign-off.`,
                },
                {
                    question: "How quickly is my work reviewed?",
                    answer: `Project leads review each stage's proof. If no one has reviewed it within ${REVIEW_WINDOW_HOURS} hours, it's approved automatically — Sundays aren't counted.`,
                },
                {
                    question: "Who pays for materials?",
                    answer: "Timber and fittings are bought out of the money held for the job — by you or by MANDE, decided job by job.",
                },
                {
                    question: "How do withdrawals work?",
                    answer: "Withdraw from your balance to your bank account whenever you like. Most withdrawals arrive within a few minutes, though it can vary by bank. Bank charges and our processing partner's fee are added to each withdrawal.",
                },
            ],
        },
        {
            id: "plans",
            title: "Plans & pricing",
            faqs: [
                {
                    question: "How much does MANDE cost?",
                    answer:
                        discountPercent > 0
                            ? `Right now every plan is ${discountPercent}% off: ${planPrices}. Pay for the year and save a further ${annualSaving}%, paying for 10 months and working all 12.`
                            : `${planPrices}. Pay for the year and save ${annualSaving}%, paying for 10 months and working all 12.`,
                },
                {
                    question: "Can I change or cancel my plan?",
                    answer: "Yes, from Settings › Plan. Upgrades start straight away; downgrades and cancellations take effect when your billing period ends.",
                },
                {
                    question: "How can I pay for my plan?",
                    answer: "By card, or straight from your MANDE balance.",
                },
            ],
        },
        {
            id: "account",
            title: "Account & safety",
            faqs: [
                {
                    question: "How do I keep my account safe?",
                    answer: "Turn on two-factor authentication from Security — a code from your email or an authenticator app when you log in. Sensitive actions, like changing your password or withdrawing, ask for a code too.",
                },
                {
                    question: "What does it mean if my account is flagged or suspended?",
                    answer: "A flagged account can hold one job at a time until the flag is lifted. A suspended account is paused — you can't take on or work on jobs, or withdraw — but you can send an appeal, and an admin will look at it.",
                },
            ],
        },
    ];
}

export const WEBSITE_FAQ_GROUPS: WebsiteFaqGroup[] = getWebsiteFaqGroups(0);

export const CONTACT_TOPIC_OPTIONS: SelectOption[] = [
    { label: "I'm a furniture maker", value: "maker" },
    { label: "I have a furniture project", value: "project" },
    { label: "Partnerships", value: "partnership" },
    { label: "Press", value: "press" },
    { label: "Something else", value: "other" },
];

export const CONTACT_DETAILS = {
    // Sample address on the company domain — confirm the real inbox before launch
    email: "hello@mande.com.ng",
    hours: SUPPORT_HOURS,
};
