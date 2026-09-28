import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PLAN_OFFER_TEXT } from "@/constant/sampleData";
import { PRICING_SECTION_ID } from "../homePage/pricingSection";

/**
 * The plan offer, above the website header on every page — "Every plan is
 * 90% off for now", and a way to the plans. Gone when there's no offer
 * (PLAN_DISCOUNT_PERCENT is 0).
 */
export default function OfferBar() {
    if (!PLAN_OFFER_TEXT) return null;
    return (
        <div className="bg-primary-500 px-2.5 py-2 text-center text-sm text-primary-950">
            <p className="container mx-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5">
                <span className="font-medium">{PLAN_OFFER_TEXT}.</span>
                <Link
                    href={`/#${PRICING_SECTION_ID}`}
                    className="inline-flex items-center gap-1 font-medium underline underline-offset-4 hover:text-primary-900"
                >
                    See plans
                    <ArrowRight className="size-3.5" aria-hidden />
                </Link>
            </p>
        </div>
    );
}
