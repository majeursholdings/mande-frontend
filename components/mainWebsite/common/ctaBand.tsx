import Link from "next/link";
import { ARTISAN_SIGNUP_URL, OPEN_JOBS_URL } from "@/constant/navigation";
import SectionHeading from "./sectionHeading";
import SectionWrapper from "./sectionWrapper";
import { WEBSITE_ON_DARK_BUTTON, WEBSITE_ON_DARK_OUTLINE_BUTTON } from "./buttonStyles";

/**
 * The closing band on a website page, in the pricing section's dark green:
 * a line to sign up on, with the sign-up button and a second link.
 */
export default function CtaBand({
    title = "Ready to take on your next furniture job?",
    description = "Create your profile, choose a plan, and start applying for jobs — you're paid as each stage is approved.",
    secondaryLink = { label: "Browse open jobs", href: OPEN_JOBS_URL },
}: {
    title?: string;
    description?: string;
    secondaryLink?: { label: string; href: string };
}) {
    return (
        <SectionWrapper
            className="border-t border-b border-primary-900/30 bg-[#031b11] text-mist-100"
            containerClassName="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between md:gap-10"
        >
            <div className="flex max-w-175 flex-col gap-3">
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
