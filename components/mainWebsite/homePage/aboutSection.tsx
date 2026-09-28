import Image from "next/image";
import Link from "next/link";
import { JOB_PAYMENT_SCHEDULE } from "@/constant/jobWorkflow";
import { ABOUT_URL, ARTISAN_SIGNUP_URL } from "@/constant/navigation";
import SectionHeading from "../common/sectionHeading";
import SectionWrapper from "../common/sectionWrapper";
import { WEBSITE_OUTLINE_BUTTON, WEBSITE_PRIMARY_BUTTON } from "../common/buttonStyles";

const FIRST_PAYMENT = JOB_PAYMENT_SCHEDULE[0];

/** Why makers choose MANDE — paid as the work moves, not at the end — beside a workshop photo. */
export default function AboutSection() {
    return (
        <SectionWrapper containerClassName="flex flex-col-reverse gap-8 md:flex-row md:items-center md:gap-12">
            <div className="flex flex-1 flex-col gap-6">
                <div className="flex flex-col gap-4">
                    <span className="text-lg font-medium">Get paid as you work</span>
                    <SectionHeading as="h2" className="max-w-175">
                        Craftsmanship, elevated by community.
                    </SectionHeading>
                    <p className="text-base font-light">
                        Makers on MANDE are paid {FIRST_PAYMENT.percent}% the day they accept a job, a share at every
                        approved stage, and the balance once the job is signed off. You take on real furniture projects and
                        prove each stage with photographs checked against the drawing for that job, so your payment is
                        protected from the first cut.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Link href={ABOUT_URL} className={WEBSITE_PRIMARY_BUTTON}>
                        Learn how it works
                    </Link>
                    <Link href={ARTISAN_SIGNUP_URL} className={WEBSITE_OUTLINE_BUTTON}>
                        Start registration
                    </Link>
                </div>
            </div>
            <div className="flex-1">
                <Image
                    src="/images/image1.png"
                    alt="Furniture makers at work on a MANDE job"
                    width={1000}
                    height={667}
                    className="aspect-1000/667 w-full rounded-[10px] object-cover object-center"
                />
            </div>
        </SectionWrapper>
    );
}
