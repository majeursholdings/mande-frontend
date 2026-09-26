import SectionWrapper from "@/components/common/sectionWrapper";
import { DEFAULT_CURRENCY } from "@/constant/global";
import { PRICING_PLANS } from "@/constant/sampleData";
import Link from "next/link";
import SectionHeading from "../common/sectionHeading";

export default function PricingSection() {
    return (
        <SectionWrapper
            className="bg-[#031b11] text-mist-100 relative overflow-hidden border-t border-b border-primary-900/30"
            containerClassName="flex flex-col items-start gap-8 md:gap-10"
        >
            <SectionHeading>
                Pay for 10 months, work all 12.
            </SectionHeading>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 w-full">
                {PRICING_PLANS.map((plan) => (
                    <div
                        key={plan.id}
                        className="border border-[#0c3c24] bg-[#042416]/70 rounded-[6px] p-6 lg:p-8 flex flex-col justify-between hover:border-primary-600/50 transition-colors duration-300"
                    >
                        <div>
                            {/* Card Header */}
                            <div>
                                <span className="text-primary-400 font-mono text-sm font-semibold">
                                    {plan.tierNumber}
                                </span>
                                <h3 className="text-xl md:text-2xl font-medium text-white mt-1">
                                    {plan.name}
                                </h3>
                                <p className="text-xs text-mist-400 uppercase tracking-wider mt-0.5">
                                    {plan.targetAudience}
                                </p>
                            </div>

                            {/* Price */}
                            <div className="mt-6 md:mt-8">
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                                        {DEFAULT_CURRENCY}
                                        {plan.monthlyPrice.toLocaleString()}
                                    </span>
                                    <span className="text-xs text-mist-400 uppercase font-medium">
                                        /MONTH
                                    </span>
                                </div>
                                <p className="text-[#c2a649] text-xs md:text-sm mt-1.5 font-normal">
                                    {plan.savingsText}
                                </p>
                            </div>

                            {/* Features Table */}
                            <div className="mt-8 md:mt-10 space-y-3">
                                {plan.features.map((feature, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between py-2 border-b border-primary-900/40 text-sm"
                                    >
                                        <span className="text-mist-400 text-sm">
                                            {feature.label}
                                        </span>
                                        <span className="text-white text-sm font-medium">
                                            {feature.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-8 md:mt-10">
                            <Link
                                href={plan.ctaUrl}
                                title={plan.buttonText}
                                className="block w-full text-center py-3.5 px-4 bg-primary-500 hover:bg-primary-400 active:bg-primary-600 text-primary-950 font-semibold text-xs md:text-sm rounded-button transition-colors duration-300"
                            >
                                {plan.buttonText}
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </SectionWrapper>
    );
}
