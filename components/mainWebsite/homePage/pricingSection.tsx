import { Suspense } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatPrice, fromKobo } from "@/lib/currency";
import { ARTISAN_SIGNUP_URL } from "@/constant/navigation";
import { NOT_INCLUDED } from "@/constant/plans";
import { getWebsitePlans, type WebsitePlan } from "@/lib/services/websiteService";
import SectionHeading from "../common/sectionHeading";
import SectionWrapper from "../common/sectionWrapper";
import { WEBSITE_ON_DARK_BUTTON } from "../common/buttonStyles";

/** Where "See plans" links land — the offer bar's, for one. */
export const PRICING_SECTION_ID = "pricing";

/** How much yearly billing saves on 12 monthly payments, e.g. 17. */
const annualSavingPercent = (plan: WebsitePlan) =>
    Math.round((1 - plan.annualPriceKobo / (plan.monthlyPriceKobo * 12)) * 100);

/** The plan's sign-up button. */
const buttonTextFor = (plan: WebsitePlan) => `Choose ${plan.name}`;

/**
 * The plans, in the website's dark green band, as the API has them now:
 * price (with the usual one struck through while there's an offer), what
 * each includes, and a way to sign up on it. The heading shows straight
 * away; the offer and the plans stream in (skeletons until then).
 */
export default function PricingSection() {
    return (
        <SectionWrapper
            id={PRICING_SECTION_ID}
            className="scroll-mt-16 border-t border-b border-primary-900/30 bg-[#031b11] text-mist-100"
            containerClassName="flex flex-col gap-8 md:gap-12"
        >
            <div className="flex max-w-175 flex-col gap-3">
                {/* Only while there's an offer, so nothing holds its place */}
                <Suspense fallback={null}>
                    <PricingOfferBadge />
                </Suspense>
                <SectionHeading as="h2">Pay for 10 months, work all 12.</SectionHeading>
                <p className="text-base font-light text-mist-300">
                    Pick the plan that fits your team.{" "}
                    <Suspense fallback={<Skeleton inline className="h-4 w-64 max-w-full" />}>
                        <PricingOfferLine />
                    </Suspense>
                </p>
            </div>

            <Suspense fallback={<PlanCardsSkeleton />}>
                <PlanCards />
            </Suspense>
        </SectionWrapper>
    );
}

/** "Every plan is X% off for now", above the heading. Nothing when there's no offer. */
async function PricingOfferBadge() {
    const discountPercent = (await getWebsitePlans())?.discountPercent ?? 0;
    if (discountPercent <= 0) return null;
    return (
        <span className="w-fit rounded-full bg-primary-500 px-3 py-1 text-sm font-medium text-primary-950">
            Every plan is {discountPercent}% off for now
        </span>
    );
}

/** The offer and the yearly saving, after "Pick the plan that fits your team." */
async function PricingOfferLine() {
    const data = await getWebsitePlans();
    const plans = data?.plans ?? [];
    if (plans.length === 0) return null;
    const discountPercent = data?.discountPercent ?? 0;
    const annualSaving = annualSavingPercent(plans[0]);
    return discountPercent > 0
        ? `Every plan is ${discountPercent}% off for now, and paying for the year saves a further ${annualSaving}%.`
        : `Pay for the year and save ${annualSaving}%.`;
}

async function PlanCards() {
    const data = await getWebsitePlans();
    const plans = data?.plans ?? [];
    const discountPercent = data?.discountPercent ?? 0;

    if (plans.length === 0) {
        return (
            <p className="rounded-[10px] border border-white/10 bg-white/5 p-6 text-base font-light text-mist-300">
                The plans couldn&apos;t be loaded right now. Please refresh the page in a minute, or{" "}
                <Link href={ARTISAN_SIGNUP_URL} className="font-medium text-white underline underline-offset-4">
                    see them when you sign up
                </Link>
                .
            </p>
        );
    }

    return (
        <ul className="grid w-full grid-cols-1 gap-5 md:grid-cols-3 lg:gap-6">
            {plans.map((plan) => (
                <li
                    key={plan.id}
                    className="flex flex-col justify-between gap-8 rounded-[10px] border border-white/10 bg-white/5 p-6 transition-colors duration-300 hover:border-primary-600/50 lg:p-8"
                >
                    <div className="flex flex-col gap-6 md:gap-8">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between gap-3">
                                <span className="font-mono text-sm font-semibold text-primary-400">{plan.tierNumber}</span>
                                {discountPercent > 0 && (
                                    <span className="rounded-full bg-primary-500/15 px-2.5 py-0.5 text-xs font-medium text-primary-300">
                                        {discountPercent}% off
                                    </span>
                                )}
                            </div>
                            <h3 className="text-xl font-medium text-white md:text-2xl">{plan.name}</h3>
                            <p className="text-xs tracking-wider text-mist-400 uppercase">{plan.targetAudience}</p>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                                <span className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                                    {formatPrice(fromKobo(plan.currentMonthlyPriceKobo))}
                                </span>
                                <span className="text-xs font-medium text-mist-400 uppercase">/month</span>
                                {discountPercent > 0 && (
                                    <s className="text-sm font-normal text-mist-500">
                                        <span className="sr-only">Usually </span>
                                        {formatPrice(fromKobo(plan.monthlyPriceKobo))}
                                    </s>
                                )}
                            </p>
                            <p className="text-sm font-light text-[#c2a649]">
                                or {formatPrice(fromKobo(plan.currentAnnualPriceKobo))} a year, saving {annualSavingPercent(plan)}%
                            </p>
                        </div>

                        <dl className="flex flex-col">
                            {plan.features.map((feature) => (
                                <div
                                    key={feature.label}
                                    className="flex items-center justify-between gap-4 border-b border-white/10 py-2.5 text-sm"
                                >
                                    <dt className="text-mist-400">{feature.label}</dt>
                                    <dd
                                        className={cn(
                                            "text-right",
                                            feature.value === NOT_INCLUDED ? "font-light text-mist-500" : "font-medium text-white",
                                        )}
                                    >
                                        {feature.value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>

                    <Link href={`${ARTISAN_SIGNUP_URL}?plan=${plan.id}`} className={cn(WEBSITE_ON_DARK_BUTTON, "w-full py-2.5")}>
                        {buttonTextFor(plan)}
                    </Link>
                </li>
            ))}
        </ul>
    );
}

/** The plan cards while the plans load: the same cards, with skeletons for what's in them. */
function PlanCardsSkeleton() {
    return (
        <ul aria-hidden className="grid w-full grid-cols-1 gap-5 md:grid-cols-3 lg:gap-6">
            {[1, 2, 3].map((i) => (
                <li
                    key={i}
                    className="flex flex-col justify-between gap-8 rounded-[10px] border border-white/10 bg-white/5 p-6 lg:p-8"
                >
                    <div className="flex flex-col gap-6 md:gap-8">
                        <div className="flex flex-col gap-2">
                            <Skeleton className="h-4 w-8" />
                            <Skeleton className="h-7 w-32" />
                            <Skeleton className="h-3 w-40" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Skeleton className="h-9 w-40" />
                            <Skeleton className="h-4 w-52" />
                        </div>
                        <div className="flex flex-col">
                            {[1, 2, 3, 4, 5].map((row) => (
                                <div key={row} className="flex items-center justify-between gap-4 border-b border-white/10 py-3">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-4 w-14" />
                                </div>
                            ))}
                        </div>
                    </div>
                    <Skeleton className="h-11 w-full rounded-button" />
                </li>
            ))}
        </ul>
    );
}
