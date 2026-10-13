import Image from "next/image";
import Link from "next/link";
import { BriefcaseBusiness, Factory, UsersRound, Wallet, type LucideIcon } from "lucide-react";
import { JOB_PAYMENT_SCHEDULE } from "@/constant/jobWorkflow";
import { ABOUT_URL, ARTISAN_SIGNUP_URL } from "@/constant/navigation";
import SectionHeading from "../common/sectionHeading";
import SectionWrapper from "../common/sectionWrapper";
import { WEBSITE_OUTLINE_BUTTON, WEBSITE_PRIMARY_BUTTON } from "../common/buttonStyles";
import { ACCELERATOR_LOAN_LABEL, ACCELERATOR_PROGRAM_NAME } from "@/constant/accelerator";

const FIRST_PAYMENT = JOB_PAYMENT_SCHEDULE[0];

// What a maker gets from MANDE, in four lines under the introduction
const PILLARS: { icon: LucideIcon; title: string; description: string }[] = [
    {
        icon: BriefcaseBusiness,
        title: "Real furniture jobs",
        description: "Every job comes with drawings, a budget and a deadline. Apply for open jobs, or be offered work that fits your specialities.",
    },
    {
        icon: Wallet,
        title: "Paid as the work moves",
        description: `${FIRST_PAYMENT.percent}% when you accept, a share at every approved stage, and the rest at sign-off, straight into your MANDE wallet.`,
    },
    {
        icon: UsersRound,
        title: "A project lead on every job",
        description: "Someone from MANDE checks each stage with you and signs off the work, so you always know what's expected.",
    },
    {
        icon: Factory,
        title: "Room to grow",
        description: `Machine time at our Lagos factory, and loans of up to ${ACCELERATOR_LOAN_LABEL} through the ${ACCELERATOR_PROGRAM_NAME}.`,
    },
];

/** What MANDE is and what makers get from it, beside a workshop photo. */
export default function AboutSection() {
    return (
        <SectionWrapper containerClassName="flex flex-col gap-12 md:gap-16">
            <div className="flex flex-col-reverse gap-8 md:flex-row md:items-center md:gap-12">
                <div className="flex flex-1 flex-col gap-6">
                    <div className="flex flex-col gap-4">
                        <span className="text-lg font-medium">What MANDE is</span>
                        <SectionHeading as="h2" className="max-w-175">
                            The platform built for Nigeria&apos;s furniture makers.
                        </SectionHeading>
                        <p className="text-base font-light">
                            MANDE connects skilled furniture makers with real projects from leading brands and businesses. We
                            bring you the work, a project lead to guide every job, the machines to build it and the funding
                            to grow, so your workshop can take on more than it could alone.
                        </p>
                        <p className="text-base font-light">
                            You build the furniture. We make sure the work is clear, checked at every stage and paid for as
                            it moves.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Link href={ABOUT_URL} className={WEBSITE_PRIMARY_BUTTON}>
                            More about MANDE
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
            </div>

            <ul className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
                {PILLARS.map(({ icon: Icon, title, description }) => (
                    <li key={title} className="flex flex-col gap-3 border-t border-mist-300 pt-6">
                        <Icon className="size-6 text-primary-800" strokeWidth={1.5} aria-hidden />
                        <h3 className="text-lg font-medium">{title}</h3>
                        <p className="text-base font-light text-mist-700">{description}</p>
                    </li>
                ))}
            </ul>
        </SectionWrapper>
    );
}
