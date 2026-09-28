import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/currency";
import ListPrice from "@/components/ui/listPrice";
import {
    NOT_INCLUDED,
    PLAN_DISCOUNT_PERCENT,
    PLAN_OFFER_TEXT,
    PRICING_PLANS,
    getAnnualSavingPercent,
    getAnnualSavingsText,
    getPlanPrice,
} from "@/constant/sampleData";
import SectionHeading from "../common/sectionHeading";
import SectionWrapper from "../common/sectionWrapper";
import { WEBSITE_ON_DARK_BUTTON } from "../common/buttonStyles";

/** Where "See plans" links land — the offer bar's, for one. */
export const PRICING_SECTION_ID = "pricing";

/**
 * The plans, in the website's dark green band — price (with the usual one
 * struck through while there's an offer), what each includes, and a way to
 * sign up on it.
 */
export default function PricingSection() {
    return (
        <SectionWrapper
            id={PRICING_SECTION_ID}
            className="scroll-mt-16 border-t border-b border-primary-900/30 bg-[#031b11] text-mist-100"
            containerClassName="flex flex-col gap-8 md:gap-12"
        >
            <div className="flex max-w-175 flex-col gap-3">
                {PLAN_OFFER_TEXT && (
                    <span className="w-fit rounded-full bg-primary-500 px-3 py-1 text-sm font-medium text-primary-950">
                        {PLAN_OFFER_TEXT}
                    </span>
                )}
                <SectionHeading as="h2">Pay for 10 months, work all 12.</SectionHeading>
                <p className="text-base font-light text-mist-300">
                    Pick the plan that fits your team.{" "}
                    {PLAN_DISCOUNT_PERCENT > 0
                        ? `Every plan is ${PLAN_DISCOUNT_PERCENT}% off for now, and paying for the year saves a further ${getAnnualSavingPercent(PRICING_PLANS[0])}%.`
                        : `Pay for the year and save ${getAnnualSavingPercent(PRICING_PLANS[0])}%.`}
                </p>
            </div>

            <ul className="grid w-full grid-cols-1 gap-5 md:grid-cols-3 lg:gap-6">
                {PRICING_PLANS.map((plan) => (
                    <li
                        key={plan.id}
                        className="flex flex-col justify-between gap-8 rounded-[10px] border border-white/10 bg-white/5 p-6 transition-colors duration-300 hover:border-primary-600/50 lg:p-8"
                    >
                        <div className="flex flex-col gap-6 md:gap-8">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="font-mono text-sm font-semibold text-primary-400">{plan.tierNumber}</span>
                                    {PLAN_DISCOUNT_PERCENT > 0 && (
                                        <span className="rounded-full bg-primary-500/15 px-2.5 py-0.5 text-xs font-medium text-primary-300">
                                            {PLAN_DISCOUNT_PERCENT}% off
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-xl font-medium text-white md:text-2xl">{plan.name}</h3>
                                <p className="text-xs tracking-wider text-mist-400 uppercase">{plan.targetAudience}</p>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                                    <span className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                                        {formatPrice(getPlanPrice(plan, "monthly"))}
                                    </span>
                                    <span className="text-xs font-medium text-mist-400 uppercase">/month</span>
                                    <ListPrice plan={plan} billingCycle="monthly" className="text-sm text-mist-500" />
                                </p>
                                <p className="text-sm font-light text-[#c2a649]">{getAnnualSavingsText(plan)}</p>
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

                        <Link href={plan.ctaUrl} className={cn(WEBSITE_ON_DARK_BUTTON, "w-full py-2.5")}>
                            {plan.buttonText}
                        </Link>
                    </li>
                ))}
            </ul>
        </SectionWrapper>
    );
}
