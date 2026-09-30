import Link from "next/link";
import { ARTISAN_SIGNUP_URL, OPEN_JOBS_URL } from "@/constant/navigation";
import { getWebsitePlans } from "@/lib/services/websiteService";
import SectionHeading from "./sectionHeading";
import SectionWrapper from "./sectionWrapper";
import { WEBSITE_ON_DARK_BUTTON, WEBSITE_ON_DARK_OUTLINE_BUTTON } from "./buttonStyles";

/**
 * The closing band on a website page, in the pricing section's dark green:
 * a line to sign up on, with the sign-up button and a second link.
 */
export default async function CtaBand({
    title = "Ready to take on your next furniture job?",
    description = "Create your profile, choose a plan and start applying for jobs. You're paid as each stage is approved.",
    secondaryLink = { label: "Browse open jobs", href: OPEN_JOBS_URL },
    offerText,
}: {
    title?: string;
    description?: string;
    secondaryLink?: { label: string; href: string };
    offerText?: string | null;
}) {
    let resolvedOffer = offerText;
    if (resolvedOffer === undefined) {
        const plansData = await getWebsitePlans();
        const discountPercent = plansData?.discountPercent ?? 0;
        resolvedOffer = discountPercent > 0 ? `Every plan is ${discountPercent}% off for now` : null;
    }

    return (
        <SectionWrapper
            className="border-t border-b border-primary-900/30 bg-[#031b11] text-mist-100"
            containerClassName="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between md:gap-10"
        >
            <div className="flex max-w-175 flex-col gap-3">
                {resolvedOffer && (
                    <span className="w-fit rounded-full bg-primary-500/15 px-3 py-1 text-sm font-medium text-primary-300">
                        {resolvedOffer}
                    </span>
                )}
                <SectionHeading as="h2">{title}</SectionHeading>
                <p className="text-base font-light text-mist-300">{description}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
                <Link href={ARTISAN_SIGNUP_URL} className={WEBSITE_ON_DARK_BUTTON}>
                    Create your profile
                </Link>
                <Link href={secondaryLink.href} className={WEBSITE_ON_DARK_OUTLINE_BUTTON}>
                    {secondaryLink.label}
                </Link>
            </div>
        </SectionWrapper>
    );
}
